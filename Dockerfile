# ── Stage 1: Build React frontend ──────────────────────────
FROM node:20-alpine AS frontend-builder

WORKDIR /build/frontend
COPY frontend/package.json ./
RUN npm install

COPY frontend/ ./
RUN npm run build

# ── Stage 2: Python backend + built frontend ────────────────
FROM python:3.12-slim

WORKDIR /app

# Install backend dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy compiled frontend
COPY --from=frontend-builder /build/frontend/dist ./frontend/dist

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
