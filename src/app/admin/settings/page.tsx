"use client";

import React, { useState, useEffect } from "react";
import { Save, Check, ShieldCheck, MessageCircle, Globe, Building } from "lucide-react";
import { authService } from "@/lib/services/authService";
import { Agency } from "@/lib/types";
import { DEFAULT_AGENCY_ID } from "@/lib/data/mockAgency";

export default function AdminSettingsPage() {
  const [agency, setAgency] = useState<Agency | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    authService.getAgency(DEFAULT_AGENCY_ID).then((data: Agency) => {
      setAgency(data);
      setName(data.name);
      setTagline(data.tagline);
      setDescription(data.description);
      setPhone(data.phone);
      setWhatsapp(data.whatsapp);
      setEmail(data.email);
      setAddress(data.address);
      setInstagram(data.instagram || "");
      setFacebook(data.facebook || "");
      setWebsite(data.website || "");
      setLoading(false);
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    try {
      const updated = await authService.updateAgency(DEFAULT_AGENCY_ID, {
        name,
        tagline,
        description,
        phone,
        whatsapp: whatsapp.replace(/\D/g, ""), // clean digits
        email,
        address,
        instagram,
        facebook,
        website,
      });

      setAgency(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update agency configuration.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1C1E21] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-light text-[#1C1E21] tracking-tight">
          Agency Settings
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-1">
          Configure branding, WhatsApp contact number, address, and social links. Changes apply globally across public pages.
        </p>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Agency settings updated successfully! Public website links have refreshed.</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* Brand Details */}
        <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 flex flex-col gap-5 shadow-2xs">
          <h2 className="text-sm font-semibold text-[#1C1E21] uppercase tracking-wider border-b border-[#F0EFEA] pb-3 flex items-center gap-2">
            <Building className="w-4 h-4 text-[#4B6B5B]" />
            <span>Brand Identity</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">Agency Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-medium focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">Tagline / Subheading</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#374151]">Agency Bio & Philosophy</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
            />
          </div>
        </div>

        {/* Contact & WhatsApp Integration */}
        <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 flex flex-col gap-5 shadow-2xs">
          <h2 className="text-sm font-semibold text-[#1C1E21] uppercase tracking-wider border-b border-[#F0EFEA] pb-3 flex items-center gap-2">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <span>WhatsApp & Communication Numbers</span>
          </h2>

          <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100 text-xs text-emerald-900 leading-relaxed">
            <strong>Important:</strong> The WhatsApp number below powers all customer inquiry buttons, the chatbot handover links, and trip card inquiries across your website.
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">
                WhatsApp Number (with Country Code) *
              </label>
              <input
                type="text"
                required
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="e.g. 919820045120"
                className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm font-mono font-semibold focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
              <span className="text-[10px] text-[#6B7280]">
                Digits only (e.g. 91 for India followed by 10-digit number)
              </span>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">Phone (Display Format)</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. +91 98200 45120"
                className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">Inquiry Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">Physical Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Social & Web Presence */}
        <div className="bg-white rounded-3xl border border-[#E5E0D8] p-6 sm:p-8 flex flex-col gap-5 shadow-2xs">
          <h2 className="text-sm font-semibold text-[#1C1E21] uppercase tracking-wider border-b border-[#F0EFEA] pb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#4B6B5B]" />
            <span>Social & Online Presence</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">Instagram URL</label>
              <input
                type="url"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="https://instagram.com/..."
                className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">Facebook URL</label>
              <input
                type="url"
                value={facebook}
                onChange={(e) => setFacebook(e.target.value)}
                placeholder="https://facebook.com/..."
                className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#374151]">Agency Website</label>
              <input
                type="url"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
                placeholder="https://agency.com"
                className="px-3.5 py-2.5 rounded-xl border border-[#E5E0D8] text-xs sm:text-sm focus:ring-2 focus:ring-[#4B6B5B]/20 outline-hidden"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-[#1C1E21] hover:bg-[#2A3A4A] text-white text-xs sm:text-sm font-semibold shadow-md transition-all disabled:opacity-75"
          >
            {saving ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{saving ? "Updating..." : "Save Settings"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
