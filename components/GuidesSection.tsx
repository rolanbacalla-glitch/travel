"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { BookOpen, ArrowRight, Clock, Star, Sparkles } from "lucide-react";

const GUIDES = [
  {
    id: "siargao",
    title: "The Solo Traveller's Guide to Siargao",
    description: "Everything you need to know about navigating the surfing capital of the Philippines solo—from Cloud 9 boards to vetted crew hangouts.",
    image: "https://images.unsplash.com/photo-1540979388789-6cee28a1cdc9?q=80&w=800&auto=format&fit=crop",
    duration: "15 min read",
    rating: 4.9,
    category: "Solo Travel",
  },
  {
    id: "el-nido",
    title: "El Nido, Palawan: Beyond the Main Lagoons",
    description: "How to split private boat charters with verified solo travellers, skip the crowds, and find quiet limestone coves.",
    image: "https://images.pexels.com/photos/13874296/pexels-photo-13874296.jpeg?auto=compress&cs=tinysrgb&w=800",
    duration: "12 min read",
    rating: 4.8,
    category: "Adventure",
  },
  {
    id: "cebu",
    title: "Cebu & Moalboal: Reefs, Falls & Solo Safety",
    description: "Practical transit routes, verified canyoneering guides, and safety essentials for exploring the Visayas solo.",
    image: "https://images.pexels.com/photos/4175000/pexels-photo-4175000.jpeg?auto=compress&cs=tinysrgb&w=800",
    duration: "10 min read",
    rating: 5.0,
    category: "Safety",
  },
];

export function GuidesSection() {
  return (
    <section id="guides" className="py-24 md:py-32 bg-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-ocean/5 rounded-full blur-[100px] -z-10" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-sunset/5 rounded-full blur-[100px] -z-10" />

      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-ocean/10 text-ocean border border-ocean/20 text-xs font-bold uppercase tracking-widest mb-6"
            >
              <BookOpen className="w-3.5 h-3.5" />
              Field Guides
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold tracking-tight text-slate leading-tight"
            >
              Practical playbooks for <span className="text-ocean">solo routes</span>.
            </motion.h2>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/guides"
              className="group flex items-center gap-3 text-slate hover:text-ocean transition-all"
            >
              <span className="text-sm font-bold tracking-wide">View all guides</span>
              <div className="w-10 h-10 rounded-full border-2 border-slate/10 flex items-center justify-center group-hover:border-ocean group-hover:bg-ocean group-hover:text-white transition-all">
                <ArrowRight className="w-4 h-4" />
              </div>
            </Link>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {GUIDES.map((guide, i) => (
            <motion.div
              key={guide.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <Link href={`/guides/${guide.id}`} className="block space-y-5">
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden shadow-lg shadow-slate/10 transition-transform duration-500 group-hover:scale-[1.01]">
                  <Image
                    src={guide.image}
                    alt={guide.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                  <div className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-white/95 backdrop-blur-sm text-xs font-bold text-slate">
                    {guide.category}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate/65">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      {guide.duration}
                    </div>
                    <div className="flex items-center gap-1.5 text-ocean tabular-nums">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      {guide.rating}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold tracking-tight text-slate group-hover:text-ocean transition-colors duration-300">
                    {guide.title}
                  </h3>

                  <p className="text-slate/70 text-sm leading-relaxed line-clamp-2">
                    {guide.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
