const axios = require('axios');
const path = require('path');
const db = require('../database/db');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const BASE_URL = 'https://api.themoviedb.org/3';
const IMAGE_BASE_URL = 'https://image.tmdb.org/t/p/w1280';
const POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w500';

async function fetchTrendingMovies() {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
        console.warn('TMDB_API_KEY is not set or invalid in .env. Using mock data for prototype purposes.');
        return generateMockData();
    }
    
    try {
        console.log('Fetching trending movies from TMDB...');
        const response = await axios.get(`${BASE_URL}/trending/movie/day`, {
            params: { api_key: TMDB_API_KEY }
        });
        
        const movies = response.data.results.slice(0, 10);
        return await Promise.all(movies.map(handleMovieItem));
    } catch (error) {
        console.error('Error fetching TMDB data:', error.response?.data || error.message);
        return generateMockData();
    }
}

async function handleMovieItem(movie) {
    // Optionally fetch trailer via another endpoint: /movie/{movie_id}/videos
    let trailerUrl = '';
    try {
        const vidResponse = await axios.get(`${BASE_URL}/movie/${movie.id}/videos`, {
            params: { api_key: TMDB_API_KEY }
        });
        const vids = vidResponse.data.results;
        const trailer = vids.find(v => v.type === 'Trailer' && v.site === 'YouTube');
        if (trailer) trailerUrl = `https://www.youtube.com/watch?v=${trailer.key}`;
    } catch (e) {
        console.log(`Could not fetch trailer for ${movie.id}`);
    }

    return {
        id: movie.id,
        title: movie.title || movie.name,
        poster_path: movie.poster_path ? `${POSTER_BASE_URL}${movie.poster_path}` : null,
        backdrop_path: movie.backdrop_path ? `${IMAGE_BASE_URL}${movie.backdrop_path}` : null,
        overview: movie.overview,
        release_date: movie.release_date || movie.first_air_date,
        vote_average: movie.vote_average,
        trailer_url: trailerUrl
    };
}

function generateMockData() {
    return [
        {
            id: 1,
            title: "Mockbuster: The API Key is Missing",
            poster_path: "https://image.tmdb.org/t/p/w500/8cdWjvZQUExUUTzyp4t6EDMubfO.jpg",
            backdrop_path: "https://image.tmdb.org/t/p/w1280/yDHYTfA3R0jFYba16ZAKAW5aw4b.jpg",
            overview: "A thrilling adventure of a developer realizing they need a real TMDB API key to load live data.",
            release_date: "2024-01-01",
            vote_average: 9.9,
            trailer_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4" 
        },
        {
            id: 2,
            title: "Cyberpunk Database Protocol",
            poster_path: "https://image.tmdb.org/t/p/w500/1E5baAaEse26fej7uHcjOgEE2t2.jpg",
            backdrop_path: "https://image.tmdb.org/t/p/w1280/x2RS3hTcvlSjcCXAecfKigXlSNE.jpg",
            overview: "In a world ruled by relational data, one row rebels.",
            release_date: "2024-05-15",
            vote_average: 8.5,
            trailer_url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
        }
    ];
}

async function populateDatabase() {
    const movies = await fetchTrendingMovies();
    
    // Insert into DB
    const insert = db.prepare(`
        INSERT INTO movies_cache (id, title, poster_path, backdrop_path, overview, release_date, vote_average, trailer_url)
        VALUES (@id, @title, @poster_path, @backdrop_path, @overview, @release_date, @vote_average, @trailer_url)
        ON CONFLICT(id) DO UPDATE SET
            title=excluded.title,
            poster_path=excluded.poster_path,
            backdrop_path=excluded.backdrop_path,
            overview=excluded.overview,
            release_date=excluded.release_date,
            vote_average=excluded.vote_average,
            trailer_url=excluded.trailer_url,
            fetched_at=CURRENT_TIMESTAMP
    `);
    
    const insertMany = db.transaction((moviesList) => {
        for (const m of moviesList) insert.run(m);
    });
    
    insertMany(movies);
    console.log(`Successfully populated ${movies.length} movies into SQLite DB.`);
}

populateDatabase();
