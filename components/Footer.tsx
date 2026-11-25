"use client";

import React from "react";
import Link from "next/link";
import { Camera, AtSign, Globe, Play } from "lucide-react";

export function Footer() {
  const socialLinks = [
    { icon: Camera, label: "Instagram" },
    { icon: AtSign, label: "Threads & Social" },
    { icon: Globe, label: "Community" },
    { icon: Play, label: "YouTube" },
  ];

  return (
    <footer className="bg-slate text-white pt-32 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-4 gap-16 mb-24">
          <div className="col-span-1 md:col-span-2">
            <Link
              href="/"
              className="text-4xl font-bold text-white mb-8 block"
            >
              Travel <span className="text-sunset">Kin</span>
            </Link>
            <p className="text-white/75 text-base max-w-sm mb-8 leading-relaxed">
              We&rsquo;re building the safety-first network for solo travellers across the Philippines &amp; Southeast Asia. Join 12,000+ ID-verified explorers.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social, i) => (
                <Link
                  key={i}
                  href="/dashboard"
                  aria-label={`${social.label} — Preview Travel Kin`}
                  className="w-11 h-11 rounded-full border border-white/15 flex items-center justify-center hover:bg-white hover:text-slate transition-all duration-300"
                >
                  <social.icon className="w-4 h-4" strokeWidth={1.75} />
                </Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-sunset mb-6">
              Explore
            </h4>
            <ul className="space-y-3.5">
              {[
                { label: "Destinations", href: "/destinations" },
                { label: "How Crew Matching Works", href: "/#crew" },
                { label: "Field Guides", href: "/guides" },
                { label: "Safety Commitment", href: "/safety-commitment" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-white/75 hover:text-white transition-colors font-medium text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-xs uppercase tracking-wider text-sunset mb-6">
              Get Started
            </h4>
            <ul className="space-y-3.5">
              {[
                { label: "Build Your Crew Profile", href: "/onboarding" },
                { label: "ID Verification", href: "/verify" },
                { label: "Member Dashboard", href: "/dashboard" },
                { label: "Sign In", href: "/login" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="text-white/75 hover:text-white transition-colors font-medium text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-white/70 text-xs font-semibold tracking-wide">
            © {new Date().getFullYear()} Travel Kin Ltd. All rights reserved.
          </div>
          <div className="flex flex-wrap gap-6 text-xs font-semibold text-white/70">
            <Link href="/privacy-policy" className="hover:text-white">
              Privacy Policy
            </Link>
            <Link href="/terms-of-service" className="hover:text-white">
              Terms of Service
            </Link>
            <Link href="/cookie-policy" className="hover:text-white">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
