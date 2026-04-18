"""SIREN Predictive Heatmap Service — FastAPI"""

import json
import math
import os
from datetime import datetime
from pathlib import Path

import numpy as np
import pandas as pd
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from scipy.stats import gaussian_kde

app = FastAPI(title="SIREN ML Heatmap", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)

DATA_PATH = Path(__file__).parent / "data" / "historical_incidents.csv"

_df: pd.DataFrame | None = None


def load_data() -> pd.DataFrame:
    global _df
    if _df is None:
        if DATA_PATH.exists():
            df = pd.read_csv(DATA_PATH, parse_dates=["timestamp"])
            _df = df
        else:
            # Generate in-memory stub if CSV missing
            _df = _generate_stub()
    return _df


def _generate_stub() -> pd.DataFrame:
    """Minimal stub so the service starts even without the CSV."""
    rng = np.random.default_rng(42)
    n = 500
    hotspots = [
        (30.2672, -97.7431, 0.4),
        (30.3598, -97.7143, 0.3),
        (30.2774, -97.7013, 0.3),
    ]
    lats, lngs, hours = [], [], []
    for _ in range(n):
        r = rng.random()
        cumulative = 0.0
        for lat_c, lng_c, w in hotspots:
            cumulative += w
            if r <= cumulative:
                lats.append(lat_c + rng.normal(0, 0.025))
                lngs.append(lng_c + rng.normal(0, 0.03))
                break
        hours.append(int(rng.integers(0, 24)))

    now = datetime.now()
    timestamps = pd.date_range(end=now, periods=n, freq="h")
    return pd.DataFrame({
        "timestamp": timestamps,
        "lat": lats,
        "lng": lngs,
        "type": rng.choice(["medical", "fire", "accident", "other"], size=n),
        "severity": rng.integers(1, 6, size=n),
    })


def _hour_similarity(row_hour: float, target_hour: int) -> float:
    """Circular similarity between two hours of day (0..1)."""
    diff = abs(row_hour - target_hour)
    diff = min(diff, 24 - diff)  # wrap
    return math.exp(-0.5 * (diff / 3.0) ** 2)  # sigma=3 hours


def _recency_weight(ts: pd.Series, now_ts: datetime) -> np.ndarray:
    """Exponential recency decay; ~180-day half-life."""
    days_ago = (now_ts - ts).dt.total_seconds() / 86400
    return np.exp(-days_ago / 180)


@app.get("/")
def health():
    return {"status": "ok", "service": "SIREN ML Heatmap"}


@app.get("/heatmap")
def heatmap(at: str = Query(default=None)):
    """Return a GeoJSON FeatureCollection of heatmap points."""
    try:
        target_dt = datetime.fromisoformat(at) if at else datetime.now()
    except (ValueError, TypeError):
        target_dt = datetime.now()

    df = load_data()

    # Compute per-row weights
    hour_weights = df["timestamp"].dt.hour.apply(
        lambda h: _hour_similarity(h, target_dt.hour)
    ).values
    recency_weights = _recency_weight(df["timestamp"], target_dt)
    weights = hour_weights * recency_weights
    weights = weights / weights.sum()  # normalize

    # Austin bounding box
    LAT_MIN, LAT_MAX = 30.10, 30.50
    LNG_MIN, LNG_MAX = -97.95, -97.55
    GRID = 60

    lat_grid = np.linspace(LAT_MIN, LAT_MAX, GRID)
    lng_grid = np.linspace(LNG_MIN, LNG_MAX, GRID)
    ll_mesh = np.array([(lat, lng) for lat in lat_grid for lng in lng_grid])

    # Weighted KDE
    try:
        data = np.vstack([df["lat"].values, df["lng"].values])
        kde = gaussian_kde(data, weights=weights, bw_method="scott")
        intensities = kde(ll_mesh.T)
    except Exception:
        # Fall back to simple distance-weighted hotspots
        intensities = np.array([
            math.exp(-((pt[0] - 30.2672) ** 2 + (pt[1] - (-97.7431)) ** 2) / 0.01)
            for pt in ll_mesh
        ])

    # Normalize to [0, 1]
    if intensities.max() > 0:
        intensities = intensities / intensities.max()

    # Build GeoJSON
    features = []
    threshold = float(np.percentile(intensities, 40))  # skip very low-density points
    for (lat, lng), intensity in zip(ll_mesh, intensities):
        if intensity < threshold:
            continue
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [float(lng), float(lat)]},
            "properties": {"intensity": round(float(intensity), 4)},
        })

    return {"type": "FeatureCollection", "features": features}
