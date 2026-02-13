# 🌙 Dream Journal

A personal dream journal — mobile-optimized, self-hosted, beautifully designed.
Built with React + Vite (frontend) and FastAPI + SQLite (backend), packaged as a single Docker container.

---

## Quick Start

### Prerequisites
- Docker & Docker Compose installed on your Linux machine

### 1. Clone / copy this project

```bash
git clone <your-repo> dreamjournal
cd dreamjournal
```

### 2. Build and run

```bash
docker compose up -d --build
```

The app will be available at **http://localhost:8000**

Your dream data is stored in `./data/dreams.db` on your host machine — it persists across container rebuilds.

---

## Local Development

### Backend (FastAPI)

```bash
cd backend
pip install -r requirements.txt
DB_PATH=../data/dreams.db uvicorn main:app --reload --port 8000
```

### Frontend (React + Vite)

```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173 with proxy to :8000
```

The Vite dev server proxies `/api/*` to the backend automatically.

---

## Add to your phone home screen (PWA)

1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap **Share → Add to Home Screen** (iOS) or the install prompt (Android)
3. The app opens fullscreen like a native app

---

## Configuration

Edit `docker-compose.yml` to change the port:

```yaml
ports:
  - "80:8000"   # serve on port 80 instead
```

### HTTPS with nginx (recommended for LAN use)

If you want HTTPS (needed for PWA install on some browsers), put nginx in front:

```nginx
server {
    listen 443 ssl;
    server_name dreams.local;

    ssl_certificate     /etc/ssl/certs/dreams.crt;
    ssl_certificate_key /etc/ssl/private/dreams.key;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
    }
}
```

---

## Data Backup

Your SQLite database lives at `./data/dreams.db`. Back it up with:

```bash
cp ./data/dreams.db ./backups/dreams-$(date +%Y%m%d).db
```

Or add a cron job:

```cron
0 3 * * * cp /path/to/dreamjournal/data/dreams.db /path/to/backups/dreams-$(date +\%Y\%m\%d).db
```

---

## API

The REST API is available at `/api`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dreams` | List dreams (supports `search`, `mood`, `tag` params) |
| POST | `/api/dreams` | Create a new dream |
| GET | `/api/dreams/{id}` | Get a single dream |
| PUT | `/api/dreams/{id}` | Update a dream |
| DELETE | `/api/dreams/{id}` | Delete a dream |
| GET | `/api/tags` | List all used tags |
| GET | `/api/stats` | Get journal stats |

Interactive API docs: **http://localhost:8000/docs**

---

## Tech Stack

- **Frontend**: React 18, Vite, React Router, Lucide icons, Day.js
- **Backend**: FastAPI, SQLite (via Python stdlib), Uvicorn
- **Fonts**: Cormorant Garamond (display) + DM Sans (body)
- **Container**: Single multi-stage Docker build
