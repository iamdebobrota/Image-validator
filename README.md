# Argon — AI Image Validator

Upload photos, validate them against 6 AI-powered rules (face detection, blur, duplicates, resolution, format, face size), and categorize as **Accepted** or **Rejected**.

**Stack:** React + TypeScript + Tailwind | Express + TypeScript + TypeORM | PostgreSQL | Cloudinary | face-api.js

---

## Prerequisites

- **Node.js** >= 18
- **Docker** (for PostgreSQL)
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

### 2. Start PostgreSQL

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
│   │   ├── config/          # DB, Cloudinary, env config
│   │   ├── entities/        # TypeORM Image entity
│   │   ├── services/        # Validation pipeline (blur, face, hash, heic)
│   │   ├── controllers/     # Request handlers
│   │   ├── routes/          # Express routes
│   │   └── middleware/       # Multer, error handler
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
