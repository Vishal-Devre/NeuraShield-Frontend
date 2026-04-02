import { Activity, Cpu, Flame, Navigation, Radio } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./VolcanoModule.css";

const trendData = [
  { time: "T-16H", thermal: 350 },
  { time: "T-12H", thermal: 380 },
  { time: "T-08H", thermal: 450 },
  { time: "T-04H", thermal: 680 },
  { time: "T-ZERO", thermal: 810 },
];

const liveFeeds = [
  { loc: "Mauna Loa, HI", event: "Thermal spike 810C", time: "UTC 14:34:22.41Z" },
  { loc: "Mount Etna, IT", event: "Ash emission", time: "UTC 14:12:01.12Z" },
  { loc: "Krakatoa, ID", event: "Tremor 4.2", time: "UTC 13:45:59.05Z" },
];

export const VolcanoModule = ({
  selectedCountry,
}: {
  selectedCountry?: string | null;
}) => {
  const regionLabel = selectedCountry || "Pacific";

  const sectionTitleStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  } as const;

  const unitStyle = {
    fontSize: "0.68rem",
    color: "var(--text-dim)",
  } as const;

  return (
    <>
      <div className="hydro-panel-left volcano-panel volcano-panel--left">
        <div className="volcano-hero">
          <h2 className="volcano-title">
            <Flame size={24} color="#ff7b2f" /> Volcano Overwatch
          </h2>
          <p className="volcano-subtitle">
            Monitoring magmatic displacement, thermal spikes, and eruption
            pressure across active tectonic systems.
          </p>
        </div>

        <div className="hydro-section volcano-card">
          <h3 style={sectionTitleStyle}>
            <Navigation size={16} color="var(--text-dim)" /> 1. Region Focus
          </h3>
          <div className="volcano-info-grid">
            <div className="info-cell">
              <strong>Volcano</strong>
              Mauna Loa
            </div>
            <div className="info-cell">
              <strong>Sector</strong>
              {regionLabel} Ring
            </div>
            <div className="info-cell">
              <strong>Coords</strong>
              19.47{"\u00B0"}N, -155.6{"\u00B0"}W
            </div>
            <div className="info-cell">
              <strong>Elevation</strong>
              4,169 m
            </div>
          </div>
        </div>

        <div className="hydro-section volcano-card volcano-spacer">
          <h3 style={sectionTitleStyle}>
            <Activity size={16} color="var(--text-dim)" /> 2. Magmatic Activity
          </h3>
          <div className="seismic-data-grid">
            <div className="data-box volcano-metric">
              <span className="box-label">Thermal (C)</span>
              <span className="box-value highlight-red">810</span>
            </div>
            <div className="data-box volcano-metric">
              <span className="box-label">SO2 Emission</span>
              <span className="box-value">High</span>
            </div>
            <div className="data-box volcano-metric">
              <span className="box-label">Seismic</span>
              <span className="box-value highlight-cyan">8.4</span>
            </div>
          </div>
        </div>

        <div className="hydro-section volcano-card volcano-spacer">
          <h3 style={sectionTitleStyle}>
            <Navigation size={16} color="var(--text-dim)" /> 3. Subterranean
            Readings
          </h3>
          <div className="seismic-data-grid">
            <div className="data-box volcano-metric">
              <span className="box-label">Magma Depth</span>
              <span className="box-value">
                3.2<span style={unitStyle}>km</span>
              </span>
            </div>
            <div className="data-box volcano-metric">
              <span className="box-label">Pressure</span>
              <span className="box-value highlight-red">Critical</span>
            </div>
            <div className="data-box volcano-metric">
              <span className="box-label">Deformation</span>
              <span className="box-value highlight-red">
                +12<span style={unitStyle}>mm</span>
              </span>
            </div>
          </div>
        </div>

        <div className="hydro-section volcano-card volcano-spacer">
          <h3 style={sectionTitleStyle}>
            <Flame size={16} color="var(--text-dim)" /> Gas Emission Data
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Vent</th>
                <th>SO2 Level</th>
                <th>CO2 Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Primary Vent</td>
                <td>12,000 t/d</td>
                <td>4,500 t/d</td>
              </tr>
              <tr>
                <td>Fissure 2</td>
                <td>800 t/d</td>
                <td>120 t/d</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section volcano-card volcano-spacer">
          <h3 style={sectionTitleStyle}>
            <Activity size={16} color="var(--text-dim)" /> Thermal Activity
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Volcano</th>
                <th>Surface Temp</th>
                <th>Heat Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Main Crater</td>
                <td>810C</td>
                <td>Critical</td>
              </tr>
              <tr>
                <td>Lava Tube A</td>
                <td>450C</td>
                <td>High</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section volcano-card volcano-spacer">
          <h3 style={sectionTitleStyle}>
            <Navigation size={16} color="var(--text-dim)" /> Ground
            Deformation
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Uplift/Shift</th>
                <th>Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{regionLabel} Flank</td>
                <td>+12mm</td>
                <td>1mm/day</td>
              </tr>
              <tr>
                <td>Summit Caldera</td>
                <td>+34mm</td>
                <td>3mm/day</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="hydro-panel-right volcano-panel volcano-panel--right">
        <div className="hydro-section volcano-card">
          <h3 style={sectionTitleStyle}>
            <Cpu size={16} color="var(--text-dim)" /> 4. AI Eruption Prediction
          </h3>
          <div className="seismic-ai-risk volcano-risk-panel">
            <div className="risk-header">
              <span>Eruption Imminent</span>
              <span className="status-badge volcano-badge">Critical (89%)</span>
            </div>
            <div className="risk-bar-bg">
              <div
                className="risk-bar-fill"
                style={{ width: "89%", background: "#ff7b2f" }}
              />
            </div>
            <div className="risk-footer">
              Predictive Confidence: <strong>94%</strong>
            </div>
          </div>
        </div>

        <div className="hydro-section volcano-card volcano-spacer">
          <h3 style={sectionTitleStyle}>
            <Activity size={16} color="var(--text-dim)" /> 5. Thermal Trend
            (24h)
          </h3>
          <div className="volcano-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
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
                  itemStyle={{ color: "#ff7b2f" }}
                />
                <Line
                  type="monotone"
                  dataKey="thermal"
                  stroke="#ff7b2f"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#ff7b2f", strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: "#fff" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hydro-section volcano-card volcano-spacer">
          <h3 style={sectionTitleStyle}>
            <Cpu size={16} color="var(--text-dim)" /> Nearby Population Risk
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Population</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{regionLabel} Valley</td>
                <td>1.2M</td>
                <td className="highlight-red">Critical</td>
              </tr>
              <tr>
                <td>East Ridge</td>
                <td>45K</td>
                <td>Moderate</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section volcano-card volcano-spacer">
          <h3 style={sectionTitleStyle}>
            <Radio size={16} color="var(--text-dim)" /> Volcano Alert Levels
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Volcano</th>
                <th>Alert Stage</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Major Peak</td>
                <td>
                  <span className="status-badge volcano-badge">Red</span>
                </td>
                <td>Imminent Eruption</td>
              </tr>
              <tr>
                <td>Secondary</td>
                <td>
                  <span className="status-badge volcano-badge volcano-badge--amber">
                    Orange
                  </span>
                </td>
                <td>High Unrest</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section volcano-card volcano-spacer volcano-alert-card">
          <h3 style={{ ...sectionTitleStyle, color: "#ff7b2f", borderBottom: "none" }}>
            <Radio size={16} className="blink-icon" /> 6. Active Vulcan Alerts
          </h3>
          <p className="volcano-alert-text">
            <strong>Red Code:</strong> Immediate evacuation protocols suggested
            for zones 1 and 2 around Mauna Loa.
          </p>
        </div>

        <div className="hydro-section volcano-card volcano-spacer">
          <h3 style={sectionTitleStyle}>
            <Radio size={16} color="var(--text-dim)" /> 7. Live Events Feed
          </h3>
          <div className="seismic-feed-list volcano-feed">
            {liveFeeds.map((feed, index) => (
              <div className="feed-item" key={feed.loc}>
                <div
                  className={`feed-dot ${index === 0 ? "blink-red" : ""}`}
                  style={
                    index === 0
                      ? { background: "#ff7b2f", boxShadow: "0 0 8px #ff7b2f" }
                      : { background: "rgba(255,255,255,0.3)" }
                  }
                />
                <div className="feed-details">
                  <span className="feed-loc">{feed.loc}</span>
                  <span
                    className="feed-mag"
                    style={
                      index === 0
                        ? { color: "#ff7b2f" }
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
      </div>
    </>
  );
};
