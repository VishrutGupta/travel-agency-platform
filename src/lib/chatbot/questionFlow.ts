import { AssistantQuestion, AssistantUserAnswers } from "../types";
import { resolveTravelDate } from "./resolveDate";

const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const now = new Date();
const thisMonthName = monthNames[now.getMonth()];
const nextMonthName = monthNames[(now.getMonth() + 1) % 12];

export const CHATBOT_QUESTIONS: AssistantQuestion[] = [
  {
    id: "destinationCategory",
    prompt: "Where would you like to travel?",
    subtitle: "Select a landscape or destination vibe that inspires you.",
    options: [
      { label: "Mountains 🏔️", value: "mountains" },
      { label: "Beaches & Coast 🌊", value: "beaches" },
      { label: "Desert & Heritage 🏜️", value: "desert" },
      { label: "Wild Nature & Rainforest 🌿", value: "nature" },
      { label: "I'm open to anything ✨", value: "flexible" },
    ],
  },
  {
    id: "mountainExperience",
    prompt: "What kind of mountain experience do you prefer?",
    subtitle: "From gentle valley walks to rugged alpine passes.",
    conditionalOn: {
      questionId: "destinationCategory",
      value: "mountains",
    },
    options: [
      { label: "Relaxed & Scenic ☕", value: "relaxed" },
      { label: "Active Adventure 🧗", value: "adventure" },
      { label: "Cultural Sightseeing 🏯", value: "sightseeing" },
      { label: "High-Altitude Trekking 🥾", value: "trekking" },
    ],
  },
  {
    id: "timing",
    prompt: "When would you like to travel?",
    subtitle: "We run curated departures aligned with the best seasons.",
    options: [
      { label: `This month (${thisMonthName})`, value: "this_month" },
      { label: `Next month (${nextMonthName})`, value: "next_month" },
      { label: "In 2–3 months", value: "2_3_months" },
      { label: "I'm flexible with dates", value: "flexible" },
    ],
  },
  {
    id: "duration",
    prompt: "How many days are you looking for?",
    subtitle: "Including travel and acclimatization time.",
    options: [
      { label: "2–3 days (Quick getaway)", value: "2-3" },
      { label: "4–5 days (Short expedition)", value: "4-5" },
      { label: "6–7 days (Full immersion)", value: "6-7" },
      { label: "8+ days (Grand traverse)", value: "8+" },
    ],
  },
  {
    id: "budget",
    prompt: "What is your approximate budget per person?",
    subtitle: "All our journeys include stays, local guides, and gear.",
    options: [
      { label: "Under ₹20,000", value: "under_20k" },
      { label: "₹20,000 – ₹30,000", value: "20k-30k" },
      { label: "₹30,000 – ₹50,000", value: "30k-50k" },
      { label: "₹50,000+", value: "above_50k" },
    ],
  },
  {
    id: "travelers",
    prompt: "Who are you travelling with?",
    subtitle: "Helps us tune the pace and accommodation style.",
    options: [
      { label: "Solo Explorer 🎒", value: "solo" },
      { label: "Couple / Duo 👥", value: "couple" },
      { label: "Family 👨‍👩‍👧", value: "family" },
      { label: "Friends 🤝", value: "friends" },
      { label: "Private Group ⛺", value: "group" },
    ],
  },
  {
    id: "hasChildren",
    prompt: "Will children be joining this journey?",
    subtitle: "We ensure family-friendly trails and safety measures.",
    conditionalOn: {
      questionId: "travelers",
      value: "family",
    },
    options: [
      { label: "Yes, travelling with kids", value: "yes" },
      { label: "No children", value: "no" },
    ],
  },
];

export function getNextQuestion(
  currentAnswers: AssistantUserAnswers,
  answeredQuestionIds: string[]
): AssistantQuestion | null {
  for (const q of CHATBOT_QUESTIONS) {
    if (answeredQuestionIds.includes(q.id)) {
      continue;
    }

    if (q.conditionalOn) {
      const parentVal = (currentAnswers as Record<string, string | string[]>)[q.conditionalOn.questionId] as string | undefined;
      if (Array.isArray(q.conditionalOn.value)) {
        if (!parentVal || !q.conditionalOn.value.includes(parentVal)) {
          continue;
        }
      } else if (parentVal !== q.conditionalOn.value) {
        continue;
      }
    }

    return q;
  }
  return null;
}
