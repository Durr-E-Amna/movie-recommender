import pandas as pd
import os

# Define paths based on your project structure
BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(__file__)))
LINKS_FILE = os.path.join(BASE_DIR, "data", "links.csv")

# Load the mapping once at startup
try:
    links_df = pd.read_csv(LINKS_FILE)
    # Map MovieLens 'movieId' to TMDB 'tmdbId'
    movie_to_tmdb = dict(zip(links_df['movieId'], links_df['tmdbId']))
    print(f"✅ Successfully mapped {len(movie_to_tmdb)} movies from links.csv")
except Exception as e:
    print(f"⚠️ Error loading links.csv: {e}")
    movie_to_tmdb = {}

def get_tmdb_id(movie_id: int):
    """Translates the MovieLens internal ID to a TMDB ID"""
    tmdb_id = movie_to_tmdb.get(movie_id)
    # Ensure the ID is valid and not a NaN value from the CSV
    if tmdb_id and pd.notna(tmdb_id):
        return int(tmdb_id)
    return None

def get_poster_url(movie_id: int):
    """Returns the TMDB ID so the frontend fetchPoster function can work"""
    return get_tmdb_id(movie_id)