"use client";

import { useEffect } from "react";

export function useA11yTTS() {
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    // Pre-load voices to avoid delay on first click
    let femaleVoice: SpeechSynthesisVoice | null = null;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      // Try to find a good female English voice (Google UK/US Female, Samantha, Microsoft Zira, etc.)
      femaleVoice = 
        voices.find(v => v.name.includes("Female") || v.name.includes("Google UK English Female") || v.name.includes("Zira") || v.name.includes("Samantha")) || 
        voices.find(v => v.lang.startsWith("en")) || 
        voices[0];
    };
    
    // Some browsers load voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      // Find the closest clickable element (button, link, or elements with role=button)
      const clickable = target.closest("button, a, [role='button'], [tabindex='0']");
      if (!clickable) return;

      // Extract text to read
      let textToRead = clickable.getAttribute("aria-label") || clickable.getAttribute("title");
      if (!textToRead) {
        // Get visible text, ignoring child elements that might clutter it, or just use textContent
        textToRead = clickable.textContent || "";
      }

      textToRead = textToRead.trim();
      if (!textToRead) return;

      // Stop any current speech
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(textToRead);
      if (femaleVoice) utterance.voice = femaleVoice;
      utterance.rate = 1.1; // Slightly faster for snappier UI feel
      utterance.pitch = 1.2; // Higher pitch often sounds more female/clear

      window.speechSynthesis.speak(utterance);
    };

    document.addEventListener("click", handleGlobalClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleGlobalClick, { capture: true });
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);
}
