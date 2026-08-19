"use client";

import { useCallback, useEffect, useState } from "react";

export function useTTS() {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      const updateVoices = () => {
        setVoices(window.speechSynthesis.getVoices());
      };
      
      updateVoices();
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  const speak = useCallback((text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel(); // Stop current speech

      const utterance = new SpeechSynthesisUtterance(text);
      
      // Try to find a female English voice
      const femaleVoice = voices.find(v => 
        (v.name.toLowerCase().includes("female") || 
         v.name.includes("Zira") || 
         v.name.includes("Samantha") || 
         v.name.includes("Victoria") ||
         v.name.includes("Google UK English Female") ||
         v.name.includes("Ria")) && v.lang.startsWith("en")
      );

      if (femaleVoice) {
        utterance.voice = femaleVoice;
      }
      
      utterance.rate = 1.0;
      utterance.pitch = 1.1; 
      
      window.speechSynthesis.speak(utterance);
    }
  }, [voices]);

  return { speak };
}
