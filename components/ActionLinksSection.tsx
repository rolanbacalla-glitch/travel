"use client";

import React from "react";
import Link from "next/link";
import { Users, Map, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export function ActionLinksSection() {
  const actions = [
    {
      title: "Find Your Crew",
      desc: "Connect with verified solo travellers who match your vibe and itinerary.",
      href: "/dashboard",
      icon: Users,
      color: "bg-ocean",
      hoverColor: "hover:bg-ocean-dark",
      shadow: "shadow-ocean/20",
    },
    {
      title: "Explore Destinations",
      desc: "Discover 87+ vetted locations across Southeast Asia tailored for solo safety.",
      href: "/destinations",
      icon: Map,
      color: "bg-sunset",
      hoverColor: "hover:bg-sunset-dark",
      shadow: "shadow-sunset/20",
    },
  ];

  return (
    <section className="py-24 px-6 bg-mist/30">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-8">
          {actions.map((action, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
            >
              <Link
                href={action.href}
                className={`group block p-12 rounded-2xl bg-white border border-mist hover:shadow-2xl transition-all duration-500 overflow-hidden relative`}
              >
                <div className="flex flex-col h-full relative z-10">
                  <div className="w-14 h-14 rounded-2xl bg-slate/5 border border-slate/10 text-slate flex items-center justify-center mb-8 transition-colors duration-300 group-hover:bg-slate group-hover:text-white">
                    <action.icon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <h3 className="text-3xl font-bold text-slate mb-4">
                    {action.title}
                  </h3>
                  <p className="text-slate/65 text-lg leading-relaxed mb-8 max-w-sm">
                    {action.desc}
                  </p>
                  <div className="mt-auto flex items-center gap-3 text-sunset font-bold uppercase tracking-widest text-xs">
                    Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
