"use client";
// Chart layer — validated dark-surface palette, thin marks, crosshair tooltips,
// recessive grid. Series colors follow entities, never rank.
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, Legend,
} from "recharts";

// Validated categorical slots (dark surface): blue / orange / aqua / yellow.
export const C = { s1: "#3987e5", s2: "#d95926", s3: "#199e70", s4: "#c98500", accent: "#a3c2f0" };

const axis = { stroke: "#3a4150", tick: { fill: "#8b93a5", fontSize: 11, fontFamily: "ui-monospace, Menlo, monospace" }, tickLine: false, axisLine: { stroke: "#232833" } };
const grid = { stroke: "#1c212b", vertical: false };
const tip = {
  cursor: { stroke: "#3a4150", strokeDasharray: "3 3" },
  contentStyle: {
    background: "#171b22", border: "1px solid #232833", borderRadius: 10,
    fontSize: 12, fontFamily: "ui-monospace, Menlo, monospace", boxShadow: "0 8px 30px rgba(0,0,0,0.5)",
  },
  labelStyle: { color: "#8b93a5", marginBottom: 4 },
};
const legend = { wrapperStyle: { fontSize: 11.5, fontFamily: "ui-monospace, Menlo, monospace", color: "#8b93a5" }, iconType: "plainline", iconSize: 14 };

export function DauChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: -12, bottom: 0 }}>
        <CartesianGrid {...grid} />
        <XAxis dataKey="day" {...axis} tickFormatter={(d) => d.slice(5)} minTickGap={26} />
        <YAxis {...axis} allowDecimals={false} width={44} />
        <Tooltip {...tip} />
        <Legend {...legend} />
        <Line type="monotone" dataKey="dau" name="Active users" stroke={C.s1} strokeWidth={2}
              dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Line type="monotone" dataKey="gens" name="Generations" stroke={C.s2} strokeWidth={2}
              dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
        <Line type="monotone" dataKey="saves" name="Saves" stroke={C.s3} strokeWidth={2}
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
        <Area type="monotone" dataKey="events" stroke={C.s1} strokeWidth={2}
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
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2}
              fill={`url(#fill-${color.slice(1)})`} dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}
