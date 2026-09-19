"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  X,
  RotateCcw,
  Compass,
  MessageCircle,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import {
  AssistantChoice,
  AssistantUserAnswers,
  Agency,
  ChatMessageItem,
  Trip,
} from "@/lib/types";
import {
  CHATBOT_QUESTIONS,
  getNextQuestion,
} from "@/lib/chatbot/questionFlow";
import { resolveTravelDate } from "@/lib/chatbot/resolveDate";
import { findMatchingTrips } from "@/lib/chatbot/ranking";
import { tripService } from "@/lib/services/tripService";
import { ChatMessage } from "./ChatMessage";
import { BrochureModal } from "../trips/BrochureModal";
import { authService } from "@/lib/services/authService";
import { buildWhatsAppLink } from "@/lib/utils/whatsapp";

export const TravelAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [answers, setAnswers] = useState<AssistantUserAnswers>({});
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<string[]>([]);
  const [activeBrochureTrip, setActiveBrochureTrip] = useState<Trip | null>(null);
  const [agencyWhatsApp, setAgencyWhatsApp] = useState("919820045120");
  const [textInput, setTextInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleSendText = async () => {
    const text = textInput.trim();
    if (!text) return;

    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setTextInput("");
    setMessages(newMessages);

    // Try to resolve date from text
    const resolved = resolveTravelDate(text);
    if (resolved) {
      const dateStr = resolved.date.toISOString().split("T")[0];
      const assistantMsg: ChatMessageItem = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: `Looking for trips on ${resolved.label} (${dateStr})...`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMsg]);

      const trips = await tripService.getTrips(undefined, true);
      const dateTrips = trips.filter((t) => t.startDate <= dateStr && t.endDate >= dateStr && t.isActive);

      if (dateTrips.length > 0) {
        const resultMsg: ChatMessageItem = {
          id: `msg-results-${Date.now()}`,
          sender: "assistant",
          text: `I found ${dateTrips.length} trip(s) available for ${resolved.label}:`,
          trips: dateTrips.slice(0, 4),
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, resultMsg]);
      } else {
        const noResultMsg: ChatMessageItem = {
          id: `msg-nores-${Date.now()}`,
          sender: "assistant",
          text: `I couldn't find a trip available for ${resolved.label}. Would you like to see nearby available dates?`,
          actionSuggestions: [{ label: "Show all upcoming trips", action: "show_all" }],
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, noResultMsg]);
      }
    } else {
      const fallbackMsg: ChatMessageItem = {
        id: `msg-fallback-${Date.now()}`,
        sender: "assistant",
        text: "I can help with date-related queries like 'I want to go tomorrow' or 'next week'. Try asking about dates!",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    }
  };

  // Initialize on mount
  useEffect(() => {
    authService.getAgency().then((a: Agency | null) => {
      if (a?.whatsapp) setAgencyWhatsApp(a.whatsapp);
    });

    const handleOpenEvent = () => {
      setIsOpen(true);
      setIsMinimized(false);
    };

    window.addEventListener("open-travel-assistant", handleOpenEvent);
    return () => window.removeEventListener("open-travel-assistant", handleOpenEvent);
  }, []);

  // Auto scroll to bottom of messages
  useEffect(() => {
    if (isOpen && !isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isMinimized]);

  // Start fresh conversation flow
  const initConversation = () => {
    const firstQ = CHATBOT_QUESTIONS[0];
    setAnswers({});
    setAnsweredQuestionIds([]);
    setMessages([
      {
        id: "msg-welcome",
        sender: "assistant",
        text: "Hi! I am your Mountain Expedition Assistant. I can help you discover the ideal journey tailored to your style, dates, and budget.",
        timestamp: new Date().toISOString(),
      },
      {
        id: `msg-${firstQ.id}`,
        sender: "assistant",
        text: firstQ.prompt,
        options: firstQ.options,
        questionId: firstQ.id,
        timestamp: new Date().toISOString(),
      },
    ]);
  };

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      initConversation();
    }
  }, [isOpen]);

  const handleSelectOption = async (
    option: AssistantChoice,
    questionId?: string
  ) => {
    if (!questionId) return;

    // 1. Add user answer bubble
    const userMsg: ChatMessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: option.label,
      timestamp: new Date().toISOString(),
    };

    const newAnswers = { ...answers, [questionId]: option.value };
    const newAnsweredIds = [...answeredQuestionIds, questionId];
    setAnswers(newAnswers);
    setAnsweredQuestionIds(newAnsweredIds);

    // Update messages removing clickable options on the answered question
    const updatedMessages = messages.map((m) =>
      m.questionId === questionId ? { ...m, options: undefined } : m
    );

    setMessages([...updatedMessages, userMsg]);

    // 2. Check for next question
    const nextQ = getNextQuestion(newAnswers, newAnsweredIds);

    if (nextQ) {
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-${nextQ.id}`,
            sender: "assistant",
            text: nextQ.prompt,
            options: nextQ.options,
            questionId: nextQ.id,
            timestamp: new Date().toISOString(),
          },
        ]);
      }, 400);
    } else {
      // 3. All questions answered: execute deterministic recommendation query!
      setTimeout(async () => {
        setMessages((prev) => [
          ...prev,
          {
            id: "msg-searching",
            sender: "assistant",
            text: "Analyzing our upcoming departures and matching your preferences...",
            timestamp: new Date().toISOString(),
          },
        ]);

        const searchRes = await findMatchingTrips(newAnswers);

        setTimeout(() => {
          if (searchRes.results.length > 0) {
            const resultMsgText = searchRes.isRelaxed
              ? `I found ${searchRes.results.length} close matches for your journey:`
              : `Great news! I found ${searchRes.results.length} curated expeditions matching all your criteria:`;

            setMessages((prev) => [
              ...prev.filter((m) => m.id !== "msg-searching"),
              {
                id: "msg-results",
                sender: "assistant",
                text: resultMsgText,
                trips: searchRes.results,
                isRelaxedSearch: searchRes.isRelaxed,
                relaxationReason: searchRes.relaxationReason,
                actionSuggestions: [
                  { label: "Show cheaper options", action: "cheaper" },
                  { label: "More adventure trips", action: "adventure" },
                  { label: "Change dates", action: "change_dates" },
                  { label: "Start over", action: "restart" },
                ],
                timestamp: new Date().toISOString(),
              },
            ]);
          } else {
            setMessages((prev) => [
              ...prev.filter((m) => m.id !== "msg-searching"),
              {
                id: "msg-no-results",
                sender: "assistant",
                text: "We currently don't have an exact departure matching all these specific filters. Would you like to broaden your criteria or speak to our trip planning specialist?",
                actionSuggestions: [
                  { label: "Show all upcoming trips", action: "show_all" },
                  { label: "Increase budget", action: "higher_budget" },
                  { label: "Start over", action: "restart" },
                ],
                timestamp: new Date().toISOString(),
              },
            ]);
          }
        }, 600);
      }, 300);
    }
  };

  const handleActionClick = async (action: string) => {
    if (action === "restart") {
      initConversation();
    } else if (action === "cheaper") {
      const updated = { ...answers, budget: "under_20k" };
      setAnswers(updated);
      const res = await findMatchingTrips(updated);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-user-cheaper-${Date.now()}`,
          sender: "user",
          text: "Show cheaper options (Under ₹20,000)",
          timestamp: new Date().toISOString(),
        },
        {
          id: `msg-cheaper-${Date.now()}`,
          sender: "assistant",
          text: `Here are our best valued expeditions under ₹20,000:`,
          trips: res.results,
          actionSuggestions: [{ label: "Start over", action: "restart" }],
          timestamp: new Date().toISOString(),
        },
      ]);
    } else if (action === "adventure") {
      const updated = {
        ...answers,
        destinationCategory: "mountains",
        mountainExperience: "trekking",
      };
      setAnswers(updated);
      const res = await findMatchingTrips(updated);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-user-adv-${Date.now()}`,
          sender: "user",
          text: "Show high-altitude trekking adventures",
          timestamp: new Date().toISOString(),
        },
        {
          id: `msg-adv-${Date.now()}`,
          sender: "assistant",
          text: `Here are our top high-altitude trekking challenges:`,
          trips: res.results,
          actionSuggestions: [{ label: "Start over", action: "restart" }],
          timestamp: new Date().toISOString(),
        },
      ]);
    } else if (action === "change_dates") {
      const timingQ = CHATBOT_QUESTIONS.find((q) => q.id === "timing");
      if (timingQ) {
        setMessages((prev) => [
          ...prev,
          {
            id: `msg-timing-retry-${Date.now()}`,
            sender: "assistant",
            text: "Which departure month works best for you?",
            options: timingQ.options,
            questionId: timingQ.id,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } else if (action === "show_all") {
      const res = await findMatchingTrips({});
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-all-${Date.now()}`,
          sender: "assistant",
          text: "Here are all our featured expeditions across the Himalayas and beyond:",
          trips: res.results,
          actionSuggestions: [{ label: "Start over", action: "restart" }],
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  };

  return (
    <>
      {/* Floating Trigger Pill */}
      {!isOpen && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setIsMinimized(false);
            }}
            className="group flex items-center gap-2.5 px-4 py-3.5 rounded-full bg-[#1C1E21] hover:bg-[#2A3A4A] text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 active:scale-95 border border-white/20"
            aria-label="Open Travel Assistant Chatbot"
          >
            <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold tracking-wide">Travel Assistant</span>
              <span className="text-[10px] text-stone-300 font-normal">
                Find your trip in 1 min
              </span>
            </div>
          </button>
        </div>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed z-50 transition-all duration-300 ${
            isMinimized
              ? "bottom-6 right-6 w-80 bg-white rounded-2xl shadow-xl border border-[#E5E0D8] p-3"
              : "inset-x-3 bottom-3 sm:inset-auto sm:bottom-6 sm:right-6 w-auto sm:w-[420px] h-[85vh] sm:h-[620px] max-h-[85vh] bg-[#FAF9F6] rounded-3xl shadow-2xl border border-[#E5E0D8] flex flex-col overflow-hidden"
          }`}
        >
          {/* Header */}
          <div className="p-4 bg-[#1C1E21] text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-white/10 text-emerald-400 flex items-center justify-center">
                <Compass className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold tracking-tight">
                  Travel Assistant
                </h3>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Deterministic Rule-Based Matcher
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={initConversation}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Start over"
                aria-label="Restart conversation"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors hidden sm:block"
                title={isMinimized ? "Expand" : "Minimize"}
                aria-label="Toggle assistant window size"
              >
                <ChevronDown className={`w-4 h-4 transition-transform ${isMinimized ? "rotate-180" : ""}`} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Close"
                aria-label="Close assistant"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Message List */}
              <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
                {messages.map((msg) => (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    onSelectOption={handleSelectOption}
                    onActionClick={handleActionClick}
                    onOpenBrochure={(trip) => setActiveBrochureTrip(trip)}
                    agencyWhatsApp={agencyWhatsApp}
                  />
                ))}
<div ref={messagesEndRef} />
               </div>

              {/* Text Message Input */}
              <div className="p-3 bg-[#F5F4F0] border-t border-[#E5E0D8] flex items-center gap-2">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendText()}
                  placeholder="Ask about dates, e.g. 'I want to go tomorrow'"
                  className="flex-1 px-3 py-2 rounded-xl border border-[#E5E0D8] text-xs font-medium focus:ring-2 focus-ring-[#4B6B5B]/20 outline-hidden bg-white"
                />
                <button
                  type="button"
                  onClick={handleSendText}
                  disabled={!textInput.trim()}
                  className="p-2 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white disabled:opacity-50 transition-colors"
                  aria-label="Send message"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Footer WhatsApp Link */}
              <div className="p-3 bg-[#F5F4F0] border-t border-[#E5E0D8] flex items-center justify-between text-xs text-[#6B7280]">
                <span>Need custom expedition planning?</span>
                <a
                  href={buildWhatsAppLink(
                    agencyWhatsApp,
                    "Hi, I would like to speak with an expedition specialist for custom travel planning."
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Expert</span>
                </a>
              </div>
            </>
          )}
        </div>
      )}

      {/* Brochure Modal if triggered from chat */}
      {activeBrochureTrip && (
        <BrochureModal
          isOpen={!!activeBrochureTrip}
          onClose={() => setActiveBrochureTrip(null)}
          trip={activeBrochureTrip}
        />
      )}
    </>
  );
};
