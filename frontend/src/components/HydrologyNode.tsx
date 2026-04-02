import {
  AlertTriangle,
  CloudRain,
  Cpu,
  MapPin,
  Radio,
  TrendingUp,
  Waves,
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
import "./HydrologyNode.css";

const trendData = [
  { time: "00:00", rain: 20, water: 2.1 },
  { time: "04:00", rain: 45, water: 2.3 },
  { time: "08:00", rain: 120, water: 3.5 },
  { time: "12:00", rain: 240, water: 4.2 },
];

const liveFeeds = [
  { loc: "Assam Delta", event: "Heavy Rain", time: "10:02 AM" },
  { loc: "Brahmaputra Basin", event: "Rising Water", time: "10:01 AM" },
  { loc: "Kaziranga", event: "Flood Warning", time: "09:55 AM" },
];

export const HydrologyNode = ({
  selectedCountry,
}: {
  selectedCountry?: string | null;
}) => {
  const regionLabel = selectedCountry || "India";

  const sectionTitleStyle = {
    display: "flex",
    alignItems: "center",
    gap: "6px",
  } as const;

  return (
    <>
      <div className="hydro-panel-left hydrology-panel hydrology-panel--left">
        <div className="hydrology-hero">
          <h2 className="hydrology-title">
            <Waves size={24} color="#00d4ff" /> Hydrology Node
          </h2>
          <p className="hydrology-subtitle">
            Basin intelligence for rainfall loading, river rise, and overflow
            prediction across vulnerable corridors.
          </p>
        </div>

        <div className="hydro-section hydrology-card">
          <h3 style={sectionTitleStyle}>
            <MapPin size={16} color="var(--text-dim)" /> 1. Region-wise Data
          </h3>
          <div className="hydrology-info-grid">
            <div className="info-cell">
              <strong>Location</strong>
              {regionLabel} Basin
            </div>
            <div className="info-cell">
              <strong>Coordinates</strong>
              26.20{"\u00B0"} N, 92.93{"\u00B0"} E
            </div>
          </div>
        </div>

        <div className="hydro-section hydrology-card hydrology-spacer">
          <h3 style={sectionTitleStyle}>
            <CloudRain size={16} color="var(--text-dim)" /> 2. Rainfall Data
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Current (mm)</th>
                <th>Intensity</th>
                <th>Past 24h (mm)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>240</td>
                <td>Heavy</td>
                <td>410</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section hydrology-card hydrology-spacer">
          <h3 style={sectionTitleStyle}>
            <Waves size={16} color="var(--text-dim)" /> 3. Water / River Data
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>River Level</th>
                <th>Reservoir</th>
                <th>Rise Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>4.2m</td>
                <td>18.5m</td>
                <td>0.15 m/hr</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section hydrology-card hydrology-spacer">
          <h3 style={sectionTitleStyle}>
            <Waves size={16} color="var(--text-dim)" /> River Monitoring
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>River Name</th>
                <th>Current Level</th>
                <th>Danger Level</th>
                <th>Rise Rate</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Primary River</td>
                <td>12.4m</td>
                <td>10.0m</td>
                <td>+0.2m/hr</td>
              </tr>
              <tr>
                <td>Local Tributary</td>
                <td>4.2m</td>
                <td>5.5m</td>
                <td>+0.05m/hr</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section hydrology-card hydrology-spacer">
          <h3 style={sectionTitleStyle}>
            <Waves size={16} color="var(--text-dim)" /> Reservoir Status
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Dam Name</th>
                <th>Capacity %</th>
                <th>Overflow Risk</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Main Reservoir</td>
                <td>88%</td>
                <td>
                  <span className="status-badge hydrology-badge hydrology-badge--low">
                    Low
                  </span>
                </td>
              </tr>
              <tr>
                <td>Secondary Dam</td>
                <td>95%</td>
                <td>
                  <span className="status-badge hydrology-badge hydrology-badge--high">
                    High
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section hydrology-card hydrology-spacer">
          <h3 style={sectionTitleStyle}>
            <Waves size={16} color="var(--text-dim)" /> Soil Moisture Data
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Moisture %</th>
                <th>Saturation Level</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{regionLabel} Delta</td>
                <td>92%</td>
                <td>Critical</td>
              </tr>
              <tr>
                <td>Highlands</td>
                <td>45%</td>
                <td>Normal</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="hydro-panel-right hydrology-panel hydrology-panel--right">
        <div className="hydro-section hydrology-card">
          <h3 style={sectionTitleStyle}>
            <Cpu size={16} color="var(--text-dim)" /> 4. AI Prediction Output
          </h3>
          <div className="seismic-ai-risk hydrology-risk-panel">
            <div className="risk-header">
              <span>Flood Escalation Risk</span>
              <span className="status-badge hydrology-badge hydrology-badge--high">
                High (85%)
              </span>
            </div>
            <div className="risk-bar-bg">
              <div
                className="risk-bar-fill"
                style={{ width: "85%", background: "#00d4ff" }}
              />
            </div>
            <div className="risk-footer">
              Predictive Confidence: <strong>92%</strong>
            </div>
          </div>
        </div>

        <div className="hydro-section hydrology-card hydrology-spacer">
          <h3 style={sectionTitleStyle}>
            <TrendingUp size={16} color="var(--text-dim)" /> 5. Trend Data
          </h3>
          <div className="hydrology-chart-wrap">
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
                  yAxisId="left"
                  tick={{ fill: "#00d4ff", fontSize: 10 }}
                  width={30}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  tick={{ fill: "#ff8c42", fontSize: 10 }}
                  width={30}
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
                  yAxisId="left"
                  type="monotone"
                  dataKey="rain"
                  stroke="#00d4ff"
                  strokeWidth={2}
                  name="Rain (mm)"
                  dot={{ fill: "#00d4ff" }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="water"
                  stroke="#ff8c42"
                  strokeWidth={2}
                  name="Level (m)"
                  dot={{ fill: "#ff8c42" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="hydro-section hydrology-card hydrology-spacer">
          <h3 style={sectionTitleStyle}>
            <Cpu size={16} color="var(--text-dim)" /> Historical Flood Data
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Year</th>
                <th>Region</th>
                <th>Severity</th>
                <th>Damage</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>2022</td>
                <td>{regionLabel}</td>
                <td>Catastrophic</td>
                <td>$1.1B</td>
              </tr>
              <tr>
                <td>2018</td>
                <td>{regionLabel} Coastal</td>
                <td>High</td>
                <td>$400M</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section hydrology-card hydrology-spacer">
          <h3 style={sectionTitleStyle}>
            <CloudRain size={16} color="var(--text-dim)" /> Rainfall Forecast
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Region</th>
                <th>Expected Rainfall</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Coastal Belt</td>
                <td>120mm</td>
                <td>48 hrs</td>
              </tr>
              <tr>
                <td>Inland Valley</td>
                <td>40mm</td>
                <td>24 hrs</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="hydro-section hydrology-card hydrology-spacer">
          <h3 style={sectionTitleStyle}>
            <AlertTriangle size={16} color="var(--text-dim)" /> 6. Alerts /
            Status
          </h3>
          <div className="hydrology-alert hydrology-alert--critical">
            High flood risk in Assam
          </div>
          <div className="hydrology-alert hydrology-alert--warning">
            Water level rising rapidly
          </div>
        </div>

        <div className="hydro-section hydrology-card hydrology-spacer">
          <h3 style={sectionTitleStyle}>
            <Radio size={16} color="var(--text-dim)" /> 7. Live Feed
          </h3>
          <table className="hydro-table">
            <thead>
              <tr>
                <th>Location</th>
                <th>Event</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {liveFeeds.map((feed) => (
                <tr key={feed.loc}>
                  <td>{feed.loc}</td>
                  <td>{feed.event}</td>
                  <td>{feed.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
