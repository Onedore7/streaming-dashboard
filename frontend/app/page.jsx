"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Search, Play, Plus, Info, ChevronDown } from "lucide-react";
import PremiumPlayer from "../components/PremiumPlayer";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://streaming-dashboard.onrender.com";

export default function Dashboard() {
  const [movies, setMovies] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [gridTitle, setGridTitle] = useState("Trending Now");
  
  // New States for Vercel/Cloudstream Hook
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  
  // Extraction Logic
  const [isExtracting, setIsExtracting] = useState(false);
  const [isWatching, setIsWatching] = useState(false);
  const [searchResultPlayUrl, setSearchResultPlayUrl] = useState("");

  const fetchTrending = () => {
    fetch(`${API_URL}/api/tmdb/trending`)
      .then((res) => res.json())
      .then((json) => {
        if (json.data && json.data.length > 0) {
          setMovies(json.data);
          setGridTitle("Trending Now");
          setHeroMovie(json.data[0]); 
        }
      })
      .catch((err) => console.error("Failed to fetch TMDB trending UI from API", err));
  };

  useEffect(() => {
    fetchTrending();
    // Fetch the newly structured Master Provider Config List
    fetch(`${API_URL}/api/sources`)
      .then((res) => res.json())
      .then((json) => {
        if (json.sources && typeof json.sources === 'object') {
            const providerArray = Object.keys(json.sources).map(key => json.sources[key]);
            setProviders(providerArray);
            if (providerArray.length > 0) setSelectedProvider(providerArray[0].id);
        }
      })
      .catch((err) => console.error("Failed to fetch sources", err));
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery) {
        fetchTrending();
        return;
    }
    
    // Phase 5: Fetch Graphic Movie Search Results FIRST (Netflix workflow!)
    try {
        const res = await fetch(`${API_URL}/api/tmdb/search?q=${encodeURIComponent(searchQuery)}`);
        const json = await res.json();
        
        if (json.data && json.data.length > 0) {
            setMovies(json.data);
            setHeroMovie(json.data[0]);
            setGridTitle(`Search Results for "${searchQuery}"`);
        } else {
            console.warn("No graphical results found on TMDB.");
        }
    } catch (err) {
        console.error("TMDB Search Execution Failed", err);
    }
  };

  const handleWatchNow = async () => {
    if (!heroMovie || !selectedProvider) return;
    setIsExtracting(true);
    setSearchResultPlayUrl("");

    // Phase 5: Actually Execute the Generic Cloudstream Extraction!
    try {
        const res = await fetch(`${API_URL}/api/watch?provider=${selectedProvider}&id=${encodeURIComponent(heroMovie.title)}`);
        const json = await res.json();
        
        if (json.data && json.data.success) {
            setSearchResultPlayUrl(json.data.sourceUrl);
            setIsWatching(true);
        } else {
            alert('Cloudstream Failed: ' + selectedProvider + ' could not extract a native stream for this movie. Try FlixHQ or another generic provider!');
        }
    } catch (e) {
        alert('Extraction Intercept Failed securely passing through CORS.');
    }
    setIsExtracting(false);
  };

  return (
    <main className="relative w-full min-h-screen pb-20 bg-black">
      {/* Navigation (Glassmorphism & Search) */}
      <nav className="fixed top-0 w-full z-50 flex items-center justify-between px-8 py-5 transition-all duration-300 bg-gradient-to-b from-black/80 to-transparent">
        <h1 
          className="text-red-600 font-black text-3xl tracking-tighter cursor-pointer drop-shadow-[0_0_15px_rgba(220,38,38,0.5)]"
          onClick={() => { setSearchQuery(""); fetchTrending(); }}
        >
          SFLIX
        </h1>
        
        <form 
          onSubmit={handleSearch}
          className="flex items-center space-x-2 bg-white/10 backdrop-blur-md rounded-full px-4 py-2 border border-white/20 transition hover:bg-white/20"
        >
          {/* Provider Selection Architecture */}
          <div className="relative flex items-center border-r border-white/20 pr-3 mr-2">
            <select 
                value={selectedProvider} 
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="bg-transparent text-white outline-none text-sm appearance-none cursor-pointer filter-none mr-2 uppercase tracking-widest font-bold"
            >
                {providers.map(p => (
                    <option key={p.id} value={p.id} className="text-black bg-white">{p.name}</option>
                ))}
            </select>
            <ChevronDown size={14} className="text-gray-300 absolute right-0 pointer-events-none" />
          </div>

          <Search size={20} className="text-gray-300 cursor-pointer" onClick={handleSearch} />
          <input
            type="text"
            placeholder={"Search movie catalog..."}
            className="bg-transparent border-none outline-none text-white placeholder-gray-400 w-48 lg:w-64"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </nav>

      {/* Hero Section */}
      {heroMovie && (
        <section className="relative w-full h-[80vh] flex items-center overflow-hidden">
          {isWatching ? (
            <div className="absolute inset-0 z-40 mt-20 px-8 flex items-center justify-center bg-black/80 backdrop-blur-lg">
               <div className="w-full max-w-6xl relative shadow-[0_0_40px_rgba(229,9,20,0.3)] rounded-2xl">
                 <button 
                    onClick={() => { setIsWatching(false); setSearchResultPlayUrl(""); }}
                    className="absolute -top-12 right-0 z-50 text-white bg-red-600/80 px-4 py-2 rounded-md hover:bg-red-600 transition font-bold shadow-lg"
                 >
                   EXIT PLAYER
                 </button>
                 <PremiumPlayer 
                    movieId={heroMovie.title} 
                    streamType={(searchResultPlayUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8").includes('.mpd') ? 'mpd' : 'm3u8'} 
                    streamUrl={searchResultPlayUrl || "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8"} 
                 />
               </div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 z-0 scale-105 transform">
                {heroMovie.backdrop_path ? (
                    <Image
                      src={heroMovie.backdrop_path}
                      alt={heroMovie.title}
                      fill
                      className="object-cover opacity-60 mix-blend-screen"
                      priority
                    />
                ) : (
                    <div className="w-full h-full bg-neutral-900 absolute" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
              </div>

              <div className="relative z-10 px-8 lg:px-16 max-w-2xl mt-20">
                <span className="px-3 py-1 bg-red-600 text-xs font-bold text-white uppercase tracking-widest rounded mb-4 inline-block shadow-lg">New Fetch</span>
                <h1 className="text-5xl lg:text-7xl font-bold text-white mb-4 drop-shadow-2xl">
                  {heroMovie.title}
                </h1>
                <p className="text-lg text-gray-300 mb-8 line-clamp-3 font-medium">
                  {heroMovie.overview}
                </p>
                <div className="flex gap-4">
                  <button 
                    onClick={handleWatchNow}
                    disabled={isExtracting}
                    className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-md font-bold hover:scale-105 transition-transform shadow-xl disabled:opacity-50"
                  >
                    <Play fill="black" size={20} />
                    {isExtracting ? 'Extracting Stream...' : 'Watch Now'}
                  </button>
                  <button className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-8 py-3 rounded-md font-bold hover:bg-white/30 transition shadow-xl border border-white/10">
                    <Info size={20} />
                    More Info
                  </button>
                </div>
              </div>
            </>
          )}
        </section>
      )}

      {/* Horizontal List: TMDB Graphical Grid */}
      <section className="relative z-20 px-8 lg:px-16 mt-[-10vh]">
        <h2 className="text-2xl font-bold text-white mb-6 drop-shadow-md border-l-4 border-red-600 pl-3">{gridTitle}</h2>
        
        <div className="flex gap-6 overflow-x-auto scrollbar-hide py-4 px-2 -mx-2">
          {movies.map((movie) => (
            <div 
              key={movie.id}
              className="relative flex-none w-48 aspect-[2/3] md:w-56 rounded-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-110 hover:z-30 shadow-2xl border border-white/5 hover:border-red-600/50 group"
              onClick={() => { setHeroMovie(movie); window.scrollTo({top: 0, behavior: 'smooth'}); }}
            >
              {movie.poster_path ? (
                <>
                  <Image
                    src={movie.poster_path}
                    alt={movie.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                     <p className="text-white font-bold text-sm leading-tight text-center w-full drop-shadow-lg">{movie.title}</p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full bg-neutral-900 flex items-center justify-center p-4 text-center text-sm font-semibold text-neutral-400">
                  {movie.title}
                </div>
              )}
            </div>
          ))}
          
          {/* Skeleton Loaders if API offline */}
          {movies.length === 0 && Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="flex-none w-48 aspect-[2/3] md:w-56 rounded-xl bg-neutral-900 animate-pulse border border-white/5" />
          ))}
        </div>
      </section>
    </main>
  );
}
