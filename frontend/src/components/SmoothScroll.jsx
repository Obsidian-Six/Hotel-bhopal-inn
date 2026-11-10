"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export default function SmoothScroll() {
  useEffect(() => {
    // Admin / staff screens use their own scroll panels (side menu, main panel,
    // pop-ups). Let those scroll natively; smooth scrolling stays on the public site.
    const isStaffScreen = () =>
      /^\/(admin|super-admin|superadmin|reception)/.test(window.location.pathname);

    const lenis = new Lenis({
      duration: 1.15,
      smoothWheel: true,
      smoothTouch: false,
      allowNestedScroll: true,
      prevent: () => isStaffScreen()
    });

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
