import { useState, useEffect } from "react";
import {
  Sun,
  Moon,
  Radar,
  Activity,
  Droplets,
  MapPin,
  Globe,
  Home,
} from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from "react-simple-maps";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import "./index.css";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

const disasterData: Record<number, any[]> = {
  1960: [
    {
      type: "Earthquake",
      name: "Valdivia Earthquake",
      place: "Chile",
      lat: -39.8,
      lon: -73.0,
      severity: 95,
      magnitude: "9.5 Mw",
      fatalities: "1,655–5,700",
      loss: "$3B+",
    },
  ],
  1964: [
    {
      type: "Earthquake",
      name: "Alaska Earthquake",
      place: "USA",
      lat: 61.0,
      lon: -147.7,
      severity: 92,
      magnitude: "9.2 Mw",
      fatalities: "131",
      loss: "$311M",
    },
  ],
  1970: [
    {
      type: "Flood",
      name: "Bhola Cyclone Flood",
      place: "Bangladesh",
      lat: 22.3,
      lon: 90.3,
      severity: 85,
      magnitude: "Category 3",
      fatalities: "300,000+",
      loss: "$86M",
    },
  ],
  1975: [
    {
      type: "Flood",
      name: "Banqiao Dam Flood",
      place: "China",
      lat: 33.0,
      lon: 113.5,
      severity: 90,
      magnitude: "Catastrophic",
      fatalities: "171,000",
      loss: "$1.2B",
    },
  ],
  2004: [
    {
      type: "Earthquake",
      name: "Indian Ocean EQ",
      place: "Indonesia",
      lat: 3.3,
      lon: 95.8,
      severity: 91,
      magnitude: "9.1–9.3 Mw",
      fatalities: "227,898",
      loss: "$15B",
    },
  ],
  2008: [
    {
      type: "Earthquake",
      name: "Sichuan EQ",
      place: "China",
      lat: 31.0,
      lon: 103.6,
      severity: 79,
      magnitude: "7.9 Mw",
      fatalities: "87,587",
      loss: "$150B",
    },
  ],
  2010: [
    {
      type: "Earthquake",
      name: "Chile EQ",
      place: "Chile",
      lat: -35.9,
      lon: -72.7,
      severity: 88,
      magnitude: "8.8 Mw",
      fatalities: "525",
      loss: "$30B",
    },
  ],
  2011: [
    {
      type: "Earthquake",
      name: "Tōhoku EQ",
      place: "Japan",
      lat: 38.2,
      lon: 142.3,
      severity: 91,
      magnitude: "9.1 Mw",
      fatalities: "19,759",
      loss: "$360B",
    },
  ],
  2013: [
    {
      type: "Flood",
      name: "Uttarakhand Flood",
      place: "India",
      lat: 30.2,
      lon: 79.0,
      severity: 75,
      magnitude: "Multi-Day",
      fatalities: "6,000+",
      loss: "$1.1B",
    },
  ],
  2015: [
    {
      type: "Earthquake",
      name: "Nepal EQ",
      place: "Nepal",
      lat: 28.1,
      lon: 84.7,
      severity: 78,
      magnitude: "7.8 Mw",
      fatalities: "8,964",
      loss: "$10B",
    },
  ],
  2018: [
    {
      type: "Earthquake",
      name: "Sulawesi EQ",
      place: "Indonesia",
      lat: -0.1,
      lon: 119.8,
      severity: 75,
      magnitude: "7.5 Mw",
      fatalities: "4,340",
      loss: "$1.5B",
    },
  ],
  2022: [
    {
      type: "Flood",
      name: "Pakistan Floods",
      place: "Pakistan",
      lat: 28.0,
      lon: 68.0,
      severity: 85,
      magnitude: "Severe",
      fatalities: "1,739",
      loss: "$14.9B",
    },
  ],
  2023: [
    {
      type: "Earthquake",
      name: "Turkey-Syria EQ",
      place: "Turkey",
      lat: 37.1,
      lon: 37.0,
      severity: 78,
      magnitude: "7.8 Mw",
      fatalities: "59,259",
      loss: "$104B",
    },
  ],
};

const years = Object.keys(disasterData).map(Number).sort();
const PIE_COLORS = ["#ff4757", "#00d4ff"];

function App() {
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [activeYear, setActiveYear] = useState<number>(2023);
  const [activePage, setActivePage] = useState<
    "home" | "telemetry" | "hydrology" | "seismic"
  >("home");
  const [hoveredMapArea, setHoveredMapArea] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);

  const [time, setTime] = useState(new Date());

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const activeEvents = disasterData[activeYear] || [];

  // Component to render the dial mathematically
  const CircularDial = () => {
    if (activePage !== "home") return null;

    const R = 320;
    const total = years.length;

    return (
      <div className="circular-dial-container">
        <div className="dial-label" style={{ top: "35%" }}>
          History
        </div>
        {years.map((y, i) => {
          const angleDeg = -70 + (i / (total - 1)) * 140;
          const angleRad = (angleDeg * Math.PI) / 180;

          const top = `calc(50% + ${Math.sin(angleRad) * R}px)`;
          const left = `calc(100vw - 60px - ${Math.cos(angleRad) * R}px)`;

          return (
            <button
              key={y}
              style={{ top, left }}
              className={`dial-btn ${y === activeYear ? "active" : ""}`}
              onClick={() => setActiveYear(y)}
            >
              {y}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div
        className={`page-bg-wrapper ${activePage !== "home" ? "visible" : ""}`}
      />

      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <div
            className="brand"
            style={{ cursor: "pointer" }}
            onClick={() => setActivePage("home")}
          >
            <Radar size={32} /> NeuraShield
          </div>

          {activePage !== "home" && (
            <button
              className="home-back-btn"
              onClick={() => setActivePage("home")}
            >
              <Home size={18} /> Home
            </button>
          )}
        </div>

        <div className="nav-controls">
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      <div className={`map-wrapper ${activePage !== "home" ? "hidden" : ""}`}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{ scale: 130 }}
          style={{ width: "100%", height: "100%", maxHeight: "75vh" }}
        >
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map((geo) => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  className="rsm-geography"
                  onMouseEnter={(e) =>
                    setHoveredMapArea({
                      name: geo.properties.name,
                      x: e.clientX,
                      y: e.clientY,
                    })
                  }
                  onMouseLeave={() => setHoveredMapArea(null)}
                />
              ))
            }
          </Geographies>

          {activePage === "home" &&
            activeEvents.map((ev, idx) => {
              const isFlood = ev.type === "Flood";
              const dotColor = isFlood ? "var(--accent)" : "var(--pulse)";

              return (
                <Marker key={idx} coordinates={[ev.lon, ev.lat]}>
                  <circle
                    r={6}
                    className="marker-dot"
                    style={{
                      fill: dotColor,
                      filter: `drop-shadow(0 0 10px ${dotColor})`,
                    }}
                  />
                </Marker>
              );
            })}
        </ComposableMap>
      </div>

      {hoveredMapArea && activePage === "home" && (
        <div
          className="country-tooltip"
          style={{ left: hoveredMapArea.x, top: hoveredMapArea.y }}
        >
          {hoveredMapArea.name}
        </div>
      )}

      {/* Real Time Display */}
      <div className="system-time">{time.toLocaleString()}</div>

      <CircularDial />

      {activePage === "home" && activeEvents.length > 0 && (
        <div className="event-details-box">
          <h2>{activeYear} Incident Report</h2>
          {activeEvents.map((ev, idx) => {
            const pieData = [
              { name: "Impact/Severity", value: ev.severity },
              { name: "Contained", value: 100 - ev.severity },
            ];

            return (
              <div className="event-item" key={idx}>
                <h3>
                  {ev.type === "Earthquake" ? (
                    <Activity size={20} color="#ff4757" />
                  ) : (
                    <Droplets size={20} color="#00d4ff" />
                  )}
                  {ev.name}
                </h3>
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text-dim)",
                  }}
                >
                  <Globe size={16} /> {ev.place}
                </p>

                <div className="info-row">
                  <div className="info-cell">
                    <strong>Metrics / Mag</strong>
                    {ev.magnitude}
                  </div>
                  <div className="info-cell">
                    <strong>Fatalities</strong>
                    {ev.fatalities}
                  </div>
                  <div className="info-cell">
                    <strong>Fin. Loss</strong>
                    {ev.loss}
                  </div>
                  <div className="info-cell">
                    <strong>Coordinates</strong>
                    {ev.lat}, {ev.lon}
                  </div>
                </div>

                <div className="pie-chart-container">
                  <div className="pie-center-text">
                    {ev.severity}%<br />
                    <small>Severity</small>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {pieData.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{
                          background: "var(--bg-panel)",
                          backdropFilter: "blur(10px)",
                          border: "1px solid var(--btn-border)",
                          borderRadius: "12px",
                          color: "var(--text-main)",
                          fontWeight: 600,
                        }}
                        itemStyle={{ color: "var(--text-main)" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div
        className={`modules-container ${activePage === "home" ? "home-layout" : "sidebar-layout"}`}
      >
        <button
          className={`module-btn ${activePage === "telemetry" ? "active" : ""}`}
          onClick={() => setActivePage("telemetry")}
        >
          <Activity size={22} /> Telemetry Console
        </button>
        <button
          className={`module-btn ${activePage === "hydrology" ? "active" : ""}`}
          onClick={() => setActivePage("hydrology")}
        >
          <Droplets size={22} /> Hydrology Node
        </button>
        <button
          className={`module-btn ${activePage === "seismic" ? "active" : ""}`}
          onClick={() => setActivePage("seismic")}
        >
          <MapPin size={22} /> Seismic Uplink
        </button>
      </div>

      {activePage === "telemetry" && (
        <div className="page-view" key="telemetry">
          <h1
            style={{
              fontSize: "2.5rem",
              marginBottom: "2rem",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <Activity size={32} /> Telemetry Console
          </h1>
          <p>Global sensor arrays are online and verifying ML outputs.</p>
        </div>
      )}
      {activePage === "hydrology" && (
        <div className="page-view" key="hydrology">
          <h1
            style={{
              fontSize: "2.5rem",
              marginBottom: "2rem",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <Droplets size={32} /> Hydrology Node
          </h1>
          <p>Flood predictive models and historical basin analysis.</p>
        </div>
      )}
      {activePage === "seismic" && (
        <div className="page-view" key="seismic">
          <h1
            style={{
              fontSize: "2.5rem",
              marginBottom: "2rem",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              gap: "1rem",
            }}
          >
            <MapPin size={32} /> Seismic Uplink
          </h1>
          <p>Tectonic stress readings and live earthquake predictions.</p>
        </div>
      )}
    </div>
  );
}

export default App;
