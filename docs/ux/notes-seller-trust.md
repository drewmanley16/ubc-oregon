# Seller trust: "what stops a seller from using the card after listing it?"

Team chat, night of Nov 18 (Drew, Shantam). Summarized by lane A for context. Not a decision yet.

## The problem raised
If a seller lists a **real gift card** (a number and PIN), they still know that number. They could
spend it online after listing and still collect the buyer's money. A balance check when they list
doesn't stop that, and later it can't prove who spent it (buyer or seller).

## Ideas discussed
| Idea | From | Open issue raised in chat |
|---|---|---|
| Sellers lock up tokens as a deposit and lose it if a sold card turns out used. Rewards for locking up and for being a trusted seller. | Shantam | Means creating our own token. Average person won't front $100 to list. Doesn't fit the Consumer track. |
| Hold the seller's money until the buyer confirms the card worked. | Drew | Buyer can lie ("it didn't work") to get a refund. |
| Check the balance on the brand's site (or a gift card checker), maybe with a bot. | Drew, Shantam | Shows the balance, not who used it. |
| On listing, swap the card for a fresh card of the same value (like CardCash's exchange), so only Sway holds a working number. Seller gets USDC, buyer gets the new card. | Shantam | Unclear if a swap service allows it. Anti-money-laundering rules. Drew: "sounds good at face value, look into it tomorrow." |

## Where the current build stands (lane A note)
The spec avoids this problem on purpose, and it's what Drew's contracts already do:
- The credit is **issued by the shop on-chain**, never a code. There's no number the seller could spend.
- Listing **moves the credit into the contract** (escrow). The seller can't touch it until it sells or they cancel.
- Checkout **burns it in the same transaction** that pays the seller. It can't be spent twice.

Real gift card codes are listed as out of scope in the spec (section 3). Every idea above is about
real codes, so each would add new scope (a token, refunds, a third-party swap service, compliance)
after Thursday's feature freeze.

**Suggested use for the pitch:** this conversation is the best answer to the judge question "why not
just resell gift cards?" Real codes can be drained, and no deposit or balance check fixes that.
On-chain shop credit in escrow can't be. Supporting real cards later means shops issuing their
credit through Sway, the way Raise's Smart Cards already partner with brands.
