import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export const DestinationsSection: React.FC = () => {
  const destinations = [
    {
      name: "Kashmir",
      tagline: "Paradise of alpine lakes & pine valleys",
      imageUrl: "https://images.unsplash.com/photo-1595815771614-ade9d652a65d?auto=format&fit=crop&w=600&q=80",
      query: "Kashmir",
      badge: "Alpine Lakes",
    },
    {
      name: "Himachal",
      tagline: "High passes, deep pine gorges & Spiti",
      imageUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80",
      query: "Himachal Pradesh",
      badge: "High Passes",
    },
    {
      name: "Ladakh",
      tagline: "Lunar deserts, gompas & Pangong Tso",
      imageUrl: "https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=600&q=80",
      query: "Ladakh",
      badge: "Cold Desert",
    },
    {
      name: "Rajasthan",
      tagline: "Regal sand citadels & starry Thar dunes",
      imageUrl: "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=600&q=80",
      query: "Rajasthan",
      badge: "Heritage Dunes",
    },
    {
      name: "Goa",
      tagline: "Secret backwaters, spice estates & coves",
      imageUrl: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=600&q=80",
      query: "Goa",
      badge: "Hinterland Coast",
    },
    {
      name: "Kerala",
      tagline: "Misty tea slopes & palm-fringed waters",
      imageUrl: "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=600&q=80",
      query: "Kerala",
      badge: "Western Ghats",
    },
  ];

  return (
    <section className="py-20 sm:py-28 bg-[#FAF9F6] border-b border-[#E5E0D8]/60">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
          <div>
            <span className="text-xs uppercase tracking-widest text-[#4B6B5B] font-semibold">
              Terrains & Horizons
            </span>
            <h2 className="text-3xl sm:text-4xl font-light tracking-tight text-[#1C1E21] mt-2">
              Popular Destinations
            </h2>
          </div>
          <Link
            href="/trips"
            className="text-xs sm:text-sm font-semibold text-[#1C1E21] hover:text-[#4B6B5B] transition-colors"
          >
            Explore all regions →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6">
          {destinations.map((d) => (
            <Link
              key={d.name}
              href={`/trips?destination=${encodeURIComponent(d.query)}`}
              className="group relative rounded-2xl overflow-hidden aspect-4/5 bg-stone-200 block shadow-2xs hover:shadow-md transition-all duration-300"
            >
              <img
                src={d.imageUrl}
                alt={d.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              <div className="absolute inset-0 p-3.5 flex flex-col justify-between">
                <span className="self-start px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[9px] font-medium tracking-wide">
                  {d.badge}
                </span>

                <div>
                  <div className="flex items-center justify-between text-white">
                    <h3 className="font-semibold text-sm sm:text-base leading-tight">
                      {d.name}
                    </h3>
                    <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-[10px] text-stone-300 line-clamp-1 mt-0.5 font-normal">
                    {d.tagline}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};
