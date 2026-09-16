import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateRange(start: string, end: string): string {
  try {
    const s = new Date(start);
    const e = new Date(end);
    const sMonth = s.toLocaleString("default", { month: "short" });
    const eMonth = e.toLocaleString("default", { month: "short" });
    const sDay = s.getDate();
    const eDay = e.getDate();

    if (sMonth === eMonth) {
      return `${sDay} – ${eDay} ${sMonth}`;
    }
    return `${sDay} ${sMonth} – ${eDay} ${eMonth}`;
  } catch {
    return `${start} – ${end}`;
  }
}
