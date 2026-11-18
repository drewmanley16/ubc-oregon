// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Test} from "forge-std/Test.sol";
import {MerchantCredit} from "../src/MerchantCredit.sol";
import {SwayMarketplace} from "../src/SwayMarketplace.sol";
import {ISwayMarketplace} from "../src/interfaces/ISwayMarketplace.sol";
import {MockUSDC} from "../src/MockUSDC.sol";

/// Random sequences of mint / list / cancel / checkout across 2 merchants, 3 sellers, 2 buyers.
contract Handler is Test {
    MerchantCredit public credit;
    SwayMarketplace public market;
    MockUSDC public usdc;
    address[2] public issuers;
    address[3] public sellers = [address(0x5e1), address(0x5e2), address(0x5e3)];
    address[2] public buyers = [address(0xb01), address(0xb02)];

    uint256 public ghostMinted; // sum over both merchants
    uint256 public ghostPayouts;
    uint256 public ghostFees;
    uint256 public ghostBuyerSpend;
    uint256 public ghostOrderNonce;

    constructor(MerchantCredit c, SwayMarketplace m, MockUSDC u, address i1, address i2) {
        credit = c;
        market = m;
        usdc = u;
        issuers = [i1, i2];
        for (uint256 i; i < 3; ++i) {
            vm.prank(sellers[i]);
            credit.setApprovalForAll(address(m), true);
        }
        for (uint256 i; i < 2; ++i) {
            vm.prank(buyers[i]);
            usdc.approve(address(m), type(uint256).max);
        }
    }

    function mint(uint256 mSeed, uint256 sSeed, uint256 cents) external {
        uint256 mid = bound(mSeed, 1, 2);
        cents = bound(cents, 1, 1_000_000);
        vm.prank(issuers[mid - 1]);
        credit.mintCredit(mid, sellers[sSeed % 3], cents, 0);
        ghostMinted += cents;
    }

    function list(uint256 mSeed, uint256 sSeed, uint256 cents) external {
        uint256 mid = bound(mSeed, 1, 2);
        address s = sellers[sSeed % 3];
        uint256 bal = credit.balanceOf(s, mid);
        if (bal == 0) return;
        cents = bound(cents, 1, bal);
        vm.prank(s);
        market.createListing(mid, cents);
    }

    function cancel(uint256 idSeed) external {
        uint256 n = market.nextListingId();
        if (n == 1) return;
        uint256 id = bound(idSeed, 1, n - 1);
        ISwayMarketplace.Listing memory l = market.getListing(id);
        if (l.status != ISwayMarketplace.ListingStatus.Active) return;
        vm.prank(l.seller);
        market.cancelListing(id);
    }

    function buy(uint256 idSeed, uint256 bSeed) external {
        uint256 n = market.nextListingId();
        if (n == 1) return;
        uint256 id = bound(idSeed, 1, n - 1);
        ISwayMarketplace.Listing memory l = market.getListing(id);
        if (l.status != ISwayMarketplace.ListingStatus.Active) return;
        address b = buyers[bSeed % 2];
        deal(address(usdc), b, usdc.balanceOf(b) + l.askUsdcUnits);
        vm.prank(b);
        market.checkout(id, keccak256(abi.encode(++ghostOrderNonce)), l.merchantId, l.askUsdcUnits, l.creditCents);
        ghostPayouts += l.sellerPayoutUnits;
        ghostFees += l.askUsdcUnits - l.sellerPayoutUnits;
        ghostBuyerSpend += l.askUsdcUnits;
    }

    function sellerUsdcTotal() external view returns (uint256 t) {
        for (uint256 i; i < 3; ++i) {
            t += usdc.balanceOf(sellers[i]);
        }
    }
}

contract InvariantsTest is Test {
    MerchantCredit credit;
    SwayMarketplace market;
    MockUSDC usdc;
    Handler handler;
    address treasury = makeAddr("treasury");

    function setUp() public {
        address admin = makeAddr("admin");
        usdc = new MockUSDC();
        credit = new MerchantCredit(admin, "");
        market = new SwayMarketplace(admin, address(usdc), address(credit), treasury);
        address i1 = makeAddr("issuer1");
        address i2 = makeAddr("issuer2");
        bytes32 role = credit.REDEEMER_ROLE();
        vm.startPrank(admin);
        credit.grantRole(role, address(market));
        credit.registerMerchant(1, i1);
        credit.registerMerchant(2, i2);
        market.setMerchantRates(1, 8_800, 8_500);
        market.setMerchantRates(2, 9_137, 8_011); // odd rates exercise rounding
        vm.stopPrank();
        handler = new Handler(credit, market, usdc, i1, i2);
        targetContract(address(handler));
    }

    /// I2: marketplace escrow per merchant == sum of Active listings' credit.
    function invariant_escrowEqualsSumOfActiveListings() public view {
        uint256[3] memory active;
        uint256 n = market.nextListingId();
        for (uint256 id = 1; id < n; ++id) {
            ISwayMarketplace.Listing memory l = market.getListing(id);
            if (l.status == ISwayMarketplace.ListingStatus.Active) active[l.merchantId] += l.creditCents;
        }
        assertEq(credit.balanceOf(address(market), 1), active[1]);
        assertEq(credit.balanceOf(address(market), 2), active[2]);
    }

    /// I1/I8: issued only via mint; outstanding == issued - redeemed == sum of all balances.
    function invariant_outstandingOnlyIncreasesViaMint() public view {
        assertEq(credit.totalIssued(1) + credit.totalIssued(2), handler.ghostMinted());
        for (uint256 mid = 1; mid <= 2; ++mid) {
            uint256 held = credit.balanceOf(address(market), mid);
            for (uint256 i; i < 3; ++i) {
                held += credit.balanceOf(handler.sellers(i), mid);
            }
            for (uint256 i; i < 2; ++i) {
                held += credit.balanceOf(handler.buyers(i), mid);
            }
            assertEq(credit.outstanding(mid), held);
        }
    }

    /// I4/I9: sellers got exactly their locked payouts, treasury exactly the fees, buyers paid exactly
    ///        payout + fee; marketplace never holds USDC.
    function invariant_paymentSplitIsExact() public view {
        assertEq(handler.sellerUsdcTotal(), handler.ghostPayouts());
        assertEq(usdc.balanceOf(treasury), handler.ghostFees());
        assertEq(handler.ghostBuyerSpend(), handler.ghostPayouts() + handler.ghostFees());
        assertEq(usdc.balanceOf(address(market)), 0);
    }
}
