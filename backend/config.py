import os
from dotenv import load_dotenv

load_dotenv()


def get_external_api_settings() -> dict:
    return {
        "weatherapi": {
            "base_url": os.getenv("WEATHERAPI_BASE_URL", "https://api.weatherapi.com/v1"),
            "api_key": os.getenv("WEATHERAPI_API_KEY"),
        },
        "nasa_eonet": {
            "events_url": os.getenv("NASA_EONET_API_URL", "https://eonet.gsfc.nasa.gov/api/v3/events"),
        },
        "nasa_firms": {
            "base_url": os.getenv("NASA_FIRMS_API_BASE_URL", "https://firms.modaps.eosdis.nasa.gov/api/area"),
            "map_key": os.getenv("NASA_FIRMS_MAP_KEY"),
        },
        "usgs_earthquake": {
            "query_url": os.getenv("USGS_EARTHQUAKE_API_URL", "https://earthquake.usgs.gov/fdsnws/event/1/query"),
            "format": os.getenv("USGS_EARTHQUAKE_FORMAT", "geojson"),
            "daily_feed_url": os.getenv(
                "USGS_EARTHQUAKE_DAILY_FEED_URL",
                "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson",
            ),
        },
        "usgs_volcano": {
            "messages_url": os.getenv("USGS_VOLCANO_API_URL", "https://volcanoes.usgs.gov/vsc/api/volcanoMessageApi"),
            "volcanoes_url": os.getenv("USGS_VOLCANOES_US_URL", "https://volcanoes.usgs.gov/vsc/api/volcanoApi/volcanoesUS"),
        },
        "smithsonian": {
            "weekly_report_url": os.getenv("SMITHSONIAN_VOLCANO_REPORT_URL", "https://a.cf11.si.edu/reports_weekly.cfm"),
            "geojson_url": os.getenv(
                "SMITHSONIAN_VOLCANO_GEOJSON_URL",
                "https://webservices.volcano.si.edu/geoserver/GVP-VOTW/wfs?service=WFS&version=1.0.0&request=GetFeature&typeName=GVP-VOTW:Holocene_Volcanoes&outputFormat=application/json",
            ),
        },
        "openrouter": {
            "api_url": os.getenv("OPENROUTER_API_URL", "https://openrouter.ai/api/v1/chat/completions"),
            "api_key": os.getenv("OPENROUTER_API_KEY"),
        },
        "reliefweb": {
            "reports_url": os.getenv("RELIEFWEB_REPORTS_API_URL", "https://api.reliefweb.int/v2/reports"),
            "appname": os.getenv("RELIEFWEB_APPNAME", "neurashield-backend.onrender.com"),
        },
    }


def get_external_api_status() -> dict:
    settings = get_external_api_settings()
    return {
        "weatherapi_configured": bool(settings["weatherapi"]["api_key"]),
        "eonet_configured": bool(settings["nasa_eonet"]["events_url"]),
        "firms_configured": bool(settings["nasa_firms"]["map_key"]),
        "usgs_earthquake_configured": bool(settings["usgs_earthquake"]["query_url"]),
        "usgs_earthquake_daily_feed_configured": bool(settings["usgs_earthquake"]["daily_feed_url"]),
        "usgs_volcano_configured": bool(settings["usgs_volcano"]["messages_url"]),
        "smithsonian_configured": bool(
            settings["smithsonian"]["weekly_report_url"]
            and settings["smithsonian"]["geojson_url"]
        ),
        "openrouter_configured": bool(settings["openrouter"]["api_key"]),
        "reliefweb_configured": bool(
            settings["reliefweb"]["reports_url"] and settings["reliefweb"]["appname"]
        ),
    }
