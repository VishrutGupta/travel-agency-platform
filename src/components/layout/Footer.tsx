"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Compass, MessageCircle, Mail, MapPin, Phone } from "lucide-react";
import { Agency } from "@/lib/types";
import { authService } from "@/lib/services/authService";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";

export const Footer: React.FC = () => {
  const [agency, setAgency] = useState<Agency | null>(null);

  useEffect(() => {
    authService.getAgency().then(setAgency);
  }, []);

  const whatsappUrl = agency
    ? buildWhatsAppLink(
        agency.whatsapp,
        `Hi ${agency.name}, I would like to inquire about upcoming trips.`
      )
    : "#";

  return (
    <footer className="bg-[#182026] text-[#E2E8F0] pt-16 pb-12 border-t border-[#2D3748]">
      <div className="max-w-6xl mx-auto px-6 sm:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-[#2D3748]/70">
          {/* Brand Info */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 text-white flex items-center justify-center">
                <Compass className="w-4 h-4 text-emerald-400" />
              </div>
              <span className="font-semibold text-lg tracking-tight text-white">
                {agency?.name || "Alpine & Co. Expeditions"}
              </span>
            </div>
            <p className="text-sm text-[#94A3B8] max-w-md leading-relaxed">
              {agency?.description ||
                "Curated high-altitude treks, mindful journeys, and small-group expeditions across the Himalayas and India's untouched landscapes."}
            </p>
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold tracking-wide transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs uppercase tracking-widest text-[#94A3B8] font-semibold">
              Journeys
            </h4>
            <Link
              href="/trips?destination=Kashmir"
              className="text-sm text-[#CBD5E1] hover:text-white transition-colors"
            >
              Kashmir Expeditions
            </Link>
            <Link
              href="/trips?destination=Himachal+Pradesh"
              className="text-sm text-[#CBD5E1] hover:text-white transition-colors"
            >
              Spiti & Himachal Passes
            </Link>
            <Link
              href="/trips?destination=Ladakh"
              className="text-sm text-[#CBD5E1] hover:text-white transition-colors"
            >
              Ladakh High Lakes
            </Link>
            <Link
              href="/trips"
              className="text-sm text-emerald-400 hover:underline pt-1"
            >
              View All Trips →
            </Link>
          </div>

          {/* Contact Details */}
          <div className="flex flex-col gap-3">
            <h4 className="text-xs uppercase tracking-widest text-[#94A3B8] font-semibold">
              Get in Touch
            </h4>
            <div className="flex items-start gap-2.5 text-xs text-[#CBD5E1]">
              <MapPin className="w-4 h-4 text-[#94A3B8] shrink-0 mt-0.5" />
              <span>{agency?.address || "Manali, Himachal Pradesh, India"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#CBD5E1]">
              <Phone className="w-4 h-4 text-[#94A3B8] shrink-0" />
              <span>{agency?.phone || "+91 98200 45120"}</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-[#CBD5E1]">
              <Mail className="w-4 h-4 text-[#94A3B8] shrink-0" />
              <span>{agency?.email || "hello@alpine-expeditions.com"}</span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#64748B] gap-4">
          <p>© {new Date().getFullYear()} {agency?.name || "Alpine & Co."}. Mountain Expedition Platform.</p>
          <div className="flex items-center gap-6">
            <Link href="/admin" className="hover:text-[#94A3B8] transition-colors">
              Owner Dashboard
            </Link>
            <span>•</span>
            <Link href="/admin/login" className="hover:text-[#94A3B8] transition-colors">
              Staff Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
