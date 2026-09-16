import React from "react";
import { Compass, Sparkles } from "lucide-react";
import { AssistantChoice, ChatMessageItem, Trip } from "@/lib/types";
import { ChatTripCard } from "./ChatTripCard";

interface ChatMessageProps {
  message: ChatMessageItem;
  onSelectOption: (option: AssistantChoice, questionId?: string) => void;
  onActionClick: (action: string) => void;
  onOpenBrochure?: (trip: Trip) => void;
  agencyWhatsApp?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onSelectOption,
  onActionClick,
  onOpenBrochure,
  agencyWhatsApp,
}) => {
  const isAssistant = message.sender === "assistant";

  return (
    <div className={`flex flex-col gap-2 ${isAssistant ? "items-start" : "items-end"}`}>
      {/* Sender indicator and Text Bubble */}
      <div className={`flex items-start gap-2.5 max-w-[88%] ${isAssistant ? "flex-row" : "flex-row-reverse"}`}>
        {isAssistant && (
          <div className="w-7 h-7 rounded-full bg-[#1C1E21] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        )}

        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
            isAssistant
              ? "bg-[#F3F4F6] text-[#1F2937] rounded-tl-xs border border-[#E5E7EB]"
              : "bg-[#1C1E21] text-white rounded-tr-xs shadow-xs"
          }`}
        >
          {message.text}
        </div>
      </div>

      {/* Relaxed Search Notice */}
      {message.isRelaxedSearch && message.relaxationReason && (
        <div className="ml-9 max-w-[88%] p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-normal">
          <span className="font-semibold">Note: </span>
          {message.relaxationReason}
        </div>
      )}

      {/* Option Selection Buttons */}
      {message.options && message.options.length > 0 && (
        <div className="ml-9 flex flex-wrap gap-2 max-w-[92%] mt-1">
          {message.options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => onSelectOption(option, message.questionId)}
              className="px-3.5 py-2 rounded-xl bg-white border border-[#E5E0D8] text-xs font-medium text-[#1C1E21] hover:border-[#4B6B5B] hover:bg-[#FAF9F6] active:scale-98 transition-all shadow-2xs text-left"
            >
              {option.label}
            </button>
          ))}
        </div>
      )}

      {/* Matching Trip Cards */}
      {message.trips && message.trips.length > 0 && (
        <div className="ml-9 flex flex-col gap-2.5 w-full max-w-[92%] mt-1">
          {message.trips.map((trip) => (
            <ChatTripCard
              key={trip.id}
              trip={trip}
              agencyWhatsApp={agencyWhatsApp}
              onOpenBrochure={onOpenBrochure}
            />
          ))}
        </div>
      )}

      {/* Refinement Action Suggestions */}
      {message.actionSuggestions && message.actionSuggestions.length > 0 && (
        <div className="ml-9 flex flex-wrap gap-2 max-w-[92%] mt-2">
          {message.actionSuggestions.map((act) => (
            <button
              key={act.action}
              type="button"
              onClick={() => onActionClick(act.action)}
              className="px-3 py-1.5 rounded-full bg-[#E5E0D8]/60 hover:bg-[#E5E0D8] text-[11px] font-semibold text-[#374151] transition-colors"
            >
              {act.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
