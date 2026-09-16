import React from "react";
import Link from "next/link";
import { MessageCircle, FileText, ArrowRight, MapPin, Clock } from "lucide-react";
import { Trip } from "@/lib/types";
import { formatINR, formatDateRange } from "@/lib/utils/cn";
import { buildTripWhatsAppInquiry } from "@/lib/utils/whatsapp";

interface ChatTripCardProps {
  trip: Trip;
  agencyWhatsApp?: string;
  onOpenBrochure?: (trip: Trip) => void;
}

export const ChatTripCard: React.FC<ChatTripCardProps> = ({
  trip,
  agencyWhatsApp = "919820045120",
  onOpenBrochure,
}) => {
  const dateStr = formatDateRange(trip.startDate, trip.endDate);
  const targetWhatsApp = trip.whatsappNumber || agencyWhatsApp;
  const whatsappUrl = buildTripWhatsAppInquiry(trip.title, dateStr, targetWhatsApp);

  return (
    <div className="bg-white rounded-xl border border-[#E5E0D8] p-3 shadow-xs hover:shadow-sm transition-all flex flex-col gap-2.5">
      <div className="flex gap-3">
        <img
          src={trip.imageUrl}
          alt={trip.title}
          className="w-20 h-20 rounded-lg object-cover bg-stone-100 shrink-0"
        />
        <div className="flex flex-col justify-between min-w-0 flex-1">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#6B7280]">
              <MapPin className="w-2.5 h-2.5 text-[#4B6B5B]" />
              <span className="truncate">{trip.destination}</span>
              <span>•</span>
              <span>{trip.duration} Days</span>
            </div>
            <h4 className="text-xs sm:text-sm font-semibold text-[#1C1E21] truncate mt-0.5">
              {trip.title}
            </h4>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-xs sm:text-sm font-bold text-[#1C1E21]">
              {formatINR(trip.price)}
            </span>
            <span className="text-[10px] text-[#6B7280]">{dateStr}</span>
          </div>
        </div>
      </div>

      {/* Quick Action buttons in chat */}
      <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-[#F5F4F0]">
        <Link
          href={`/trips/${trip.slug}`}
          className="py-1.5 px-2 rounded-lg bg-[#FAF9F6] border border-[#E5E0D8] hover:bg-[#F0EFEA] text-[11px] font-medium text-[#1C1E21] flex items-center justify-center gap-1 transition-colors"
        >
          <span>View</span>
          <ArrowRight className="w-3 h-3 text-[#6B7280]" />
        </Link>

        <button
          type="button"
          onClick={() => onOpenBrochure && onOpenBrochure(trip)}
          className="py-1.5 px-2 rounded-lg bg-[#FAF9F6] border border-[#E5E0D8] hover:bg-[#F0EFEA] text-[11px] font-medium text-[#1C1E21] flex items-center justify-center gap-1 transition-colors"
        >
          <FileText className="w-3 h-3 text-[#6B7280]" />
          <span>Brochure</span>
        </button>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-1.5 px-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
        >
          <MessageCircle className="w-3 h-3" />
          <span>WhatsApp</span>
        </a>
      </div>
    </div>
  );
};
