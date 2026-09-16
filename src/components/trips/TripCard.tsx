import React from "react";
import Link from "next/link";
import { MessageCircle, ArrowUpRight, Calendar, Clock, MapPin } from "lucide-react";
import { Trip } from "@/lib/types";
import { formatINR, formatDateRange } from "@/lib/utils/cn";
import { buildTripWhatsAppInquiry } from "@/lib/utils/whatsapp";

interface TripCardProps {
  trip: Trip;
  agencyWhatsApp?: string;
}

export const TripCard: React.FC<TripCardProps> = ({
  trip,
  agencyWhatsApp = "919820045120",
}) => {
  const dateStr = formatDateRange(trip.startDate, trip.endDate);
  const targetWhatsApp = trip.whatsappNumber || agencyWhatsApp;
  const whatsappUrl = buildTripWhatsAppInquiry(trip.title, dateStr, targetWhatsApp);

  return (
    <div className="group flex flex-col bg-white rounded-2xl border border-[#E5E0D8]/80 overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 hover:-translate-y-1">
      {/* Cover Image */}
      <Link
        href={`/trips/${trip.slug}`}
        className="relative w-full h-52 sm:h-56 overflow-hidden bg-[#E2E8F0] block"
      >
        <img
          src={trip.imageUrl}
          alt={trip.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-70 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between pointer-events-none">
          <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-semibold text-[#1C1E21] uppercase tracking-wider shadow-xs">
            {trip.destination}
          </span>

          {trip.featured && (
            <span className="px-2.5 py-1 rounded-full bg-[#1C1E21]/80 backdrop-blur-md text-[11px] font-medium text-amber-300">
              ★ Featured
            </span>
          )}
        </div>

        {/* Bottom meta over image */}
        <div className="absolute bottom-3 left-3.5 right-3.5 flex items-center justify-between text-white text-xs font-medium">
          <div className="flex items-center gap-1.5 drop-shadow-sm">
            <Clock className="w-3.5 h-3.5 text-emerald-300" />
            <span>
              {trip.duration} Days • {trip.nights} Nights
            </span>
          </div>

          <div className="flex items-center gap-1.5 drop-shadow-sm">
            <Calendar className="w-3.5 h-3.5 text-amber-200" />
            <span>{dateStr}</span>
          </div>
        </div>
      </Link>

      {/* Card Content */}
      <div className="p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-[#6B7280] font-medium mb-1.5">
            <MapPin className="w-3 h-3 text-[#4B6B5B]" />
            <span>{trip.region}</span>
            <span>•</span>
            <span className="text-[#4B6B5B]">{trip.tripType}</span>
          </div>

          <Link href={`/trips/${trip.slug}`} className="block group/title">
            <h3 className="text-base sm:text-lg font-medium text-[#1C1E21] group-hover/title:text-[#4B6B5B] transition-colors leading-snug line-clamp-1">
              {trip.title}
            </h3>
          </Link>

          <p className="mt-2 text-xs sm:text-sm text-[#4A5568] line-clamp-2 leading-relaxed font-normal">
            {trip.shortDescription}
          </p>
        </div>

        {/* Footer info: Price & CTAs */}
        <div className="pt-3.5 border-t border-[#F0EFEA] flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#6B7280] block font-medium">
              From
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base sm:text-lg font-semibold text-[#1C1E21]">
                {formatINR(trip.price)}
              </span>
              {trip.originalPrice && (
                <span className="text-xs text-[#9CA3AF] line-through">
                  {formatINR(trip.originalPrice)}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl border border-[#E5E0D8] text-[#1C1E21] hover:text-emerald-700 hover:border-emerald-600 hover:bg-emerald-50/50 transition-colors"
              title="Chat on WhatsApp"
              aria-label={`Inquire on WhatsApp about ${trip.title}`}
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            <Link
              href={`/trips/${trip.slug}`}
              className="inline-flex items-center gap-1 px-3.5 py-2.5 rounded-xl bg-[#1C1E21] text-white text-xs font-semibold hover:bg-[#2A3A4A] transition-colors shadow-xs"
            >
              <span>View Trip</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
