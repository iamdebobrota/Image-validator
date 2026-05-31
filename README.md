# Argon — AI Image Validator

Upload photos, validate them against 6 AI-powered rules (face detection, blur, duplicates, resolution, format, face size), and categorize as **Accepted** or **Rejected**. Accepted images enter a scalable media processing pipeline that converts, compresses, and generates multi-resolution variants.

**Stack:** React + TypeScript + Tailwind | Express + TypeScript + TypeORM | PostgreSQL | Redis + BullMQ | Cloudinary | face-api.js

---

## Prerequisites

- **Node.js** >= 18
- **Docker** (for PostgreSQL + Redis)
- **Cloudinary** account ([cloudinary.com](https://cloudinary.com))

---

## Quick Start

### 1. Clone & install

```bash
git clone <repo-url> && cd argon

# Backend
cd backend && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 2. Start PostgreSQL + Redis

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` — fill in your Cloudinary credentials:

```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### 4. Run

```bash
# Terminal 1 — Backend (port 3001)
cd backend && npm run dev

# Terminal 2 — Frontend (port 5173)
cd frontend && npm run dev
```

Open **http://localhost:5173**

---

## Project Structure

```
argon/
├── backend/
│   ├── src/
│   │   ├── config/          # DB, Cloudinary, Redis, env config
│   │   ├── entities/        # TypeORM entities (Image, ProcessingJob, ImageVariant)
│   │   ├── services/        # Validation pipeline (blur, face, hash, heic)
│   │   ├── queues/          # BullMQ queue definitions + job flow
│   │   ├── workers/         # Pipeline workers (conversion, compression, variant)
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # Express routes
│   │   └── middleware/       # Multer, error handler
│   ├── scripts/             # Load test script
│   └── models/              # face-api.js model weights
├── frontend/
│   └── src/
│       ├── components/      # Sidebar, ImageGallery, ImageCard, ImageModal
│       ├── hooks/           # useUpload, useImages
│       ├── lib/             # API client, validators
│       └── types/           # TypeScript types
└── docker-compose.yml
```

## API Endpoints

| Method   | Endpoint              | Description          |
|----------|-----------------------|----------------------|
| `POST`   | `/api/images/upload`  | Upload image         |
| `GET`    | `/api/images`         | List all images      |
| `GET`    | `/api/images/:id`     | Get image details    |
| `DELETE` | `/api/images/:id`     | Delete image         |
| `GET`    | `/api/images/:id/status`    | Get pipeline processing status |
| `GET`    | `/api/images/:id/variants`  | Get generated image variants   |
| `POST`   | `/api/images/:id/reprocess` | Reprocess a failed image       |

## Processing Pipeline

After an image is accepted, it enters a 3-stage processing pipeline powered by BullMQ + Redis:

1. **Conversion** — Normalizes format to JPEG (handles HEIC, PNG)
2. **Compression** — Reduces file size using mozjpeg (quality 80), tracks compression ratio
3. **Variant Generation** — Creates 3 sizes and uploads each to Cloudinary:
   - **Thumbnail:** 150x150 max
   - **Web:** 800x800 max
   - **Full:** 1920x1920 max

Each stage is a stateless BullMQ worker that can be scaled independently. Jobs retry up to 3 times with exponential backoff. Reprocessing is idempotent — old variants are deleted before regeneration.

### Load Testing

```bash
cd backend

# Default 20 concurrent uploads
npm run load-test -- ~/path/to/test-image.jpg

# Custom concurrency
CONCURRENCY=50 npm run load-test -- ~/path/to/test-image.jpg
```

## Validation Rules

| Rule | Threshold |
|------|-----------|
| Format | JPEG, PNG, HEIC only |
| File size | >= 50 KB |
| Resolution | >= 300 x 300 px |
| Blur | Laplacian variance >= 25 |
| Face count | Exactly 1 face |
| Face size | >= 2% of image area |
| Duplicates | pHash Hamming distance > 10 |

Thresholds are configurable in `backend/.env`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | `redis://localhost:6379` | Redis connection URL |
| `CLOUDINARY_CLOUD_NAME` | — | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | — | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | — | Cloudinary API secret |
| `MIN_FILE_SIZE_BYTES` | `51200` | Minimum file size (50KB) |
| `MIN_WIDTH_PX` | `300` | Minimum image width |
| `MIN_HEIGHT_PX` | `300` | Minimum image height |
| `LAPLACIAN_THRESHOLD` | `100` | Blur detection threshold |
| `PHASH_THRESHOLD` | `10` | Duplicate detection threshold |
| `MIN_FACE_AREA_RATIO` | `0.02` | Minimum face area (2%) |
