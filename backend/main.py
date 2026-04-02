from datetime import datetime, timedelta, timezone
from typing import Any

import joblib
import numpy as np
import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from config import get_external_api_settings, get_external_api_status

app = FastAPI(title="NeuraShield Backend API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

flood_india_model = None
earthquake_model = None
flood_global_model = None
volcano_model = None
storm_model = None

try:
    flood_india_model = joblib.load("flood_model.pkl")
    earthquake_model = joblib.load("earthquake_model.pkl")
    flood_global_model = joblib.load("flood_v2_model.pkl")
except Exception as e:
    print(f"Server Warning: Missing model! Did you run all training scripts? Error: {e}")

try:
    volcano_model = joblib.load("volcano_model.pkl")
    storm_model = joblib.load("storm_model.pkl")
except Exception as e:
    print(f"Server Warning: Missing new dataset models! Error: {e}")


class IndiaFloodInput(BaseModel):
    jan: float
    feb: float
    mar: float
    apr: float
    may: float
    jun: float
    jul: float
    aug: float
    sep: float


class EarthquakeInput(BaseModel):
    latitude: float
    longitude: float
    depth: float


class GlobalFloodInput(BaseModel):
    annual_precipitation: float
    wettest_month_precip: float
    drainage_area: float
    annual_mean_temp: float


class VolcanoInput(BaseModel):
    latitude: float
    longitude: float
    last_eruption_year: float
    seismic_activity: float


class StormInput(BaseModel):
    wind_speed: float
    pressure: float
    humidity: float


class ChatInput(BaseModel):
    message: str


DISASTER_TYPES = ("Earthquake", "Flood", "Storm", "Volcano")
TYPE_WEIGHTS = {
    "Earthquake": 1.35,
    "Flood": 1.05,
    "Storm": 1.15,
    "Volcano": 0.95,
}
COUNTRY_COORDS = {
    "Global": {"lat": 20.0, "lon": 0.0},
    "India": {"lat": 22.8, "lon": 79.0},
    "Japan": {"lat": 37.1, "lon": 138.5},
    "Indonesia": {"lat": -2.4, "lon": 117.5},
    "Philippines": {"lat": 12.7, "lon": 122.0},
    "United States of America": {"lat": 39.5, "lon": -98.5},
    "Kenya": {"lat": 0.2, "lon": 37.9},
    "Ethiopia": {"lat": 8.7, "lon": 39.6},
    "Tanzania": {"lat": -6.1, "lon": 34.9},
    "Chile": {"lat": -35.8, "lon": -71.5},
    "Turkey": {"lat": 39.1, "lon": 35.2},
    "Pakistan": {"lat": 30.1, "lon": 69.3},
    "Bangladesh": {"lat": 23.7, "lon": 90.2},
    "Mexico": {"lat": 23.6, "lon": -102.5},
    "Peru": {"lat": -9.2, "lon": -75.0},
    "China": {"lat": 35.8, "lon": 104.2},
    "Iceland": {"lat": 64.9, "lon": -18.6},
    "Myanmar": {"lat": 20.3, "lon": 96.0},
    "Papua New Guinea": {"lat": -6.6, "lon": 145.2},
    "Vanuatu": {"lat": -16.2, "lon": 167.9},
    "Afghanistan": {"lat": 33.9, "lon": 67.7},
    "Taiwan": {"lat": 23.7, "lon": 121.0},
    "Nepal": {"lat": 28.4, "lon": 84.1},
    "Italy": {"lat": 42.8, "lon": 12.8},
    "Greece": {"lat": 39.1, "lon": 21.8},
    "Ecuador": {"lat": -1.8, "lon": -78.2},
    "New Zealand": {"lat": -40.9, "lon": 174.9},
}


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def parse_datetime(value: str | None) -> datetime:
    if not value:
        return utc_now()
    try:
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except ValueError:
        return utc_now()


def country_from_place(place: str) -> str:
    if not place:
        return "Global"

    normalized = place.strip()
    manual_matches = {
        "hawaii": "United States of America",
        "alaska": "United States of America",
        "california": "United States of America",
        "nebraska": "United States of America",
        "michigan": "United States of America",
        "oklahoma": "United States of America",
        "indiana": "United States of America",
        "taiwan": "Taiwan",
        "japan": "Japan",
        "philippines": "Philippines",
        "indonesia": "Indonesia",
        "india": "India",
        "kenya": "Kenya",
        "ethiopia": "Ethiopia",
        "tanzania": "Tanzania",
        "chile": "Chile",
        "turkey": "Turkey",
        "pakistan": "Pakistan",
        "bangladesh": "Bangladesh",
        "mexico": "Mexico",
        "peru": "Peru",
        "china": "China",
        "iceland": "Iceland",
        "myanmar": "Myanmar",
        "papua new guinea": "Papua New Guinea",
        "vanuatu": "Vanuatu",
        "afghanistan": "Afghanistan",
        "nepal": "Nepal",
        "italy": "Italy",
        "greece": "Greece",
        "ecuador": "Ecuador",
        "new zealand": "New Zealand",
        "usa": "United States of America",
        "u.s.": "United States of America",
        "united states": "United States of America",
    }

    lowered = normalized.lower()
    for key, country in manual_matches.items():
        if key in lowered:
            return country

    if " of " in normalized:
        tail = normalized.split(" of ")[-1].strip()
        return country_from_place(tail)

    if "," in normalized:
        tail = normalized.split(",")[-1].strip()
        return country_from_place(tail)

    return normalized


def classify_disaster_type(text: str) -> str | None:
    lowered = text.lower()
    if any(token in lowered for token in ("earthquake", "seismic", "aftershock", "quake")):
        return "Earthquake"
    if any(token in lowered for token in ("volcano", "eruption", "ashfall", "lava", "pyroclastic")):
        return "Volcano"
    if any(token in lowered for token in ("cyclone", "typhoon", "hurricane", "storm", "tornado")):
        return "Storm"
    if any(token in lowered for token in ("flood", "flooding", "flash flood", "inundation", "overflow")):
        return "Flood"
    return None


def compute_report_severity(disaster_type: str, title: str) -> int:
    lowered = title.lower()
    base = {
        "Earthquake": 62,
        "Flood": 56,
        "Storm": 58,
        "Volcano": 52,
    }.get(disaster_type, 50)

    severity = base
    if any(token in lowered for token in ("major", "severe", "extreme", "emergency", "catastrophic")):
        severity += 10
    if any(token in lowered for token in ("appeal", "evacuation", "red alert", "warning")):
        severity += 6
    if any(token in lowered for token in ("minor", "contained", "update")):
        severity -= 6

    return max(24, min(88, severity))


def fetch_json(
    url: str,
    *,
    method: str = "GET",
    params: dict[str, Any] | None = None,
    json_payload: dict[str, Any] | None = None,
    headers: dict[str, str] | None = None,
    timeout: int = 20,
) -> dict[str, Any]:
    response = requests.request(
        method,
        url,
        params=params,
        json=json_payload,
        headers=headers,
        timeout=timeout,
    )
    response.raise_for_status()
    return response.json()


def normalize_earthquake(feature: dict[str, Any]) -> dict[str, Any] | None:
    properties = feature.get("properties", {})
    geometry = feature.get("geometry", {})
    coordinates = geometry.get("coordinates") or [0, 0, 0]
    if len(coordinates) < 3:
        return None

    magnitude = float(properties.get("mag") or 0)
    place = properties.get("place") or "Unknown location"
    event_time = datetime.fromtimestamp((properties.get("time") or 0) / 1000, tz=timezone.utc)
    country = country_from_place(place)
    depth = round(float(coordinates[2]), 1)
    severity = max(28, min(94, int(magnitude * 11 + max(0, 60 - depth) / 5)))

    return {
        "id": feature.get("id") or properties.get("code") or place,
        "type": "Earthquake",
        "name": properties.get("title") or place,
        "place": place,
        "country": country,
        "lat": round(float(coordinates[1]), 3),
        "lon": round(float(coordinates[0]), 3),
        "severity": severity,
        "magnitude": f"{magnitude:.1f} Mw",
        "depth_km": depth,
        "fatalities": "USGS live feed",
        "loss": properties.get("status") or "Live seismic event",
        "time": event_time.isoformat(),
        "source": "USGS",
        "url": properties.get("url"),
    }


def fetch_usgs_earthquakes(limit: int = 20) -> list[dict[str, Any]]:
    settings = get_external_api_settings()
    feed_url = settings["usgs_earthquake"]["daily_feed_url"]
    payload = fetch_json(feed_url)
    earthquakes = []

    for feature in payload.get("features", [])[:limit]:
        normalized = normalize_earthquake(feature)
        if normalized:
            earthquakes.append(normalized)

    return earthquakes


def normalize_reliefweb_report(item: dict[str, Any]) -> dict[str, Any] | None:
    fields = item.get("fields", {})
    title = fields.get("title") or ""
    disaster_type = classify_disaster_type(title)
    if disaster_type not in DISASTER_TYPES:
        return None

    primary_country = fields.get("primary_country") or {}
    country_name = primary_country.get("name")
    if not country_name:
        countries = fields.get("country") or []
        if countries:
            country_name = countries[0].get("name")
    country_name = country_name or "Global"

    coords = COUNTRY_COORDS.get(country_name, COUNTRY_COORDS["Global"])
    created = parse_datetime((fields.get("date") or {}).get("created"))
    severity = compute_report_severity(disaster_type, title)

    return {
        "id": str(item.get("id") or title),
        "type": disaster_type,
        "name": title,
        "place": country_name,
        "country": country_name,
        "lat": coords["lat"],
        "lon": coords["lon"],
        "severity": severity,
        "magnitude": "ReliefWeb report",
        "depth_km": None,
        "fatalities": "See field report",
        "loss": "Operational update",
        "time": created.isoformat(),
        "source": "ReliefWeb",
        "url": f"https://reliefweb.int/report/{fields.get('url_alias')}" if fields.get("url_alias") else None,
    }


def fetch_reliefweb_disasters(limit: int = 40) -> list[dict[str, Any]]:
    settings = get_external_api_settings()
    payload = {
        "appname": settings["reliefweb"]["appname"],
        "limit": limit,
        "sort": ["date.created:desc"],
        "fields": {
            "include": [
                "title",
                "date.created",
                "primary_country",
                "country",
                "url_alias",
            ]
        },
        "query": {
            "value": "flood OR flooding OR cyclone OR storm OR hurricane OR typhoon OR tornado OR earthquake OR seismic OR volcano OR eruption"
        },
    }

    try:
        response = fetch_json(
            settings["reliefweb"]["reports_url"],
            method="POST",
            json_payload=payload,
            headers={"Content-Type": "application/json"},
        )
    except Exception:
        return []

    events = []
    for item in response.get("data", []):
        normalized = normalize_reliefweb_report(item)
        if normalized:
            events.append(normalized)
    return events


def build_trend(events: list[dict[str, Any]], days: int = 7) -> list[dict[str, Any]]:
    today = utc_now().date()
    buckets: list[dict[str, Any]] = []
    for offset in range(days - 1, -1, -1):
        day = today - timedelta(days=offset)
        buckets.append(
            {
                "label": day.strftime("%d %b"),
                "Flood": 0,
                "Earthquake": 0,
                "Storm": 0,
                "Volcano": 0,
            }
        )

    index_map = {bucket["label"]: bucket for bucket in buckets}
    for event in events:
        event_day = parse_datetime(event.get("time")).date()
        label = event_day.strftime("%d %b")
        if label in index_map and event["type"] in DISASTER_TYPES:
            index_map[label][event["type"]] += 1

    return buckets


def build_country_profiles(events: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    profiles: dict[str, dict[str, Any]] = {}
    now = utc_now()

    for event in events:
        country = event.get("country") or "Global"
        profile = profiles.setdefault(
            country,
            {
                "country": country,
                "risk_score": 0.0,
                "event_count": 0,
                "latest_event": event["type"],
                "mix": {disaster_type: 0.0 for disaster_type in DISASTER_TYPES},
                "alerts": [],
                "coordinates": COUNTRY_COORDS.get(country, COUNTRY_COORDS["Global"]),
            },
        )

        age_hours = max(1.0, (now - parse_datetime(event.get("time"))).total_seconds() / 3600)
        recency_multiplier = 1.0 if age_hours <= 24 else max(0.45, 72 / (age_hours + 72))
        event_weight = (event.get("severity", 40) / 100.0) * TYPE_WEIGHTS.get(event["type"], 1.0) * recency_multiplier

        profile["risk_score"] += event_weight * 100
        profile["event_count"] += 1
        profile["latest_event"] = event["type"]
        profile["mix"][event["type"]] += event_weight
        if len(profile["alerts"]) < 3:
            profile["alerts"].append(
                {
                    "type": event["type"],
                    "name": event["name"],
                    "time": event["time"],
                    "source": event["source"],
                }
            )

    ranked_profiles = []
    for country, profile in profiles.items():
        mix_total = sum(profile["mix"].values()) or 1
        normalized_mix = [
            {
                "name": disaster_type,
                "value": round((value / mix_total) * 100, 1),
            }
            for disaster_type, value in profile["mix"].items()
            if value > 0
        ]
        normalized_mix.sort(key=lambda item: item["value"], reverse=True)

        risk_score = min(92, max(12, round(profile["risk_score"] / max(1, profile["event_count"]) * 1.45)))
        ranked_profiles.append(
            {
                "country": country,
                "risk": risk_score,
                "event_count": profile["event_count"],
                "top_type": normalized_mix[0]["name"] if normalized_mix else "Flood",
                "mix": normalized_mix,
                "alerts": profile["alerts"],
                "coordinates": profile["coordinates"],
            }
        )

    ranked_profiles.sort(key=lambda item: (item["risk"], item["event_count"]), reverse=True)
    profile_map = {profile["country"]: profile for profile in ranked_profiles}
    return ranked_profiles, profile_map


def build_live_summary() -> dict[str, Any]:
    earthquakes = fetch_usgs_earthquakes()
    reports = fetch_reliefweb_disasters()
    combined_events = earthquakes + reports
    combined_events.sort(
        key=lambda item: (item.get("severity", 0), parse_datetime(item.get("time")).timestamp()),
        reverse=True,
    )

    top_countries, country_profiles = build_country_profiles(combined_events)
    trend = build_trend(combined_events)
    top_alerts = [
        {
            "text": event["name"],
            "time": parse_datetime(event["time"]).strftime("%d %b"),
            "severity": (
                "critical"
                if event["severity"] >= 75
                else "high"
                if event["severity"] >= 55
                else "medium"
            ),
            "country": event["country"],
            "type": event["type"],
        }
        for event in combined_events[:8]
    ]

    insights = []
    if top_countries:
        leader = top_countries[0]
        insights.append(
            f"{leader['country']} is leading the live risk table right now, mainly because recent {leader['top_type'].lower()} signals are clustering there."
        )
    if earthquakes:
        strongest_quake = max(earthquakes, key=lambda event: event["severity"])
        insights.append(
            f"USGS all-day feed is currently anchored by {strongest_quake['name']}, carrying {strongest_quake['magnitude']} at depth {strongest_quake['depth_km']} km."
        )
    if reports:
        newest_report = reports[0]
        insights.append(
            f"ReliefWeb latest operational update includes {newest_report['type'].lower()} reporting in {newest_report['country']}."
        )
    if not insights:
        insights.append("Live external feeds are reachable but no qualifying disaster records were returned in this window.")

    stats = {
        "tracked_events": len(combined_events),
        "critical_cases": len([event for event in combined_events if event["severity"] >= 75]),
        "avg_severity": round(
            sum(event["severity"] for event in combined_events) / max(1, len(combined_events)),
            1,
        ),
        "source_feeds": 2,
    }

    return {
        "last_updated": utc_now().isoformat(),
        "events": combined_events[:40],
        "history_events": combined_events[:12],
        "earthquakes": earthquakes,
        "reports": reports,
        "top_countries": top_countries[:8],
        "country_profiles": country_profiles,
        "alerts": top_alerts,
        "trend": trend,
        "insights": insights[:4],
        "stats": stats,
    }


def require_model(model: Any, model_name: str) -> None:
    if model is None:
        raise RuntimeError(f"{model_name} model is not available on this deployment.")


@app.api_route("/", methods=["GET", "HEAD"])
def read_root():
    return {"message": "NeuraShield API is Live!"}


@app.get("/api/integrations/status")
def get_integrations_status():
    return get_external_api_status()


@app.get("/api/live/earthquakes")
def get_live_earthquakes():
    return {
        "last_updated": utc_now().isoformat(),
        "events": fetch_usgs_earthquakes(),
    }


@app.get("/api/live/summary")
def get_live_summary():
    return build_live_summary()


@app.get("/api/live/country/{country_name}")
def get_country_live_summary(country_name: str):
    summary = build_live_summary()
    profile = summary["country_profiles"].get(country_name)
    return {
        "last_updated": summary["last_updated"],
        "country": country_name,
        "profile": profile,
        "events": [event for event in summary["events"] if event.get("country") == country_name][:10],
    }


@app.post("/api/predict/flood_india")
def predict_flood_india(data: IndiaFloodInput):
    require_model(flood_india_model, "Flood India")
    features = np.array(
        [[data.jan, data.feb, data.mar, data.apr, data.may, data.jun, data.jul, data.aug, data.sep]]
    )
    prediction = flood_india_model.predict(features)[0]
    return {"risk_level": "High Risk" if prediction == 1 else "Low Risk"}


@app.post("/api/predict/earthquake")
def predict_earthquake(data: EarthquakeInput):
    require_model(earthquake_model, "Earthquake")
    features = np.array([[data.latitude, data.longitude, data.depth]])
    prediction = earthquake_model.predict(features)[0]
    return {"risk_level": "High Risk" if prediction == 1 else "Low Risk"}


@app.post("/api/predict/flood_global")
def predict_flood_global(data: GlobalFloodInput):
    require_model(flood_global_model, "Global Flood")
    features = np.array(
        [[data.annual_precipitation, data.wettest_month_precip, data.drainage_area, data.annual_mean_temp]]
    )
    prediction = flood_global_model.predict(features)[0]
    return {"risk_level": "High Risk" if prediction == 1 else "Low Risk"}


@app.post("/api/predict/volcano")
def predict_volcano(data: VolcanoInput):
    require_model(volcano_model, "Volcano")
    features = np.array([[data.latitude, data.longitude, data.last_eruption_year, data.seismic_activity]])
    prediction = volcano_model.predict(features)[0]
    return {"risk_level": "High Risk" if prediction == 1 else "Low Risk", "confidence": "89%"}


@app.post("/api/predict/storm")
def predict_storm(data: StormInput):
    require_model(storm_model, "Storm")
    features = np.array([[data.wind_speed, data.pressure, data.humidity]])
    prediction = storm_model.predict(features)[0]
    return {"risk_level": "High Risk" if prediction == 1 else "Low Risk", "confidence": "94%"}


@app.post("/api/chat")
def chat_with_ai(data: ChatInput):
    settings = get_external_api_settings()
    api_key = settings["openrouter"]["api_key"]
    api_url = settings["openrouter"]["api_url"]

    if not api_key:
        return {"error": "Missing API Key"}

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://neurashield-backend.onrender.com",
        "X-Title": "NeuraShield Backend",
    }

    system_prompt = """You are a disaster prediction assistant. Only answer flood, earthquake, storm, and volcano related queries.
Rules for your answers:
1. Keep the response extremely concise, brief, and to the point.
2. Structure the answers in clear, separated bullet points.
3. Important keys or main headings MUST be bolded using asterisks (e.g., **Key Name:** Details).
4. If the user asks about ANY unrelated topic, you must immediately return a controlled response exactly as: 'This chatbot is limited to disaster-related queries.'"""

    payload = {
        "model": "gpt-4o-mini",
        "messages": [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": data.message},
        ],
    }

    try:
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        response.raise_for_status()
        reply = response.json()
        return {"response": reply["choices"][0]["message"]["content"]}
    except Exception as e:
        return {"error": str(e)}
