"use client";

import React, { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/hero/HeroSection";
import { FeaturedTripsSection } from "@/components/home/FeaturedTripsSection";
import { WhyWithUsSection } from "@/components/home/WhyWithUsSection";
import { DestinationsSection } from "@/components/home/DestinationsSection";
import { AboutSection } from "@/components/home/AboutSection";
import { ContactSection } from "@/components/home/ContactSection";
import { TravelAssistant } from "@/components/chatbot/TravelAssistant";
import { tripService } from "@/lib/services/tripService";
import { authService } from "@/lib/services/authService";
import { Trip, Agency } from "@/lib/types";

export default function HomePage() {
  const [featuredTrips, setFeaturedTrips] = useState<Trip[]>([]);
  const [agency, setAgency] = useState<Agency | null>(null);

  useEffect(() => {
    tripService.getFeaturedTrips().then(setFeaturedTrips);
    authService.getAgency().then(setAgency);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-[#1C1E21] flex flex-col selection:bg-[#4B6B5B]/20 selection:text-[#1C1E21]">
      <Navbar />

      <main className="flex-1">
        <HeroSection />
        <FeaturedTripsSection
          featuredTrips={featuredTrips}
          agencyWhatsApp={agency?.whatsapp}
        />
        <WhyWithUsSection />
        <DestinationsSection />
        <AboutSection />
        <ContactSection />
      </main>

      <Footer />
      <TravelAssistant />
    </div>
  );
}
