"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface EvVsRealizedChartProps {
  data: Array<{
    name: string;
    expectedValue: number;
    realizedPoints: number;
  }>;
}

export function EvVsRealizedChart({ data }: EvVsRealizedChartProps) {
  return (
    <div className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl flex flex-col">
      <h3 className="text-sm font-bold font-mono text-foreground mb-1 flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-primary" />
        EXPECTED VALUE VS REALIZED POINTS (PER PACKET)
      </h3>
      <p className="text-xs text-muted-foreground mb-4 font-mono">
        Comparison of theoretical EV against realized points on captured packets
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={10}
              tickLine={false}
              interval={0}
              angle={-35}
              textAnchor="end"
            />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#1e293b",
                fontSize: 12,
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
            <Bar dataKey="expectedValue" name="Theoretical EV" fill="#00f0ff" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="realizedPoints"
              name="Realized Points"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
