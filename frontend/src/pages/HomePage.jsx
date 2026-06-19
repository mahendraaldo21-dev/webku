import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import HeroCarousel from "@/components/HeroCarousel";
import { Button } from "@/components/ui/button";
import { ArrowRight, MapPin, Sparkles, ShieldCheck, Truck } from "lucide-react";
import { STORE_INFO, api } from "@/lib/api";

export default function HomePage() {
  const [maps, setMaps] = useState({
    embed_url: STORE_INFO.maps_embed,
    link_url: STORE_INFO.maps_link,
  });

  useEffect(() => {
    api.get("/maps").then((r) => {
      if (r.data?.embed_url) setMaps(r.data);
    }).catch(() => {});
  }, []);

  return (
    <div data-testid="home-page">
      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 items-center">
          <div className="fade-up">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#F3F1EC] border border-[#E2E8F0] px-3 py-1 text-xs font-medium text-[#4A5568]">
              <Sparkles className="h-3.5 w-3.5 text-brand" />
              Toko offline kini hadir online
            </div>
            <h1 className="mt-4 font-heading text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#1A202C] leading-[1.05]">
              Belanja kebutuhan harian, <span className="text-brand">tanpa repot</span>.
            </h1>
            <p className="mt-5 text-base sm:text-lg text-[#4A5568] max-w-xl leading-relaxed">
              Selamat datang di <strong>{STORE_INFO.name}</strong>. Pilih barangmu,
              gunakan kode diskon, lalu checkout langsung via WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/shop">
                <Button
                  data-testid="belanja-sekarang-btn"
                  size="lg"
                  className="rounded-full bg-brand hover:bg-[#C9302C] text-white px-7 h-12 text-base font-semibold"
                >
                  Belanja Sekarang
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <a href={`https://wa.me/${STORE_INFO.phone_wa}`} target="_blank" rel="noreferrer">
                <Button
                  data-testid="contact-wa-btn"
                  variant="outline"
                  size="lg"
                  className="rounded-full h-12 border-[#E2E8F0] hover:border-[#1A202C]"
                >
                  Hubungi via WhatsApp
                </Button>
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 max-w-md">
              {[
                { icon: ShieldCheck, label: "Barang Asli" },
                { icon: Truck, label: "Pengiriman Cepat" },
                { icon: Sparkles, label: "Harga Bersaing" },
              ].map((f, i) => (
                <div key={i} className="flex flex-col items-start gap-1.5">
                  <f.icon className="h-5 w-5 text-brand" />
                  <span className="text-xs font-medium text-[#1A202C]">{f.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="fade-up" style={{ animationDelay: "120ms" }}>
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* Maps Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 sm:mt-28">
        <div className="grid lg:grid-cols-2 gap-8 items-stretch">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] soft-shadow p-8 sm:p-10 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-[#4A5568]">
              <MapPin className="h-3.5 w-3.5 text-brand" />
              Kunjungi Toko Kami
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold tracking-tight mt-3">
              Sambangi langsung <span className="text-brand">{STORE_INFO.name}</span>
            </h2>
            <p className="mt-4 text-[#4A5568] leading-relaxed">
              Belanja online praktis, atau datang langsung ke toko offline kami untuk pengalaman belanja yang lebih personal.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href={maps.link_url || STORE_INFO.maps_link} target="_blank" rel="noreferrer">
                <Button
                  data-testid="open-maps-btn"
                  className="rounded-full bg-[#1A202C] hover:bg-black text-white h-11"
                >
                  Buka di Google Maps
                  <MapPin className="ml-2 h-4 w-4" />
                </Button>
              </a>
            </div>
          </div>
          <div
            data-testid="map-embed"
            className="relative rounded-3xl overflow-hidden border border-[#E2E8F0] soft-shadow min-h-[320px]"
          >
            <iframe
              title="Lokasi Toko"
              src={maps.embed_url}
              className="absolute inset-0 w-full h-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </div>
  );
}
