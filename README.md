# 🎬 CineAI — Hybrid AI Movie Recommendation System

A production-ready, full-stack movie recommendation platform built with a **Hybrid ML Engine** (TF-IDF Content Filtering + KNN Collaborative Filtering), FastAPI backend, React frontend, and MongoDB.

---
## Dataset
Download `ratings.csv` from [MovieLens](https://grouplens.org/datasets/movielens/)
and place it in the `data/` folder before running the app.
## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    HYBRID ENGINE                      │
│                                                       │
│  Content-Based         Collaborative Filtering        │
│  ─────────────         ───────────────────────        │
│  TF-IDF (genres+tags)  KNN User-Based                 │
│  Cosine Similarity     20 nearest neighbours          │
│                                                       │
│  Cold-Start Logic:                                    │
│  • New user    → Content-Based                        │
│  • Has ratings → Collaborative (70%) + Content (30%) │
└─────────────────────────────────────────────────────┘
```

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- MongoDB (local or Atlas)

---

### 1. Clone & Setup

```bash
git clone <repo-url>
cd movie-recommender

# Copy environment file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
```

---

### 2. Backend Setup

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Train the ML models (required before starting backend)
cd movie-recommender
python -m backend.ml.train_model

# This generates:
#   models/content_model.pkl
#   models/collaborative_model.pkl
#   evaluation/metrics.json
```

---

### 3. Start Backend

```bash
# From project root (movie-recommender/)
uvicorn backend.main:app --reload --port 8000
```

API docs available at: http://localhost:8000/docs

---

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
echo "VITE_TMDB_API_KEY=your_key_here" >> .env

# Start dev server
npm run dev
```

Frontend: http://localhost:3000

---

## Project Structure

```
movie-recommender/
├── data/
│   ├── movies.csv            # MovieLens movie metadata
│   ├── links.csv             # TMDB / IMDB IDs
│   └── tags.csv              # User tags per movie
│
├── models/                   # Saved ML model files (generated)
│   ├── content_model.pkl
│   └── collaborative_model.pkl
│
├── evaluation/
│   └── metrics.json          # Precision, Recall, RMSE (generated)
│
├── backend/
│   ├── main.py               # FastAPI app entry point
│   ├── database.py           # MongoDB connection & indexes
│   ├── ml/
│   │   ├── train_model.py    # Training pipeline
│   │   └── recommender.py    # Hybrid recommendation engine
│   └── routes/
│       ├── auth.py           # Register, Login, JWT
│       ├── movies.py         # Movie CRUD + rating
│       └── recommendation.py # Hybrid recs + metrics
│
├── frontend/
│   ├── src/
│   │   ├── context/AuthContext.jsx
│   │   ├── services/
│   │   │   ├── api.js        # Axios + helpers
│   │   │   └── tmdb.js       # Poster fetching
│   │   ├── components/
│   │   │   ├── layout/Layout.jsx
│   │   │   └── ui/           # MovieCard, StarRating, etc.
│   │   └── pages/
│   │       ├── LoginPage.jsx
│   │       ├── RegisterPage.jsx
│   │       ├── GenrePage.jsx
│   │       ├── HomePage.jsx
│   │       ├── SearchPage.jsx
│   │       ├── MoviePage.jsx
│   │       ├── RecsPage.jsx
│   │       ├── ProfilePage.jsx
│   │       └── MetricsPage.jsx
│   └── package.json
│
├── requirements.txt
├── .env.example
└── README.md
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | Register new user |
| POST | `/api/auth/login` | No | Login + receive JWT |
| GET | `/api/auth/me` | Yes | Current user profile |
| PATCH | `/api/auth/genres` | Yes | Update favourite genres |
| GET | `/api/movies` | Yes | Paginated movie list |
| GET | `/api/movies/search?q=` | Yes | Full-text title search |
| GET | `/api/movies/top-rated` | Yes | Highest rated movies |
| GET | `/api/movies/{id}` | Yes | Movie details |
| POST | `/api/movies/{id}/rate` | Yes | Submit rating (0.5–5) |
| GET | `/api/movies/{id}/similar` | Yes | Content-based similar |
| GET | `/api/recommendations` | Yes | Hybrid personalised recs |
| GET | `/api/recommendations/history` | Yes | Recently watched |
| GET | `/api/recommendations/metrics` | Yes | Model evaluation metrics |

---

## ML Models

### Content-Based Filtering
- **Input:** Movie genres + aggregated user tags
- **Vectoriser:** TF-IDF (10,000 features, bigrams, min_df=2)
- **Similarity:** Cosine similarity matrix
- **Output:** Top-N most similar movies with explanation

### Collaborative Filtering
- **Input:** User-movie rating matrix
- **Algorithm:** KNN (k=20 neighbours, cosine distance)
- **Prediction:** Weighted average of neighbour ratings
- **Output:** Movies highly rated by similar users

### Hybrid Logic
```python
if user_has_3_or_more_ratings:
    recs = collaborative(70%) + content(30%)
else:  # cold start
    recs = content_based(last_watched_movie)
```

### Evaluation Metrics
| Metric | Model | Description |
|--------|-------|-------------|
| RMSE | Collaborative | Prediction error on held-out ratings |
| Precision@10 | Collaborative | % relevant in top-10 recommendations |
| Recall@10 | Collaborative | % of all relevant items retrieved |
| Avg Cosine Similarity | Content | Genre/tag coherence of top-5 |

---

## Deployment

### Backend → Render

1. Push to GitHub
2. Create new **Web Service** on [Render](https://render.com)
3. Set build command: `pip install -r requirements.txt && python -m backend.ml.train_model`
4. Set start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables from `.env.example`

### Frontend → Vercel

```bash
cd frontend
npm run build

# Or connect GitHub repo to Vercel:
# Build command: npm run build
# Output directory: dist
# Environment variables: VITE_API_BASE_URL, VITE_TMDB_API_KEY
```

---

## TMDB Poster Images (Optional)

Get a free API key at https://www.themoviedb.org/settings/api and add it to `.env`:

```
VITE_TMDB_API_KEY=your_key_here
```

Without a key, gradient placeholder posters are shown instead.

---

## MongoDB Collections

```javascript
// users
{ username, email, passwordHash, favoriteGenres[], watchHistory[], createdAt }

// ratings
{ userId, movieId, rating, updatedAt }

// watchHistory
{ userId, movieId, title, genres, tmdbId, watchedAt }

// recommendations (log)
{ userId, recs[], createdAt }
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | FastAPI, Python 3.11 |
| Database | MongoDB (Motor async driver) |
| ML | scikit-learn, pandas, numpy, joblib |
| Auth | JWT (PyJWT), bcrypt |
| Deployment | Render (BE), Vercel (FE) |
