"use client";

import React, { useState, useEffect } from "react";
import { MessageCircle, Phone, Mail, MapPin, Globe, Check } from "lucide-react";
import { Agency } from "@/lib/types";
import { authService } from "@/lib/services/authService";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export const ContactSection: React.FC = () => {
  const [agency, setAgency] = useState<Agency | null>(null);

  useEffect(() => {
    authService.getAgency().then(setAgency);
  }, []);

  const whatsappNumber = agency?.whatsapp || "919820045120";
  const whatsappUrl = buildWhatsAppLink(
    whatsappNumber,
    `Hi ${agency?.name || "Alpine & Co."}, I'm planning an upcoming trip and would like to speak with an expedition specialist.`
  );

  return (
    <section id="contact" className="py-20 sm:py-28 bg-[#FAF9F6]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="bg-[#1C1E21] text-white rounded-3xl p-8 sm:p-12 lg:p-16 relative overflow-hidden shadow-xl">
          {/* Subtle background glow */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left pitch & Primary WhatsApp CTA */}
            <div className="lg:col-span-7 flex flex-col gap-6">
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-semibold">
                Direct Communication
              </span>

              <h2 className="text-3xl sm:text-5xl font-light tracking-tight text-white leading-tight">
                Ready to plan your <br />
                <span className="font-serif italic font-normal text-stone-300">
                  next mountain crossing?
                </span>
              </h2>

              <p className="text-sm sm:text-base text-[#94A3B8] font-normal leading-relaxed max-w-lg">
                We take pride in direct, personalized trip consultation. Reach out directly on WhatsApp to check seat availability, request custom dates, or ask about gear readiness.
              </p>

              <div className="pt-2 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm tracking-wide transition-all shadow-md hover:scale-[1.02] active:scale-[0.98]"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Chat on WhatsApp</span>
                </a>

                <span className="text-xs text-[#94A3B8]">
                  Typically responds in &lt; 15 minutes
                </span>
              </div>
            </div>

            {/* Right Contact Details Card */}
            <div className="lg:col-span-5 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 p-6 sm:p-8 flex flex-col gap-5">
              <h3 className="text-sm font-semibold tracking-wider uppercase text-stone-300 pb-3 border-b border-white/10">
                Agency Contact Information
              </h3>

              <div className="flex items-start gap-3 text-xs sm:text-sm text-stone-300">
                <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>{agency?.address || "Old Manali, Himachal Pradesh, India"}</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-stone-300">
                <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{agency?.phone || "+91 98200 45120"}</span>
              </div>

              <div className="flex items-center gap-3 text-xs sm:text-sm text-stone-300">
                <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>{agency?.email || "hello@alpine-expeditions.com"}</span>
              </div>

              {/* Social links */}
              <div className="pt-3 border-t border-white/10 flex items-center gap-3">
                {agency?.instagram && (
                  <a
                    href={agency.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                    aria-label="Instagram"
                  >
                    <InstagramIcon className="w-4 h-4" />
                  </a>
                )}
                {agency?.facebook && (
                  <a
                    href={agency.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                    aria-label="Facebook"
                  >
                    <FacebookIcon className="w-4 h-4" />
                  </a>
                )}
                {agency?.website && (
                  <a
                    href={agency.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                    aria-label="Official Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
