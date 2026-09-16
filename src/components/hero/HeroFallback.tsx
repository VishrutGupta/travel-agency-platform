import React from "react";

export const HeroFallback: React.FC<{ title?: string }> = () => {
  return (
    <div
      className="relative w-full h-full min-h-[560px] lg:min-h-[640px] overflow-hidden bg-gradient-to-b from-[#E9EDF0] via-[#D8DFE4] to-[#C4CCD3] flex items-center justify-center select-none"
      aria-label="Stylized mountain landscape background"
    >
      {/* Background Sun Glow */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-amber-100/40 blur-3xl pointer-events-none" />

      {/* Atmospheric Mist */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#FAF9F6] via-transparent to-transparent opacity-90" />

      {/* Layer 3: Distant Peaks */}
      <svg
        className="absolute bottom-16 w-[120%] -left-[10%] text-[#8A9BA8] opacity-50"
        viewBox="0 0 1200 400"
        fill="currentColor"
        preserveAspectRatio="none"
      >
        <path d="M0,400 L0,220 L150,110 L320,240 L500,70 L680,260 L850,100 L1020,250 L1200,160 L1200,400 Z" />
      </svg>

      {/* Layer 2: Midground Alpine Ridges */}
      <svg
        className="absolute bottom-6 w-[115%] -left-[7%] text-[#4A5D6E] opacity-75"
        viewBox="0 0 1200 400"
        fill="currentColor"
        preserveAspectRatio="none"
      >
        <path d="M0,400 L0,280 L180,180 L360,300 L540,150 L720,280 L920,160 L1080,290 L1200,210 L1200,400 Z" />
      </svg>

      {/* Layer 1: Foreground Crags */}
      <svg
        className="absolute -bottom-2 w-full text-[#23313E] opacity-95"
        viewBox="0 0 1200 320"
        fill="currentColor"
        preserveAspectRatio="none"
      >
        <path d="M0,320 L0,240 L160,190 L340,260 L520,180 L700,270 L880,190 L1060,250 L1200,200 L1200,320 Z" />
      </svg>

      {/* Drifting Clouds Simulation */}
      <div className="absolute top-20 left-10 w-48 h-12 bg-white/40 rounded-full blur-xl animate-pulse pointer-events-none" />
      <div className="absolute top-36 right-16 w-64 h-14 bg-white/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-28 left-1/3 w-96 h-16 bg-white/50 rounded-full blur-xl pointer-events-none" />
    </div>
  );
};
