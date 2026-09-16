import React from "react";
import { Compass, ShieldCheck, HeartHandshake, Eye } from "lucide-react";

export const WhyWithUsSection: React.FC = () => {
  const pillars = [
    {
      num: "01",
      title: "Experienced Planning",
      description: "Trained mountain leaders and certified wilderness first responders for every route.",
      icon: Compass,
    },
    {
      num: "02",
      title: "Curated Experiences",
      description: "Access secluded valleys, authentic mountain homestays, and pristine alpine camps.",
      icon: Eye,
    },
    {
      num: "03",
      title: "Transparent Pricing",
      description: "Zero hidden surcharges. All permits, alpine tents, meals, and safety gear included.",
      icon: ShieldCheck,
    },
    {
      num: "04",
      title: "Personal Support",
      description: "Direct WhatsApp communication with an experienced coordinator before and during your trip.",
      icon: HeartHandshake,
    },
  ];

  return (
    <section className="py-20 sm:py-24 bg-[#F5F4F0] border-b border-[#E5E0D8]/60">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="text-center max-w-xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest text-[#4B6B5B] font-semibold">
            Our Standard
          </span>
          <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#1C1E21] mt-2">
            Thoughtfully planned journeys.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {pillars.map((p) => {
            const IconComponent = p.icon;
            return (
              <div
                key={p.num}
                className="flex flex-col p-6 rounded-2xl bg-[#FAF9F6] border border-[#E5E0D8]/80 shadow-2xs hover:shadow-xs transition-all"
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="font-mono text-xs font-semibold text-[#4B6B5B]">
                    {p.num}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-white text-[#1C1E21] border border-[#E5E0D8] flex items-center justify-center">
                    <IconComponent className="w-4 h-4 text-[#4B6B5B]" />
                  </div>
                </div>

                <h3 className="text-base font-semibold text-[#1C1E21] mb-2">
                  {p.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed font-normal">
                  {p.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
