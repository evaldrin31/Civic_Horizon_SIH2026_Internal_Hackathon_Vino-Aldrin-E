"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useProfile } from "@/lib/hooks/use-profile";
import { AccessibilityProfile } from "@/lib/scoring";
import * as Popover from "@radix-ui/react-popover";
import { Accessibility, Eye, Ear, Brain, User, ChevronDown, Check } from "lucide-react";
import { useTTS } from "@/lib/hooks/use-tts";
import { cn } from "@/lib/utils";

interface ProfileOption {
  value: AccessibilityProfile | "none";
  label: string;
  sublabel: string;
  Icon: React.ElementType;
  color: string;
  bg: string;
}

const PROFILE_OPTIONS: ProfileOption[] = [
  {
    value: "none",
    label: "General",
    sublabel: "No accessibility profile",
    Icon: User,
    color: "text-muted-foreground",
    bg: "bg-muted",
  },
  {
    value: "wheelchair",
    label: "Wheelchair / Mobility",
    sublabel: "Step-free, ramps, lifts",
    Icon: Accessibility,
    color: "text-[#1b55d0]",
    bg: "bg-[#e5eeff]",
  },
  {
    value: "blind",
    label: "Blind / Low Vision",
    sublabel: "Braille, audio, tactile paths",
    Icon: Eye,
    color: "text-[#7c3aed]",
    bg: "bg-[#f3eeff]",
  },
  {
    value: "deaf",
    label: "Deaf / Hard of Hearing",
    sublabel: "Visual alerts, sign language",
    Icon: Ear,
    color: "text-[#0d7c66]",
    bg: "bg-[#e0f9f4]",
  },
  {
    value: "sensory",
    label: "Sensory Sensitivity",
    sublabel: "Quiet zones, low stimulation",
    Icon: Brain,
    color: "text-[#c2410c]",
    bg: "bg-[#fff4ed]",
  },
  {
    value: "elderly",
    label: "Elderly",
    sublabel: "Seating, handrails, slow pace",
    Icon: User,
    color: "text-[#00687a]",
    bg: "bg-[#e0f9ff]",
  },
  {
    value: "temporary",
    label: "Temporary Mobility",
    sublabel: "Crutches, cast, short-term",
    Icon: Accessibility,
    color: "text-[#856d00]",
    bg: "bg-[#fffbe0]",
  },
];

export function ProfileSelector({ variant = "default" }: { variant?: "default" | "header" }) {
  const { profile, setProfile } = useProfile();
  const { speak } = useTTS();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const selectedOption =
    PROFILE_OPTIONS.find((o) => o.value === (profile ?? "none")) ?? PROFILE_OPTIONS[0];

  const handleSelect = useCallback(
    (val: AccessibilityProfile | "none") => {
      setProfile(val === "none" ? null : val);
      speak(val === "none" ? "Profile cleared" : val + " profile selected");
      setOpen(false);
    },
    [setProfile]
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!open) return;
    const options = Array.from(document.querySelectorAll('[role="option"]')) as HTMLButtonElement[];
    if (options.length === 0) return;
    
    const currentIndex = options.indexOf(document.activeElement as HTMLButtonElement);
    
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % options.length;
      options[nextIndex].focus();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = currentIndex === -1 ? options.length - 1 : (currentIndex - 1 + options.length) % options.length;
      options[prevIndex].focus();
    }
    // Enter/Space is handled natively by the button if focused
  };

  const SelectedIcon = selectedOption.Icon;

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          ref={triggerRef}
          aria-label={`Accessibility profile: ${selectedOption.label}. Click to change.`}
          aria-expanded={open}
          aria-haspopup="listbox"
          className={cn(
            "flex items-center gap-2 rounded-xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
            variant === "header"
              ? "h-9 pl-2 pr-3 bg-popover border-border hover:bg-accent text-foreground text-sm font-medium"
              : "h-10 px-3 w-full bg-background border-border hover:bg-accent text-foreground text-sm font-medium"
          )}
        >
          <span className={cn("flex items-center justify-center w-7 h-7 rounded-lg shrink-0", selectedOption.bg)}>
            <SelectedIcon className={cn("h-4 w-4", selectedOption.color)} aria-hidden />
          </span>
          <span className="truncate hidden sm:inline max-w-[120px]">
            {selectedOption.label}
          </span>
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 text-muted-foreground transition-transform duration-200 shrink-0 ml-auto",
              open && "rotate-180"
            )}
            aria-hidden
          />
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          onKeyDown={handleKeyDown}
          side="bottom"
          align="end"
          sideOffset={8}
          avoidCollisions
          collisionPadding={12}
          role="listbox"
          aria-label="Select accessibility profile"
          className={cn(
            "z-[99999] w-72 rounded-2xl border border-border/50 bg-popover shadow-xl outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            "data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2"
          )}
        >
          <div className="p-2">
            <p className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">
              Accessibility Profile
            </p>
            {PROFILE_OPTIONS.map((option) => {
              const isSelected = (profile ?? "none") === option.value;
              const Icon = option.Icon;
              return (
                <button
                  key={option.value}
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(option.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150",
                    "hover:bg-accent focus-visible:outline-none focus-visible:bg-accent",
                    isSelected && "bg-accent"
                  )}
                >
                  <span className={cn("flex items-center justify-center w-8 h-8 rounded-lg shrink-0", option.bg)}>
                    <Icon className={cn("h-4 w-4", option.color)} aria-hidden />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-semibold text-foreground leading-tight">
                      {option.label}
                    </span>
                    <span className="block text-xs text-muted-foreground leading-tight mt-0.5 truncate">
                      {option.sublabel}
                    </span>
                  </span>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0" aria-hidden />
                  )}
                </button>
              );
            })}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
