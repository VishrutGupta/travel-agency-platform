export function resolveTravelDate(
  message: string,
  now: Date = new Date()
): { date: Date; label: string } | null {
  const msg = message.toLowerCase().trim();
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  // today
  if (/\btoday\b/.test(msg)) {
    return { date: new Date(year, month, day), label: "today" };
  }

  // tomorrow
  if (/\btomorrow\b/.test(msg)) {
    return { date: new Date(year, month, day + 1), label: "tomorrow" };
  }

  // day after tomorrow
  if (/\bday after tomorrow\b/.test(msg) || /\bdays after tomorrow\b/.test(msg)) {
    return { date: new Date(year, month, day + 2), label: "day after tomorrow" };
  }

  // this weekend
  if (/\bthis weekend\b/.test(msg)) {
    const currentDay = now.getDay();
    const daysUntilSat = currentDay === 0 ? 6 : currentDay === 6 ? 0 : 6 - currentDay;
    const saturday = new Date(year, month, day + daysUntilSat);
    return { date: saturday, label: "this weekend" };
  }

  // next weekend
  if (/\bnext weekend\b/.test(msg)) {
    const currentDay = now.getDay();
    const daysUntilNextSat = currentDay === 0 ? 7 : currentDay === 6 ? 7 : 13 - currentDay;
    const saturday = new Date(year, month, day + daysUntilNextSat);
    return { date: saturday, label: "next weekend" };
  }

  // next week
  if (/\bnext week\b/.test(msg)) {
    const d = new Date(year, month, day + 7);
    return { date: d, label: "next week" };
  }

  // explicit dates: "25th September", "September 30", "1st October", "September 25"
  const ordinalRegex = /(\d{1,2})(?:st|nd|rd|th)?\s+(january|february|march|april|may|june|july|august|september|october|november|december)/i;
  const simpleRegex = /(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2})/i;

  const ordinalMatch = msg.match(ordinalRegex);
  const simpleMatch = msg.match(simpleRegex);

  if (ordinalMatch || simpleMatch) {
    const match = ordinalMatch || simpleMatch;
    if (match) {
      let parsedMonth: number;
      let parsedDay: number;
      if (ordinalMatch) {
        parsedDay = parseInt(match[1], 10);
        parsedMonth = new Date(Date.parse(`${match[2]} 1`)).getMonth();
      } else {
        parsedMonth = new Date(Date.parse(`${match[1]} 1`)).getMonth();
        parsedDay = parseInt(match[2], 10);
      }
      const d = new Date(year, parsedMonth, parsedDay);
      // If the date is in the past, use next year
      if (d < now) {
        d.setFullYear(year + 1);
      }
      const monthNames = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
      return { date: d, label: `${parsedDay} ${monthNames[parsedMonth]}` };
    }
  }

  return null;
}
