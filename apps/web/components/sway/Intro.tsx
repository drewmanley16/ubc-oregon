"use client";
// LANE B. Brand intro on the landing page: "Sway" rises in, tagline follows, then the screen lifts away.
// - Server-rendered so it covers the page from the first paint (no flash of the landing first).
// - Once per tab session: an inline script hides it before paint on reload; client-side navigation back to "/"
//   is handled by the layout effect. Tap/click or any key skips it.
// - prefers-reduced-motion: hidden by CSS (globals.css), no animation at all.
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import { copy } from "@/content/copy";

const KEY = "sway:intro";
const HIDE_IF_SEEN = `try{if(sessionStorage.getItem("${KEY}"))document.getElementById("sway-intro").hidden=true}catch(e){}`;

const noop = () => () => {};
/** true only for the server render and hydration; false for client-only renders (e.g. navigating back to "/"). */
const useServerPass = () => useSyncExternalStore(noop, () => false, () => true);

export function Intro() {
  const serverPass = useServerPass();
  const [gone, setGone] = useState(false);
  const [leaving, setLeaving] = useState(false);

  // Read the flag once per mount. A ref survives React Strict Mode's dev-only double effect run, which would
  // otherwise see the flag this same mount just wrote and hide the intro immediately.
  const seenBefore = useRef<boolean | null>(null);
  useLayoutEffect(() => {
    if (seenBefore.current === null) {
      try {
        seenBefore.current = !!sessionStorage.getItem(KEY);
        sessionStorage.setItem(KEY, "1");
      } catch {
        seenBefore.current = false;
      }
    }
    if (seenBefore.current) setGone(true); // layout effect: hides before paint on client-side navigation
  }, []);

  useLayoutEffect(() => {
    if (gone) return;
    const skip = () => setLeaving(true);
    window.addEventListener("keydown", skip);
    return () => window.removeEventListener("keydown", skip);
  }, [gone]);

  if (gone) return null;
  return (
    <>
      <div
        id="sway-intro"
        className={`intro${leaving ? " leaving" : ""}`}
        aria-hidden="true"
        suppressHydrationWarning
        onClick={() => setLeaving(true)}
        onAnimationEnd={(e) => e.target === e.currentTarget && setGone(true)}
      >
        <div className="intro-mark">
          <span className="intro-word">Sway</span>
          <span className="intro-tag">{copy.landing.introTagline}</span>
        </div>
      </div>
      {/* Needed only in the server HTML (runs before paint on reload); React never runs it on client renders. */}
      {serverPass && <script dangerouslySetInnerHTML={{ __html: HIDE_IF_SEEN }} />}
    </>
  );
}
