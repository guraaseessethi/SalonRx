"use client";

import { useEffect } from "react";

/**
 * Content review mode. Visit any page with ?review=1 to show a small [verify] marker on everything that
 * must be confirmed with the salon (see docs/CONTENT_TODO.md). ?review=0 turns it off.
 * The choice is remembered for the browser tab only.
 */
export function ReviewMode() {
  useEffect(() => {
    try {
      const param = new URLSearchParams(window.location.search).get("review");
      if (param === "1") window.sessionStorage.setItem("salonrx-review", "1");
      if (param === "0") window.sessionStorage.removeItem("salonrx-review");
      if (window.sessionStorage.getItem("salonrx-review") === "1") document.documentElement.dataset.review = "1";
      else delete document.documentElement.dataset.review;
    } catch {
      if (new URLSearchParams(window.location.search).get("review") === "1") document.documentElement.dataset.review = "1";
    }
  }, []);
  return null;
}

/** A marker that only shows in review mode. Empty in the DOM, so it never reaches search results. */
export function Verify() {
  return <span className="verify" aria-hidden="true" />;
}
