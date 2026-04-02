import { geoCentroid } from "d3-geo";
import type { LiveDisasterType, LiveSummary } from "./liveData";

export type RiskMetricKey = "earthquake" | "flood" | "storm" | "volcano";
export type HazardEventType = "Earthquake" | "Flood" | "Storm" | "Volcano";

export type HazardEvent = {
  type: HazardEventType;
  country: string;
  lat: number;
  lon: number;
  severity: number;
};

type BoundaryCatalogEntry = {
  boundaryID: string;
  boundaryName: string;
  boundaryISO: string;
  boundaryCanonical: string;
  boundarySource: string;
  Continent: string;
  admUnitCount: string;
  buildDate: string;
  simplifiedGeometryGeoJSON: string;
};

type BoundaryFeatureProperties = {
  shapeName?: string;
  shapeISO?: string;
  shapeID?: string;
  shapeGroup?: string;
  shapeType?: string;
};

type BoundaryGeometry =
  | {
      type: "Polygon";
      coordinates: number[][][];
    }
  | {
      type: "MultiPolygon";
      coordinates: number[][][][];
    };

type BoundaryFeature = {
  type: "Feature";
  properties: BoundaryFeatureProperties;
  geometry: BoundaryGeometry;
};

type BoundaryFeatureCollection = {
  type: "FeatureCollection";
  features: BoundaryFeature[];
};

export type RegionalRiskProfile = {
  earthquake: number;
  flood: number;
  storm: number;
  volcano: number;
  overall: number;
  dominant: RiskMetricKey;
  level: "Minimal" | "Guarded" | "Elevated" | "High" | "Critical";
  redZone: boolean;
};

export type RegionalBoundaryFeature = BoundaryFeature & {
  label: string;
  centroid: [number, number];
  risk: RegionalRiskProfile;
};

export type Adm1Overlay = {
  countryName: string;
  countryIso: string;
  unitLabel: string;
  unitCount: number;
  source: string;
  buildDate: string;
  features: RegionalBoundaryFeature[];
};

const COUNTRY_ALIASES: Record<string, string[]> = {
  "Bosnia and Herz.": ["Bosnia and Herzegovina"],
  "Central African Rep.": ["Central African Republic"],
  "Dem. Rep. Congo": ["Democratic Republic of the Congo", "DR Congo"],
  "Dominican Rep.": ["Dominican Republic"],
  "Eq. Guinea": ["Equatorial Guinea"],
  "Solomon Is.": ["Solomon Islands"],
  "S. Sudan": ["South Sudan"],
  eSwatini: ["Eswatini", "Swaziland"],
  "Côte d'Ivoire": ["Cote d'Ivoire", "Ivory Coast"],
  Laos: ["Lao People's Democratic Republic", "Lao PDR"],
  Moldova: ["Republic of Moldova"],
  Macedonia: ["North Macedonia"],
  Russia: ["Russian Federation"],
  Syria: ["Syrian Arab Republic"],
  Tanzania: ["United Republic of Tanzania"],
  Venezuela: ["Venezuela, Bolivarian Republic of"],
  Vietnam: ["Viet Nam"],
  Bolivia: ["Bolivia, Plurinational State of"],
  Brunei: ["Brunei Darussalam"],
  Iran: ["Iran, Islamic Republic of"],
  "South Korea": ["Republic of Korea", "Korea, Republic of"],
  "North Korea": ["Democratic People's Republic of Korea", "Korea, North"],
  Palestine: ["State of Palestine"],
  "Czechia": ["Czech Republic"],
  Myanmar: ["Burma"],
  "United States": ["United States of America", "USA"],
  "United States of America": ["United States", "USA"],
};

const DEFAULT_BASELINE: Record<RiskMetricKey, number> = {
  earthquake: 4,
  flood: 5,
  storm: 4,
  volcano: 1,
};

const CONTINENT_BASELINE: Partial<Record<string, Partial<Record<RiskMetricKey, number>>>> = {
  Asia: { earthquake: 2, flood: 2, storm: 1, volcano: 1 },
  Oceania: { earthquake: 3, storm: 2, volcano: 2 },
  Africa: { flood: 1, storm: 1 },
  Europe: { flood: 1, earthquake: 1 },
  "Northern America": { storm: 2, flood: 1, earthquake: 1 },
  "South America": { earthquake: 2, flood: 1, volcano: 1 },
};

const COUNTRY_BASELINE: Partial<Record<string, Partial<Record<RiskMetricKey, number>>>> = {
  India: { flood: 18, storm: 14, earthquake: 12, volcano: 2 },
  Japan: { earthquake: 30, volcano: 18, storm: 12, flood: 10 },
  Indonesia: { earthquake: 26, volcano: 24, storm: 12, flood: 10 },
  Philippines: { storm: 24, flood: 18, earthquake: 14, volcano: 12 },
  "United States of America": { storm: 18, flood: 12, earthquake: 10, volcano: 4 },
  Mexico: { earthquake: 16, storm: 10, flood: 8, volcano: 8 },
  Chile: { earthquake: 28, volcano: 10, flood: 4, storm: 3 },
  Turkey: { earthquake: 20, flood: 6, storm: 4, volcano: 2 },
  Nepal: { earthquake: 24, flood: 8, storm: 3, volcano: 0 },
  Pakistan: { flood: 16, earthquake: 12, storm: 6, volcano: 1 },
  Bangladesh: { flood: 22, storm: 18, earthquake: 4, volcano: 0 },
  China: { earthquake: 12, flood: 10, storm: 7, volcano: 3 },
  Italy: { earthquake: 12, volcano: 10, flood: 5, storm: 3 },
  Iceland: { volcano: 24, earthquake: 14, flood: 2, storm: 4 },
  Peru: { earthquake: 16, flood: 5, storm: 2, volcano: 6 },
  Myanmar: { storm: 18, flood: 14, earthquake: 10, volcano: 2 },
  "Papua New Guinea": { earthquake: 20, volcano: 22, storm: 10, flood: 8 },
  Vanuatu: { earthquake: 18, volcano: 16, storm: 12, flood: 8 },
  Haiti: { earthquake: 18, storm: 16, flood: 10, volcano: 0 },
  Kenya: { flood: 10, storm: 5, earthquake: 4, volcano: 5 },
  Tanzania: { flood: 9, storm: 4, earthquake: 3, volcano: 4 },
  Ethiopia: { flood: 7, storm: 3, earthquake: 6, volcano: 3 },
};

const catalogPromise = fetchBoundaryCatalog();
const geometryCache = new Map<string, Promise<BoundaryFeatureCollection>>();

const riskKeyOrder: RiskMetricKey[] = ["earthquake", "flood", "storm", "volcano"];

const liveTypeToRiskKey: Record<LiveDisasterType, RiskMetricKey> = {
  Earthquake: "earthquake",
  Flood: "flood",
  Storm: "storm",
  Volcano: "volcano",
};

const eventTypeToRiskKey: Record<HazardEventType, RiskMetricKey> = {
  Earthquake: "earthquake",
  Flood: "flood",
  Storm: "storm",
  Volcano: "volcano",
};

function normalizeCountryName(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-zA-Z0-9]+/g, " ")
    .trim()
    .toLowerCase();
}

function getCountryNameCandidates(countryName: string) {
  const normalizedTarget = normalizeCountryName(countryName);
  const candidates = new Set<string>([normalizedTarget]);

  Object.entries(COUNTRY_ALIASES).forEach(([name, aliases]) => {
    const normalizedName = normalizeCountryName(name);
    const normalizedAliases = aliases.map(normalizeCountryName);
    if (
      normalizedTarget === normalizedName ||
      normalizedAliases.includes(normalizedTarget)
    ) {
      candidates.add(normalizedName);
      normalizedAliases.forEach((alias) => candidates.add(alias));
    }
  });

  return candidates;
}

export function countryNamesMatch(left: string, right: string) {
  const leftCandidates = getCountryNameCandidates(left);
  const rightCandidates = getCountryNameCandidates(right);
  return Array.from(leftCandidates).some((candidate) => rightCandidates.has(candidate));
}

function isBoundaryFeatureCollection(value: unknown): value is BoundaryFeatureCollection {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeCollection = value as Partial<BoundaryFeatureCollection>;
  return (
    maybeCollection.type === "FeatureCollection" &&
    Array.isArray(maybeCollection.features)
  );
}

async function fetchBoundaryCatalog() {
  const response = await fetch("https://www.geoboundaries.org/api/current/gbOpen/ALL/ADM1/");
  if (!response.ok) {
    throw new Error("Boundary catalog unavailable");
  }

  return (await response.json()) as BoundaryCatalogEntry[];
}

async function loadBoundaryGeometry(entry: BoundaryCatalogEntry) {
  const cached = geometryCache.get(entry.boundaryISO);
  if (cached) {
    return cached;
  }

  const request = fetch(entry.simplifiedGeometryGeoJSON).then(async (response) => {
    if (!response.ok) {
      throw new Error(`Regional map unavailable for ${entry.boundaryName}`);
    }

    const json = (await response.json()) as unknown;
    if (!isBoundaryFeatureCollection(json)) {
      throw new Error(`Invalid regional geometry for ${entry.boundaryName}`);
    }

    return json;
  });

  geometryCache.set(entry.boundaryISO, request);
  return request;
}

function getBaseline(countryName: string, continent: string) {
  const baseline = { ...DEFAULT_BASELINE };
  const continentBaseline = CONTINENT_BASELINE[continent];
  const countryBaseline = COUNTRY_BASELINE[countryName];

  riskKeyOrder.forEach((riskKey) => {
    baseline[riskKey] += continentBaseline?.[riskKey] ?? 0;
    baseline[riskKey] += countryBaseline?.[riskKey] ?? 0;
  });

  return baseline;
}

function getLiveBoosts(countryName: string, liveSummary: LiveSummary | null | undefined) {
  const boosts: Record<RiskMetricKey, number> = {
    earthquake: 0,
    flood: 0,
    storm: 0,
    volcano: 0,
  };

  const liveCountry = Object.values(liveSummary?.country_profiles ?? {}).find((profile) =>
    countryNamesMatch(profile.country, countryName),
  );

  if (!liveCountry) {
    return boosts;
  }

  boosts[liveTypeToRiskKey[liveCountry.top_type]] += Math.round(liveCountry.risk * 0.2);

  liveCountry.mix.forEach((mix) => {
    boosts[liveTypeToRiskKey[mix.name]] += Math.round(mix.value * 0.12);
  });

  return boosts;
}

function hashLabel(label: string) {
  let hash = 0;
  for (let index = 0; index < label.length; index += 1) {
    hash = (hash << 5) - hash + label.charCodeAt(index);
    hash |= 0;
  }
  return hash;
}

function haversineDistanceKm([lon1, lat1]: [number, number], [lon2, lat2]: [number, number]) {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const earthRadius = 6371;
  const latDelta = toRad(lat2 - lat1);
  const lonDelta = toRad(lon2 - lon1);
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(lonDelta / 2) ** 2;

  return earthRadius * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getEventRadius(riskKey: RiskMetricKey) {
  switch (riskKey) {
    case "flood":
    case "storm":
      return 420;
    case "earthquake":
      return 300;
    case "volcano":
      return 220;
    default:
      return 300;
  }
}

function applyConservativeSmoothing(score: number, riskKey: RiskMetricKey) {
  if (riskKey === "volcano" && score < 12) {
    return Math.min(score, 4);
  }
  if (score < 12) {
    return Math.round(score * 0.55);
  }
  if (score < 24) {
    return Math.round(score * 0.78);
  }
  return Math.round(score);
}

function getRiskLevel(score: number): RegionalRiskProfile["level"] {
  if (score >= 78) return "Critical";
  if (score >= 62) return "High";
  if (score >= 42) return "Elevated";
  if (score >= 18) return "Guarded";
  return "Minimal";
}

function computeRiskProfile(params: {
  countryName: string;
  continent: string;
  label: string;
  centroid: [number, number];
  events: HazardEvent[];
  liveSummary: LiveSummary | null | undefined;
}) {
  const { countryName, continent, label, centroid, events, liveSummary } = params;
  const baseline = getBaseline(countryName, continent);
  const liveBoosts = getLiveBoosts(countryName, liveSummary);
  const profile: Record<RiskMetricKey, number> = {
    earthquake: 0,
    flood: 0,
    storm: 0,
    volcano: 0,
  };

  riskKeyOrder.forEach((riskKey) => {
    const eventContributions = events
      .filter((event) => eventTypeToRiskKey[event.type] === riskKey)
      .map((event) => {
        const distance = haversineDistanceKm(centroid, [event.lon, event.lat]);
        const countryFactor = countryNamesMatch(event.country, countryName) ? 1 : 0.35;
        const radius = getEventRadius(riskKey);
        const magnitude = Math.max(event.severity - 28, 0);
        return magnitude * Math.exp(-((distance / radius) ** 2)) * countryFactor;
      })
      .sort((left, right) => right - left)
      .slice(0, 3);

    const localizedVariance = (Math.abs(hashLabel(`${label}-${riskKey}`)) % 5) - 2;
    const rawScore =
      baseline[riskKey] +
      liveBoosts[riskKey] +
      eventContributions.reduce((sum, contribution) => sum + contribution, 0) +
      localizedVariance;

    profile[riskKey] = Math.max(0, Math.min(96, applyConservativeSmoothing(rawScore, riskKey)));
  });

  const dominant = riskKeyOrder.reduce((topRisk, riskKey) =>
    profile[riskKey] > profile[topRisk] ? riskKey : topRisk,
  );
  const overall = Math.round(
    Math.max(
      profile[dominant] * 0.82 + (profile.earthquake + profile.flood + profile.storm + profile.volcano) * 0.06,
      (profile.earthquake + profile.flood + profile.storm + profile.volcano) / 4,
    ),
  );
  const redZone = overall >= 64 || profile[dominant] >= 72;

  return {
    ...profile,
    overall,
    dominant,
    level: getRiskLevel(overall),
    redZone,
  } satisfies RegionalRiskProfile;
}

export async function loadBoundaryCatalog() {
  return catalogPromise;
}

export async function loadAdm1Overlay(params: {
  countryName: string;
  events: HazardEvent[];
  liveSummary: LiveSummary | null | undefined;
}) {
  const catalog = await loadBoundaryCatalog();
  const candidates = getCountryNameCandidates(params.countryName);
  const entry =
    catalog.find((item) => candidates.has(normalizeCountryName(item.boundaryName))) ?? null;

  if (!entry) {
    return null;
  }

  const geometry = await loadBoundaryGeometry(entry);
  const features = geometry.features.map((feature) => {
    const label = feature.properties.shapeName?.trim() || "Unnamed Region";
    const centroid = geoCentroid(feature) as [number, number];

    return {
      ...feature,
      label,
      centroid,
      risk: computeRiskProfile({
        countryName: entry.boundaryName,
        continent: entry.Continent,
        label,
        centroid,
        events: params.events,
        liveSummary: params.liveSummary,
      }),
    } satisfies RegionalBoundaryFeature;
  });

  return {
    countryName: entry.boundaryName,
    countryIso: entry.boundaryISO,
    unitLabel: entry.boundaryCanonical || "State / Province",
    unitCount: Number(entry.admUnitCount) || features.length,
    source: entry.boundarySource,
    buildDate: entry.buildDate,
    features,
  } satisfies Adm1Overlay;
}
