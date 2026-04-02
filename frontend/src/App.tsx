import { useState, useEffect, useRef, useCallback } from "react";
import {
  Sun,
  Moon,
  Radar,
  Activity,
  AlertTriangle,
  Droplets,
  Globe,
  Home,
  Flame,
  CloudLightning,
  MapPin,
  Search,
  MessageSquare,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";
import { geoCentroid, geoBounds } from "d3-geo";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts";
import { HydrologyNode } from "./components/HydrologyNode";
import { SeismicUplink } from "./components/SeismicUplink";
import { TelemetryConsole } from "./components/TelemetryConsole";
import { VolcanoModule } from "./components/VolcanoModule";
import { StormModule } from "./components/StormModule";
import { ChatbotModule } from "./components/ChatbotModule";
import { HomeGlobalView } from "./components/HomeGlobalView";
import { useLiveSummary } from "./lib/liveData";
import {
  countryNamesMatch,
  loadAdm1Overlay,
  loadBoundaryCatalog,
  type Adm1Overlay,
  type HazardEvent,
  type HazardEventType,
  type RegionalBoundaryFeature,
  type RiskMetricKey,
} from "./lib/adminBoundaries";
import "./index.css";

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

type DisasterType =
  | "Earthquake"
  | "Flood"
  | "Storm"
  | "Volcano"
  | "Wildfire"
  | "Landslide";

type DisasterEvent = {
  type: DisasterType;
  name: string;
  place: string;
  lat: number;
  lon: number;
  severity: number;
  magnitude: string;
  fatalities: string;
  loss: string;
};

const disasterTypeColors: Record<DisasterType, string> = {
  Earthquake: "#ff4757",
  Flood: "#00d4ff",
  Storm: "#ffa502",
  Volcano: "#ff6b81",
  Wildfire: "#ff7b2f",
  Landslide: "#ff8c42",
};

const countryFocusPresets: Record<
  string,
  { coordinates: [number, number]; zoom: number }
> = {
  Kenya: { coordinates: [37.9, 0.2], zoom: 6 },
  Ethiopia: { coordinates: [39.6, 8.7], zoom: 5.8 },
  Tanzania: { coordinates: [34.9, -6.1], zoom: 5.6 },
  "United States of America": { coordinates: [-98.5, 39.5], zoom: 4.2 },
  Philippines: { coordinates: [122, 12.7], zoom: 6.1 },
  India: { coordinates: [79, 22.8], zoom: 5.2 },
  Turkey: { coordinates: [35.2, 39.1], zoom: 5.7 },
  Pakistan: { coordinates: [69.3, 30.1], zoom: 5.6 },
  Chile: { coordinates: [-71.5, -35.8], zoom: 5.2 },
  Japan: { coordinates: [138.5, 37.1], zoom: 5.8 },
  Indonesia: { coordinates: [117.5, -2.4], zoom: 4.8 },
  Iceland: { coordinates: [-18.6, 64.9], zoom: 6.1 },
  Bangladesh: { coordinates: [90.2, 23.7], zoom: 6.3 },
  Peru: { coordinates: [-75, -9.2], zoom: 5.1 },
  China: { coordinates: [104.2, 35.8], zoom: 4.8 },
  "Papua New Guinea": { coordinates: [145.2, -6.6], zoom: 5.4 },
  Vanuatu: { coordinates: [167.9, -16.2], zoom: 6.8 },
  Myanmar: { coordinates: [96, 20.3], zoom: 5.4 },
};

const getDisasterMarkerColor = (type: DisasterType) =>
  disasterTypeColors[type] ?? "#00d4ff";

const getDisasterIcon = (type: DisasterType) => {
  switch (type) {
    case "Earthquake":
      return <Activity size={20} color={disasterTypeColors[type]} />;
    case "Flood":
      return <Droplets size={20} color={disasterTypeColors[type]} />;
    case "Storm":
      return <CloudLightning size={20} color={disasterTypeColors[type]} />;
    case "Volcano":
    case "Wildfire":
      return <Flame size={20} color={disasterTypeColors[type]} />;
    case "Landslide":
      return <AlertTriangle size={20} color={disasterTypeColors[type]} />;
    default:
      return <Activity size={20} color="#ff4757" />;
  }
};

// Risk heatmap data for country fill colors on the globe
const countryRiskMap: Record<string, number> = {
  "Japan": 82, "India": 67, "Philippines": 74, "Indonesia": 71,
  "Chile": 58, "Bangladesh": 63, "Turkey": 55, "Nepal": 60,
  "Pakistan": 62, "China": 45, "Mexico": 50, "Italy": 42,
  "United States of America": 79, "Russia": 30, "Brazil": 48,
  "Australia": 25, "Iran": 52, "Haiti": 70, "Peru": 44,
  "Myanmar": 56, "Colombia": 40, "Afghanistan": 53, "Papua New Guinea": 60,
  "Ecuador": 47, "New Zealand": 38, "Fiji": 45, "Vanuatu": 55,
  "Kenya": 82, "Tanzania": 68, "Ethiopia": 78,
  "Tonga": 50, "Solomon Is.": 48,
};

const getRiskColor = (name: string): string => {
  const risk = countryRiskMap[name];
  if (!risk) return "rgba(0, 212, 255, 0.03)"; // Safe - very faint blue
  if (risk >= 70) return "rgba(255, 71, 87, 0.35)"; // Red - High
  if (risk >= 50) return "rgba(255, 165, 2, 0.25)"; // Orange - Medium  
  if (risk >= 30) return "rgba(255, 220, 80, 0.15)"; // Yellow - Low-Med
  return "rgba(0, 212, 255, 0.08)"; // Blue - Safe
};

// Subdivision type with risk profile
type SubdivisionRisk = {
  name: string;
  coords: [number, number];
  earthquake: number; // 0-100
  flood: number;
  storm: number;
  volcano: number;
};

// Realistic risk data per subdivision — values based on actual geological and climatic patterns
// Most places have LOW or ZERO risk for most categories. Only genuinely hazard-prone areas show elevated values.
const countrySubdivisionsRisk: Record<string, SubdivisionRisk[]> = {
  "India": [
    { name: "Jammu & Kashmir", coords: [74.8, 34.1], earthquake: 72, flood: 18, storm: 5, volcano: 0 },
    { name: "Himachal Pradesh", coords: [77.2, 31.1], earthquake: 58, flood: 22, storm: 3, volcano: 0 },
    { name: "Punjab", coords: [75.3, 31.1], earthquake: 18, flood: 30, storm: 8, volcano: 0 },
    { name: "Haryana", coords: [76.1, 29.1], earthquake: 12, flood: 15, storm: 5, volcano: 0 },
    { name: "Uttarakhand", coords: [79.0, 30.1], earthquake: 68, flood: 55, storm: 4, volcano: 0 },
    { name: "Delhi", coords: [77.1, 28.7], earthquake: 22, flood: 18, storm: 6, volcano: 0 },
    { name: "Rajasthan", coords: [73.7, 27.0], earthquake: 15, flood: 8, storm: 4, volcano: 0 },
    { name: "Uttar Pradesh", coords: [80.9, 27.0], earthquake: 14, flood: 38, storm: 6, volcano: 0 },
    { name: "Bihar", coords: [85.3, 25.6], earthquake: 20, flood: 62, storm: 8, volcano: 0 },
    { name: "Sikkim", coords: [88.5, 27.5], earthquake: 65, flood: 22, storm: 3, volcano: 0 },
    { name: "Arunachal Pradesh", coords: [94.7, 28.2], earthquake: 60, flood: 20, storm: 4, volcano: 0 },
    { name: "Nagaland", coords: [94.5, 26.2], earthquake: 48, flood: 12, storm: 5, volcano: 0 },
    { name: "Manipur", coords: [93.9, 24.8], earthquake: 45, flood: 18, storm: 5, volcano: 0 },
    { name: "Mizoram", coords: [92.7, 23.2], earthquake: 40, flood: 15, storm: 6, volcano: 0 },
    { name: "Tripura", coords: [91.7, 23.9], earthquake: 32, flood: 20, storm: 8, volcano: 0 },
    { name: "Meghalaya", coords: [91.4, 25.5], earthquake: 38, flood: 30, storm: 5, volcano: 0 },
    { name: "Assam", coords: [92.9, 26.2], earthquake: 55, flood: 70, storm: 6, volcano: 0 },
    { name: "West Bengal", coords: [87.8, 22.9], earthquake: 12, flood: 42, storm: 45, volcano: 0 },
    { name: "Jharkhand", coords: [85.3, 23.6], earthquake: 10, flood: 18, storm: 5, volcano: 0 },
    { name: "Odisha", coords: [84.0, 20.9], earthquake: 8, flood: 48, storm: 72, volcano: 0 },
    { name: "Chhattisgarh", coords: [81.9, 21.3], earthquake: 5, flood: 15, storm: 4, volcano: 0 },
    { name: "Madhya Pradesh", coords: [78.6, 23.5], earthquake: 8, flood: 12, storm: 3, volcano: 0 },
    { name: "Gujarat", coords: [71.1, 22.3], earthquake: 65, flood: 25, storm: 38, volcano: 0 },
    { name: "Maharashtra", coords: [75.7, 19.7], earthquake: 18, flood: 35, storm: 22, volcano: 0 },
    { name: "Goa", coords: [74.0, 15.5], earthquake: 8, flood: 20, storm: 12, volcano: 0 },
    { name: "Karnataka", coords: [75.7, 15.3], earthquake: 10, flood: 28, storm: 10, volcano: 0 },
    { name: "Andhra Pradesh", coords: [79.7, 15.9], earthquake: 8, flood: 35, storm: 55, volcano: 0 },
    { name: "Telangana", coords: [79.0, 17.4], earthquake: 5, flood: 22, storm: 8, volcano: 0 },
    { name: "Tamil Nadu", coords: [78.6, 11.1], earthquake: 8, flood: 42, storm: 48, volcano: 0 },
    { name: "Kerala", coords: [76.2, 10.8], earthquake: 5, flood: 68, storm: 15, volcano: 0 },
  ],
  "United States of America": [
    { name: "California", coords: [-119.4, 36.8], earthquake: 82, flood: 18, storm: 5, volcano: 12 },
    { name: "Texas", coords: [-99.9, 31.9], earthquake: 4, flood: 35, storm: 58, volcano: 0 },
    { name: "New York", coords: [-75.0, 43.0], earthquake: 5, flood: 18, storm: 22, volcano: 0 },
    { name: "Florida", coords: [-81.5, 27.6], earthquake: 2, flood: 45, storm: 78, volcano: 0 },
    { name: "Illinois", coords: [-89.3, 40.6], earthquake: 8, flood: 22, storm: 35, volcano: 0 },
    { name: "Washington", coords: [-120.7, 47.7], earthquake: 55, flood: 20, storm: 10, volcano: 45 },
    { name: "Alaska", coords: [-154.5, 63.6], earthquake: 88, flood: 8, storm: 5, volcano: 62 },
    { name: "Hawaii", coords: [-155.5, 19.9], earthquake: 42, flood: 15, storm: 25, volcano: 80 },
    { name: "Oklahoma", coords: [-97.5, 35.5], earthquake: 15, flood: 12, storm: 68, volcano: 0 },
    { name: "Louisiana", coords: [-91.8, 30.5], earthquake: 2, flood: 55, storm: 65, volcano: 0 },
    { name: "Oregon", coords: [-120.6, 44.0], earthquake: 48, flood: 15, storm: 8, volcano: 32 },
    { name: "Montana", coords: [-109.6, 47.0], earthquake: 25, flood: 8, storm: 5, volcano: 10 },
  ],
  "China": [
    { name: "Beijing", coords: [116.4, 39.9], earthquake: 28, flood: 12, storm: 5, volcano: 0 },
    { name: "Shanghai", coords: [121.5, 31.2], earthquake: 5, flood: 30, storm: 38, volcano: 0 },
    { name: "Sichuan", coords: [104.0, 30.6], earthquake: 78, flood: 35, storm: 5, volcano: 0 },
    { name: "Guangdong", coords: [113.3, 23.1], earthquake: 8, flood: 40, storm: 62, volcano: 0 },
    { name: "Yunnan", coords: [102.7, 25.0], earthquake: 65, flood: 25, storm: 5, volcano: 8 },
    { name: "Tibet", coords: [91.1, 29.6], earthquake: 58, flood: 5, storm: 2, volcano: 0 },
    { name: "Fujian", coords: [118.3, 26.1], earthquake: 12, flood: 28, storm: 55, volcano: 0 },
    { name: "Gansu", coords: [103.8, 36.1], earthquake: 52, flood: 10, storm: 3, volcano: 0 },
    { name: "Hebei", coords: [115.5, 38.0], earthquake: 35, flood: 18, storm: 5, volcano: 0 },
  ],
  "Japan": [
    { name: "Tokyo", coords: [139.7, 35.7], earthquake: 82, flood: 22, storm: 35, volcano: 18 },
    { name: "Osaka", coords: [135.5, 34.7], earthquake: 68, flood: 18, storm: 28, volcano: 5 },
    { name: "Hokkaido", coords: [143.2, 43.1], earthquake: 72, flood: 12, storm: 15, volcano: 45 },
    { name: "Kyushu", coords: [131.0, 33.0], earthquake: 55, flood: 30, storm: 48, volcano: 65 },
    { name: "Okinawa", coords: [127.7, 26.3], earthquake: 28, flood: 10, storm: 72, volcano: 0 },
    { name: "Tohoku", coords: [140.5, 39.5], earthquake: 85, flood: 18, storm: 20, volcano: 25 },
    { name: "Shikoku", coords: [133.5, 33.8], earthquake: 55, flood: 25, storm: 42, volcano: 0 },
  ],
  "Indonesia": [
    { name: "Java", coords: [110.4, -7.6], earthquake: 75, flood: 40, storm: 8, volcano: 82 },
    { name: "Sumatra", coords: [101.4, 0.5], earthquake: 82, flood: 35, storm: 5, volcano: 65 },
    { name: "Borneo (Kalimantan)", coords: [114.6, -0.1], earthquake: 8, flood: 45, storm: 5, volcano: 0 },
    { name: "Sulawesi", coords: [121.4, -1.4], earthquake: 68, flood: 25, storm: 5, volcano: 30 },
    { name: "Papua", coords: [138.5, -4.3], earthquake: 55, flood: 28, storm: 5, volcano: 18 },
    { name: "Bali", coords: [115.2, -8.4], earthquake: 45, flood: 15, storm: 5, volcano: 58 },
    { name: "Nusa Tenggara", coords: [120.0, -9.0], earthquake: 48, flood: 18, storm: 8, volcano: 42 },
  ],
  "Philippines": [
    { name: "Metro Manila", coords: [121.0, 14.6], earthquake: 52, flood: 58, storm: 72, volcano: 12 },
    { name: "Cebu", coords: [123.9, 10.3], earthquake: 38, flood: 22, storm: 55, volcano: 5 },
    { name: "Mindanao", coords: [126.0, 7.5], earthquake: 48, flood: 30, storm: 35, volcano: 22 },
    { name: "Visayas", coords: [123.0, 11.0], earthquake: 42, flood: 28, storm: 68, volcano: 8 },
    { name: "Bicol", coords: [123.7, 13.1], earthquake: 30, flood: 35, storm: 78, volcano: 55 },
    { name: "Negros", coords: [123.0, 9.9], earthquake: 25, flood: 18, storm: 45, volcano: 48 },
  ],
  "Turkey": [
    { name: "Istanbul", coords: [29.0, 41.0], earthquake: 78, flood: 12, storm: 8, volcano: 0 },
    { name: "Ankara", coords: [32.9, 39.9], earthquake: 45, flood: 8, storm: 5, volcano: 0 },
    { name: "Eastern Anatolia", coords: [40.0, 39.5], earthquake: 82, flood: 15, storm: 5, volcano: 12 },
    { name: "Hatay", coords: [36.2, 36.4], earthquake: 88, flood: 10, storm: 5, volcano: 0 },
    { name: "Izmir", coords: [27.1, 38.4], earthquake: 62, flood: 12, storm: 8, volcano: 0 },
    { name: "Mediterranean Coast", coords: [32.0, 36.5], earthquake: 35, flood: 15, storm: 12, volcano: 0 },
  ],
  "Pakistan": [
    { name: "Sindh", coords: [68.8, 26.0], earthquake: 12, flood: 72, storm: 32, volcano: 0 },
    { name: "Punjab", coords: [72.3, 31.5], earthquake: 18, flood: 55, storm: 10, volcano: 0 },
    { name: "Balochistan", coords: [66.5, 28.0], earthquake: 65, flood: 28, storm: 18, volcano: 5 },
    { name: "KPK", coords: [71.8, 34.0], earthquake: 72, flood: 40, storm: 5, volcano: 0 },
    { name: "Islamabad", coords: [73.0, 33.7], earthquake: 55, flood: 12, storm: 5, volcano: 0 },
    { name: "Gilgit-Baltistan", coords: [75.5, 35.8], earthquake: 68, flood: 22, storm: 2, volcano: 0 },
  ],
  "Bangladesh": [
    { name: "Dhaka", coords: [90.4, 23.8], earthquake: 18, flood: 65, storm: 35, volcano: 0 },
    { name: "Chittagong", coords: [91.8, 22.4], earthquake: 22, flood: 55, storm: 68, volcano: 0 },
    { name: "Sylhet", coords: [91.9, 24.9], earthquake: 35, flood: 72, storm: 18, volcano: 0 },
    { name: "Khulna", coords: [89.6, 22.8], earthquake: 5, flood: 78, storm: 55, volcano: 0 },
    { name: "Rajshahi", coords: [88.6, 24.4], earthquake: 12, flood: 40, storm: 12, volcano: 0 },
    { name: "Barisal", coords: [90.4, 22.7], earthquake: 5, flood: 70, storm: 62, volcano: 0 },
  ],
  "Nepal": [
    { name: "Kathmandu", coords: [85.3, 27.7], earthquake: 82, flood: 18, storm: 3, volcano: 0 },
    { name: "Pokhara", coords: [83.9, 28.2], earthquake: 65, flood: 25, storm: 2, volcano: 0 },
    { name: "Biratnagar", coords: [87.3, 26.5], earthquake: 48, flood: 42, storm: 5, volcano: 0 },
    { name: "Bharatpur", coords: [84.4, 27.7], earthquake: 42, flood: 35, storm: 3, volcano: 0 },
  ],
  "Mexico": [
    { name: "Mexico City", coords: [-99.1, 19.4], earthquake: 72, flood: 18, storm: 5, volcano: 35 },
    { name: "Jalisco", coords: [-103.3, 20.7], earthquake: 55, flood: 15, storm: 30, volcano: 15 },
    { name: "Oaxaca", coords: [-96.7, 17.1], earthquake: 68, flood: 22, storm: 35, volcano: 0 },
    { name: "Chiapas", coords: [-92.6, 16.8], earthquake: 58, flood: 28, storm: 25, volcano: 18 },
    { name: "Guerrero", coords: [-99.5, 17.5], earthquake: 72, flood: 20, storm: 38, volcano: 0 },
    { name: "Puebla", coords: [-98.2, 19.0], earthquake: 55, flood: 12, storm: 5, volcano: 45 },
  ],
  "Chile": [
    { name: "Santiago", coords: [-70.6, -33.4], earthquake: 78, flood: 10, storm: 5, volcano: 15 },
    { name: "Valparaíso", coords: [-71.6, -33.0], earthquake: 72, flood: 12, storm: 8, volcano: 8 },
    { name: "Atacama", coords: [-70.3, -27.4], earthquake: 55, flood: 5, storm: 2, volcano: 0 },
    { name: "Patagonia", coords: [-72.0, -47.0], earthquake: 30, flood: 8, storm: 12, volcano: 35 },
    { name: "Biobío", coords: [-73.0, -37.0], earthquake: 68, flood: 18, storm: 8, volcano: 25 },
  ],
  "Italy": [
    { name: "Rome (Lazio)", coords: [12.5, 41.9], earthquake: 35, flood: 12, storm: 5, volcano: 5 },
    { name: "Sicily", coords: [14.2, 37.6], earthquake: 55, flood: 10, storm: 12, volcano: 65 },
    { name: "Naples (Campania)", coords: [14.3, 40.9], earthquake: 48, flood: 15, storm: 8, volcano: 72 },
    { name: "Milan (Lombardy)", coords: [9.2, 45.5], earthquake: 12, flood: 22, storm: 8, volcano: 0 },
    { name: "L'Aquila (Abruzzo)", coords: [13.4, 42.4], earthquake: 72, flood: 10, storm: 5, volcano: 0 },
  ],
  "Brazil": [
    { name: "São Paulo", coords: [-46.6, -23.5], earthquake: 2, flood: 38, storm: 15, volcano: 0 },
    { name: "Rio de Janeiro", coords: [-43.2, -22.9], earthquake: 2, flood: 42, storm: 12, volcano: 0 },
    { name: "Amazonas", coords: [-64.0, -3.1], earthquake: 0, flood: 55, storm: 5, volcano: 0 },
    { name: "Bahia", coords: [-41.7, -12.9], earthquake: 2, flood: 28, storm: 8, volcano: 0 },
    { name: "Minas Gerais", coords: [-44.0, -19.9], earthquake: 3, flood: 32, storm: 5, volcano: 0 },
    { name: "Santa Catarina", coords: [-49.4, -27.6], earthquake: 2, flood: 35, storm: 22, volcano: 0 },
  ],
  "Russia": [
    { name: "Moscow", coords: [37.6, 55.8], earthquake: 2, flood: 10, storm: 5, volcano: 0 },
    { name: "St. Petersburg", coords: [30.3, 59.9], earthquake: 2, flood: 15, storm: 8, volcano: 0 },
    { name: "Siberia", coords: [90.0, 60.0], earthquake: 12, flood: 8, storm: 5, volcano: 0 },
    { name: "Kamchatka", coords: [160.0, 56.0], earthquake: 85, flood: 5, storm: 8, volcano: 88 },
    { name: "Caucasus", coords: [44.0, 43.0], earthquake: 55, flood: 15, storm: 5, volcano: 12 },
    { name: "Sakhalin", coords: [143.0, 50.5], earthquake: 62, flood: 10, storm: 15, volcano: 18 },
  ],
  "Australia": [
    { name: "New South Wales", coords: [151.2, -33.9], earthquake: 5, flood: 28, storm: 15, volcano: 0 },
    { name: "Queensland", coords: [153.0, -27.5], earthquake: 3, flood: 42, storm: 55, volcano: 0 },
    { name: "Victoria", coords: [144.9, -37.8], earthquake: 8, flood: 18, storm: 8, volcano: 0 },
    { name: "Western Australia", coords: [115.9, -31.9], earthquake: 5, flood: 5, storm: 15, volcano: 0 },
    { name: "Northern Territory", coords: [130.8, -12.5], earthquake: 3, flood: 25, storm: 48, volcano: 0 },
    { name: "South Australia", coords: [138.6, -34.9], earthquake: 5, flood: 8, storm: 5, volcano: 0 },
  ],
  "Kenya": [
    { name: "Nairobi", coords: [36.82, -1.29], earthquake: 8, flood: 35, storm: 5, volcano: 0 },
    { name: "Mombasa", coords: [39.67, -4.04], earthquake: 5, flood: 42, storm: 12, volcano: 0 },
    { name: "Kisumu", coords: [34.75, -0.09], earthquake: 12, flood: 48, storm: 5, volcano: 0 },
    { name: "Garissa", coords: [39.65, -0.46], earthquake: 3, flood: 55, storm: 2, volcano: 0 },
    { name: "Rift Valley", coords: [36.1, 0.5], earthquake: 25, flood: 20, storm: 3, volcano: 8 },
  ],
  "Ethiopia": [
    { name: "Addis Ababa", coords: [38.76, 8.98], earthquake: 15, flood: 22, storm: 3, volcano: 5 },
    { name: "Mekelle", coords: [39.48, 13.5], earthquake: 12, flood: 15, storm: 2, volcano: 0 },
    { name: "Dire Dawa", coords: [41.87, 9.6], earthquake: 18, flood: 28, storm: 3, volcano: 0 },
    { name: "Wolaita", coords: [37.8, 6.9], earthquake: 10, flood: 42, storm: 5, volcano: 0 },
    { name: "Afar", coords: [41.0, 11.5], earthquake: 35, flood: 5, storm: 2, volcano: 42 },
  ],
  "Tanzania": [
    { name: "Dar es Salaam", coords: [39.28, -6.8], earthquake: 8, flood: 38, storm: 12, volcano: 0 },
    { name: "Dodoma", coords: [35.75, -6.17], earthquake: 5, flood: 18, storm: 3, volcano: 0 },
    { name: "Mbeya", coords: [33.46, -8.91], earthquake: 15, flood: 25, storm: 5, volcano: 8 },
    { name: "Mwanza", coords: [32.9, -2.52], earthquake: 8, flood: 22, storm: 3, volcano: 0 },
    { name: "Arusha", coords: [36.68, -3.37], earthquake: 12, flood: 10, storm: 3, volcano: 18 },
  ],
  "Iceland": [
    { name: "Reykjavik", coords: [-21.9, 64.1], earthquake: 55, flood: 5, storm: 18, volcano: 42 },
    { name: "Grindavík", coords: [-22.4, 63.8], earthquake: 72, flood: 5, storm: 12, volcano: 82 },
    { name: "Akureyri", coords: [-18.1, 65.7], earthquake: 25, flood: 5, storm: 15, volcano: 18 },
    { name: "Vatnajökull", coords: [-17.0, 64.4], earthquake: 45, flood: 25, storm: 10, volcano: 65 },
  ],
  "Peru": [
    { name: "Lima", coords: [-77.0, -12.0], earthquake: 72, flood: 10, storm: 2, volcano: 0 },
    { name: "Arequipa", coords: [-71.5, -16.4], earthquake: 65, flood: 8, storm: 2, volcano: 48 },
    { name: "Cusco", coords: [-72.0, -13.5], earthquake: 45, flood: 15, storm: 2, volcano: 5 },
    { name: "Ancash", coords: [-77.5, -9.5], earthquake: 68, flood: 22, storm: 2, volcano: 0 },
  ],
  "Colombia": [
    { name: "Bogotá", coords: [-74.1, 4.6], earthquake: 42, flood: 15, storm: 5, volcano: 8 },
    { name: "Medellín", coords: [-75.6, 6.2], earthquake: 28, flood: 22, storm: 5, volcano: 5 },
    { name: "Pasto", coords: [-77.3, 1.2], earthquake: 48, flood: 12, storm: 3, volcano: 55 },
    { name: "Cali", coords: [-76.5, 3.4], earthquake: 45, flood: 18, storm: 5, volcano: 5 },
  ],
  "New Zealand": [
    { name: "Auckland", coords: [174.8, -36.8], earthquake: 18, flood: 15, storm: 12, volcano: 28 },
    { name: "Wellington", coords: [174.8, -41.3], earthquake: 72, flood: 10, storm: 18, volcano: 8 },
    { name: "Canterbury", coords: [172.6, -43.5], earthquake: 65, flood: 12, storm: 8, volcano: 0 },
    { name: "Rotorua", coords: [176.2, -38.1], earthquake: 35, flood: 8, storm: 5, volcano: 55 },
  ],
};

// Helper: get max risk for a subdivision
const getMaxRisk = (sub: SubdivisionRisk): number =>
  Math.max(sub.earthquake, sub.flood, sub.storm, sub.volcano);

// Helper: determine if a subdivision is a "red zone" (any single risk >= 65)
const isRedZone = (sub: SubdivisionRisk): boolean => getMaxRisk(sub) >= 65;

const disasterData: Record<number, DisasterEvent[]> = {
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
    {
      type: "Flood",
      name: "East Pakistan Floods",
      place: "Bangladesh",
      lat: 23.7,
      lon: 90.4,
      severity: 69,
      magnitude: "Monsoon flooding",
      fatalities: "Hundreds affected",
      loss: "Delta inundation",
    },
    {
      type: "Storm",
      name: "Hurricane Donna",
      place: "United States of America",
      lat: 24.5,
      lon: -81.8,
      severity: 74,
      magnitude: "Category 4 landfalls",
      fatalities: "364 dead",
      loss: "$900M damage",
    },
    {
      type: "Volcano",
      name: "Kilauea Eruption",
      place: "United States of America",
      lat: 19.42,
      lon: -155.29,
      severity: 61,
      magnitude: "Kapoho eruption",
      fatalities: "No mass casualty event",
      loss: "Communities buried by lava",
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
    {
      type: "Flood",
      name: "Northwest Flood",
      place: "United States of America",
      lat: 45.6,
      lon: -122.7,
      severity: 72,
      magnitude: "Christmas flood",
      fatalities: "47+ dead",
      loss: "$157M damage",
    },
    {
      type: "Storm",
      name: "Hurricane Dora",
      place: "United States of America",
      lat: 30.3,
      lon: -81.7,
      severity: 67,
      magnitude: "Category 2",
      fatalities: "5 dead",
      loss: "$250M damage",
    },
    {
      type: "Volcano",
      name: "Shiveluch Eruption",
      place: "Russia",
      lat: 56.65,
      lon: 161.36,
      severity: 64,
      magnitude: "Major explosive eruption",
      fatalities: "Remote impact",
      loss: "Heavy ashfall in Kamchatka",
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
    {
      type: "Earthquake",
      name: "Ancash Earthquake",
      place: "Peru",
      lat: -9.2,
      lon: -78.8,
      severity: 90,
      magnitude: "7.9 Mw",
      fatalities: "66,000+ dead",
      loss: "Yungay destroyed",
    },
    {
      type: "Storm",
      name: "Bhola Cyclone",
      place: "Bangladesh",
      lat: 22.1,
      lon: 90.0,
      severity: 94,
      magnitude: "Category 3 equivalent",
      fatalities: "Historic cyclone disaster",
      loss: "Coastal communities wiped out",
    },
    {
      type: "Volcano",
      name: "Hekla Eruption",
      place: "Iceland",
      lat: 63.98,
      lon: -19.7,
      severity: 58,
      magnitude: "Large fissure eruption",
      fatalities: "No major fatalities",
      loss: "Ashfall and lava fields",
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
    {
      type: "Earthquake",
      name: "Haicheng Earthquake",
      place: "China",
      lat: 40.65,
      lon: 122.8,
      severity: 77,
      magnitude: "7.3 Mw",
      fatalities: "2,000+ dead",
      loss: "Urban damage",
    },
    {
      type: "Storm",
      name: "Typhoon Nina",
      place: "China",
      lat: 25.8,
      lon: 114.5,
      severity: 84,
      magnitude: "Typhoon rainfall catastrophe",
      fatalities: "Linked to dam failures",
      loss: "Severe central China impact",
    },
    {
      type: "Volcano",
      name: "Tolbachik Eruption",
      place: "Russia",
      lat: 55.83,
      lon: 160.33,
      severity: 62,
      magnitude: "Long fissure eruption",
      fatalities: "Remote impact",
      loss: "Ash and lava over Kamchatka",
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
    {
      type: "Flood",
      name: "Haiti Floods",
      place: "Haiti",
      lat: 19.0,
      lon: -72.3,
      severity: 74,
      magnitude: "Tropical flood disaster",
      fatalities: "3,000+ dead",
      loss: "Gonaives heavily damaged",
    },
    {
      type: "Storm",
      name: "Hurricane Ivan",
      place: "United States of America",
      lat: 30.4,
      lon: -87.2,
      severity: 82,
      magnitude: "Category 5 peak",
      fatalities: "92 dead",
      loss: "$26B damage",
    },
    {
      type: "Volcano",
      name: "Manam Eruption",
      place: "Papua New Guinea",
      lat: -4.08,
      lon: 145.04,
      severity: 63,
      magnitude: "Explosive eruption",
      fatalities: "Evacuations triggered",
      loss: "Island settlements impacted",
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
    {
      type: "Flood",
      name: "Kosi Floods",
      place: "India",
      lat: 26.0,
      lon: 87.2,
      severity: 81,
      magnitude: "River avulsion flooding",
      fatalities: "500+ dead",
      loss: "3M+ affected",
    },
    {
      type: "Storm",
      name: "Cyclone Nargis",
      place: "Myanmar",
      lat: 16.8,
      lon: 95.7,
      severity: 94,
      magnitude: "Category 4 equivalent",
      fatalities: "138,000+ dead",
      loss: "$10B damage",
    },
    {
      type: "Volcano",
      name: "Chaiten Eruption",
      place: "Chile",
      lat: -42.83,
      lon: -72.65,
      severity: 65,
      magnitude: "Major rhyolitic eruption",
      fatalities: "Mass evacuation",
      loss: "Town buried in ash",
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
    {
      type: "Flood",
      name: "Pakistan Floods",
      place: "Pakistan",
      lat: 30.4,
      lon: 71.5,
      severity: 91,
      magnitude: "Indus super flood",
      fatalities: "1,985 dead",
      loss: "20M affected",
    },
    {
      type: "Storm",
      name: "Cyclone Phet",
      place: "Pakistan",
      lat: 24.9,
      lon: 66.9,
      severity: 68,
      magnitude: "Very severe cyclonic storm",
      fatalities: "44 dead",
      loss: "Arabian Sea landfall impacts",
    },
    {
      type: "Volcano",
      name: "Eyjafjallajokull Eruption",
      place: "Iceland",
      lat: 63.63,
      lon: -19.62,
      severity: 70,
      magnitude: "Ash plume disrupted Europe",
      fatalities: "No major fatalities",
      loss: "Aviation shutdown",
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
    {
      type: "Flood",
      name: "Thailand Floods",
      place: "Thailand",
      lat: 14.0,
      lon: 100.6,
      severity: 82,
      magnitude: "Monsoon flooding",
      fatalities: "815 dead",
      loss: "$45B damage",
    },
    {
      type: "Storm",
      name: "Tropical Storm Washi",
      place: "Philippines",
      lat: 8.5,
      lon: 124.6,
      severity: 73,
      magnitude: "Deadly tropical storm",
      fatalities: "1,268 dead",
      loss: "Northern Mindanao devastation",
    },
    {
      type: "Volcano",
      name: "Puyehue-Cordon Caulle",
      place: "Chile",
      lat: -40.59,
      lon: -72.12,
      severity: 61,
      magnitude: "Explosive ash eruption",
      fatalities: "Regional disruption",
      loss: "Flights cancelled across South America",
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
    {
      type: "Earthquake",
      name: "Bohol Earthquake",
      place: "Philippines",
      lat: 9.88,
      lon: 124.1,
      severity: 71,
      magnitude: "7.2 Mw",
      fatalities: "222 dead",
      loss: "Historic churches damaged",
    },
    {
      type: "Storm",
      name: "Typhoon Haiyan",
      place: "Philippines",
      lat: 11.0,
      lon: 125.0,
      severity: 97,
      magnitude: "Category 5 super typhoon",
      fatalities: "6,300+ dead",
      loss: "$5.8B damage",
    },
    {
      type: "Volcano",
      name: "Sinabung Eruption",
      place: "Indonesia",
      lat: 3.17,
      lon: 98.39,
      severity: 62,
      magnitude: "Renewed explosive activity",
      fatalities: "Evacuations triggered",
      loss: "Villages repeatedly evacuated",
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
    {
      type: "Flood",
      name: "Chennai Floods",
      place: "India",
      lat: 13.08,
      lon: 80.27,
      severity: 76,
      magnitude: "Urban flood crisis",
      fatalities: "470+ dead",
      loss: "$3B damage",
    },
    {
      type: "Storm",
      name: "Cyclone Pam",
      place: "Vanuatu",
      lat: -17.75,
      lon: 168.3,
      severity: 83,
      magnitude: "Category 5 tropical cyclone",
      fatalities: "24 dead",
      loss: "Severe national destruction",
    },
    {
      type: "Volcano",
      name: "Calbuco Eruption",
      place: "Chile",
      lat: -41.33,
      lon: -72.62,
      severity: 64,
      magnitude: "Explosive eruption",
      fatalities: "Large evacuations",
      loss: "Ash cloud across Andes",
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
    {
      type: "Flood",
      name: "Kerala Floods",
      place: "India",
      lat: 10.85,
      lon: 76.27,
      severity: 78,
      magnitude: "Extreme monsoon flooding",
      fatalities: "483 dead",
      loss: "$5B+ damage",
    },
    {
      type: "Storm",
      name: "Hurricane Michael",
      place: "United States of America",
      lat: 30.1,
      lon: -85.7,
      severity: 81,
      magnitude: "Category 5 landfall",
      fatalities: "74 dead",
      loss: "$25B damage",
    },
    {
      type: "Volcano",
      name: "Kilauea Lower East Rift",
      place: "United States of America",
      lat: 19.45,
      lon: -154.95,
      severity: 69,
      magnitude: "Large lava eruption",
      fatalities: "No direct fatalities",
      loss: "700+ homes destroyed",
    },
  ],
  2022: [
    {
      type: "Earthquake",
      name: "Afghanistan Earthquake",
      place: "Afghanistan",
      lat: 33.09,
      lon: 69.51,
      severity: 73,
      magnitude: "5.9 Mw",
      fatalities: "1,100+ dead",
      loss: "Remote villages destroyed",
    },
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
    {
      type: "Storm",
      name: "Hurricane Ian",
      place: "United States of America",
      lat: 26.64,
      lon: -81.87,
      severity: 88,
      magnitude: "Category 4 landfall",
      fatalities: "150+ dead",
      loss: "$112B damage",
    },
    {
      type: "Volcano",
      name: "Mauna Loa Eruption",
      place: "United States of America",
      lat: 19.47,
      lon: -155.6,
      severity: 60,
      magnitude: "Summit eruption resumed",
      fatalities: "No fatalities",
      loss: "Highway threats and lava flows",
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
    {
      type: "Flood",
      name: "Derna Flood Disaster",
      place: "Libya",
      lat: 32.77,
      lon: 22.64,
      severity: 89,
      magnitude: "Dam-break flood",
      fatalities: "4,300+ dead",
      loss: "Entire districts destroyed",
    },
    {
      type: "Storm",
      name: "Cyclone Mocha",
      place: "Bangladesh",
      lat: 21.43,
      lon: 92.0,
      severity: 77,
      magnitude: "Very severe cyclonic storm",
      fatalities: "High coastal impact",
      loss: "Rakhine and Cox's Bazar damage",
    },
    {
      type: "Volcano",
      name: "Reykjanes Eruption",
      place: "Iceland",
      lat: 63.88,
      lon: -22.27,
      severity: 63,
      magnitude: "Fissure eruption",
      fatalities: "No major fatalities",
      loss: "Evacuations near Grindavik",
    },
  ],
  2026: [
    {
      type: "Earthquake",
      name: "Taiwan Offshore Earthquake",
      place: "Taiwan",
      lat: 23.9,
      lon: 121.2,
      severity: 64,
      magnitude: "Strong regional quake",
      fatalities: "Limited confirmed casualties",
      loss: "Localized transport disruption",
    },
    {
      type: "Flood",
      name: "Kenya Flood Crisis",
      place: "Kenya",
      lat: -1.286,
      lon: 36.817,
      severity: 84,
      magnitude: "Rivers overflowed after seasonal rain",
      fatalities: "88+ dead",
      loss: "34,000 displaced",
    },
    {
      type: "Landslide",
      name: "Tanzania Rain Landslides",
      place: "Tanzania",
      lat: -8.9,
      lon: 33.45,
      severity: 68,
      magnitude: "Slope failure after heavy rain",
      fatalities: "20+ dead",
      loss: "Mbeya region affected",
    },
    {
      type: "Landslide",
      name: "Ethiopia Landslide Disaster",
      place: "Ethiopia",
      lat: 6.25,
      lon: 37.55,
      severity: 81,
      magnitude: "Landslides and flooding in south",
      fatalities: "Around 80 dead",
      loss: "3,400+ displaced",
    },
    {
      type: "Wildfire",
      name: "Nebraska Megafire",
      place: "United States of America",
      lat: 41.72,
      lon: -103.77,
      severity: 86,
      magnitude: "600,000+ acres burned",
      fatalities: "1+ dead",
      loss: "Multiple counties damaged",
    },
    {
      type: "Flood",
      name: "Hawaii Kona Storm Flooding",
      place: "United States of America",
      lat: 19.64,
      lon: -155.99,
      severity: 79,
      magnitude: "200 rescues and major flooding",
      fatalities: "No statewide total confirmed",
      loss: "$1B estimated damage",
    },
    {
      type: "Volcano",
      name: "Kanlaon Eruption",
      place: "Philippines",
      lat: 10.41,
      lon: 123.13,
      severity: 72,
      magnitude: "Ash plume rose about 5 km",
      fatalities: "No deaths reported",
      loss: "Schools closed in Negros",
    },
    {
      type: "Storm",
      name: "U.S. Tornado Outbreak",
      place: "United States of America",
      lat: 41.9,
      lon: -85.0,
      severity: 78,
      magnitude: "30+ confirmed tornadoes",
      fatalities: "Deadly impacts in MI and OK",
      loss: "Multi-state structural damage",
    },
  ],
};

const years = Object.keys(disasterData).map(Number).sort();
const hazardEventTypes = new Set<HazardEventType>([
  "Earthquake",
  "Flood",
  "Storm",
  "Volcano",
]);

const historicalHazardEvents: HazardEvent[] = Object.values(disasterData).flatMap((events) =>
  events.flatMap((event) =>
    hazardEventTypes.has(event.type as HazardEventType)
      ? [
          {
            type: event.type as HazardEventType,
            country: event.place,
            lat: event.lat,
            lon: event.lon,
            severity: event.severity,
          },
        ]
      : [],
  ),
);

const PIE_COLORS = ["#ff4757", "#00d4ff"];

type WorldMapGeography = {
  properties: { name: string };
} & Record<string, unknown>;

const getRegionalFillColor = (feature: RegionalBoundaryFeature, isHovered: boolean) => {
  if (isHovered) {
    return feature.risk.redZone ? "rgba(255, 92, 108, 0.5)" : "rgba(0, 212, 255, 0.28)";
  }
  if (feature.risk.redZone) return "rgba(255, 92, 108, 0.28)";
  if (feature.risk.overall >= 42) return "rgba(255, 165, 2, 0.18)";
  if (feature.risk.overall >= 18) return "rgba(0, 212, 255, 0.1)";
  return "rgba(255, 255, 255, 0.025)";
};

const getRegionalStrokeColor = (feature: RegionalBoundaryFeature, isHovered: boolean) => {
  if (isHovered) {
    return feature.risk.redZone ? "#ff808d" : "#36dafd";
  }
  if (feature.risk.redZone) return "rgba(255, 92, 108, 0.78)";
  if (feature.risk.overall >= 42) return "rgba(255, 186, 59, 0.55)";
  return "rgba(0, 212, 255, 0.22)";
};

const fallbackSearchableCountries = Object.keys(countryFocusPresets).sort((a, b) =>
  a.localeCompare(b),
);

const riskMetricMeta: Record<RiskMetricKey, { label: string; color: string }> = {
  earthquake: { label: "Earthquake Risk", color: "#ff5c6c" },
  flood: { label: "Flood Risk", color: "#00d4ff" },
  storm: { label: "Storm Risk", color: "#ffa502" },
  volcano: { label: "Volcano Risk", color: "#ff8f5e" },
};

function App() {
  const { data: liveSummary } = useLiveSummary();
  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== "undefined" ? window.innerWidth <= 900 : false,
  );
  const [activeYear, setActiveYear] = useState<number>(2026);
  const [activePage, setActivePage] = useState<
    | "home"
    | "telemetry"
    | "hydrology"
    | "seismic"
    | "volcano"
    | "storm"
    | "chat"
  >("home");
  const [hoveredMapArea, setHoveredMapArea] = useState<{
    name: string;
    x: number;
    y: number;
  } | null>(null);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [isStormDetailedViewOpen, setIsStormDetailedViewOpen] = useState(false);
  const [position, setPosition] = useState({
    coordinates: [0, 20] as [number, number],
    zoom: 1,
  });
  const [districts, setDistricts] = useState<SubdivisionRisk[]>([]);
  const [adm1Overlay, setAdm1Overlay] = useState<Adm1Overlay | null>(null);
  const [isAdm1Loading, setIsAdm1Loading] = useState(false);
  const [adm1Error, setAdm1Error] = useState<string | null>(null);
  const [hoveredDistrict, setHoveredDistrict] = useState<{
    district: RegionalBoundaryFeature;
    x: number;
    y: number;
  } | null>(null);

  const [time, setTime] = useState(new Date());
  const [reportCollapsed, setReportCollapsed] = useState(false);
  const [selectedReportIndex, setSelectedReportIndex] = useState(0);
  const [reportPos, setReportPos] = useState({ x: 20, y: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [searchableCountries, setSearchableCountries] = useState<string[]>(
    fallbackSearchableCountries,
  );
  const [isUiLoading, setIsUiLoading] = useState(true);
  const dragOffset = useRef({ x: 0, y: 0 });
  const worldGeographiesRef = useRef<WorldMapGeography[]>([]);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncViewport = () => setIsMobile(window.innerWidth <= 900);
    syncViewport();
    window.addEventListener("resize", syncViewport);
    return () => window.removeEventListener("resize", syncViewport);
  }, []);

  useEffect(() => {
    setSelectedReportIndex(0);
  }, [activeYear]);

  useEffect(() => {
    setIsUiLoading(true);
    const timer = window.setTimeout(() => setIsUiLoading(false), 850);
    return () => window.clearTimeout(timer);
  }, [activePage, activeYear, selectedCountry]);

  useEffect(() => {
    let isActive = true;

    loadBoundaryCatalog()
      .then((catalog) => {
        if (!isActive) {
          return;
        }

        const allCountries = [...new Set([...fallbackSearchableCountries, ...catalog.map((entry) => entry.boundaryName)])]
          .sort((left, right) => left.localeCompare(right));
        setSearchableCountries(allCountries);
      })
      .catch(() => {
        if (isActive) {
          setSearchableCountries(fallbackSearchableCountries);
        }
      });

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    let isActive = true;

    if (!selectedCountry) {
      setAdm1Overlay(null);
      setAdm1Error(null);
      setIsAdm1Loading(false);
      setHoveredDistrict(null);
      return () => {
        isActive = false;
      };
    }

    setIsAdm1Loading(true);
    setAdm1Error(null);
    setHoveredDistrict(null);

    const liveRiskEvents: HazardEvent[] = [
      ...(liveSummary?.events || []),
      ...(liveSummary?.history_events || []),
    ].flatMap((event) =>
      hazardEventTypes.has(event.type as HazardEventType)
        ? [
            {
              type: event.type as HazardEventType,
              country: event.country || event.place,
              lat: event.lat,
              lon: event.lon,
              severity: event.severity,
            },
          ]
        : [],
    );

    loadAdm1Overlay({
      countryName: selectedCountry,
      events: [...historicalHazardEvents, ...liveRiskEvents],
      liveSummary,
    })
      .then((overlay) => {
        if (!isActive) {
          return;
        }
        setAdm1Overlay(overlay);
        if (!overlay) {
          setAdm1Error("Verified regional boundaries unavailable for this country.");
        }
      })
      .catch((error: unknown) => {
        if (!isActive) {
          return;
        }
        setAdm1Overlay(null);
        setAdm1Error(error instanceof Error ? error.message : "Regional map sync failed");
      })
      .finally(() => {
        if (isActive) {
          setIsAdm1Loading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [selectedCountry, liveSummary]);

  const liveCountryRiskMap = Object.fromEntries(
    (liveSummary?.top_countries || []).map((country) => [country.country, country.risk]),
  ) as Record<string, number>;
  const activeEvents =
    activeYear === 2026 && liveSummary?.history_events?.length
      ? liveSummary.history_events
      : disasterData[activeYear] || [];
  const getCountryFillColor = (countryName: string) => {
    const liveRisk = liveCountryRiskMap[countryName];
    if (typeof liveRisk === "number") {
      if (liveRisk >= 70) return "rgba(255, 71, 87, 0.35)";
      if (liveRisk >= 50) return "rgba(255, 165, 2, 0.25)";
      if (liveRisk >= 30) return "rgba(255, 220, 80, 0.15)";
      return "rgba(0, 212, 255, 0.08)";
    }
    return getRiskColor(countryName);
  };
  const activeReport =
    activeEvents[Math.min(selectedReportIndex, Math.max(activeEvents.length - 1, 0))] ??
    null;
  const isMobileHomeIdle = isMobile && activePage === "home" && !selectedCountry;
  const countrySuggestions = (countrySearch.trim()
    ? searchableCountries.filter((country) =>
        country.toLowerCase().includes(countrySearch.trim().toLowerCase()),
      )
    : searchableCountries
  ).slice(0, 6);
  const regionalFeatureCollection = adm1Overlay
    ? {
        type: "FeatureCollection" as const,
        features: adm1Overlay.features,
      }
    : null;
  const redZoneCount = adm1Overlay?.features.filter((feature) => feature.risk.redZone).length ?? 0;
  const elevatedZoneCount =
    adm1Overlay?.features.filter(
      (feature) => !feature.risk.redZone && feature.risk.overall >= 42,
    ).length ?? 0;
  const shouldShowRegionalLabels =
    activePage === "home" &&
    position.zoom >= 3.8 &&
    Boolean(adm1Overlay?.features.length && adm1Overlay.features.length <= 70);

  const applyCountrySelection = useCallback(
    (
      countryName: string,
      coordinates: [number, number],
      zoom: number,
      dx = 12,
      dy = 8,
    ) => {
      setPosition({ coordinates, zoom });
      setSelectedCountry(countryName);
      setAdm1Overlay(null);
      setAdm1Error(null);
      setHoveredDistrict(null);

      const realSubs = countrySubdivisionsRisk[countryName];
      if (realSubs) {
        setDistricts(realSubs);
        return;
      }

      // Fallback for countries without detailed data — show sectors with zero risk
      setDistricts([
        {
          name: "North Sector",
          coords: [coordinates[0], coordinates[1] + dy * 0.2] as [number, number],
          earthquake: 0, flood: 0, storm: 0, volcano: 0,
        },
        {
          name: "South Sector",
          coords: [coordinates[0], coordinates[1] - dy * 0.2] as [number, number],
          earthquake: 0, flood: 0, storm: 0, volcano: 0,
        },
        {
          name: "East Sector",
          coords: [coordinates[0] + dx * 0.2, coordinates[1]] as [number, number],
          earthquake: 0, flood: 0, storm: 0, volcano: 0,
        },
        {
          name: "West Sector",
          coords: [coordinates[0] - dx * 0.2, coordinates[1]] as [number, number],
          earthquake: 0, flood: 0, storm: 0, volcano: 0,
        },
      ]);
    },
    [],
  );

  const focusWorldMapGeography = useCallback(
    (geo: WorldMapGeography) => {
      const centroid = geoCentroid(geo as never);
      const bounds = geoBounds(geo as never);
      const dx = bounds[1][0] - bounds[0][0];
      const dy = bounds[1][1] - bounds[0][1];
      const zoom = Math.min(Math.max((360 / Math.max(dx, dy)) * 0.7, 3), 12);

      applyCountrySelection(
        geo.properties.name,
        centroid as [number, number],
        zoom,
        dx,
        dy,
      );
    },
    [applyCountrySelection],
  );

  const focusCountryFromSidebar = useCallback(
    (countryName: string) => {
      const matchedGeography = worldGeographiesRef.current.find((geo) =>
        countryNamesMatch(geo.properties.name, countryName),
      );

      if (matchedGeography) {
        setActivePage("home");
        focusWorldMapGeography(matchedGeography);
        return;
      }

      const preset = countryFocusPresets[countryName];
      if (preset) {
        setActivePage("home");
        applyCountrySelection(countryName, preset.coordinates, preset.zoom);
      }
    },
    [applyCountrySelection, focusWorldMapGeography],
  );

  const resetHomeSelection = useCallback(() => {
    setSelectedCountry(null);
    setDistricts([]);
    setAdm1Overlay(null);
    setAdm1Error(null);
    setHoveredDistrict(null);
    setCountrySearch("");
    setPosition({ coordinates: [0, 20], zoom: 1 });
  }, []);

  const handleCountrySearchSelect = useCallback(
    (countryName: string) => {
      setCountrySearch(countryName);
      focusCountryFromSidebar(countryName);
    },
    [focusCountryFromSidebar],
  );

  // Drag handlers for the incident report
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    dragOffset.current = {
      x: e.clientX - reportPos.x,
      y: e.clientY - reportPos.y,
    };
  }, [reportPos]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      setReportPos({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  return (
    <div className={`app-container ${isUiLoading ? "ui-loading" : ""}`}>
      <div
        className={`page-bg-wrapper ${activePage !== "home" && activePage !== "hydrology" ? "visible" : ""}`}
      />

      <nav className="navbar">
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <div
            className="brand"
            style={{ cursor: "pointer" }}
            onClick={() => {
              setActivePage("home");
              resetHomeSelection();
            }}
          >
            <Radar size={32} />
            <span className="brand-text">NeuraShield</span>
          </div>

          {activePage !== "home" && (
            <button
              className="home-back-btn"
              onClick={() => {
                setActivePage("home");
                resetHomeSelection();
              }}
            >
              <Home size={18} />
              <span>Home</span>
            </button>
          )}
        </div>

        <div className="nav-controls">
          <button
            className="theme-toggle"
            onClick={() =>
              setActivePage(activePage === "chat" ? "home" : "chat")
            }
            style={{
              marginRight: "10px",
              color: activePage === "chat" ? "var(--accent)" : "inherit",
            }}
          >
            <MessageSquare size={20} />
          </button>
          <button
            className="theme-toggle"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </nav>

      {!isMobile && (
        <div
          className={`map-wrapper map-state-${activePage} ${((!["home", "hydrology", "seismic"].includes(activePage) && !selectedCountry) || (activePage === "storm" && isStormDetailedViewOpen) || isMobileHomeIdle) ? "hidden" : ""}`}
        >
          {/* High-tech flash overlay whenever activePage changes */}
          <div key={`${activePage}-flash`} className="page-transition-flash" />

          <ComposableMap
            projection="geoMercator"
            projectionConfig={{ scale: 130 }}
            style={{ width: "100%", height: "100%" }}
          >
            <ZoomableGroup
              center={position.coordinates}
              zoom={position.zoom}
              minZoom={1}
              maxZoom={20}
              className="rsm-zoomable-group"
            >
              <Geographies geography={geoUrl}>
                {({ geographies }) => {
                  worldGeographiesRef.current = geographies as unknown as WorldMapGeography[];

                  return geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      className={`globe-geography ${selectedCountry === geo.properties.name && activePage !== "home" ? "selected-country-pulse" : ""}`}
                      onClick={() => {
                        if (activePage === "home") {
                          focusWorldMapGeography(geo as unknown as WorldMapGeography);
                        }
                      }}
                      onMouseEnter={(e) =>
                        setHoveredMapArea({
                          name: geo.properties.name,
                          x: e.clientX,
                          y: e.clientY,
                        })
                      }
                      onMouseLeave={() => setHoveredMapArea(null)}
                      style={{
                        default: {
                          fill:
                            selectedCountry === geo.properties.name &&
                            activePage === "home"
                              ? "rgba(0, 212, 255, 0.22)"
                              : activePage === "home"
                                ? getCountryFillColor(geo.properties.name)
                                : "var(--bg-panel)",
                          stroke:
                            selectedCountry &&
                            activePage !== "home" &&
                            selectedCountry !== geo.properties.name
                              ? "transparent"
                              : activePage === "home"
                                ? "rgba(0, 212, 255, 0.15)"
                                : "#1a1f33",
                          opacity:
                            selectedCountry &&
                            activePage !== "home" &&
                            selectedCountry !== geo.properties.name
                              ? 0
                              : 1,
                          transition: "opacity 1s ease-in-out, fill 0.5s ease",
                        },
                        hover: {
                          fill: "rgba(0, 212, 255, 0.8)",
                          stroke: "#00d4ff",
                          strokeWidth: 0.5,
                          opacity: 1,
                        },
                      }}
                    />
                  ));
                }}
              </Geographies>

              {selectedCountry && activePage === "home" && regionalFeatureCollection && (
                <>
                  <Geographies geography={regionalFeatureCollection}>
                    {({ geographies }) =>
                      geographies.map((geo) => {
                        const matchingFeature =
                          adm1Overlay?.features.find(
                            (feature) =>
                              feature.properties.shapeID === geo.properties.shapeID ||
                              feature.label === geo.properties.shapeName,
                          ) ?? null;

                        if (!matchingFeature) {
                          return null;
                        }

                        const isHovered =
                          hoveredDistrict?.district.properties.shapeID ===
                            matchingFeature.properties.shapeID ||
                          hoveredDistrict?.district.label === matchingFeature.label;

                        return (
                          <Geography
                            key={`${geo.rsmKey}-adm1`}
                            geography={geo}
                            onMouseEnter={(event) =>
                              setHoveredDistrict({
                                district: matchingFeature,
                                x: event.clientX,
                                y: event.clientY,
                              })
                            }
                            onMouseMove={(event) =>
                              setHoveredDistrict({
                                district: matchingFeature,
                                x: event.clientX,
                                y: event.clientY,
                              })
                            }
                            onMouseLeave={() => setHoveredDistrict(null)}
                            style={{
                              default: {
                                fill: getRegionalFillColor(matchingFeature, isHovered),
                                stroke: getRegionalStrokeColor(matchingFeature, isHovered),
                                strokeWidth: matchingFeature.risk.redZone ? 1.2 : 0.65,
                                opacity: 1,
                                transition: "fill 0.2s ease, stroke 0.2s ease, stroke-width 0.2s ease",
                              },
                              hover: {
                                fill: getRegionalFillColor(matchingFeature, true),
                                stroke: getRegionalStrokeColor(matchingFeature, true),
                                strokeWidth: 1.3,
                                opacity: 1,
                              },
                              pressed: {
                                fill: getRegionalFillColor(matchingFeature, true),
                                stroke: getRegionalStrokeColor(matchingFeature, true),
                                strokeWidth: 1.35,
                                opacity: 1,
                              },
                            }}
                          />
                        );
                      })
                    }
                  </Geographies>

                  {shouldShowRegionalLabels &&
                    adm1Overlay?.features.map((feature) => (
                      <Marker
                        key={`adm1-label-${feature.properties.shapeISO ?? feature.label}`}
                        coordinates={feature.centroid}
                      >
                        {feature.risk.redZone && (
                          <>
                            <circle
                              r={Math.max(1.9 / position.zoom, 0.42)}
                              fill="rgba(255, 92, 108, 0.9)"
                            />
                            <circle
                              r={Math.max(7 / position.zoom, 1.4)}
                              fill="none"
                              stroke="rgba(255, 92, 108, 0.85)"
                              strokeWidth={Math.max(0.42 / position.zoom, 0.1)}
                              opacity={0.52}
                            >
                              <animate
                                attributeName="r"
                                from={Math.max(1.9 / position.zoom, 0.42)}
                                to={Math.max(18 / position.zoom, 3.4)}
                                dur="2.2s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                from="0.55"
                                to="0"
                                dur="2.2s"
                                repeatCount="indefinite"
                              />
                            </circle>
                          </>
                        )}
                        <text
                          textAnchor="middle"
                          y={-Math.max(9 / position.zoom, 1.8)}
                          style={{
                            fontFamily: "Inter, sans-serif",
                            fontSize: `${Math.max(4 / position.zoom, 0.66)}px`,
                            fill: feature.risk.redZone ? "#ffd2d9" : "var(--map-label-color)",
                            fontWeight: feature.risk.redZone ? 700 : 600,
                            textShadow: `0 0 6px ${feature.risk.redZone ? "rgba(255, 92, 108, 0.55)" : "var(--map-label-shadow)"}`,
                            pointerEvents: "none",
                          }}
                        >
                          {feature.label}
                        </text>
                      </Marker>
                    ))}
                </>
              )}

              {(activePage === "hydrology" || activePage === "seismic") && (
                <>
                  <defs>
                    <radialGradient id="ringGradient" cx="50%" cy="50%" r="50%">
                      <stop offset="0%" stopColor="transparent" />
                      <stop offset="60%" stopColor="transparent" />
                      <stop offset="85%" stopColor="#fff" />
                      <stop offset="100%" stopColor="transparent" />
                    </radialGradient>
                    <mask id="radarMask">
                      <circle cx="450" cy="250" r="0" fill="url(#ringGradient)">
                        <animate
                          attributeName="r"
                          from="0"
                          to="600"
                          dur="4s"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="cx"
                          values="250; 600; 400; 250"
                          keyTimes="0; 0.333; 0.666; 1"
                          dur="12s"
                          calcMode="discrete"
                          repeatCount="indefinite"
                        />
                        <animate
                          attributeName="cy"
                          values="180; 200; 400; 180"
                          keyTimes="0; 0.333; 0.666; 1"
                          dur="12s"
                          calcMode="discrete"
                          repeatCount="indefinite"
                        />
                      </circle>
                    </mask>
                  </defs>
                  <g mask="url(#radarMask)">
                    <Geographies geography={geoUrl}>
                      {({ geographies }) =>
                        geographies.map((geo) => (
                          <Geography
                            key={geo.rsmKey + "-scan"}
                            geography={geo}
                            className="globe-borders-scan"
                            style={{
                              default: {
                                opacity:
                                  selectedCountry &&
                                  selectedCountry !== geo.properties.name
                                    ? 0
                                    : 1,
                                transition: "opacity 1s ease-in-out",
                              },
                            }}
                          />
                        ))
                      }
                    </Geographies>
                  </g>
                </>
              )}

              {selectedCountry &&
                !regionalFeatureCollection &&
                districts.map((dist, idx) => (
                  <Marker key={"dist-" + idx} coordinates={dist.coords}>
                    <circle
                      r={Math.max((getMaxRisk(dist) >= 45 ? 2.1 : 1.5) / position.zoom, 0.32)}
                      fill={isRedZone(dist) ? "rgba(255, 92, 108, 0.95)" : "rgba(0, 212, 255, 0.9)"}
                    />
                    <circle
                      r={Math.max((isRedZone(dist) ? 8 : 6) / position.zoom, 1)}
                      fill="none"
                      stroke={isRedZone(dist) ? "rgba(255, 92, 108, 0.8)" : "#00d4ff"}
                      strokeWidth={Math.max(0.4 / position.zoom, 0.08)}
                      opacity={0.5}
                    >
                      <animate
                        attributeName="r"
                        from={Math.max(1.5 / position.zoom, 0.3)}
                        to={Math.max(16 / position.zoom, 3)}
                        dur={`${1.5 + idx * 0.15}s`}
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        from="0.8"
                        to="0"
                        dur={`${1.5 + idx * 0.15}s`}
                        repeatCount="indefinite"
                      />
                    </circle>
                    <text
                      textAnchor="middle"
                      y={-Math.max(8 / position.zoom, 1.5)}
                      style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: `${Math.max(4 / position.zoom, 0.7)}px`,
                        fill: isRedZone(dist) ? "#ffd2d9" : "var(--map-label-color)",
                        fontWeight: isRedZone(dist) ? 700 : 600,
                        textShadow: `0 0 4px ${isRedZone(dist) ? "rgba(255, 92, 108, 0.45)" : "var(--map-label-shadow)"}`,
                        pointerEvents: "none",
                      }}
                    >
                      {dist.name}
                    </text>
                  </Marker>
                ))}

              {(activePage === "home" || activePage === "seismic") &&
                activeEvents
                  .filter(
                    (ev) => activePage === "home" || ev.type === "Earthquake",
                  )
                  .map((ev, idx) => {
                    const color =
                      activePage === "seismic"
                        ? "#ff4757"
                        : getDisasterMarkerColor(ev.type as DisasterType);
                    const showRipple = activePage === "seismic";
                    return (
                      <Marker
                        key={idx}
                        coordinates={[ev.lon, ev.lat]}
                        onClick={() => {
                          if (activePage === "home") {
                            setSelectedReportIndex(idx);
                          }
                        }}
                      >
                        <circle r={showRipple ? 3 : 4} fill={color} />
                        <circle
                          r={showRipple ? 3 : 14}
                          fill="none"
                          stroke={color}
                          strokeWidth={showRipple ? 2 : 1}
                          opacity={0.5}
                        >
                          {showRipple && (
                            <>
                              <animate
                                attributeName="r"
                                from="3"
                                to="24"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                              <animate
                                attributeName="opacity"
                                from="0.8"
                                to="0"
                                dur="2s"
                                repeatCount="indefinite"
                              />
                            </>
                          )}
                        </circle>
                      </Marker>
                    );
                  })}
            </ZoomableGroup>
          </ComposableMap>

          {selectedCountry && activePage === "home" && (
            <div className="map-region-summary">
              <div className="map-region-summary-head">
                <span className="map-region-kicker">
                  {adm1Overlay ? adm1Overlay.unitLabel : "Regional Sync"}
                </span>
                <h3>{selectedCountry}</h3>
                <p>
                  {adm1Overlay
                    ? `${adm1Overlay.unitCount} verified regional units loaded for hover review.`
                    : "Verified state / province boundaries are loading for this country."}
                </p>
              </div>

              <div className="map-region-summary-stats">
                <span>{redZoneCount} red zone</span>
                <span>{elevatedZoneCount} elevated</span>
                <span>{adm1Overlay?.buildDate ?? "syncing"}</span>
              </div>

              <div className="map-region-legend">
                <span className="legend-pill legend-low">Low</span>
                <span className="legend-pill legend-watch">Watch</span>
                <span className="legend-pill legend-red">Red zone</span>
              </div>

              {isAdm1Loading && (
                <div className="map-region-inline-note">Loading verified ADM1 boundaries...</div>
              )}
              {!isAdm1Loading && adm1Error && (
                <div className="map-region-inline-note muted">{adm1Error}</div>
              )}
              {!isAdm1Loading && adm1Overlay && (
                <div className="map-region-inline-note">
                  Source: {adm1Overlay.source}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {hoveredDistrict && activePage === "home" && (
        <div
          className="district-risk-tooltip"
          style={{ left: hoveredDistrict.x, top: hoveredDistrict.y }}
        >
          <div className="district-risk-head">
            <span className="district-risk-kicker">
              {hoveredDistrict.district.risk.level}
            </span>
            <strong>{hoveredDistrict.district.label}</strong>
            <span
              className={`district-risk-chip ${hoveredDistrict.district.risk.redZone ? "red" : "stable"}`}
            >
              {hoveredDistrict.district.risk.redZone ? "Red Zone" : "Monitored"}
            </span>
          </div>
          <div className="district-risk-grid">
            {Object.entries(riskMetricMeta).map(([key, meta]) => {
              const score =
                hoveredDistrict.district.risk[key as RiskMetricKey];

              return (
                <div className="district-risk-row" key={key}>
                  <span>{meta.label}</span>
                  <strong style={{ color: meta.color }}>{score}%</strong>
                </div>
              );
            })}
          </div>
          <div className="district-risk-foot">
            Overall Risk {hoveredDistrict.district.risk.overall}% | Dominant{" "}
            {riskMetricMeta[hoveredDistrict.district.risk.dominant].label.replace(" Risk", "")}
          </div>
        </div>
      )}

      {hoveredMapArea &&
        !hoveredDistrict &&
        (activePage === "home" || activePage === "hydrology") && (
          <div
            className="country-tooltip"
            style={{ left: hoveredMapArea.x, top: hoveredMapArea.y }}
          >
            {hoveredMapArea.name}
          </div>
        )}

      {/* Real Time Display */}
      <div className="system-time">{time.toLocaleString()}</div>

      {activePage === "home" && isMobile && (
        <div className="mobile-country-search">
          <div className="mobile-country-search-card">
            <div className="mobile-country-search-head">
              <span className="mobile-country-kicker">Mobile Country Access</span>
              <h2>
                <MapPin size={18} />
                {selectedCountry ? selectedCountry : "Search a Country"}
              </h2>
              <p>
                {selectedCountry
                  ? "Focused country preview ready. Neeche se modules open kar sakte ho."
                  : "World map mobile pe hide kiya hai. Country search karo aur quick focused map dekho."}
              </p>
            </div>

            {selectedCountry ? (
              <div className="mobile-country-selected">
                <button
                  type="button"
                  className="mobile-country-reset"
                  onClick={resetHomeSelection}
                >
                  Change Country
                </button>
              </div>
            ) : (
              <>
                <label className="mobile-country-input-wrap">
                  <Search size={18} />
                  <input
                    type="text"
                    value={countrySearch}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const match = searchableCountries.find(
                        (country) =>
                          country.toLowerCase() ===
                            countrySearch.trim().toLowerCase() ||
                          countryNamesMatch(country, countrySearch.trim()),
                      );
                      if (match) {
                        handleCountrySearchSelect(match);
                      }
                    }}
                    placeholder="Search country name"
                    className="mobile-country-input"
                    list="mobile-country-options"
                  />
                </label>
                <datalist id="mobile-country-options">
                  {searchableCountries.map((country) => (
                    <option key={country} value={country} />
                  ))}
                </datalist>
                <div className="mobile-country-suggestions">
                  {countrySuggestions.map((country) => (
                    <button
                      type="button"
                      key={country}
                      className="mobile-country-suggestion"
                      onClick={() => handleCountrySearchSelect(country)}
                    >
                      {country}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* History Year Bar — Bottom, only when no country selected */}
      {activePage === "home" && !selectedCountry && !isMobile && (
        <div className="history-year-bar">
          <div className="history-year-meta">
            <span className="history-bar-label">History</span>
            <span className="history-count">{activeEvents.length} Events</span>
          </div>
          <div className="history-year-list">
            {years.map((y) => (
              <button
                key={y}
                className={`year-btn ${y === activeYear ? "active" : ""}`}
                onClick={() => setActiveYear(y)}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Draggable + Collapsible Incident Report */}
      {activePage === "home" && activeReport && !isMobile && (
        <div
          className={`event-details-box draggable-report ${reportCollapsed ? "collapsed" : ""}`}
          style={{
            left: reportPos.x,
            top: reportPos.y,
            cursor: isDragging ? "grabbing" : "default",
          }}
        >
          {/* Drag Handle + Controls */}
          <div
            className="report-header"
            onMouseDown={handleDragStart}
          >
            <div className="report-drag-handle">
              <GripVertical size={16} />
              <h2>{activeYear} Incident Report</h2>
            </div>
            <div className="report-controls">
              <button onClick={() => setReportCollapsed(!reportCollapsed)}>
                {reportCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
            </div>
          </div>

          {/* Collapsible Content */}
          {!reportCollapsed && activeReport && (
            <>
              {activeEvents.length > 1 && (
                <div className="report-event-nav">
                  {activeEvents.map((ev, idx) => (
                    <button
                      type="button"
                      key={ev.name}
                      className={`report-event-pill ${idx === selectedReportIndex ? "active" : ""}`}
                      onClick={() => setSelectedReportIndex(idx)}
                    >
                      {ev.type}
                    </button>
                  ))}
                </div>
              )}

              <div className="event-item">
                <h3>
                  {getDisasterIcon(activeReport.type as DisasterType)}
                  {activeReport.name}
                </h3>
                <p
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "var(--text-dim)",
                  }}
                >
                  <Globe size={16} /> {activeReport.place}
                </p>

                <div className="pie-chart-container">
                  <div className="pie-center-text">
                    {activeReport.severity}%<br />
                    <small>Severity</small>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "Impact/Severity", value: activeReport.severity },
                          { name: "Contained", value: 100 - activeReport.severity },
                        ]}
                        innerRadius={34}
                        outerRadius={48}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={true}
                        animationBegin={0}
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        {PIE_COLORS.map((color, index) => (
                          <Cell key={`cell-${index}`} fill={color} />
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

                <div className="info-row">
                  <div className="info-cell">
                    <strong>Metrics / Mag</strong>
                    {activeReport.magnitude}
                  </div>
                  <div className="info-cell">
                    <strong>Fatalities</strong>
                    {activeReport.fatalities}
                  </div>
                  <div className="info-cell">
                    <strong>Impact</strong>
                    {activeReport.loss}
                  </div>
                  <div className="info-cell">
                    <strong>Coordinates</strong>
                    {activeReport.lat}, {activeReport.lon}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Home Global View Panels */}
      {activePage === "home" && !(isMobile && selectedCountry) && (
        <HomeGlobalView
          onSelectRegion={focusCountryFromSidebar}
          liveSummary={liveSummary}
        />
      )}

      {selectedCountry && activePage !== "chat" && (
        <div className="modules-container">
          <button
            className={`module-btn ${activePage === "telemetry" ? "active" : ""}`}
            onClick={() => setActivePage("telemetry")}
            title="Telemetry Console"
          >
            <Activity size={22} />
            <span>Telemetry Console</span>
          </button>
          <button
            className={`module-btn ${activePage === "hydrology" ? "active" : ""}`}
            onClick={() => setActivePage("hydrology")}
            title="Hydrology Node"
          >
            <Droplets size={22} />
            <span>Hydrology Node</span>
          </button>
          <button
            className={`module-btn ${activePage === "seismic" ? "active" : ""}`}
            onClick={() => setActivePage("seismic")}
            title="Seismic Uplink"
          >
            <MapPin size={22} />
            <span>Seismic Uplink</span>
          </button>
          <button
            className={`module-btn ${activePage === "volcano" ? "active" : ""}`}
            onClick={() => setActivePage("volcano")}
            title="Volcano Node"
          >
            <Flame size={22} />
            <span>Volcano Node</span>
          </button>
          <button
            className={`module-btn ${activePage === "storm" ? "active" : ""}`}
            onClick={() => setActivePage("storm")}
            title="Storm System"
          >
            <CloudLightning size={22} />
            <span>Storm System</span>
          </button>
        </div>
      )}

      {activePage === "telemetry" && (
        <TelemetryConsole
          selectedCountry={selectedCountry}
          liveSummary={liveSummary}
        />
      )}
      {activePage === "hydrology" && (
        <HydrologyNode selectedCountry={selectedCountry} />
      )}
      {activePage === "seismic" && (
        <SeismicUplink selectedCountry={selectedCountry} />
      )}
      {activePage === "volcano" && (
        <VolcanoModule selectedCountry={selectedCountry} />
      )}
      {activePage === "storm" && (
        <StormModule
          selectedCountry={selectedCountry}
          onDetailedViewChange={setIsStormDetailedViewOpen}
        />
      )}
      {activePage === "chat" && (
        <ChatbotModule
          onClose={() => {
            setActivePage("home");
            setSelectedCountry(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
