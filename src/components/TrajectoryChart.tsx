"use client";

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { YearCount } from "@/lib/types";

interface TrajectoryChartProps {
  countsByYear: YearCount[];
}

export default function TrajectoryChart({ countsByYear }: TrajectoryChartProps) {
  // Filter to last 20 years for readability
  const currentYear = new Date().getFullYear();
  const data = countsByYear
    .filter((c) => c.year >= currentYear - 20 && c.year <= currentYear)
    .map((c) => ({
      year: c.year,
      papers: c.worksCount,
      citations: c.citedByCount,
    }));

  if (data.length < 2) return null;

  return (
    <div className="h-32">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -15 }}>
          <defs>
            <linearGradient id="colorCitations" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0057ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0057ff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorPapers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#15e60d" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#15e60d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="year"
            tick={{ fontSize: 10, fill: "rgba(255,255,255,0.3)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          {/* Left axis: Citations (blue) */}
          <YAxis
            yAxisId="left"
            tick={{ fontSize: 9, fill: "rgba(0,87,255,0.5)" }}
            axisLine={false}
            tickLine={false}
            width={35}
          />
          {/* Right axis: Papers (green) */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fontSize: 9, fill: "rgba(21,230,13,0.5)" }}
            axisLine={false}
            tickLine={false}
            width={30}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1a1a24",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              fontSize: 11,
              color: "rgba(255,255,255,0.8)",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.5)" }}
          />
          <Area
            yAxisId="left"
            type="monotone"
            dataKey="citations"
            stroke="#0057ff"
            strokeWidth={1.5}
            fill="url(#colorCitations)"
            name="Citations"
          />
          <Area
            yAxisId="right"
            type="monotone"
            dataKey="papers"
            stroke="#15e60d"
            strokeWidth={1.5}
            fill="url(#colorPapers)"
            name="Papers"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
