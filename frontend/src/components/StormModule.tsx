import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CloudLightning,
  Cpu,
  Maximize2,
  Navigation,
  Radio,
  Wind,
  X,
} from "lucide-react";
import "./StormModule.css";

const trendData = [
  { time: "T-16H", wind: 80 },
  { time: "T-12H", wind: 110 },
  { time: "T-08H", wind: 145 },
  { time: "T-04H", wind: 210 },
  { time: "T-ZERO", wind: 265 },
];

const liveFeeds = [
  {
    loc: "Bay of Bengal",
    event: "Category 5 wall wind >265 km/h",
    time: "UTC 14:34:22.41Z",
  },
  {
    loc: "Odisha Coast",
    event: "Pressure drop and surge acceleration",
    time: "UTC 14:12:01.12Z",
  },
  {
    loc: "Andhra Corridor",
    event: "Landfall corridor tightened",
    time: "UTC 13:45:59.05Z",
  },
];

type StormModuleProps = {
  selectedCountry?: string | null;
  onDetailedViewChange?: (isOpen: boolean) => void;
};

export const StormModule = ({
  selectedCountry,
  onDetailedViewChange,
}: StormModuleProps) => {
  const [isDetailedView, setIsDetailedView] = useState(false);

  useEffect(() => {
    onDetailedViewChange?.(isDetailedView);

    return () => {
      onDetailedViewChange?.(false);
    };
  }, [isDetailedView, onDetailedViewChange]);

  useEffect(() => {
    if (!isDetailedView) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsDetailedView(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isDetailedView]);

  const sectionTitleStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  } as const;

  const unitStyle = {
    fontSize: "0.68rem",
    color: "var(--text-dim)",
  } as const;

  const regionLabel = selectedCountry || "India";

  const expectedImpactZone = (
    <div className="hydro-section storm-card storm-grid-span-12">
      <h3 style={sectionTitleStyle}>
        <Navigation size={16} color="var(--text-dim)" /> 1. Expected Impact
        Zone
      </h3>
      <div className="storm-info-grid">
        <div className="info-cell">
          <strong>Region</strong>
          {regionLabel} Coast
        </div>
        <div className="info-cell">
          <strong>System</strong>
          Severe Cyclonic Storm
        </div>
        <div className="info-cell">
          <strong>Storm Eye</strong>
          18.53{"\u00B0"}N, 85.30{"\u00B0"}E
        </div>
        <div className="info-cell">
          <strong>Radial Spread</strong>
          450 km
        </div>
      </div>
    </div>
  );

  const atmosphericMetrics = (
    <div className="hydro-section storm-card">
      <h3 style={sectionTitleStyle}>
        <Wind size={16} color="var(--text-dim)" /> 2. Atmospheric Metrics
      </h3>
      <div className="seismic-data-grid storm-metrics-grid">
        <div className="data-box storm-metric-box">
          <span className="box-label">Wind Speed</span>
          <span className="box-value highlight-cyan">
            265<span style={unitStyle}>km/h</span>
          </span>
        </div>
        <div className="data-box storm-metric-box">
          <span className="box-label">Pressure</span>
          <span className="box-value highlight-red">
            890<span style={unitStyle}>hPa</span>
          </span>
        </div>
        <div className="data-box storm-metric-box">
          <span className="box-label">Humidity</span>
          <span className="box-value highlight-cyan">98%</span>
        </div>
      </div>
    </div>
  );

  const oceanicReadings = (
    <div className="hydro-section storm-card">
      <h3 style={sectionTitleStyle}>
        <Navigation size={16} color="var(--text-dim)" /> 3. Oceanic Readings
      </h3>
      <div className="seismic-data-grid storm-metrics-grid">
        <div className="data-box storm-metric-box">
          <span className="box-label">Surge Height</span>
          <span className="box-value highlight-red">
            4.5<span style={unitStyle}>m</span>
          </span>
        </div>
        <div className="data-box storm-metric-box">
          <span className="box-label">SST</span>
          <span className="box-value">
            31.2<span style={unitStyle}>{"\u00B0"}C</span>
          </span>
        </div>
        <div className="data-box storm-metric-box">
          <span className="box-label">Velocity</span>
          <span className="box-value">
            22<span style={unitStyle}>kph</span>
          </span>
        </div>
      </div>
    </div>
  );

  const aiPrediction = (
    <div className="hydro-section storm-card storm-grid-span-8">
      <h3 style={sectionTitleStyle}>
        <Cpu size={16} color="var(--text-dim)" /> 4. AI Storm Core Prediction
      </h3>
      <div className="seismic-ai-risk storm-risk-panel">
        <div className="risk-header">
          <span>Catastrophic Risk</span>
          <span className="status-badge storm-status-badge">Maximum (96%)</span>
        </div>
        <div className="risk-bar-bg">
          <div
            className="risk-bar-fill"
            style={{ width: "96%", background: "#00d4ff" }}
          />
        </div>
        <div className="risk-footer">
          Predictive Confidence: <strong>91%</strong>
        </div>
      </div>
    </div>
  );

  const windVelocityMatrix = (
    <div className="hydro-section storm-card storm-grid-span-8">
      <h3 style={sectionTitleStyle}>
        <Wind size={16} color="var(--text-dim)" /> 5. Wind Velocity Matrix
      </h3>
      <div className="storm-chart-wrap">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trendData}>
            <defs>
              <linearGradient id="colorWind" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00d4ff" stopOpacity={0.85} />
                <stop offset="95%" stopColor="#00d4ff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.08)"
              vertical={false}
            />
            <XAxis
              dataKey="time"
              stroke="var(--text-dim)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="var(--text-dim)"
              fontSize={10}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip
              contentStyle={{
                background: "var(--bg-panel)",
                border: "1px solid var(--btn-border)",
                borderRadius: "12px",
              }}
            />
            <Area
              type="monotone"
              dataKey="wind"
              stroke="#00d4ff"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#colorWind)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const advisoryBroadcasts = (
    <div className="hydro-section storm-card storm-alert-card storm-grid-span-4">
      <h3 style={{ ...sectionTitleStyle, color: "#00d4ff", borderBottom: "none" }}>
        <Radio size={16} className="blink-icon" /> 6. Advisory Broadcasts
      </h3>
      <p className="storm-alert-text">
        <strong>Severe Threat:</strong> Gusts over 265 kph with immediate surge
        loading expected across the first landfall corridor.
      </p>
    </div>
  );

  const satcomDataFeed = (
    <div className="hydro-section storm-card storm-grid-span-4">
      <h3 style={sectionTitleStyle}>
        <Radio size={16} color="var(--text-dim)" /> 7. Satcom Data Feed
      </h3>
      <div className="seismic-feed-list storm-feed-list">
        {liveFeeds.map((feed, index) => (
          <div className="feed-item" key={feed.loc}>
            <div
              className={`feed-dot ${index === 0 ? "blink-cyan" : ""}`}
              style={
                index === 0
                  ? {
                      background: "#00d4ff",
                      boxShadow: "0 0 8px rgba(0, 212, 255, 0.9)",
                    }
                  : { background: "rgba(255,255,255,0.28)" }
              }
            />
            <div className="feed-details">
              <span className="feed-loc">{feed.loc}</span>
              <span
                className="feed-mag"
                style={
                  index === 0
                    ? { color: "#00d4ff" }
                    : { color: "var(--text-dim)" }
                }
              >
                {feed.event}
              </span>
            </div>
            <div className="feed-time">{feed.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const windAnalysis = (
    <div className="hydro-section storm-card">
      <h3 style={sectionTitleStyle}>
        <Wind size={16} color="var(--text-dim)" /> Wind Analysis
      </h3>
      <table className="hydro-table">
        <thead>
          <tr>
            <th>Region</th>
            <th>Wind Speed</th>
            <th>Gust Speed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{regionLabel} Outer Band</td>
            <td>265 km/h</td>
            <td>310 km/h</td>
          </tr>
          <tr>
            <td>Inland Path</td>
            <td>140 km/h</td>
            <td>180 km/h</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const pressureMonitoring = (
    <div className="hydro-section storm-card">
      <h3 style={sectionTitleStyle}>
        <Navigation size={16} color="var(--text-dim)" /> Pressure Monitoring
      </h3>
      <table className="hydro-table">
        <thead>
          <tr>
            <th>Region</th>
            <th>Pressure Level</th>
            <th>Drop Rate</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Eye Center</td>
            <td>890 hPa</td>
            <td>-12 hPa/hr</td>
          </tr>
          <tr>
            <td>Periphery</td>
            <td>970 hPa</td>
            <td>-4 hPa/hr</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const stormPathPrediction = (
    <div className="hydro-section storm-card">
      <h3 style={sectionTitleStyle}>
        <Cpu size={16} color="var(--text-dim)" /> Storm Path Prediction
      </h3>
      <table className="hydro-table">
        <thead>
          <tr>
            <th>Current Loc</th>
            <th>Direction</th>
            <th>Speed</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>18{"\u00B0"}N, 85{"\u00B0"}E</td>
            <td>NW</td>
            <td>22 kph</td>
          </tr>
          <tr>
            <td>Projected 12H</td>
            <td>NNW</td>
            <td>18 kph</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const cycloneCategories = (
    <div className="hydro-section storm-card">
      <h3 style={sectionTitleStyle}>
        <CloudLightning size={16} color="var(--text-dim)" /> Cyclone Categories
      </h3>
      <table className="hydro-table">
        <thead>
          <tr>
            <th>Category</th>
            <th>Wind Range</th>
            <th>Damage Level</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Cat 5</td>
            <td>&gt; 252 kph</td>
            <td>
              <span className="highlight-red">Catastrophic</span>
            </td>
          </tr>
          <tr>
            <td>Cat 4</td>
            <td>209 - 251 kph</td>
            <td>Severe</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  const historicalStorms = (
    <div className="hydro-section storm-card">
      <h3 style={sectionTitleStyle}>
        <Wind size={16} color="var(--text-dim)" /> Historical Storms
      </h3>
      <table className="hydro-table">
        <thead>
          <tr>
            <th>Year</th>
            <th>Name</th>
            <th>Severity</th>
            <th>Region</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>2022</td>
            <td>Cyclone Sitrang</td>
            <td>High</td>
            <td>{regionLabel}</td>
          </tr>
          <tr>
            <td>2019</td>
            <td>Cyclone Fani</td>
            <td>Catastrophic</td>
            <td>Bay of Bengal</td>
          </tr>
        </tbody>
      </table>
    </div>
  );

  if (isDetailedView) {
    return (
      <div className="storm-detailed-modal" role="dialog" aria-modal="true">
        <div className="storm-detailed-shell">
          <div className="storm-detailed-header">
            <div className="storm-detailed-header-copy">
              <div className="storm-detailed-icon-wrap">
                <CloudLightning size={28} color="#00d4ff" />
              </div>
              <div>
                <p className="storm-detailed-kicker">NeuraShield Storm Desk</p>
                <h2>Storm Full Analysis Grid</h2>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsDetailedView(false)}
              className="close-details-btn"
              aria-label="Close storm full analysis grid"
            >
              <X size={22} />
            </button>
          </div>

          <div className="storm-detailed-grid">
            {expectedImpactZone}
            {atmosphericMetrics}
            {oceanicReadings}
            {aiPrediction}
            {advisoryBroadcasts}
            {windVelocityMatrix}
            {satcomDataFeed}
            {windAnalysis}
            {pressureMonitoring}
            {stormPathPrediction}
            {cycloneCategories}
            {historicalStorms}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="hydro-panel-left storm-panel storm-panel--left">
        <div className="storm-panel-hero">
          <h2 className="storm-module-title">
            <CloudLightning size={24} color="#00d4ff" /> Cyclone & Storm
            Tracking
          </h2>
          <p className="storm-module-subtitle">
            Real-time atmospheric, coastal, and landfall intelligence for rapid
            decision support.
          </p>
        </div>

        {expectedImpactZone}
        <div className="storm-section-spacer">{atmosphericMetrics}</div>
        <div className="storm-section-spacer">{oceanicReadings}</div>

        <button
          type="button"
          className="detailed-view-btn"
          onClick={() => setIsDetailedView(true)}
        >
          <Maximize2 size={16} /> View Full Analysis Grid
        </button>
      </div>

      <div className="hydro-panel-right storm-panel storm-panel--right">
        {aiPrediction}
        <div className="storm-section-spacer">{windVelocityMatrix}</div>
        <div className="storm-section-spacer">{advisoryBroadcasts}</div>
        <div className="storm-section-spacer">{satcomDataFeed}</div>
      </div>
    </>
  );
};
