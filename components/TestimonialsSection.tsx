"use client";

import React from "react";
import Image from "next/image";
import { Quote } from "lucide-react";
import { testimonials } from "@/lib/data";

export function TestimonialsSection() {
  return (
    <section className="py-32 px-6 bg-sand/30 overflow-hidden">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-slate mb-4">
            Stories from <span className="text-ocean">the road</span>.
          </h2>
          <p className="text-slate/70 font-semibold uppercase tracking-wider text-xs">
            Real trips from ID-verified solo travellers
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-white/85 backdrop-blur-md border border-slate/10 p-8 rounded-2xl shadow-sm relative group hover:bg-white hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              <div className="absolute -top-4 right-6 w-11 h-11 bg-terra rounded-full flex items-center justify-center text-white shadow-md">
                <Quote className="w-5 h-5" />
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="relative w-14 h-14 rounded-xl overflow-hidden ring-2 ring-white shadow-md shrink-0">
                  <Image
                    src={t.avatar}
                    alt={t.name}
                    fill
                    sizes="56px"
                    className="object-cover object-center"
                  />
                </div>
                <div>
                  <div className="font-bold text-slate text-lg">{t.name}</div>
                  <div className="text-xs text-ocean font-bold uppercase tracking-wider mt-0.5">
                    {t.origin}
                  </div>
                </div>
              </div>

              <p className="text-slate/80 leading-relaxed font-medium text-base">
                &ldquo;{t.quote}&rdquo;
              </p>

              <div className="mt-6 flex gap-1.5">
                {[...Array(5)].map((_, j) => (
                  <div
                    key={j}
                    className="w-1.5 h-1.5 rounded-full bg-sunset"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
