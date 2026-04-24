"""
recommender.py
==============
Hybrid recommendation engine.
- Content-based: TF-IDF cosine similarity on genres + tags
- Collaborative: KNN user-based filtering on rating history
- Hybrid: falls back to content-based for new (cold-start) users
"""

import numpy as np
import joblib
from pathlib import Path
from typing import List, Dict, Any

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"


class RecommendationEngine:
    """Loads persisted models and serves recommendations."""

    def __init__(self):
        self.content_model    = None
        self.collab_model     = None
        self._loaded          = False

    def load_models(self):
        """Call once at startup."""
        cp = MODELS_DIR / "content_model.pkl"
        cf = MODELS_DIR / "collaborative_model.pkl"

        if not cp.exists() or not cf.exists():
            raise FileNotFoundError(
                "Models not found. Run `python backend/ml/train_model.py` first."
            )

        self.content_model = joblib.load(cp)
        self.collab_model  = joblib.load(cf)
        self._loaded = True
        print("✅ Models loaded into memory")

    # ─── Content-Based ────────────────────────────────────────────────────────

    def content_based(
        self,
        movie_id: int,
        n: int = 10,
        exclude_ids: List[int] = None,
    ) -> List[Dict[str, Any]]:
        """Return n movies most similar to movie_id by genre/tag content."""
        cm   = self.content_model
        idx  = cm["movie_index"].get(movie_id)
        if idx is None:
            return []

        from sklearn.metrics.pairwise import cosine_similarity
        sims = cosine_similarity(cm["tfidf_matrix"][idx], cm["tfidf_matrix"]).flatten()
        sims[idx] = 0  # exclude self

        exclude_ids = set(exclude_ids or [])
        results = []
        for i in np.argsort(sims)[::-1]:
            row = cm["movies"].iloc[i]
            if row["movieId"] in exclude_ids:
                continue
            results.append({
                "movieId": int(row["movieId"]),
                "title":   str(row["title"]),
                "genres":  str(row["genres"]),
                "tmdbId":  int(row["tmdbId"]),
                "score":   float(round(sims[i], 4)),
                "reason":  self._content_reason(row["genres"]),
            })
            if len(results) >= n:
                break
        return results

    # ─── Collaborative ────────────────────────────────────────────────────────

    def collaborative(
        self,
        user_id: int,
        n: int = 10,
        exclude_ids: List[int] = None,
    ) -> List[Dict[str, Any]]:
        """Return n recommendations via KNN user-based collaborative filtering."""
        cf  = self.collab_model
        um  = cf["user_movie_matrix"]

        if user_id not in um.index:
            return []  # signal cold start

        user_vec   = um.loc[user_id].values.reshape(1, -1)
        distances, indices = cf["knn"].kneighbors(user_vec, n_neighbors=21)

        # Aggregate scores from similar users (weighted by similarity)
        scores: Dict[int, float] = {}
        weights: Dict[int, float] = {}

        for dist, idx in zip(distances[0][1:], indices[0][1:]):  # skip self
            sim = 1 - dist
            neighbor_ratings = um.iloc[idx]
            for mid, rating in neighbor_ratings.items():
                if rating > 0:
                    scores[mid]  = scores.get(mid, 0)  + sim * rating
                    weights[mid] = weights.get(mid, 0) + sim

        # Normalise
        predicted = {mid: scores[mid] / weights[mid] for mid in scores if weights[mid] > 0}

        exclude_ids = set(exclude_ids or [])
        already_rated = set(um.columns[um.loc[user_id] > 0])
        exclude_ids |= already_rated

        sorted_movies = sorted(predicted.items(), key=lambda x: x[1], reverse=True)
        movies_df = self.content_model["movies"].set_index("movieId")

        results = []
        for mid, score in sorted_movies:
            if mid in exclude_ids:
                continue
            if mid not in movies_df.index:
                continue
            row = movies_df.loc[mid]
            results.append({
                "movieId": int(mid),
                "title":   str(row["title"]),
                "genres":  str(row["genres"]),
                "tmdbId":  int(row["tmdbId"]),
                "score":   float(round(score, 4)),
                "reason":  "Recommended because users with similar tastes enjoyed this.",
            })
            if len(results) >= n:
                break
        return results

    # ─── Hybrid (cold-start aware) ────────────────────────────────────────────

    def hybrid(
        self,
        user_id: int,
        watch_history: List[int],
        n: int = 10,
    ) -> List[Dict[str, Any]]:
        """
        Hybrid strategy:
        - If user has collaborative data → collaborative (70%) + content (30%)
        - If new user (cold start)       → content-based from watch history
        """
        cf = self.collab_model
        um = cf["user_movie_matrix"]
        has_collab = (user_id in um.index) and (um.loc[user_id] > 0).sum() >= 3

        if has_collab:
            collab_recs  = self.collaborative(user_id, n=n*2, exclude_ids=watch_history)
            if watch_history:
                seed_id = watch_history[-1]  # most recently watched
                content_recs = self.content_based(seed_id, n=n, exclude_ids=watch_history)
            else:
                content_recs = []

            # Merge: 70% collab, 30% content (deduplicated)
            seen = set()
            merged = []
            for rec in collab_recs:
                if rec["movieId"] not in seen:
                    seen.add(rec["movieId"])
                    merged.append(rec)
            for rec in content_recs:
                if rec["movieId"] not in seen:
                    rec["reason"] = "Recommended because of genres you enjoy."
                    seen.add(rec["movieId"])
                    merged.append(rec)

            return merged[:n]
        else:
            # Cold start: use last watched movie as seed, or return top popular
            if watch_history:
                seed_id = watch_history[-1]
                recs = self.content_based(seed_id, n=n, exclude_ids=watch_history)
                for r in recs:
                    r["reason"] = "Recommended based on a movie you recently watched."
                return recs
            else:
                return self._popular_movies(n)

    # ─── Popular fallback ─────────────────────────────────────────────────────

    def _popular_movies(self, n: int = 10) -> List[Dict[str, Any]]:
        """Return a diverse set of popular movies when there's no history."""
        movies = self.content_model["movies"]
        sample = movies.head(100).sample(n=min(n, len(movies)), random_state=42)
        return [
            {
                "movieId": int(r["movieId"]),
                "title":   str(r["title"]),
                "genres":  str(r["genres"]),
                "tmdbId":  int(r["tmdbId"]),
                "score":   0.0,
                "reason":  "Popular pick you might enjoy.",
            }
            for _, r in sample.iterrows()
        ]

    # ─── Helpers ──────────────────────────────────────────────────────────────

    @staticmethod
    def _content_reason(genres: str) -> str:
        g = [x.strip() for x in genres.replace("|", " ").split() if x.strip()]
        if not g:
            return "Recommended based on your viewing preferences."
        top = g[:2]
        return f"Recommended because you enjoy {' & '.join(top)} movies."

    def get_movie_details(self, movie_id: int) -> Dict[str, Any] | None:
        movies = self.content_model["movies"].set_index("movieId")
        if movie_id not in movies.index:
            return None
        row = movies.loc[movie_id]
        return {
            "movieId": int(movie_id),
            "title":   str(row["title"]),
            "genres":  str(row["genres"]),
            "tmdbId":  int(row["tmdbId"]),
        }

    def search_movies(self, query: str, limit: int = 20) -> List[Dict[str, Any]]:
        movies = self.content_model["movies"]
        q = query.lower()
        mask = movies["title"].str.lower().str.contains(q, na=False)
        results = movies[mask].head(limit)
        return [
            {
                "movieId": int(r["movieId"]),
                "title":   str(r["title"]),
                "genres":  str(r["genres"]),
                "tmdbId":  int(r["tmdbId"]),
            }
            for _, r in results.iterrows()
        ]

    def get_all_movies(self, page: int = 1, limit: int = 20, genre: str = "") -> Dict:
        movies = self.content_model["movies"]
        if genre:
            movies = movies[movies["genres"].str.contains(genre, case=False, na=False)]
        total  = len(movies)
        start  = (page - 1) * limit
        chunk  = movies.iloc[start : start + limit]
        return {
            "total": total,
            "page":  page,
            "pages": (total + limit - 1) // limit,
            "movies": [
                {
                    "movieId": int(r["movieId"]),
                    "title":   str(r["title"]),
                    "genres":  str(r["genres"]),
                    "tmdbId":  int(r["tmdbId"]),
                }
                for _, r in chunk.iterrows()
            ],
        }


# Singleton instance
engine = RecommendationEngine()
