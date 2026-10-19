import React from 'react';

export default function SupportTab() {
  return (
    <div className="max-w-2xl mx-auto px-3 sm:px-6 py-4 animate-fadeIn pb-24 md:pb-8 flex flex-col gap-6">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-outline-variant/60 p-6 sm:p-8 shadow-sm flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary-container text-white flex items-center justify-center mb-3 shadow-sm">
          <span className="material-symbols-outlined text-3xl">support_agent</span>
        </div>
        <h2 className="font-headline font-bold text-2xl text-primary">
          Village Water Helpline & Support
        </h2>
        <p className="text-xs text-on-surface-variant font-body mt-1 max-w-md">
          Gram Panchayat Mahurzari is available 24/7 for urgent pipeline bursts, contamination alerts, and clean water assistance.
        </p>

        {/* 3 Direct Contact Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mt-6">
          {/* Call */}
          <a
            href="tel:18001208040"
            className="p-3.5 bg-primary text-white hover:bg-primary/95 font-headline font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-2xl">call</span>
            <span>Call Toll-Free</span>
            <span className="text-[10px] text-primary-fixed font-mono font-normal">1800-120-8040</span>
          </a>

          {/* WhatsApp */}
          <a
            href="https://wa.me/919876543210?text=Hello%20Gram%20Panchayat%20Mahurzari,%20I%20have%20an%20urgent%20water%20issue."
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 bg-emerald-600 text-white hover:bg-emerald-700 font-headline font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-2xl">chat</span>
            <span>WhatsApp Chat</span>
            <span className="text-[10px] text-green-100 font-normal">Direct Helpline</span>
          </a>

          {/* Email */}
          <a
            href="mailto:water@village.gov.in?subject=Water%20Supply%20Issue%20Mahurzari"
            className="p-3.5 bg-secondary text-white hover:bg-secondary/95 font-headline font-bold text-xs uppercase tracking-wider rounded-2xl shadow-sm active:scale-95 transition-all flex flex-col items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-2xl">mail</span>
            <span>Official Email</span>
            <span className="text-[10px] text-secondary-fixed font-normal">water@village.gov</span>
          </a>
        </div>
      </div>

      {/* Office Hours & Physical Desk */}
      <div className="bg-white rounded-3xl border border-outline-variant/60 p-6 shadow-sm flex flex-col gap-4">
        <div className="flex items-center gap-2 text-primary">
          <span className="material-symbols-outlined text-xl text-secondary">schedule</span>
          <h3 className="font-headline font-bold text-base">Gram Panchayat Office Hours</h3>
        </div>

        <div className="divide-y divide-outline-variant/40 text-xs font-body">
          <div className="py-2.5 flex justify-between">
            <span className="text-on-surface font-medium">Monday – Friday</span>
            <span className="font-bold text-primary">9:00 AM – 5:00 PM</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-on-surface font-medium">Saturday</span>
            <span className="font-bold text-primary">10:00 AM – 2:00 PM</span>
          </div>
          <div className="py-2.5 flex justify-between">
            <span className="text-on-surface font-medium">Sunday</span>
            <span className="font-bold text-error">Closed (Emergency Siren On Duty)</span>
          </div>
        </div>

        <div className="p-3.5 bg-surface-container-low rounded-2xl flex items-start gap-2.5 text-xs text-on-surface-variant font-body">
          <span className="material-symbols-outlined text-primary text-lg shrink-0 mt-0.5">location_on</span>
          <div>
            <strong className="text-on-surface block font-headline">Office Location:</strong>
            Mahurzari Gram Panchayat Bhavan, Main Market Chowk, Mahurzari Village, District Nagpur, Maharashtra.
          </div>
        </div>
      </div>
    </div>
  );
}
