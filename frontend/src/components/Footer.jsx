import React from "react";
import { STORE_INFO } from "@/lib/api";
import { MapPin, Phone } from "lucide-react";

export default function Footer() {
  return (
    <footer data-testid="footer" className="mt-24 border-t border-[#E2E8F0] bg-[#F3F1EC]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-heading text-xl font-bold mb-2">{STORE_INFO.name}</div>
          <p className="text-[#4A5568] leading-relaxed">{STORE_INFO.tagline}</p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-[#4A5568] mb-2">Kontak</div>
          <a
            href={`https://wa.me/${STORE_INFO.phone_wa}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 hover:text-brand"
          >
            <Phone className="h-4 w-4" /> +{STORE_INFO.phone_wa}
          </a>
        </div>
        <div>
          <div className="text-xs uppercase tracking-widest text-[#4A5568] mb-2">Lokasi</div>
          <a
            href={STORE_INFO.maps_link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 hover:text-brand"
          >
            <MapPin className="h-4 w-4" /> Lihat di Google Maps
          </a>
        </div>
      </div>
      <div className="border-t border-[#E2E8F0] py-4 text-center text-xs text-[#4A5568]">
        © {new Date().getFullYear()} {STORE_INFO.name}. Semua hak dilindungi.
      </div>
    </footer>
  );
}
