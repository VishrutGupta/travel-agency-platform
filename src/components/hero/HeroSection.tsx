"use client";

import React from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight, Compass, Sparkles } from "lucide-react";
import { HeroFallback } from "./HeroFallback";

// Lazy load 3D mountain scene without SSR
const MountainScene = dynamic(() => import("./MountainScene"), {
  ssr: false,
  loading: () => <HeroFallback />,
});

interface HeroSectionProps {
  onOpenAssistant?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenAssistant,
}) => {
  return (
    <section className="relative w-full min-h-[580px] sm:h-[640px] lg:h-[720px] overflow-hidden bg-[#DDE6ED] flex items-center justify-center">
      {/* 3D Mountain Canvas Background */}
      <div className="absolute inset-0 z-0">
        <MountainScene />
      </div>

      {/* Atmospheric Vignette & Subtle Gradient for readability */}
      <div className="absolute inset-0 z-10 bg-gradient-to-t from-[#FAF9F6]/90 via-transparent to-black/10 pointer-events-none" />

      {/* Hero Content Overlay */}
      <div className="relative z-20 max-w-5xl mx-auto px-6 sm:px-8 text-center flex flex-col items-center">
        {/* Subtle pill badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 backdrop-blur-md border border-white/60 text-xs uppercase tracking-widest text-[#374151] font-medium shadow-sm mb-6 animate-fade-in">
          <Compass className="w-3.5 h-3.5 text-[#4B6B5B]" />
          <span>Mountain Expedition & Curated Treks</span>
        </div>

        {/* Agency Name */}
        <p className="text-xs sm:text-sm uppercase tracking-[0.25em] text-[#4B6B5B] font-semibold mb-3">
          Alpine & Co. Expeditions
        </p>

        {/* Main Hero Title */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-[#1C1E21] leading-[1.08] mb-6 max-w-3xl">
          Explore Beyond <br />
          <span className="font-serif italic font-normal text-[#2A3A4A]">
            The Ordinary
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-[#4A5568] max-w-xl font-normal leading-relaxed mb-10">
          Curated journeys. Unforgettable places.
        </p>

        {/* Action CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <Link
            href="/trips"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-[#1C1E21] text-white text-sm font-medium tracking-wide shadow-md hover:bg-[#2A3A4A] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Explore Trips</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => {
              if (onOpenAssistant) {
                onOpenAssistant();
              } else {
                // Dispatch event or click assistant trigger
                window.dispatchEvent(new CustomEvent("open-travel-assistant"));
              }
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-full bg-white/80 backdrop-blur-md border border-[#E5E0D8] text-[#1C1E21] text-sm font-medium tracking-wide shadow-sm hover:bg-white hover:border-[#CBD5E1] transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Sparkles className="w-4 h-4 text-[#4B6B5B]" />
            <span>Chat With Travel Assistant</span>
          </button>
        </div>
      </div>
    </section>
  );
};
