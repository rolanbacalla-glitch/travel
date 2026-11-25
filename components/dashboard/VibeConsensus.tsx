"use client";

import React from "react";
import { Star, ShieldCheck, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface VibeStats {
  id: string;
  rating: number;
  reviews: number;
  tags: string[];
  lastDiscovery: string;
}

export function VibeConsensus({ stats }: { stats: VibeStats }) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-slate/10 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={cn(
                "w-3 h-3",
                s <= Math.floor(stats.rating) ? "fill-slate text-slate" : "text-slate/20"
              )}
            />
          ))}
          <span className="text-xs font-bold text-slate ml-1 tabular-nums">{stats.rating.toFixed(1)}</span>
        </div>
        <div className="flex items-center gap-1 text-slate/65">
          <Users className="w-3.5 h-3.5" />
          <span className="text-xs font-semibold tabular-nums">{stats.reviews} reviews</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {stats.tags.map((tag) => (
          <span
            key={tag}
            className="px-2.5 py-0.5 bg-slate/5 text-xs font-semibold text-slate/75 rounded-md"
          >
            #{tag}
          </span>
        ))}
      </div>

      <div className="pt-2 border-t border-slate/10 flex items-center justify-between">
        <span className="text-xs font-medium text-slate/60">
          Active {stats.lastDiscovery}
        </span>
        <ShieldCheck className="w-3.5 h-3.5 text-slate/45" />
      </div>
    </div>
  );
}
