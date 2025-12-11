
# Plex Integration Strategy

This document details how `PlexPicker` connects to a Plex Media Server (PMS). This is the most technically complex aspect of the application due to CORS (Cross-Origin Resource Sharing) and Mixed Content (HTTP/HTTPS) restrictions in modern browsers.

## Authentication Flow (PIN)
We use the Plex.tv PIN flow (v2 API) to obtain an authentication token without handling username/passwords directly.

1.  **Request PIN:**
    *   `POST https://plex.tv/api/v2/pins`
    *   Headers include `X-Plex-Client-Identifier` (generated randomly and stored in localStorage).
2.  **User Authorization:**
    *   App opens a popup window to `https://app.plex.tv/auth#?code=...`.
    *   User signs in to Plex and approves the app.
3.  **Polling:**
    *   App polls `GET https://plex.tv/api/v2/pins/{id}`.
    *   Once authorized, the response contains `authToken`.

## Server Discovery & Connection Racing
Once authenticated, we fetch the list of servers via `https://plex.tv/api/v2/resources`. A single server resource may have multiple `connections` (Local IP, Public IP, Plex Relay).

### The Challenge
A user might access PlexPicker via HTTPS (e.g., Vercel). Their Plex server might be on a Local IP (HTTP). Browsers block requests from HTTPS to HTTP (Mixed Content). Conversely, if the server has a self-signed certificate (typical Plex setup), the browser may reject the connection unless the user has manually accepted the cert.

### The Solution: Connection Racing
In `Setup.tsx` -> `handleServerSelect`, we implement a race logic to find the first *working* connection.

1.  **Filter:**
    *   If it's a **Shared Server** (owned by a friend), we discard Local IPs (they won't work).
2.  **Sort:**
    *   Priority 1: Secure (HTTPS).
    *   Priority 2: Remote/Public IPs.
    *   Priority 3: Plex Relay (Slow, but bypasses firewall/NAT issues).
3.  **Race:**
    *   We trigger `fetch` requests to `/identity` on all viable connection URIs simultaneously.
    *   `Promise.any` is used to resolve with the first successful connection.
    *   If the app is on HTTPS, we prioritize HTTPS connections.

## API Endpoints Used

| Method | Endpoint | Purpose |
| :--- | :--- | :--- |
| POST | `plex.tv/api/v2/pins` | Generate Auth PIN |
| GET | `plex.tv/api/v2/resources` | List user's servers |
| GET | `{server_uri}/identity` | Validate connection & get MachineID |
| GET | `{server_uri}/library/sections` | List libraries (Movies/TV) |
| GET | `{server_uri}/library/sections/{id}/all` | Get all items in a library |

## Headers
All requests must include:
*   `X-Plex-Token`: The Auth Token.
*   `X-Plex-Client-Identifier`: The browser's unique ID.
*   `Accept`: `application/json` (Force JSON response instead of XML).
