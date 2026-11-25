"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { destinations } from "@/lib/data";
import { logFirebaseEvent } from "@/lib/firebase";

export function DestinationsSection() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft + clientWidth < scrollWidth - 10);

      // Check if we are scrolled to the end (within 15px tolerance)
      const isAtEnd = scrollLeft + clientWidth >= scrollWidth - 15;

      if (isAtEnd) {
        setActiveIndex(destinations.length - 1);
      } else {
        const cardWidth = window.innerWidth < 768 ? 324 : 404;
        const index = Math.round(scrollLeft / cardWidth);
        setActiveIndex(Math.min(destinations.length - 1, Math.max(0, index)));
      }
    }
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll);
      const timer = setTimeout(checkScroll, 100);
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
        clearTimeout(timer);
      };
    }
  }, []);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const cardWidth = window.innerWidth < 768 ? 324 : 404;
      const scrollAmount = direction === "left" ? -cardWidth : cardWidth;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      logFirebaseEvent("carousel_nav_click", { direction });
    }
  };

  const scrollToActive = (index: number) => {
    if (scrollRef.current) {
      const targetDestination = destinations[index]?.title || `Destination ${index}`;
      logFirebaseEvent("carousel_dot_click", { index, destination: targetDestination });
      if (index === destinations.length - 1) {
        const { scrollWidth, clientWidth } = scrollRef.current;
        scrollRef.current.scrollTo({
          left: scrollWidth - clientWidth,
          behavior: "smooth"
        });
      } else {
        const cardWidth = window.innerWidth < 768 ? 324 : 404;
        scrollRef.current.scrollTo({
          left: index * cardWidth,
          behavior: "smooth"
        });
      }
    }
  };

  return (
    <section id="destinations" className="py-24 md:py-32 px-6 bg-background overflow-hidden scroll-mt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-14">
          <div className="max-w-2xl">
            <span className="text-ocean font-bold text-xs tracking-widest uppercase mb-4 block">
              Curated Hubs
            </span>
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-slate leading-tight text-balance">
              Where to <span className="text-terra">go solo</span>{" "}
              &amp; find your crew.
            </h2>
          </div>
          <Link
            href="/destinations"
            className="group flex items-center gap-3 text-slate font-bold tracking-tight hover:text-ocean transition-colors duration-200"
          >
            <span>Explore All {destinations.length} Destinations</span>
            <div className="w-10 h-10 rounded-full border border-slate/15 flex items-center justify-center group-hover:bg-ocean group-hover:border-ocean group-hover:text-white transition-all duration-300">
              <ArrowRight className="w-4 h-4" />
            </div>
          </Link>
        </div>

        {/* Horizontal snap carousel */}
        <div className="relative group/carousel">
          {showLeftArrow && (
            <button
              onClick={() => scroll("left")}
              className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-slate/75 backdrop-blur-md border border-white/15 items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-xl focus-ring cursor-pointer hover:bg-slate"
              aria-label="Previous Destinations"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}

          {showRightArrow && (
            <button
              onClick={() => scroll("right")}
              className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 z-30 w-12 h-12 rounded-full bg-slate/75 backdrop-blur-md border border-white/15 items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-xl focus-ring cursor-pointer hover:bg-slate"
              aria-label="Next Destinations"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          <div
            ref={scrollRef}
            className="w-full overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-6"
          >
            <div className="flex gap-6 w-max">
              {destinations.map((place) => (
                <Link
                  key={place.id}
                  href={`/destinations/${place.id}`}
                  className="group relative w-[300px] md:w-[380px] shrink-0 snap-start aspect-[4/5] rounded-2xl overflow-hidden shadow-xl focus-ring"
                >
                  <Image
                    src={place.image}
                    alt={place.title}
                    fill
                    sizes="(max-width: 768px) 300px, 380px"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate/90 via-slate/25 to-transparent opacity-75 group-hover:opacity-90 transition-opacity duration-300" />

                  <div className="absolute top-5 left-5">
                    <span className="px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-full text-xs font-bold text-white uppercase tracking-wider border border-white/25">
                      {place.tag}
                    </span>
                  </div>

                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-2 mb-2.5">
                      <div className="flex items-center gap-1 text-sunset">
                        <Star className="w-3.5 h-3.5 fill-current" />
                        <span className="text-xs font-bold text-white tabular-nums">
                          {place.rating}
                        </span>
                      </div>
                      <span className="text-xs text-white/80 tabular-nums">
                        · {place.reviews.toLocaleString()} reviews
                      </span>
                    </div>

                    <h3 className="text-2xl font-bold tracking-tight text-white mb-1.5 leading-tight">
                      {place.title}
                    </h3>
                    <p className="text-white/80 text-sm font-medium line-clamp-1 mb-4">
                      {place.tagline}
                    </p>

                    <div className="flex items-center justify-between pt-3.5 border-t border-white/15">
                      <span className="text-base font-bold tabular-nums text-white">
                        Est. {place.price}
                      </span>
                      <span className="text-xs font-bold text-sunset uppercase tracking-wider flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                        View Hub <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center items-center gap-2 mt-6">
          {destinations.map((_, index) => (
            <button
              key={index}
              onClick={() => scrollToActive(index)}
              className={`h-2 rounded-full transition-all duration-300 focus-ring cursor-pointer ${activeIndex === index
                ? "w-8 bg-sunset"
                : "w-2 bg-slate/20 hover:bg-slate/40"
                }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
