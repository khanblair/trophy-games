# FootyStats Proxy API

> A lightweight HTTP proxy that wraps the FootyStats API — providing daily match listings, individual match H2H stats, and a combined bulk endpoint for efficient one-request data fetching.

**Base URL**
```
http://us3.bot-hosting.net:20562
```

---

## Endpoints

### 1. `GET /matches`

Fetch all matches scheduled for a given date.

**Query Parameters**

| Parameter | Required | Default | Description |
|---|---|---|---|
| `date` | No | Today | Date in `YYYY-MM-DD` format |
| `tz` | No | `WAT` | Timezone for match times |
| `division` | No | `leagues` | Division filter (e.g. `leagues`) |

**Example Request**
```
GET /matches?date=2026-06-06&tz=WAT&division=leagues
```

**Success Response**
```json
{
  "success": true,
  "date": "2026-06-06",
  "data": { ... }
}
```

**Error Response**
```json
{
  "success": false,
  "error": "FootyStats API error: 403 Forbidden"
}
```

HTTP Status codes: `200` success · `502` upstream FootyStats error · `500` internal server error

---

### 2. `GET /match-stats`

Fetch H2H stats and detailed data for a single match by its ID.

**Query Parameters**

| Parameter | Required | Default | Description |
|---|---|---|---|
| `match_id` | **Yes** | — | FootyStats match ID (integer) |

**Example Request**
```
GET /match-stats?match_id=8540732
```

**Success Response**
```json
{
  "success": true,
  "match_id": "8540732",
  "data": { ... }
}
```

**Error Response — missing parameter**
```json
{
  "success": false,
  "error": "match_id is required"
}
```

HTTP Status codes: `200` success · `400` missing `match_id` · `502` upstream error · `500` internal server error

---

### 3. `GET /matches-with-stats` ⭐

**The power endpoint.** Fetches the daily match list AND H2H stats for multiple matches in a **single parallel request**. All network calls are made concurrently — no waiting for each match serially.

**Query Parameters**

| Parameter | Required | Default | Description |
|---|---|---|---|
| `date` | No | Today | Date in `YYYY-MM-DD` format |
| `match_ids` | No | — | Comma-separated list of match IDs |
| `tz` | No | `WAT` | Timezone for match times |
| `division` | No | `leagues` | Division filter |

**Example Request**
```
GET /matches-with-stats?date=2026-06-06&match_ids=8540732,8461965
```

**Success Response**
```json
{
  "success": true,
  "date": "2026-06-06",
  "matches": { ... },
  "stats": {
    "8540732": { ... },
    "8461965": { ... }
  }
}
```

The `stats` field is a map of `match_id → stats object`. If a specific match stat fails to load (e.g. invalid ID), its entry will contain an error instead of silently failing the whole request:

```json
"stats": {
  "8540732": { "error": "FootyStats API error: 404 Not Found" },
  "8461965": { ... }
}
```

HTTP Status codes: `200` success (even with partial stat errors) · `502` if the daily matches list itself fails · `500` internal server error

---

## Response Envelope

All endpoints use a consistent envelope:

| Field | Type | Description |
|---|---|---|
| `success` | boolean | `true` on success, `false` on any error |
| `error` | string | Present only on failure — human-readable error message |
| `data` / `matches` / `stats` | object | Present only on success — the actual payload |

---

## Usage Notes

**Timezone values** — the `tz` parameter accepts standard timezone abbreviations supported by FootyStats. Common values for African markets:

| Value | Zone |
|---|---|
| `WAT` | West Africa Time (UTC+1) — Nigeria, Ghana, etc. |
| `EAT` | East Africa Time (UTC+3) — Kenya, Tanzania |
| `CAT` | Central Africa Time (UTC+2) — South Africa |
| `UTC` | UTC / GMT |

**Partial failures on `/matches-with-stats`** — if some match IDs are invalid, only those entries in `stats` will contain an `"error"` key. The rest of the response (including `matches` and other valid stats) is still returned with `"success": true`. Always check each stat entry individually in your client code.

**Date format** — always use `YYYY-MM-DD`. Requests without a date fall back to the server's current date (WAT timezone).

**Match IDs** — obtain match IDs from the `/matches` endpoint first, then pass selected IDs to `/matches-with-stats` or `/match-stats` for detailed H2H data.

---

## Quick Integration Example (Python)

```python
import requests

BASE = "http://us3.bot-hosting.net:20562"

# Step 1: Get today's matches
resp = requests.get(f"{BASE}/matches", params={"date": "2026-06-06", "tz": "WAT"})
matches = resp.json()

# Step 2: Fetch stats for specific matches in one call
resp = requests.get(f"{BASE}/matches-with-stats", params={
    "date": "2026-06-06",
    "match_ids": "8540732,8461965",
    "tz": "WAT"
})
data = resp.json()

if data["success"]:
    all_matches = data["matches"]
    stats = data["stats"]  # keyed by match_id string
    for match_id, stat in stats.items():
        if "error" in stat:
            print(f"[{match_id}] failed: {stat['error']}")
        else:
            print(f"[{match_id}] stats loaded OK")
```

---

## Quick Integration Example (JavaScript / fetch)

```javascript
const BASE = "http://us3.bot-hosting.net:20562";

async function getMatchesWithStats(date, matchIds) {
  const params = new URLSearchParams({
    date,
    match_ids: matchIds.join(","),
    tz: "WAT",
  });

  const res = await fetch(`${BASE}/matches-with-stats?${params}`);
  const data = await res.json();

  if (!data.success) {
    throw new Error(data.error);
  }

  return data; // { matches, stats }
}

// Usage
const result = await getMatchesWithStats("2026-06-06", ["8540732", "8461965"]);
console.log(result.stats["8540732"]);
```

---

*API powered by FootyStats · Proxied via REALLMOD infrastructure*
