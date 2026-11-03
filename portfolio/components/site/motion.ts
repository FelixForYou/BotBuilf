"use client";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flip } from "gsap/Flip";
import { useGSAP } from "@gsap/react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, Flip, useGSAP);
  gsap.defaults({ ease: "power3.out", duration: 0.8 });
  ScrollTrigger.config({ ignoreMobileResize: true });
}

export type Level = "full" | "light" | "minimal";

export function motionState(): { level: Level; touch: boolean } {
  if (typeof document === "undefined") return { level: "minimal", touch: false };
  const d = document.documentElement;
  const level = (d.getAttribute("data-motion") as Level) || "full";
  return { level, touch: d.getAttribute("data-device") === "touch" };
}

/** Tandai bahwa state awal animasi sudah dipasang GSAP sehingga CSS boleh berhenti menyembunyikan. */
export function markReady() {
  document.documentElement.classList.add("motion-ready");
}

export const EASE = {
  out: "expo.out",
  inOut: "power3.inOut",
  soft: "power2.out",
};

export { gsap, ScrollTrigger, Flip, useGSAP };
