import React, { useEffect, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { api } from "@/lib/api";

export default function HeroCarousel() {
  const [slides, setSlides] = useState([]);
  const autoplayRef = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: false, stopOnMouseEnter: false })
  );
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true }, [autoplayRef.current]);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    api.get("/slides").then((r) => {
      const imgs = (r.data.images || []).filter(Boolean);
      setSlides(imgs.length ? imgs : [
        "https://images.pexels.com/photos/7996793/pexels-photo-7996793.jpeg",
        "https://images.unsplash.com/photo-1604719312566-8912e9227c6a",
        "https://images.pexels.com/photos/27088193/pexels-photo-27088193.jpeg",
      ]);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi]);

  if (slides.length === 0) return null;

  return (
    <div data-testid="hero-carousel" className="relative">
      <div className="overflow-hidden rounded-3xl soft-shadow" ref={emblaRef}>
        <div className="flex">
          {slides.map((src, i) => (
            <div
              key={i}
              className="relative flex-[0_0_100%] aspect-[16/8] sm:aspect-[16/7]"
            >
              <img
                src={src}
                alt={`Slide ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/10 to-transparent" />
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => emblaApi && emblaApi.scrollTo(i)}
            data-testid={`carousel-dot-${i}`}
            aria-label={`Pergi ke slide ${i + 1}`}
            className={`h-2 rounded-full transition-all ${
              selectedIndex === i ? "w-8 bg-white" : "w-2 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
