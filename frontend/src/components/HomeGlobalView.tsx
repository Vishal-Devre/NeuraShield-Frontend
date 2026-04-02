import { useEffect, useState } from "react";
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Droplets,
  Flame,
  CloudLightning,
  Globe,
  Shield,
  Radio,
  Zap,
  Filter,
  Brain,
  Wifi,
  Activity,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { LiveSummary } from "../lib/liveData";

const iconMap = {
  Flood: Droplets,
  Volcano: Flame,
  Storm: CloudLightning,
  Earthquake: Activity,
} as const;

const colorMap = {
  Flood: "#00d4ff",
  Volcano: "#ff6b81",
  Storm: "#ffa502",
  Earthquake: "#ff4757",
} as const;

const fallbackFilters = ["All", "Flood", "Storm", "Earthquake", "Volcano"];

export const HomeGlobalView = ({
  onSelectRegion,
  liveSummary,
}: {
  onSelectRegion?: (countryName: string) => void;
  liveSummary?: LiveSummary | null;
}) => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [aiIndex, setAiIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(
      () =>
        setAiIndex((current) =>
          liveSummary?.insights?.length ? (current + 1) % liveSummary.insights.length : 0,
        ),
      6000,
    );
    return () => clearInterval(timer);
  }, [liveSummary?.insights]);

  const topRiskCountries =
    liveSummary?.top_countries?.map((country) => ({
      country: country.country,
      targetCountry: country.country,
      type: country.top_type,
      icon: iconMap[country.top_type],
      risk: country.risk,
      trend: country.risk >= 65 ? "up" : "down",
      color: colorMap[country.top_type],
    })) || [];

  const disasterFilters = [
    "All",
    ...Array.from(new Set(topRiskCountries.map((country) => country.type))),
  ];
  const filters = disasterFilters.length > 1 ? disasterFilters : fallbackFilters;

  const filteredCountries =
    activeFilter === "All"
      ? topRiskCountries
      : topRiskCountries.filter((country) => country.type === activeFilter);

  const alerts = liveSummary?.alerts || [];
  const trendData =
    liveSummary?.trend?.map((item) => ({
      month: item.label,
      floods: item.Flood,
      earthquakes: item.Earthquake,
      storms: item.Storm,
      volcanoes: item.Volcano,
    })) || [];
  const insights = liveSummary?.insights || [
    "Live external summary not loaded yet, so the dashboard is waiting for backend-fed disaster records.",
  ];
  const stats = liveSummary?.stats;

  return (
    <div className="home-global-view">
      <div className="hgv-panel hgv-left">
        <div className="hgv-card hgv-filters">
          <h4>
            <Filter size={14} /> Quick Filters
          </h4>
          <div className="filter-pills">
            {filters.map((filter) => (
              <button
                key={filter}
                className={`filter-pill ${activeFilter === filter ? "active" : ""}`}
                onClick={() => setActiveFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="hgv-card hgv-risk-table">
          <h4>
            <AlertTriangle size={14} /> Top Risk Regions
          </h4>
          <div className="risk-list">
            {filteredCountries.map((country, index) => {
              const Icon = country.icon;
              return (
                <button
                  type="button"
                  className="risk-row"
                  key={country.country}
                  onClick={() => onSelectRegion?.(country.targetCountry)}
                >
                  <div className="risk-rank">#{index + 1}</div>
                  <div className="risk-info">
                    <span className="risk-country">{country.country}</span>
                    <span className="risk-type" style={{ color: country.color }}>
                      <Icon size={12} /> {country.type}
                    </span>
                  </div>
                  <div className="risk-percent">{country.risk}%</div>
                  <div className={`risk-trend ${country.trend}`}>
                    {country.trend === "up" ? (
                      <TrendingUp size={14} />
                    ) : (
                      <TrendingDown size={14} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="hgv-card hgv-stats">
          <h4>
            <Globe size={14} /> Global Stats
          </h4>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-value highlight-red">
                {stats?.tracked_events ?? 0}
              </span>
              <span className="stat-label">Tracked Events</span>
            </div>
            <div className="stat-item">
              <span className="stat-value highlight-cyan">
                {stats?.critical_cases ?? 0}
              </span>
              <span className="stat-label">Critical Cases</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{stats?.avg_severity ?? 0}%</span>
              <span className="stat-label">Avg Severity</span>
            </div>
            <div className="stat-item">
              <span className="stat-value highlight-cyan">
                {stats?.source_feeds ?? 0}
              </span>
              <span className="stat-label">Source Feeds</span>
            </div>
          </div>
          <div className="data-sources">
            <span className="source-tag">USGS</span>
            <span className="source-tag">ReliefWeb</span>
            <span className="source-tag">Live API</span>
          </div>
        </div>
      </div>

      <div className="hgv-panel hgv-right">
        <div className="hgv-card hgv-ai-insight">
          <h4>
            <Brain size={14} /> AI Global Insight
          </h4>
          <div className="ai-insight-text" key={aiIndex}>
            <Zap size={14} className="ai-zap" />
            {insights[aiIndex]}
          </div>
        </div>

        <div className="hgv-card hgv-alerts-feed">
          <h4>
            <Radio size={14} className="blink-icon" /> Live Alerts Feed
          </h4>
          <div className="alerts-ticker">
            <div className="alerts-ticker-inner">
              {alerts.map((alert, index) => (
                <div className={`alert-item alert-${alert.severity}`} key={`${alert.text}-${index}`}>
                  <span className="alert-text">{alert.text}</span>
                  <span className="alert-time">{alert.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hgv-card hgv-trend-chart hgv-mobile-hidden">
          <h4>
            <TrendingUp size={14} /> Live Alert Volume (7 Days)
          </h4>
          <div style={{ height: "130px", marginTop: "8px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gFlood" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gEarthquake" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff4757" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ff4757" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gStorm" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ffa502" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#ffa502" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
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
                    fontSize: "0.75rem",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="floods"
                  stroke="#00d4ff"
                  fillOpacity={1}
                  fill="url(#gFlood)"
                  name="Floods"
                />
                <Area
                  type="monotone"
                  dataKey="earthquakes"
                  stroke="#ff4757"
                  fillOpacity={1}
                  fill="url(#gEarthquake)"
                  name="Earthquakes"
                />
                <Area
                  type="monotone"
                  dataKey="storms"
                  stroke="#ffa502"
                  fillOpacity={1}
                  fill="url(#gStorm)"
                  name="Storms"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hgv-card hgv-system-status hgv-mobile-hidden">
          <h4>
            <Shield size={14} /> System Status
          </h4>
          <div className="status-row">
            <div className="status-live">
              <span className="live-dot" />
              <span>LIVE</span>
            </div>
            <div className="status-meta">
              <span>
                <Wifi size={12} /> USGS + ReliefWeb summary
              </span>
              <span>Last sync: {liveSummary?.last_updated ? new Date(liveSummary.last_updated).toLocaleTimeString() : "Pending"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
