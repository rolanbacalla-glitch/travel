"use client";

import React from "react";
import Link from "next/link";
import { stats } from "@/lib/data";

export function StatCards() {
  return (
    <section className="relative py-12 z-30 px-6 overflow-visible bg-background">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <Link
            key={i}
            href={stat.href}
            className="bg-white/90 backdrop-blur-md p-6 md:p-8 rounded-2xl text-center border border-slate/10 shadow-sm hover:shadow-lg hover:bg-white transition-all duration-300 flex flex-col justify-center group focus-ring"
          >
            <div className="text-3xl md:text-5xl font-extrabold tracking-tight tabular-nums text-slate mb-2 group-hover:text-ocean transition-colors duration-300">
              {stat.value}
            </div>
            <div className="text-xs uppercase tracking-wider font-bold text-ocean mb-1.5">
              {stat.label}
            </div>
            {stat.description && (
              <p className="text-xs text-slate/70 leading-relaxed font-medium max-w-[220px] mx-auto mt-1">
                {stat.description}
              </p>
            )}
          </Link>
        ))}
      </div>
    </section>
  );
}
