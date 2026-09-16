import React from "react";
import { Compass, Mountain, ShieldCheck, Footprints } from "lucide-react";

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-20 sm:py-28 bg-[#F5F4F0] border-b border-[#E5E0D8]/60">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#4B6B5B]">
              <Mountain className="w-3.5 h-3.5" />
              <span>About Alpine & Co.</span>
            </div>

            <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-[#1C1E21] leading-tight">
              Travel with purpose. <br />
              <span className="font-serif italic text-[#2A3A4A]">Explore with confidence.</span>
            </h2>

            <p className="text-sm sm:text-base text-[#4A5568] leading-relaxed font-normal">
              Born in the high valleys of Himachal Pradesh, Alpine & Co. Expeditions was founded on a simple belief: the most transformative travel experiences happen when we slow down, step off paved highways, and form a respectful connection with the mountains.
            </p>

            <p className="text-sm sm:text-base text-[#4A5568] leading-relaxed font-normal">
              We operate exclusively with small groups, certified mountain leaders, and local Himalayan communities. Whether camping beside glacial tarns in Kashmir or crossing 15,000-foot passes in Spiti, your safety and the preservation of fragile wilderness ecosystems are our paramount priorities.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4 border-t border-[#E5E0D8]">
              <div>
                <span className="text-2xl sm:text-3xl font-light text-[#1C1E21] block">12+</span>
                <span className="text-xs text-[#6B7280]">Years Mountain Experience</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-light text-[#1C1E21] block">100%</span>
                <span className="text-xs text-[#6B7280]">Zero-Trace Policy</span>
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-light text-[#1C1E21] block">1:6</span>
                <span className="text-xs text-[#6B7280]">Guide-to-Trekker Ratio</span>
              </div>
            </div>
          </div>

          {/* Minimalist Mountain Graphic / Image Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden shadow-lg border border-[#E5E0D8] bg-white aspect-4/5">
              <img
                src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=900&q=80"
                alt="Alpine expedition ridge"
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              {/* Floating quote card */}
              <div className="absolute bottom-6 left-6 right-6 p-4 rounded-2xl bg-white/90 backdrop-blur-md border border-white/60 shadow-sm text-xs text-[#1C1E21]">
                <p className="font-serif italic text-sm text-[#2A3A4A] mb-1">
                  "The mountains are calling, and mindful presence is the answer."
                </p>
                <span className="text-[10px] text-[#6B7280] uppercase tracking-wider font-semibold">
                  Alpine Expedition Philosophy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
