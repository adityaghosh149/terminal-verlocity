"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { Activity } from "lucide-react";

interface ScoreTimelineChartProps {
  data: Array<{
    time: string;
    score: number;
  }>;
}

export function ScoreTimelineChart({ data }: ScoreTimelineChartProps) {
  return (
    <div className="p-6 rounded-xl border border-border/80 bg-card/70 backdrop-blur-md shadow-xl">
      <h3 className="text-sm font-bold font-mono text-foreground mb-1 flex items-center gap-2">
        <Activity className="h-4 w-4 text-purple-400" />
        RUN SCORE PROGRESSION TIMELINE
      </h3>
      <p className="text-xs text-muted-foreground mb-4 font-mono">
        Cumulative score trajectory over time as packets were intercepted or decayed
      </p>
      <div className="h-60 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderColor: "#1e293b",
                fontSize: 12,
                borderRadius: 8,
              }}
            />
            <Line
              type="monotone"
              dataKey="score"
              name="Cumulative Score"
              stroke="#a855f7"
              strokeWidth={2.5}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
