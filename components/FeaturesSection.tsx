"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { features } from "@/lib/data";

export function FeaturesSection() {
  return (
    <section id="safety" className="py-32 px-6 bg-slate text-white overflow-hidden scroll-mt-24">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-20 items-center">
        <div className="relative">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl z-10">
            <Image
              src="https://images.pexels.com/photos/1006360/pexels-photo-1006360.jpeg?auto=compress&cs=tinysrgb&w=800"
              alt="Safe solo travel"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </div>
          {/* Floating safety badge */}
          <div className="absolute -bottom-6 -right-4 sm:-right-6 glass p-6 rounded-2xl shadow-[0_24px_48px_-16px_rgba(30,45,53,0.3)] z-20 max-w-[250px] border-white/50 animate-float">
            <div className="flex items-center gap-3.5 mb-3">
              <div className="relative">
                <div className="w-11 h-11 rounded-full bg-ocean flex items-center justify-center text-white font-bold text-xs shadow-lg shadow-ocean/30 z-10 relative tabular-nums">
                  24/7
                </div>
                <div className="absolute inset-0 w-11 h-11 rounded-full bg-ocean animate-ping opacity-20" />
              </div>
              <div className="text-xs font-bold text-slate uppercase tracking-wider leading-tight">
                Emergency<br />Support
              </div>
            </div>
            <p className="text-xs text-slate/80 leading-relaxed font-medium">
              Always connected. One-tap local emergency support across the Philippines &amp; SE Asia.
            </p>
          </div>
          {/* Abstract blobs */}
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-ocean/20 blur-[100px] rounded-full z-0" />
          <div className="absolute top-40 -right-20 w-80 h-80 bg-sunset/10 blur-[120px] rounded-full z-0" />
        </div>

        <div>
          <span className="text-sunset font-bold text-xs tracking-widest uppercase mb-5 block">
            Why Travel Kin
          </span>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-10 leading-tight text-balance">
            Your peace of mind <span className="text-sand">comes first.</span>
          </h2>

          <div className="space-y-4">
            {features.map((f, i) => (
              <div
                key={i}
                id={f.title === "Solo-First Matching" ? "crew" : undefined}
                className={cn(
                  "group p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 flex items-start gap-5 cursor-default",
                  f.title === "Solo-First Matching" && "scroll-mt-32"
                )}
              >
                <div className="w-12 h-12 rounded-xl bg-white/10 text-white border border-white/10 flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105">
                  <f.icon className="w-5 h-5" strokeWidth={1.75} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1.5 group-hover:text-white transition-colors">
                    {f.title}
                  </h3>
                  <p className="text-white/75 text-sm leading-relaxed max-w-sm">
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-10 border-t border-white/10">
            <Link
              href="/safety-commitment"
              className="group flex items-center gap-3 text-sand font-bold text-xl hover:text-white transition-colors duration-200"
            >
              Read our full Safety Commitment <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
