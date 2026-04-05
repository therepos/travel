FROM node:20-alpine AS frontend-build
WORKDIR /build
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm install
COPY frontend/ ./
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ ./backend/
COPY --from=frontend-build /build/dist ./frontend/dist
RUN mkdir -p /data

ENV DB_PATH=/data/wanderlust.db
ENV STATIC_DIR=/app/frontend/dist
ENV GOOGLE_PLACES_API_KEY=""

EXPOSE 8000
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "asyncio"]
