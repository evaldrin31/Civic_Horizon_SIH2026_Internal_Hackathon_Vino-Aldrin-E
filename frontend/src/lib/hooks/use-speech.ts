/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";

export function useSpeech() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<unknown>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as Record<string, unknown>).SpeechRecognition || (window as Record<string, unknown>).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const r = new SpeechRecognition();
        r.continuous = false;
        r.interimResults = true; // get results as they speak
        r.lang = "en-IN"; // Indian English for better local name recognition

        r.onstart = () => {
          setIsListening(true);
          setError(null);
        };

        r.onresult = (event: { resultIndex: number, results: any[], error: string }) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setTranscript(currentTranscript);
        };

        r.onerror = (event: { resultIndex: number, results: any[], error: string }) => {
          console.error("Speech recognition error", event.error);
          setError(event.error);
          setIsListening(false);
        };

        r.onend = () => {
          setIsListening(false);
        };

        setRecognition(r);
      } else {
        setError("Browser does not support speech recognition.");
      }
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        setTranscript("");
        recognition.start();
      } catch (e) {
        console.error(e);
      }
    } else {
      alert("Microphone not supported on this browser.");
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    error,
    isSupported: !!recognition,
  };
}
