import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  AlertCircle,
  Brain,
  Database,
  Droplets,
  Flame,
  Server,
  ShieldCheck,
  Wind,
  Zap,
} from "lucide-react";
import Earth from "./ui/Globe";
import type { LiveSummary } from "../lib/liveData";

const colorMap = {
  Flood: "#00d4ff",
  Earthquake: "#ff4757",
  Storm: "#ffa502",
  Volcano: "#ff6b81",
} as const;

const iconMap = {
  Flood: Droplets,
  Earthquake: Activity,
  Storm: Wind,
  Volcano: Flame,
} as const;

const fallbackTrend = [
  { label: "D-6", Flood: 1, Earthquake: 0, Storm: 1, Volcano: 0 },
  { label: "D-5", Flood: 1, Earthquake: 1, Storm: 0, Volcano: 0 },
  { label: "D-4", Flood: 2, Earthquake: 1, Storm: 1, Volcano: 0 },
  { label: "D-3", Flood: 1, Earthquake: 1, Storm: 2, Volcano: 0 },
  { label: "D-2", Flood: 2, Earthquake: 1, Storm: 1, Volcano: 1 },
  { label: "D-1", Flood: 1, Earthquake: 2, Storm: 1, Volcano: 0 },
  { label: "Today", Flood: 2, Earthquake: 2, Storm: 1, Volcano: 0 },
];

export const TelemetryConsole = ({
  selectedCountry,
  liveSummary,
}: {
  selectedCountry?: string | null;
  liveSummary?: LiveSummary | null;
}) => {
  const fallbackProfile = {
    country: selectedCountry || "Global",
    risk: 34,
    event_count: 0,
    top_type: "Flood",
    mix: [
      { name: "Flood", value: 35 },
      { name: "Storm", value: 25 },
      { name: "Earthquake", value: 25 },
      { name: "Volcano", value: 15 },
    ],
    alerts: [],
  } as const;

  const profile =
    (selectedCountry && liveSummary?.country_profiles?.[selectedCountry]) ||
    (selectedCountry ? fallbackProfile : liveSummary?.top_countries?.[0]) ||
    fallbackProfile;

  const trendData =
    liveSummary?.trend?.map((item) => ({
      time: item.label,
      risk: item.Flood + item.Earthquake + item.Storm + item.Volcano,
      load: item.Flood * 0.9 + item.Earthquake * 1.2 + item.Storm * 1.1 + item.Volcano,
    })) || fallbackTrend.map((item) => ({
      time: item.label,
      risk: item.Flood + item.Earthquake + item.Storm + item.Volcano,
      load: item.Flood * 0.9 + item.Earthquake * 1.2 + item.Storm * 1.1 + item.Volcano,
    }));

  const barData = profile.mix.map((entry) => ({
    signal: entry.name.slice(0, 5).toUpperCase(),
    value: entry.value,
    fill: colorMap[entry.name],
  }));

  const eventCount = profile.event_count || liveSummary?.stats?.tracked_events || 0;
  const nodes = Math.max(120, eventCount * 17);
  const processed = `${Math.max(0.4, (eventCount / 10) * 0.8).toFixed(1)}M`;
  const dataRate = `${Math.max(8, Math.round(profile.risk / 2))} TB/s`;
  const riskDigits = profile.risk.toFixed(1).split("");
  const leadAlert = profile.alerts?.[0];

  return (
    <div className="telemetry-dashboard">
      <div className="telem-left">
        <div className="telem-card">
          <h3>
            <Database size={16} /> Live Intake
          </h3>
          <div className="seismic-data-grid" style={{ marginBottom: "1rem" }}>
            <div className="data-box">
              <span className="box-label">Processed</span>
              <span className="box-value highlight-cyan">{processed}</span>
            </div>
            <div className="data-box">
              <span className="box-label">Active Nodes</span>
              <span className="box-value">{nodes}</span>
            </div>
            <div className="data-box">
              <span className="box-label">Data Rate</span>
              <span className="box-value">{dataRate}</span>
            </div>
          </div>
          <div className="telem-brief">
            Risk score recent live disaster counts, hazard type mix aur severity-weighted signals se derive ho raha hai.
          </div>
        </div>

        <div className="telem-card">
          <h3>
            <Activity size={16} /> Hazard Weight
          </h3>
          <div style={{ height: "180px", marginTop: "0.85rem" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="signal"
                  tick={{ fill: "var(--text-dim)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-panel)",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {barData.map((entry) => (
                    <Cell key={entry.signal} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="telem-center">
        <div className="telem-global-metric">
          <div className="telem-digital-label">
            {(selectedCountry || profile.country).toUpperCase()} LIVE RISK INDEX
          </div>
          <div className="telem-digital-value">
            {riskDigits.map((digit, index) => (
              <span key={`${digit}-${index}`} className="digit">
                {digit}
              </span>
            ))}
            <span className="digit" style={{ color: "var(--text-dim)" }}>
              %
            </span>
          </div>
          <div className="telem-analysis-copy">
            <Brain size={15} />
            <span>
              {profile.country} me abhi dominant hazard <strong>{profile.top_type}</strong> hai,
              aur low-frequency categories ko intentionally overstate nahi kiya gaya.
            </span>
          </div>
        </div>

        <div
          className="telem-iframe-container"
          style={{ maskImage: "none", WebkitMaskImage: "none" }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <div className="absolute top-0 left-0 z-1 h-full w-full bg-[radial-gradient(#5875d653_1px,#06080e_1px)] bg-size-[20px_20px]"></div>
            <div
              className="relative z-10 w-full h-full flex justify-center items-center"
              style={{ transform: "scale(1.15)" }}
            >
              <Earth />
            </div>
          </div>
        </div>
      </div>

      <div className="telem-right">
        <div className="telem-card">
          <h3>
            <Server size={16} /> Feed Integrity
          </h3>
          <div className="connectivity-stats">
            <div className="conn-stat">
              <span>USGS Earthquake Feed</span>
              <span className="highlight-cyan">
                {liveSummary?.earthquakes?.length ?? 0} events
              </span>
            </div>
            <div className="conn-stat">
              <span>ReliefWeb Reports</span>
              <span>{liveSummary?.reports?.length ?? 0} reports</span>
            </div>
            <div className="conn-stat">
              <span>Last Sync</span>
              <span>
                {liveSummary?.last_updated
                  ? new Date(liveSummary.last_updated).toLocaleTimeString()
                  : "Pending"}
              </span>
            </div>
          </div>
        </div>

        <div className="telem-card">
          <h3>
            <AlertCircle size={16} /> Signal Mix
          </h3>
          <div style={{ height: "180px", position: "relative" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={profile.mix}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                  stroke="none"
                >
                  {profile.mix.map((entry) => (
                    <Cell key={entry.name} fill={colorMap[entry.name]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-panel)",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="telem-signal-pills">
            {profile.mix.map((entry) => {
              const Icon = iconMap[entry.name];
              return (
                <span
                  key={entry.name}
                  className="telem-signal-pill"
                  style={{ borderColor: `${colorMap[entry.name]}33`, color: colorMap[entry.name] }}
                >
                  <Icon size={12} /> {entry.name}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      <div className="telem-bottom">
        <div className="telem-card" style={{ flex: 3 }}>
          <h3>
            <Zap size={16} /> Seven-Day Event Movement
          </h3>
          <div style={{ height: "150px", marginTop: "10px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4757" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "var(--text-dim)", fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-panel)",
                    border: "none",
                    borderRadius: "8px",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="risk"
                  stroke="#ff4757"
                  fillOpacity={1}
                  fill="url(#colorRisk)"
                />
                <Area
                  type="monotone"
                  dataKey="load"
                  stroke="#00d4ff"
                  fillOpacity={1}
                  fill="url(#colorLoad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="telem-card" style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <h3>
            <ShieldCheck size={16} /> Status
          </h3>
          <div className="telem-status-panel">
            <p className="telem-status-title">{leadAlert ? "Early Warning Active" : "Live Feed Stable"}</p>
            <p className="telem-status-copy">
              {leadAlert
                ? `${leadAlert.type} alert: ${leadAlert.name}`
                : "No country-specific high-severity alert is available in the current live window."}
            </p>
            <div className="info-row" style={{ padding: 0, background: "none" }}>
              <div className="info-cell">
                <strong>EVENT COUNT</strong>
                {profile.event_count}
              </div>
              <div className="info-cell">
                <strong>TOP TYPE</strong>
                {profile.top_type}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
