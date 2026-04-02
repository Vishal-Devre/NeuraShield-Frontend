import {
  Activity,
  AlertTriangle,
  Cpu,
  MapPin,
  Navigation,
  Radio,
  TrendingUp,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./SeismicUplink.css";

const trendData = [
  { time: "T-16H", magnitude: 3.1 },
  { time: "T-12H", magnitude: 3.5 },
  { time: "T-08H", magnitude: 4.2 },
  { time: "T-04H", magnitude: 6.8 },
  { time: "T-ZERO", magnitude: 5.1 },
];

const liveFeeds = [
  { loc: "San Francisco", event: "Mw 6.8", time: "UTC 14:34:22.41Z" },
  { loc: "Tokyo Bay", event: "Mw 4.2", time: "UTC 14:12:01.12Z" },
  { loc: "Chile Coast", event: "Mw 5.1", time: "UTC 13:45:59.05Z" },
];

export const SeismicUplink = ({
  selectedCountry,
}: {
  selectedCountry?: string | null;
}) => {
  const regionLabel = selectedCountry || "Global";

  const sectionTitleStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  } as const;

  return (
    <>
      <div className="hydro-panel-left seismic-uplink-panel seismic-uplink-panel--left">
        <div className="seismic-uplink-hero">
          <h2 className="seismic-uplink-title">
            <Activity size={24} color="#ff4757" /> Seismic Uplink
          </h2>
          <p className="seismic-uplink-subtitle">
            Real-time fault monitoring, aftershock intelligence, and rupture
            risk escalation for active seismic corridors.
          </p>
        </div>

        <div className="hydro-section seismic-uplink-card">
          <h3 style={sectionTitleStyle}>
            <MapPin size={16} color="var(--text-dim)" /> 1. Region-wise Data
          </h3>
          <div className="seismic-uplink-info-grid">
            <div className="info-cell">
              <strong>Location</strong>
              {regionLabel} Fault Line
            </div>
            <div className="info-cell">
              <strong>Coordinates</strong>
              37.77{"\u00B0"} N, 122.42{"\u00B0"} W
            </div>
          </div>
        </div>

        <div className="hydro-section seismic-uplink-card seismic-uplink-spacer">
          <h3 style={sectionTitleStyle}>
            <Activity size={16} color="var(--text-dim)" /> 2. Earthquake
            Magnitude
          </h3>
          <div className="seismic-data-grid">
            <div className="data-box seismic-uplink-metric">
              <span className="box-label">Current (Mw)</span>
              <span className="box-value highlight-red">6.8</span>
            </div>
            <div className="data-box seismic-uplink-metric">
              <span className="box-label">Activity</span>
              <span className="box-value">High</span>
            </div>
            <div className="data-box seismic-uplink-metric">
              <span className="box-label">24h Tremors</span>
              <span className="box-value highlight-cyan">34</span>
            </div>
          </div>
        </div>

        <div className="hydro-section seismic-uplink-card seismic-uplink-spacer">
          <h3 style={sectionTitleStyle}>
            <Navigation size={16} color="var(--text-dim)" /> 3. Depth &
            Frequency
          </h3>
          <div className="seismic-data-grid">
            <div className="data-box seismic-uplink-metric">
              <span className="box-label">Depth (km)</span>
              <span className="box-value">14.5</span>
            </div>
            <div className="data-box seismic-uplink-metric">
              <span className="box-label">Frequency</span>
              <span className="box-value">1.2/hr</span>
            </div>
            <div className="data-box seismic-uplink-metric">
              <span className="box-label">Change Rate</span>
              <span className="box-value highlight-red">+0.4</span>
            </div>
          </div>
        </div>

        <div className="hydro-section seismic-uplink-card seismic-uplink-spacer">
          <h3 style={sectionTitleStyle}>
            <Activity size={16} color="var(--text-dim)" /> Fault Line Data
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Fault Type</th>
                <th>Activity Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{regionLabel} Main</td>
                <td>Transform</td>
                <td>Active</td>
              </tr>
              <tr>
                <td>Coastal Ridge</td>
                <td>Subduction</td>
                <td>Dormant</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section seismic-uplink-card seismic-uplink-spacer">
          <h3 style={sectionTitleStyle}>
            <Activity size={16} color="var(--text-dim)" /> Aftershock Tracking
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Magnitude</th>
                <th>Time Gap</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Epicenter +12km</td>
                <td>4.1 Mw</td>
                <td>2 hrs</td>
              </tr>
              <tr>
                <td>Epicenter +40km</td>
                <td>3.2 Mw</td>
                <td>5 hrs</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section seismic-uplink-card seismic-uplink-spacer">
          <h3 style={sectionTitleStyle}>
            <MapPin size={16} color="var(--text-dim)" /> Seismic Zones
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Zone Name</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Zone V ({regionLabel})</td>
                <td>
                  <span className="highlight-red">Severe</span>
                </td>
              </tr>
              <tr>
                <td>Zone IV</td>
                <td style={{ color: "#ffa502" }}>High</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="hydro-panel-right seismic-uplink-panel seismic-uplink-panel--right">
        <div className="hydro-section seismic-uplink-card">
          <h3 style={sectionTitleStyle}>
            <Cpu size={16} color="var(--text-dim)" /> 4. AI Prediction Output
          </h3>
          <div className="seismic-ai-risk seismic-uplink-risk-panel">
            <div className="risk-header">
              <span>Rupture Escalation Risk</span>
              <span className="status-badge seismic-uplink-badge">Critical (92%)</span>
            </div>
            <div className="risk-bar-bg">
              <div
                className="risk-bar-fill"
                style={{ width: "92%", background: "#ff4757" }}
              />
            </div>
            <div className="risk-footer">
              Predictive Confidence: <strong>88%</strong>
            </div>
          </div>
        </div>

        <div className="hydro-section seismic-uplink-card seismic-uplink-spacer">
          <h3 style={sectionTitleStyle}>
            <TrendingUp size={16} color="var(--text-dim)" /> 5. Trend Data
          </h3>
          <div className="seismic-uplink-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(255,255,255,0.05)"
                />
                <XAxis
                  dataKey="time"
                  tick={{ fill: "var(--text-dim)", fontSize: 10 }}
                />
                <YAxis
                  tick={{ fill: "#ff4757", fontSize: 10 }}
                  width={30}
                  domain={["auto", "auto"]}
                />
                <Tooltip
                  contentStyle={{
                    background: "var(--bg-panel)",
                    border: "1px solid var(--btn-border)",
                    borderRadius: "12px",
                    color: "var(--text-main)",
                    fontSize: "0.8rem",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="magnitude"
                  stroke="#ff4757"
                  strokeWidth={2}
                  name="Magnitude (Mw)"
                  dot={{ fill: "#ff4757" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hydro-section seismic-uplink-card seismic-uplink-spacer">
          <h3 style={sectionTitleStyle}>
            <Navigation size={16} color="var(--text-dim)" /> Depth Analysis
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Avg Depth</th>
                <th>Impact Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{regionLabel} Fault</td>
                <td>12km</td>
                <td>High</td>
              </tr>
              <tr>
                <td>Subduction Zone</td>
                <td>45km</td>
                <td>Low</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section seismic-uplink-card seismic-uplink-spacer">
          <h3 style={sectionTitleStyle}>
            <Activity size={16} color="var(--text-dim)" /> Historical
            Earthquakes
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Magnitude</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2011</td>
                <td>9.1 Mw</td>
                <td>{regionLabel} Coast</td>
              </tr>
              <tr>
                <td>2004</td>
                <td>8.8 Mw</td>
                <td>Oceanic Ridge</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section seismic-uplink-card seismic-uplink-spacer">
          <h3 style={sectionTitleStyle}>
            <AlertTriangle size={16} color="var(--text-dim)" /> 6. Alerts /
            Status
          </h3>
          <div className="seismic-uplink-alert seismic-uplink-alert--critical">
            High seismic activity detected
          </div>
          <div className="seismic-uplink-alert seismic-uplink-alert--warning">
            Frequent tremors observed
          </div>
        </div>

        <div className="hydro-section seismic-uplink-card seismic-uplink-spacer">
          <h3 style={sectionTitleStyle}>
            <Radio size={16} color="var(--text-dim)" /> 7. Live Feed
          </h3>
          <div className="seismic-feed-list seismic-uplink-feed">
            {liveFeeds.map((feed, index) => (
              <div className="feed-item" key={feed.loc}>
                <div
                  className={`feed-dot ${index === 0 ? "blink-red" : ""}`}
                  style={
                    index === 0
                      ? { background: "#ff4757", boxShadow: "0 0 8px #ff4757" }
                      : { background: "rgba(255,255,255,0.3)" }
                  }
                />
                <div className="feed-details">
                  <span className="feed-loc">{feed.loc}</span>
                  <span
                    className="feed-mag"
                    style={
                      index === 0
                        ? { color: "#ff4757" }
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
