"use client";
// Chart layer — validated dark-surface palette, thin marks, crosshair tooltips,
// recessive grid. Series colors follow entities, never rank.
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

// Validated categorical slots (dark surface): blue / orange / aqua / yellow.
import { C } from "@/lib/palette";

const axis = { stroke: "transparent", tick: { fill: "#4A4A4E", fontSize: 11 }, tickLine: false, axisLine: false };
const grid = { stroke: "rgba(255,255,255,0.05)", vertical: false };
const tip = {
  cursor: { stroke: "rgba(255,255,255,0.14)", strokeWidth: 1 },
  contentStyle: {
    background: "rgba(14,14,15,0.94)", border: "1px solid rgba(255,255,255,0.09)", borderRadius: 14,
    fontSize: 12, padding: "9px 12px", backdropFilter: "blur(12px)",
    boxShadow: "0 12px 40px rgba(0,0,0,0.7)",
  },
  labelStyle: { color: "#4A4A4E", marginBottom: 5, fontSize: 11 },
  itemStyle: { color: "#F5F5F7" },
};
const legend = { wrapperStyle: { fontSize: 11.5, color: "#8A8A8F" }, iconType: "plainline", iconSize: 14 };

export function DauChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="day" {...axis} tickFormatter={(d) => d.slice(5)} minTickGap={26} />
        <YAxis {...axis} allowDecimals={false} width={44} />
        <Tooltip {...tip} />
        <Legend {...legend} />
        <Line type="monotone" dataKey="dau" name="Active users" stroke={C.s1} strokeWidth={1.4}
              dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Line type="monotone" dataKey="gens" name="Generations" stroke={C.s2} strokeWidth={1.4}
              dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Line type="monotone" dataKey="saves" name="Saves" stroke={C.s3} strokeWidth={1.4}
              dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function CostChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -8, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid {...grid} />
        <XAxis dataKey="day" {...axis} tickFormatter={(d) => d.slice(5)} minTickGap={26} />
        <YAxis {...axis} tickFormatter={(v) => `$${v}`} width={48} />
        <Tooltip {...tip} cursor={{ fill: "rgba(163,194,240,0.05)" }}
                 formatter={(v) => [`$${Number(v).toFixed(2)}`, "API cost"]} />
        <Bar dataKey="cost" name="API cost" fill={C.s2} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

// Today, hour by hour — the ops pulse.
export function HourlyChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id="hourFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.s1} stopOpacity={0.35} />
            <stop offset="100%" stopColor={C.s1} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...grid} />
        <XAxis dataKey="hour" {...axis} interval={2} />
        <YAxis {...axis} allowDecimals={false} width={40} />
        <Tooltip {...tip} formatter={(v) => [v, "events"]} />
        <Area type="monotone" dataKey="events" stroke={C.s1} strokeWidth={1.4}
              fill="url(#hourFill)" activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SimpleBars({ data, dataKey, nameKey, color = C.s1, height = 220 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ left: 30, right: 16 }} barCategoryGap="28%">
        <CartesianGrid stroke="#1c212b" horizontal={false} />
        <XAxis type="number" {...axis} allowDecimals={false} />
        <YAxis type="category" dataKey={nameKey} {...axis} width={112} />
        <Tooltip {...tip} cursor={{ fill: "rgba(163,194,240,0.05)" }} />
        <Bar dataKey={dataKey} fill={color} radius={[0, 4, 4, 0]} maxBarSize={18} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function AcquisitionChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barCategoryGap="24%">
        <CartesianGrid {...grid} />
        <XAxis dataKey="day" {...axis} tickFormatter={(d) => d.slice(5)} minTickGap={26} />
        <YAxis {...axis} allowDecimals={false} width={40} />
        <Tooltip {...tip} formatter={(v, name) => [v, name === "newUsers" ? "New users" : name]} />
        <Bar dataKey="newUsers" name="New users" fill={C.s1} radius={[4, 4, 0, 0]} maxBarSize={22} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** A single series over time — the shape most product pages need. */
export function Line1({ data, dataKey = "value", nameKey = "name", color = C.s1, height = 200 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={`fill-${color.slice(1)}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid {...grid} />
        <XAxis dataKey={nameKey} {...axis} minTickGap={26} />
        <YAxis {...axis} allowDecimals={false} width={40} />
        <Tooltip {...tip} />
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={1.4}
              fill={`url(#fill-${color.slice(1)})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Signups per day, one stacked bar segment per product. */
export function AcquisitionByProduct({ data, products }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }} barCategoryGap="18%">
        <CartesianGrid {...grid} />
        <XAxis dataKey="day" {...axis} tickFormatter={(d) => String(d).slice(5)} minTickGap={26} />
        <YAxis {...axis} allowDecimals={false} width={40} />
        <Tooltip {...tip} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {products.map((p, i) => (
          <Bar
            key={p.slug}
            dataKey={p.slug}
            name={p.name}
            stackId="signups"
            fill={[C.s1, C.s2, C.s3, C.s4][i % 4]}
            radius={i === products.length - 1 ? [4, 4, 0, 0] : 0}
            maxBarSize={26}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
