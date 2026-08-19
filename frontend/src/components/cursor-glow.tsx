"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!glowRef.current || !dotRef.current) return;
    
    // Check if device supports hover (ignore mobile/touch)
    if (window.matchMedia("(pointer: coarse)").matches) {
      glowRef.current.style.display = "none";
      dotRef.current.style.display = "none";
      return;
    }

    // Fast, snappy response for the tight physical dot
    const dotX = gsap.quickTo(dotRef.current, "x", { duration: 0.1, ease: "power3.out" });
    const dotY = gsap.quickTo(dotRef.current, "y", { duration: 0.1, ease: "power3.out" });

    // Slightly slower, ambient lag for the massive glow
    const glowX = gsap.quickTo(glowRef.current, "x", { duration: 0.8, ease: "power3" });
    const glowY = gsap.quickTo(glowRef.current, "y", { duration: 0.8, ease: "power3" });

    const onMouseMove = (e: MouseEvent) => {
      // 200px offset for 400x400 glow
      glowX(e.clientX - 200);
      glowY(e.clientY - 200);
      
      // 12px offset for 24x24 dot
      dotX(e.clientX - 12);
      dotY(e.clientY - 12);
    };

    window.addEventListener("mousemove", onMouseMove);

    // Continuous multi-color cycling using ultra-smooth hue rotation
    gsap.to(glowRef.current, {
      filter: "blur(50px) hue-rotate(360deg)",
      duration: 6,
      repeat: -1,
      ease: "none"
    });
    
    gsap.to(dotRef.current, {
      filter: "hue-rotate(360deg)",
      duration: 6,
      repeat: -1,
      ease: "none"
    });

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      if (glowRef.current) gsap.killTweensOf(glowRef.current);
      if (dotRef.current) gsap.killTweensOf(dotRef.current);
    };
  }, []);

  return (
    <>
      {/* Slower ambient multi-color glow */}
      <div
        ref={glowRef}
        className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-[9998] mix-blend-multiply dark:mix-blend-screen opacity-70 dark:opacity-50 hidden lg:block"
        style={{
          background: "radial-gradient(circle, rgba(27,85,208,0.8) 0%, rgba(124,58,237,0.4) 40%, rgba(0,0,0,0) 70%)",
          filter: "blur(50px) hue-rotate(0deg)",
          transform: "translate(-200px, -200px)", // Initial hide offscreen
          willChange: "transform, filter"
        }}
      />
      
      {/* Fast physical dot cursor over the glow */}
      <div
        ref={dotRef}
        className="fixed top-0 left-0 w-6 h-6 rounded-full pointer-events-none z-[9999] hidden lg:block backdrop-blur-[2px] border-[1.5px] border-primary bg-primary/20"
        style={{
          transform: "translate(-12px, -12px)", // Initial hide offscreen
          filter: "hue-rotate(0deg)",
          willChange: "transform, filter"
        }}
      />
    </>
  );
}
