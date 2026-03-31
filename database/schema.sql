CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS movies_cache (
    id INTEGER PRIMARY KEY, -- Using TMDB ID
    title TEXT NOT NULL,
    poster_path TEXT,
    backdrop_path TEXT,
    overview TEXT,
    release_date TEXT,
    vote_average REAL,
    trailer_url TEXT,
    fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
