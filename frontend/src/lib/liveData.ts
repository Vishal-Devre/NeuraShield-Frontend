import { useEffect, useState } from "react";

export type LiveDisasterType = "Earthquake" | "Flood" | "Storm" | "Volcano";

export type LiveEvent = {
  id: string;
  type: LiveDisasterType;
  name: string;
  place: string;
  country: string;
  lat: number;
  lon: number;
  severity: number;
  magnitude: string;
  depth_km?: number | null;
  fatalities: string;
  loss: string;
  time: string;
  source: string;
  url?: string | null;
};

export type LiveCountryProfile = {
  country: string;
  risk: number;
  event_count: number;
  top_type: LiveDisasterType;
  mix: { name: LiveDisasterType; value: number }[];
  alerts: { type: LiveDisasterType; name: string; time: string; source: string }[];
  coordinates: { lat: number; lon: number };
};

export type LiveSummary = {
  last_updated: string;
  events: LiveEvent[];
  earthquakes: LiveEvent[];
  reports: LiveEvent[];
  history_events: LiveEvent[];
  top_countries: LiveCountryProfile[];
  country_profiles: Record<string, LiveCountryProfile>;
  alerts: {
    text: string;
    time: string;
    severity: "critical" | "high" | "medium";
    country: string;
    type: LiveDisasterType;
  }[];
  trend: Array<{
    label: string;
    Flood: number;
    Earthquake: number;
    Storm: number;
    Volcano: number;
  }>;
  insights: string[];
  stats: {
    tracked_events: number;
    critical_cases: number;
    avg_severity: number;
    source_feeds: number;
  };
};

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") || "";

export const useLiveSummary = () => {
  const [data, setData] = useState<LiveSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      if (!API_BASE) {
        setLoading(false);
        setError("Missing API base URL");
        return;
      }

      try {
        const response = await fetch(`${API_BASE}/api/live/summary`);
        if (!response.ok) {
          throw new Error("Live summary request failed");
        }
        const json = (await response.json()) as LiveSummary;
        if (isActive) {
          setData(json);
          setError(null);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Unknown live data error");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      isActive = false;
    };
  }, []);

  return { data, loading, error };
};
