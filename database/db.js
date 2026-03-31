// In-Memory Database Mock for Demo Purposes
// (Bypasses better-sqlite3 C++ binary compilation requirements on new Windows local setups)

class MemoryDB {
    constructor() {
        this.movies_cache = [];
    }
    
    prepare(sql) {
        return {
            all: () => this.movies_cache,
            run: (m) => this.movies_cache.push(m)
        };
    }
    
    transaction(fn) {
        return (items) => fn(items);
    }
}

const db = new MemoryDB();

// Insert initial mock data so the dashboard is instantly populated
db.movies_cache.push(
    {
        id: 1,
        title: "Dune: Part Two",
        poster_path: "https://image.tmdb.org/t/p/w500/1pdfLvkbY9ohJlCjQH2JGjjc91p.jpg",
        backdrop_path: "https://image.tmdb.org/t/p/w1280/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
        overview: "Paul Atreides unites with Chani and the Fremen while on a warpath of revenge against the conspirators who destroyed his family.",
        release_date: "2024-02-27",
        vote_average: 8.3,
        fetched_at: new Date().toISOString()
    },
    {
        id: 2,
        title: "Kung Fu Panda 4",
        poster_path: "https://image.tmdb.org/t/p/w500/kDp1vUBnMpe8ak4rjgl3cLELqjU.jpg",
        backdrop_path: "https://image.tmdb.org/t/p/w1280/1XDDXPXGiI8id7MrUxK36ke7wow.jpg",
        overview: "Po is gearing up to become the spiritual leader of his Valley of Peace, but also needs someone to take his place as Dragon Warrior.",
        release_date: "2024-03-02",
        vote_average: 7.1,
        fetched_at: new Date().toISOString()
    }
);

module.exports = db;
