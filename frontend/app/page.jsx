"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, Play, Plus, Info } from "lucide-react";
import PremiumPlayer from "../components/PremiumPlayer";

export default function Dashboard() {
  const [movies, setMovies] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWatching, setIsWatching] = useState(false);

  useEffect(() => {
    // Fetch data from our Node Proxy
    fetch("http://localhost:4000/movies")
      .then((res) => res.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          setMovies(json.data);
          setHeroMovie(json.data[0]); // First movie is hero
        }
      })
      .catch((err) => console.error("Failed to fetch movies from proxy", err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Search for:", searchQuery);
    // Add real search functionality here if needed
  };

  return (
    <main className="relative w-full h-full pb-20">
      {/* Navigation (Glassmorphism & Search) */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-5 transition-all duration-300 bg-gradient-to-b from-black/80 to-transparent">
        <h1 className="text-red-600 font-black text-3xl tracking-tighter cursor-pointer">
          SFLIX
        </h1>
        
        <form 
          onSubmit={handleSearch}
          className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 transition hover:bg-white/20"
        >
          <Search size={20} className="text-gray-300" />
          <input
            type="text"
            placeholder="Search movies..."
            className="bg-transparent border-none outline-none text-white placeholder-gray-400 w-48 lg:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </nav>

      {/* Hero Section */}
      {heroMovie && (
        <section className="relative w-full h-[80vh] flex items-center">
          {isWatching ? (
            <div className="absolute inset-0 z-40 mt-20 px-8">
               <PremiumPlayer 
                  movieId={heroMovie.id} 
                  streamType="m3u8" 
                  streamUrl="https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" 
               />
               <button 
                  onClick={() => setIsWatching(false)}
                  className="absolute top-4 right-12 z-50 text-white bg-black/50 px-4 py-2 rounded-md hover:bg-black transition font-bold"
               >
                 Close Player
               </button>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 z-0">
                <Image
                  src={heroMovie.backdrop_path || heroMovie.poster_path}
                  alt={heroMovie.title}
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
              </div>

              <div className="relative z-10 px-8 lg:px-16 max-w-2xl mt-20">
                <h1 className="text-5xl lg:text-7xl font-bold text-white mb-4 drop-shadow-md">
                  {heroMovie.title}
                </h1>
                <p className="text-lg text-gray-300 mb-8 line-clamp-3">
                  {heroMovie.overview}
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setIsWatching(true)}
                    className="flex items-center gap-2 bg-white text-black px-6 py-2 rounded font-bold hover:bg-white/80 transition"
                  >
                    <Play fill="black" size={20} />
                    Play
                  </button>
                  <button className="flex items-center gap-2 bg-gray-500/50 backdrop-blur-md text-white px-6 py-2 rounded font-bold hover:bg-gray-500/70 transition">
                    <Info size={20} />
                    More Info
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* Horizontal List: Trending */}
      <section className="relative z-20 px-8 lg:px-16 mt-[-8vh]">
        <h2 className="text-2xl font-bold text-white mb-4">Trending Now</h2>
        
        <div className="flex gap-4 overflow-x-auto scrollbar-hide py-4 px-2 -mx-2">
          {movies.map((movie) => (
            <div 
              key={movie.id}
              className="relative flex-none w-48 aspect-[2/3] md:w-56 rounded-md overflow-hidden cursor-pointer transition-transform duration-300 hover:scale-105 hover:z-30 shadow-lg border border-transparent hover:border-white/50"
              onClick={() => setHeroMovie(movie)}
            >
              {movie.poster_path ? (
                <Image
                  src={movie.poster_path}
                  alt={movie.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-800 flex items-center justify-center p-4 text-center text-sm font-semibold">
                  {movie.title}
                </div>
              )}
            </div>
          ))}
          
          {/* Skeleton Loaders if empty */}
          {movies.length === 0 && Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex-none w-48 aspect-[2/3] md:w-56 rounded-md bg-gray-800 animate-pulse" />
          ))}
        </div>
      </section>
    </main>
  );
}
