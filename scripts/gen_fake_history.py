#!/usr/bin/env python3
"""Generate synthetic historical incident data for Austin, TX."""

import csv
import random
import math
from datetime import datetime, timedelta

OUTPUT = "services/ml/data/historical_incidents.csv"
NUM_ROWS = 10_000
SEED = 42

random.seed(SEED)

# 3 hotspots in Austin
HOTSPOTS = [
    {"name": "downtown", "lat": 30.2672, "lng": -97.7431, "weight": 0.40, "spread": 0.025},
    {"name": "north",    "lat": 30.3598, "lng": -97.7143, "weight": 0.30, "spread": 0.040},
    {"name": "east",     "lat": 30.2774, "lng": -97.7013, "weight": 0.30, "spread": 0.030},
]

INCIDENT_TYPES = ["medical", "fire", "accident", "hazmat", "other"]

# Time-of-day weight for each type (24 buckets, one per hour)
def type_hour_weight(incident_type: str, hour: int) -> float:
    if incident_type == "medical":
        return 1.0  # 24/7 uniform
    elif incident_type == "accident":
        # Rush hour peaks
        if 7 <= hour <= 9 or 16 <= hour <= 19:
            return 2.5
        return 0.8
    elif incident_type == "fire":
        # Skew nighttime
        if 22 <= hour or hour <= 4:
            return 1.8
        return 0.7
    elif incident_type == "hazmat":
        return 1.0
    else:
        return 1.0


def sample_location():
    # Pick hotspot proportionally by weight
    r = random.random()
    cumulative = 0.0
    chosen = HOTSPOTS[-1]
    for hs in HOTSPOTS:
        cumulative += hs["weight"]
        if r <= cumulative:
            chosen = hs
            break
    lat = chosen["lat"] + random.gauss(0, chosen["spread"])
    lng = chosen["lng"] + random.gauss(0, chosen["spread"] * 1.3)
    return lat, lng


def sample_type(hour: int) -> str:
    weights = [type_hour_weight(t, hour) for t in INCIDENT_TYPES]
    total = sum(weights)
    r = random.random() * total
    cumulative = 0.0
    for t, w in zip(INCIDENT_TYPES, weights):
        cumulative += w
        if r <= cumulative:
            return t
    return INCIDENT_TYPES[0]


now = datetime.now()
start = now - timedelta(days=365)

rows = []
for _ in range(NUM_ROWS):
    delta = timedelta(seconds=random.uniform(0, 365 * 86400))
    ts = start + delta
    hour = ts.hour
    lat, lng = sample_location()
    incident_type = sample_type(hour)
    severity = random.choices([1, 2, 3, 4, 5], weights=[5, 15, 35, 30, 15])[0]
    rows.append({
        "timestamp": ts.isoformat(),
        "lat": round(lat, 6),
        "lng": round(lng, 6),
        "type": incident_type,
        "severity": severity,
    })

with open(OUTPUT, "w", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=["timestamp", "lat", "lng", "type", "severity"])
    writer.writeheader()
    writer.writerows(rows)

print(f"Generated {NUM_ROWS} rows → {OUTPUT}")
