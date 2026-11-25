"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";
import { Search, ChevronRight, Pause, Play } from "lucide-react";

export function Hero() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [useStaticFallback, setUseStaticFallback] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) {
      setUseStaticFallback(true);
      return;
    }

    const videoEl = videoRef.current;
    if (videoEl) {
      videoEl.play().catch(() => {
        // Autoplay blocked by browser policy; keep poster visible and mark paused
        setIsPaused(true);
      });
    }
  }, []);

  const togglePlayback = () => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play().then(() => setIsPaused(false)).catch(() => {});
    } else {
      videoEl.pause();
      setIsPaused(true);
    }
  };

  return (
    <section
      id="hero"
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-slate"
    >
      {/* 1. Instant Poster Image (First paint, zero flash, reduced-motion fallback) */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/videos/hero-poster.jpg"
          alt="Solo travellers enjoying a sunset beach together"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* 2. Short Looping Travel Video Background */}
      {!useStaticFallback && (
        <div className="absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster="/videos/hero-poster.jpg"
            onError={() => setUseStaticFallback(true)}
            className="w-full h-full object-cover"
          >
            <source src="/videos/hero-loop.mp4" type="video/mp4" />
          </video>
        </div>
      )}

      {/* 3. Contrast Scrim Overlays */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate/80 via-slate/45 to-slate/90 z-10" />
      <div className="absolute inset-0 bg-black/25 z-10" />

      {/* 4. Hero Content */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-6 pt-20 pb-32">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white text-xs sm:text-sm font-bold tracking-wider uppercase mb-8 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400"></span>
              </span>
              12,000+ ID-Verified Solo Travellers
            </span>

            <h1 className="text-5xl md:text-8xl font-extrabold text-white mb-6 leading-[1.08] tracking-tight drop-shadow-sm">
              Explore solo with confidence, <br />
              <span className="text-sunset">
                travel with your crew.
              </span>
            </h1>

            <p className="text-lg md:text-2xl text-white/90 max-w-2xl mx-auto mb-12 leading-relaxed font-medium">
              Share the boat, keep your independence. Match with ID-verified solo travellers on your dates, split trusted local boats, and explore with 24/7 safety backup.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              <Link
                href="/onboarding"
                className="group w-full sm:w-auto px-8 py-4 bg-sunset hover:bg-sunset-dark text-white font-bold rounded-xl shadow-xl transition-all duration-200 active:scale-[0.98] inline-flex items-center justify-center gap-2 text-base"
              >
                <span>Find Your Crew</span>
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/destinations"
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl backdrop-blur-md border border-white/20 transition-all duration-200 text-base"
              >
                <Search className="w-4 h-4 text-white/85" strokeWidth={2} />
                <span>Explore Destinations</span>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* 5. Accessible Video Pause / Play Control */}
      {!useStaticFallback && (
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPaused ? "Play background video" : "Pause background video"}
          className="absolute bottom-6 right-6 z-20 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/40 hover:bg-black/60 text-white/85 hover:text-white border border-white/15 backdrop-blur-md text-xs font-semibold transition-colors"
        >
          {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isPaused ? "Play Video" : "Pause Video"}</span>
        </button>
      )}
    </section>
  );
}
