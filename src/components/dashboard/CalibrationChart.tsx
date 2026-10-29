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
import { BarChart3 } from "lucide-react";

interface CalibrationChartProps {
  data: Array<{
    bin: string;
    expected: number;
    observed: number;
    samples: number;
  }>;
}

export function CalibrationChart({ data }: CalibrationChartProps) {
  return (
    <div className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl flex flex-col">
      <h3 className="text-sm font-bold font-mono text-foreground mb-1 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-amber-400" />
        EMPIRICAL PROBABILITY CALIBRATION CURVE
      </h3>
      <p className="text-xs text-muted-foreground mb-4 font-mono">
        Theoretical corruption probability vs observed frequency in probability bins
      </p>
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="bin" stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} unit="%" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#1e293b",
                fontSize: 12,
                borderRadius: 8,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="expected" name="Theoretical Risk (%)" fill="#ffb703" radius={[4, 4, 0, 0]} />
            <Bar
              dataKey="observed"
              name="Observed Corruption (%)"
              fill="#f43f5e"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
