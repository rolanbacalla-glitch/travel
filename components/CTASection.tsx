"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-24 md:py-32 px-6 bg-slate relative overflow-hidden text-center">
      {/* Background image overlay */}
      <div className="absolute inset-0 z-0 opacity-20" aria-hidden="true">
        <Image
          src="https://images.pexels.com/photos/16141092/pexels-photo-16141092.jpeg?auto=compress&cs=tinysrgb&w=1280"
          alt="Adventure background"
          fill
          sizes="100vw"
          className="object-cover"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-slate via-slate/90 to-ocean/40 z-10" />

      <div className="relative z-20 max-w-4xl mx-auto">
        <h2 className="text-4xl md:text-7xl font-extrabold tracking-tight text-white mb-8 leading-[1.08] text-balance">
          Ready to go <span className="text-sunset">solo</span> without going{" "}
          <span className="text-sand">alone</span>?
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="w-full sm:w-auto px-8 py-4 bg-sunset text-white font-bold rounded-xl shadow-2xl hover:bg-sunset-dark transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] focus-ring flex items-center justify-center gap-2.5"
          >
            Build Your Crew Profile <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            href="/guides"
            className="w-full sm:w-auto px-8 py-4 border border-white/25 text-white font-bold rounded-xl hover:bg-white/10 transition-all duration-300 focus-ring"
          >
            Read Field Guides
          </Link>
        </div>
        <p className="mt-10 text-white/75 text-xs font-bold uppercase tracking-wider">
          Free to join · ID-checked before your first crew chat
        </p>
      </div>
    </section>
  );
}
