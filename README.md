# 🌙 Dream Journal

A personal dream journal with multi-user support — mobile-optimized, self-hosted, beautifully designed.

Built with React 18 + Vite (TypeScript frontend) and FastAPI + SQLite (backend), packaged as a single Docker container.

---

## Features

✨ **Multi-user authentication** - Secure registration and login  
📝 **Rich dream capture** - Title, body, mood, lucidity, sleep quality, tags  
🔍 **Search & filter** - Find dreams by keywords, tags, or mood  
📅 **Calendar heatmap** - Visualize your dream frequency and lucidity over time  
📊 **Statistics dashboard** - Charts, trends, and insights  
💾 **Backup & restore** - Export/import dreams as JSON  
🎨 **Beautiful design** - Warm amber aesthetic with noise texture  
📱 **PWA ready** - Install on mobile home screen  

---

## Quick Start (Production)

### Prerequisites
- Docker & Docker Compose installed
- (Optional) Nginx Proxy Manager or reverse proxy for HTTPS

### 1. Pull the pre-built image
```bash
# Create project directory
mkdir dreamjournal && cd dreamjournal

# Create docker-compose.yml
cat > docker-compose.yml << 'EOF'
services:
  dreamjournal:
    image: georgepapagapitos/dreamjournal:latest
    container_name: dreamjournal
    restart: unless-stopped
    ports:
      - "8765:8000"
    volumes:
      - ./data:/data
    environment:
      - DB_PATH=/data/dreams.db
      - TZ=America/Chicago
EOF

# Start the container
docker compose up -d
```

The app will be available at **http://localhost:8765**

Your dream data is stored in `./data/dreams.db` on your host machine — it persists across container rebuilds.

---

## Local Development

### Backend (FastAPI)
```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Run from project root
DB_PATH=./data/dreams.db uvicorn backend.main:app --reload --port 8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev      # starts on http://localhost:5173 with proxy to :8000
```

The Vite dev server proxies `/api/*` to the backend automatically.

---

## Building & Deploying Your Own Image

### Build multi-platform image
```bash
# Create buildx builder
docker buildx create --name multiplatform --use
docker buildx inspect --bootstrap

# Build and push
./scripts/build-and-push.sh
```

This builds for both AMD64 (typical servers) and ARM64 (Mac Silicon, Raspberry Pi).

---

## Add to Your Phone Home Screen (PWA)

1. Open the app in Safari (iOS) or Chrome (Android)
2. Tap **Share → Add to Home Screen** (iOS) or the install prompt (Android)
3. The app opens fullscreen like a native app

---

## Configuration

### Change Port

Edit `docker-compose.yml`:
```yaml
ports:
  - "80:8000"   # serve on port 80 instead
```

### HTTPS with Nginx Proxy Manager (Recommended)

1. Set up Nginx Proxy Manager
2. Add proxy host pointing to your dreamjournal container (port 8765)
3. Enable SSL with Let's Encrypt
4. Access via https://dreams.yourdomain.com

---

## Data Backup

### App Built-in Export

Click **Backup** button in the Journal view to download all dreams as JSON.

### Database Backup

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

### Auth Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register` | Create new account |
| POST | `/api/auth/login` | Login and get JWT token |
| GET | `/api/auth/me` | Get current user info |
| PUT | `/api/auth/change-password` | Change password |
| PUT | `/api/auth/change-username` | Change username |
| DELETE | `/api/auth/delete-account` | Delete account |

### Dream Endpoints (Protected)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/dreams` | List dreams (supports `search`, `mood`, `tag` params) |
| POST | `/api/dreams` | Create a new dream |
| GET | `/api/dreams/{id}` | Get a single dream |
| PUT | `/api/dreams/{id}` | Update a dream |
| DELETE | `/api/dreams/{id}` | Delete a dream |
| GET | `/api/tags` | List all used tags |
| GET | `/api/stats` | Get journal stats |
| GET | `/api/stats/detailed` | Get detailed stats for dashboard |
| GET | `/api/backup` | Export all dreams as JSON |
| POST | `/api/import` | Import dreams from JSON backup |

Interactive API docs: **http://localhost:8765/docs**

---

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite, React Router, Recharts, Day.js
- **Backend**: FastAPI, SQLite, Passlib (bcrypt), Python-Jose (JWT)
- **Auth**: JWT tokens with bcrypt password hashing
- **Fonts**: Cormorant Garamond (display) + DM Sans (body)
- **Container**: Multi-stage Docker build with multi-platform support

---

## License

MIT