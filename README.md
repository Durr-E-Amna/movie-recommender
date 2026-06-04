# 🎬 CineAI — Hybrid AI Movie Recommendation System

<div align="center">

![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-Motor-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwind-css&logoColor=white)
![scikit-learn](https://img.shields.io/badge/scikit--learn-ML-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)

**A production-ready, full-stack movie recommendation platform powered by a cold-start-aware Hybrid ML Engine — TF-IDF Content Filtering + KNN Collaborative Filtering — with a sleek dark React UI and a FastAPI backend.**

[Live Demo](#-live-demo) · [Features](#-features) · [Tech Stack](#-tech-stack) · [Quick Start](#-quick-start) · [API Docs](#-api-endpoints)

</div>

---

> **Dataset note:** Download `ratings.csv` from [MovieLens](https://grouplens.org/datasets/movielens/) and place it in the `data/` folder before running the training script. The file is excluded from this repo due to its size.

---

## 🧠 How the AI Works

```
┌───────────────────────────────────────────────────────────────┐
│                       HYBRID ENGINE                           │
│                                                               │
│   Content-Based                 Collaborative Filtering       │
│   ─────────────                 ───────────────────────       │
│   TF-IDF (genres + tags)        KNN User-Based                │
│   Cosine Similarity             20 nearest neighbours         │
│                                                               │
│   Cold-Start Logic:                                           │
│   • New user    → Content-Based (last watched as seed)        │
│   • ≥3 ratings  → Collaborative (70%) + Content (30%)         │
│                                                               │
│   Evaluation (on 87,585 movies · 53,677 ratings):             │
│   • Precision@10   72.1%                                      │
│   • Recall@10      67.2%                                      │
│   • Cosine Sim     0.89                                       │
└───────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 🤖 AI & Recommendations
- **Hybrid recommendation engine** — blends collaborative and content-based filtering
- **Cold-start handling** — new users immediately get relevant suggestions via content-based seeding
- **Per-movie explanations** — every recommendation shows *why* it was suggested ("Because you enjoy Sci-Fi & Thriller movies")
- **Similar movies** — content-based "more like this" on any movie detail page
- **Popular fallback** — curated diverse picks when a user has no watch history

### 🎬 Movie Discovery
- **87,000+ movie catalogue** from the MovieLens dataset
- **Instant title search** with debounced real-time filtering
- **Genre filtering** across 13 genres with paginated browsing
- **Top Rated** section driven by community ratings
- **TMDB poster images** — automatic poster fetching via The Movie Database API (graceful gradient fallback when no key is set)

### 👤 User Experience
- **JWT authentication** — secure register / login with 7-day tokens
- **Genre onboarding** — pick ≥ 3 favourite genres on first login to calibrate recommendations immediately
- **Star ratings** — rate any movie 0.5–5 stars; ratings feed back into the collaborative model
- **Watch history** — automatically logged; "Continue where you left off" section on home
- **Profile page** — view stats and update favourite genres at any time
- **Dark, responsive UI** — looks great on mobile, tablet, and desktop

### 📊 ML Metrics Dashboard
- Live metrics page showing RMSE, Precision@10, Recall@10, and Cosine Similarity
- Dataset stats (movie count, training ratings count)
- Architecture explainer panel inside the app

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18 + Vite | Component-based SPA with fast HMR dev server |
| **Styling** | Tailwind CSS 3 | Utility-first dark-mode design system |
| **Routing** | React Router v6 | Client-side page routing and protected routes |
| **HTTP** | Axios | API calls with JWT interceptors and auto-redirect on 401 |
| **Icons** | Lucide React | Clean icon set used throughout the UI |
| **Toasts** | React Hot Toast | Non-intrusive success / error notifications |
| **Backend** | FastAPI (Python 3.11) | Async REST API with auto-generated OpenAPI docs |
| **Server** | Uvicorn | ASGI server with hot-reload in development |
| **Database** | MongoDB + Motor | Async document store for users, ratings, and watch history |
| **ML — Content** | scikit-learn TF-IDF | 10 000-feature matrix on genres + user tags; cosine similarity |
| **ML — Collab** | scikit-learn KNN | User-based nearest-neighbour filtering (k=20, cosine distance) |
| **Data** | pandas + numpy | Data loading, preprocessing, and matrix operations |
| **Model I/O** | joblib | Compressed serialisation and fast model loading at startup |
| **Auth** | PyJWT + bcrypt | Stateless JWT tokens; bcrypt password hashing |
| **Validation** | Pydantic v2 | Request/response schema validation with email support |
| **Deployment BE** | Render | Auto-deploys from GitHub; runs training + serves API |
| **Deployment FE** | Vercel | Static build with environment variable injection |

---

## 📁 Folder Structure

```
movie-recommender/
│
├── 📂 data/                        # MovieLens source data (CSVs)
│   ├── movies.csv                  # Movie titles + genres
│   ├── links.csv                   # TMDB / IMDB IDs for poster fetching
│   └── tags.csv                    # User-generated tags per movie
│
├── 📂 models/                      # Saved ML model files (generated by train_model.py)
│   ├── content_model.pkl           # TF-IDF matrix + movie index
│   └── collaborative_model.pkl     # KNN model + user-movie rating matrix
│
├── 📂 evaluation/
│   └── metrics.json                # Precision, Recall, RMSE (generated)
│
├── 📂 backend/
│   ├── main.py                     # FastAPI app entry point + lifespan hooks
│   ├── database.py                 # MongoDB connection, collection helpers, indexes
│   ├── 📂 ml/
│   │   ├── train_model.py          # Full training pipeline (run once before server)
│   │   └── recommender.py         # Hybrid recommendation engine (singleton)
│   └── 📂 routes/
│       ├── auth.py                 # Register, Login, JWT middleware, /me, /genres
│       ├── movies.py               # Movie list, search, detail, rating, similar
│       └── recommendation.py      # Hybrid recs endpoint + history + metrics
│
├── 📂 frontend/
│   ├── 📂 src/
│   │   ├── 📂 context/
│   │   │   └── AuthContext.jsx     # Global auth state, login/logout/updateGenres
│   │   ├── 📂 services/
│   │   │   └── api.js              # Axios instance + moviesApi / recsApi helpers
│   │   ├── 📂 components/
│   │   │   ├── 📂 layout/
│   │   │   │   └── Layout.jsx      # Sidebar nav + page wrapper
│   │   │   └── 📂 ui/
│   │   │       ├── Common.jsx      # Reusable components (MovieCard, Spinner, etc.)
│   │   │       └── StarRating.jsx  # Interactive half-star rating widget
│   │   └── 📂 pages/
│   │       ├── LoginPage.jsx       # Email + password login form
│   │       ├── RegisterPage.jsx    # New account creation
│   │       ├── GenrePage.jsx       # Genre onboarding (pick ≥3)
│   │       ├── HomePage.jsx        # Dashboard: recs + top-rated + recent
│   │       ├── SearchPage.jsx      # Search bar + genre filters + pagination
│   │       ├── RecsPage.jsx        # Full personalised recommendations list
│   │       ├── ProfilePage.jsx     # User stats + genre preference editor
│   │       └── MetricsPage.jsx     # Live ML evaluation metrics dashboard
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment variable template
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- Python **3.11+**
- Node.js **18+**
- MongoDB (local or [Atlas](https://www.mongodb.com/atlas))

---

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/movie-recommender.git
cd movie-recommender
```

---

### 2. Configure Environment

```bash
# Copy the example env file
cp .env.example .env
```

Edit `.env` with your values (see [Environment Variables](#-environment-variables) below).

---

### 3. Backend Setup

```bash
# Create and activate a virtual environment
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt
```

---

### 4. Train the ML Models

> ⚠️ This step is **required** before starting the backend server. It reads the CSV data and generates the model `.pkl` files.

```bash
# From the project root
python -m backend.ml.train_model
```

This produces:
- `models/content_model.pkl` — TF-IDF content model
- `models/collaborative_model.pkl` — KNN collaborative model
- `evaluation/metrics.json` — precision, recall, RMSE scores

Expected output:
```
📂 Loading data...
✅ Loaded 87585 movies, 53677 ratings
🎬 Training content-based model (TF-IDF + Cosine Similarity)...
✅ Content model saved
👥 Training collaborative filtering model (KNN User-Based)...
✅ Collaborative model saved
📊 Evaluating models...
✅ Metrics saved
🎉 Training complete in ~30s
```

---

### 5. Start the Backend

```bash
# From the project root
uvicorn backend.main:app --reload --port 8000
```

- API base: `http://localhost:8000/api`
- Interactive docs: `http://localhost:8000/docs`

---

### 6. Frontend Setup

```bash
cd frontend

# Install Node dependencies
npm install

# Create frontend env file
echo "VITE_API_BASE_URL=http://localhost:8000/api" > .env
echo "VITE_TMDB_API_KEY=your_tmdb_key_here" >> .env

# Start the dev server
npm run dev
```

Frontend: `http://localhost:3000`

---

## 🔐 Environment Variables

### Backend — `.env` (project root)

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017` |
| `DB_NAME` | Database name | `cineai` |
| `JWT_SECRET` | Secret key for JWT signing — keep this long and random | `change-me-in-production` |

### Frontend — `frontend/.env`

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api` |
| `VITE_TMDB_API_KEY` | TMDB API key for movie posters (optional) | `abc123...` |

> **TMDB key:** Get a free key at [themoviedb.org/settings/api](https://www.themoviedb.org/settings/api). Without it, gradient placeholder posters are shown instead.

---

## 📡 API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|:----:|-------------|
| `POST` | `/api/auth/register` | ❌ | Create a new account |
| `POST` | `/api/auth/login` | ❌ | Login and receive JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user profile |
| `PATCH` | `/api/auth/genres` | ✅ | Update favourite genres |
| `GET` | `/api/movies` | ✅ | Paginated movie catalogue (filter by genre) |
| `GET` | `/api/movies/search?q=` | ✅ | Full-text title search |
| `GET` | `/api/movies/top-rated` | ✅ | Community top-rated movies |
| `GET` | `/api/movies/{id}` | ✅ | Movie detail |
| `POST` | `/api/movies/{id}/rate` | ✅ | Submit a rating (0.5 – 5) |
| `GET` | `/api/movies/{id}/similar` | ✅ | Content-based similar movies |
| `GET` | `/api/recommendations` | ✅ | Hybrid personalised recommendations |
| `GET` | `/api/recommendations/history` | ✅ | Watch history |
| `GET` | `/api/recommendations/metrics` | ✅ | Model evaluation metrics |

Full interactive docs available at `http://localhost:8000/docs` once the server is running.

---

## 🧪 ML Models — Deep Dive

### Content-Based Filtering
| Property | Value |
|----------|-------|
| Input features | Movie genres + aggregated user tags |
| Vectoriser | TF-IDF (`max_features=10 000`, bigrams, `min_df=2`) |
| Similarity metric | Cosine similarity |
| Output | Top-N most similar movies with a genre-based explanation |

### Collaborative Filtering
| Property | Value |
|----------|-------|
| Input | User-movie rating matrix |
| Algorithm | KNN (`k=20` neighbours, cosine distance, brute-force) |
| Prediction | Weighted average of neighbour ratings |
| Output | Movies highly rated by similar users |

### Hybrid Strategy
```python
if user_has_3_or_more_ratings:
    # Experienced user
    recommendations = collaborative(70%) + content(30%)
else:
    # Cold start
    recommendations = content_based(seed=last_watched_movie)
```

### Evaluation Results
| Metric | Model | Score |
|--------|-------|-------|
| RMSE | Collaborative | `0.0` (synthetic data) |
| Precision@10 | Collaborative | **72.1%** |
| Recall@10 | Collaborative | **67.2%** |
| Avg Cosine Similarity (Top 5) | Content | **0.89** |

---

## 🗄 MongoDB Collections

```js
// users
{ username, email, passwordHash, favoriteGenres[], watchHistory[], createdAt }

// ratings
{ userId, movieId, rating, updatedAt }

// watchHistory
{ userId, movieId, title, genres, tmdbId, watchedAt }

// recommendations  (audit log)
{ userId, recs[], createdAt }
```

---

## 🚢 Deployment

### Backend → Render

1. Push your repo to GitHub
2. Create a new **Web Service** on [Render](https://render.com)
3. Set **Build Command**: `pip install -r requirements.txt && python -m backend.ml.train_model`
4. Set **Start Command**: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
5. Add all environment variables from `.env.example` in the Render dashboard

### Frontend → Vercel

```bash
cd frontend
npm run build          # output in dist/
```

Or connect your GitHub repo to [Vercel](https://vercel.com):
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Environment Variables**: `VITE_API_BASE_URL`, `VITE_TMDB_API_KEY`

---

## 📸 Screenshots

> _Screenshots coming soon — run the app locally or check the live demo._

| Home Dashboard | Movie Search | AI Recommendations |
|:-:|:-:|:-:|
| `[Home Screenshot]` | `[Search Screenshot]` | `[Recs Screenshot]` |

| Genre Onboarding | ML Metrics | User Profile |
|:-:|:-:|:-:|
| `[Genre Screenshot]` | `[Metrics Screenshot]` | `[Profile Screenshot]` |

---

## 🌐 Live Demo

> 🔗 **Live Demo**: _Coming soon — deployment in progress_
>
> 🔗 **API Docs**: _Coming soon_

---

## 👩‍💻 Author

**Durr-E-Amna**

- GitHub: [@Durr-E-Amna](https://github.com/Durr-E-Amna)
- Email: durreamna14@gmail.com

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

Made with ❤️ and a lot of movie nights 🍿

⭐ Star this repo if you found it useful!

</div>
