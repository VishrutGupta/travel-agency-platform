export function buildWhatsAppLink(
  phoneNumber: string,
  message: string
): string {
  // Strip non-digit characters
  const cleanNumber = phoneNumber.replace(/\D/g, "");
  const encodedText = encodeURIComponent(message.trim());
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

export function buildTripWhatsAppInquiry(
  tripTitle: string,
  dateRange: string,
  phoneNumber: string
): string {
  const message = `Hi, I am interested in the ${tripTitle} trip (${dateRange}). Please share more details, seat availability, and itinerary.`;
  return buildWhatsAppLink(phoneNumber, message);
}

export function buildGeneralWhatsAppInquiry(
  agencyName: string,
  phoneNumber: string
): string {
  const message = `Hi ${agencyName}, I'm looking to plan a custom trip. Could you please assist me with options and recommendations?`;
  return buildWhatsAppLink(phoneNumber, message);
}

export function buildAssistantWhatsAppInquiry(
  summary: string,
  phoneNumber: string
): string {
  const message = `Hi, I used your website Travel Assistant with the following preferences: ${summary}. Please share upcoming departures that match this.`;
  return buildWhatsAppLink(phoneNumber, message);
}
