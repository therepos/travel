FROM node:20-alpine AS ui-build
WORKDIR /build
COPY app/ui/package.json app/ui/package-lock.json* ./
RUN npm install
COPY app/ui/ ./
COPY static/ ./public/
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app/main.py ./main.py
COPY --from=ui-build /build/dist ./ui/dist
RUN mkdir -p /data
ENV DB_PATH=/data/travel.db
ENV STATIC_DIR=/app/ui/dist
ENV GOOGLE_PLACES_API_KEY=""
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--loop", "asyncio"]
