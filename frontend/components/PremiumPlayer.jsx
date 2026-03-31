"use client";

import React, { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { Play, Pause, Settings, Subtitles, Volume2, Maximize } from 'lucide-react';

export default function PremiumPlayer({ movieId, streamUrl, streamType }) {
    const videoRef = useRef(null);
    const containerRef = useRef(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [bufferGlow, setBufferGlow] = useState(0);
    const [controlsVisible, setControlsVisible] = useState(true);
    const [speed, setSpeed] = useState(1);
    const [token, setToken] = useState(null);
    const [error, setError] = useState('');
    const controlsTimeoutRef = useRef(null);

    // 1. Initial Handshake Validation
    useEffect(() => {
        const fetchToken = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/player/token?id=${movieId}`);
                if (!res.ok) throw new Error('Unauthorized Stream Request');
                const data = await res.json();
                setToken(data.token);
            } catch (err) {
                setError('Security Token Handshake Failed. Anti-Leak protected.');
            }
        };
        fetchToken();
    }, [movieId]);

    // 2. Universal Engine Initialization
    useEffect(() => {
        if (!token || !videoRef.current || !streamUrl) return;
        const video = videoRef.current;
        let hls;

        // Auto-Resume LocalStorage Bridge
        const savedTime = localStorage.getItem(`watch_progress_${movieId}`);
        if (savedTime) {
            video.currentTime = parseFloat(savedTime);
        }

        if (streamType === 'm3u8' && Hls.isSupported()) {
            hls = new Hls({
                maxBufferLength: 30, // Optimize "zero buffering" cache targeting
            });
            hls.loadSource(streamUrl);
            hls.attachMedia(video);
            hls.on(Hls.Events.MANIFEST_PARSED, function () {
                video.play().catch(() => console.log('Autoplay blocked'));
            });
        } 
        else if (streamType === 'mpd') {
            // Lazy load Shaka exclusively for Dash
            import('shaka-player').then(shaka => {
                shaka.polyfill.installAll();
                const player = new shaka.Player(video);
                player.load(streamUrl).then(() => {
                    video.play().catch(() => console.log('Autoplay blocked'));
                }).catch(e => console.error('Shaka Dash Error', e));
            });
        } else {
            // HTML5 Fallback
            video.src = streamUrl;
            video.play().catch(() => console.log('Autoplay blocked'));
        }

        return () => {
            if (hls) hls.destroy();
        };
    }, [token, streamUrl, streamType, movieId]);

    // 3. Playback Listeners & State Binding
    const handleTimeUpdate = () => {
        if (!videoRef.current) return;
        const { currentTime, duration, buffered } = videoRef.current;
        setProgress((currentTime / duration) * 100);
        
        // Auto-Resume Caching
        if (currentTime > 0) {
            localStorage.setItem(`watch_progress_${movieId}`, currentTime.toString());
        }

        // Buffer Visualizer (Glow Width Logic)
        if (buffered.length > 0) {
            const bufferedEnd = buffered.end(buffered.length - 1);
            setBufferGlow((bufferedEnd / duration) * 100);
        }
    };

    const togglePlay = () => {
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    };

    const changeSpeed = () => {
        const nextSpeed = speed >= 2 ? 0.5 : speed + 0.5;
        videoRef.current.playbackRate = nextSpeed;
        setSpeed(nextSpeed);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    };

    const handleMouseMove = () => {
        setControlsVisible(true);
        clearTimeout(controlsTimeoutRef.current);
        controlsTimeoutRef.current = setTimeout(() => {
            if (isPlaying) setControlsVisible(false);
        }, 2500);
    };

    if (error) {
        return (
            <div className="w-full h-[60vh] bg-neutral-900 rounded-2xl flex items-center justify-center text-red-500 font-mono text-sm border border-red-900 shadow-2xl">
                [SECURITY] {error}
            </div>
        );
    }

    if (!token) {
        return (
            <div className="w-full h-[60vh] bg-black rounded-2xl flex items-center justify-center">
                <div className="animate-spin w-8 h-8 rounded-full border-t-2 border-r-2 border-[#E50914]"></div>
                <span className="ml-4 text-neutral-400 font-mono text-xs tracking-widest uppercase">Validating Handshake...</span>
            </div>
        );
    }

    return (
        <div 
            ref={containerRef} 
            className="relative w-full h-[65vh] bg-black rounded-2xl overflow-hidden group shadow-2xl"
            onMouseMove={handleMouseMove}
            onMouseLeave={() => isPlaying && setControlsVisible(false)}
        >
            {/* Native Video Engine */}
            <video
                ref={videoRef}
                className="w-full h-full object-contain"
                onTimeUpdate={handleTimeUpdate}
                onClick={togglePlay}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
            >
                {/* Internal Subtitle Mock Track */}
                <track kind="subtitles" srcLang="en" label="English" src="/subs/en.vtt" default />
            </video>

            {/* Premium UI Glassmorphic Controls */}
            <div className={`absolute bottom-0 w-full p-6 transition-opacity duration-300 pointer-events-none \${controlsVisible ? 'opacity-100' : 'opacity-0'}`}>
                
                {/* Gradient Underlay for Contrast */}
                <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black/80 to-transparent -z-10" />

                {/* Scrubber Bar Wrapper (Interactive) */}
                <div className="relative w-full h-1.5 bg-white/20 rounded-full cursor-pointer mb-6 pointer-events-auto">
                    
                    {/* The Buffer 'Glow' Effect Layer */}
                    <div 
                        className="absolute top-0 left-0 h-full bg-white/40 rounded-full shadow-[0_0_15px_#fff]"
                        style={{ width: `\${bufferGlow}%` }}
                    />

                    {/* The Main Progress Scrubber */}
                    <div 
                        className="absolute top-0 left-0 h-full bg-[#E50914] rounded-full transition-all duration-100 shadow-[0_0_10px_#e50914]"
                        style={{ width: `\${progress}%` }}
                    >
                        {/* Playhead Marker */}
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-md scale-0 group-hover:scale-100 transition-transform" />
                    </div>
                </div>

                {/* Bottom Control Deck */}
                <div className="flex items-center justify-between text-white pointer-events-auto">
                    <div className="flex items-center space-x-6">
                        <button onClick={togglePlay} className="hover:scale-110 transition-transform">
                            {isPlaying ? <Pause size={28} /> : <Play size={28} className="fill-white" />}
                        </button>
                        <button className="hover:text-[#E50914] transition-colors">
                            <Volume2 size={24} />
                        </button>
                        <div className="text-sm font-medium tracking-wide">
                            <span className="text-[#E50914]">LIVE</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6">
                        <button onClick={changeSpeed} className="px-3 py-1 bg-white/10 rounded-md text-xs font-bold hover:bg-white/20 transition-colors">
                            {speed}x
                        </button>
                        <button className="hover:text-neutral-400 transition-colors"><Subtitles size={24} /></button>
                        <button className="hover:text-neutral-400 transition-colors"><Settings size={24} /></button>
                        <button onClick={toggleFullscreen} className="hover:scale-110 transition-transform"><Maximize size={24} /></button>
                    </div>
                </div>
            </div>
        </div>
    );
}
