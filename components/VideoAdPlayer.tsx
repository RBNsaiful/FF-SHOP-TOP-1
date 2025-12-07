
import React, { useRef, useState, useEffect, FC } from 'react';

interface VideoAdPlayerProps {
    videoUrl: string;
    onComplete: () => void;
    onClose: () => void;
    duration?: number; // Required if not a video file
}

const XIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
);

const RefreshIcon: FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
);

const VideoAdPlayer: FC<VideoAdPlayerProps> = ({ videoUrl, onComplete, onClose, duration = 15 }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [timeLeft, setTimeLeft] = useState<number>(duration);
    const [canSkip, setCanSkip] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isIframe, setIsIframe] = useState(false);
    const [isContentReady, setIsContentReady] = useState(false); // New state to track if content actually loaded
    const [hasError, setHasError] = useState(false);
    const [embedSrc, setEmbedSrc] = useState('');

    // Use refs to track start time for accurate countdown even if backgrounded
    const endTimeRef = useRef<number | null>(null);

    // Helper to convert YouTube links to Embed format
    // CRITICAL FIX: Added 'mute=1' to ensure autoplay works on modern browsers
    const getEmbedUrl = (url: string) => {
        // Regex to extract YouTube ID (Supports youtu.be, youtube.com/watch, youtube.com/embed)
        const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:.*v=|.*\/|embed\/)([^&?]*))/);
        if (ytMatch && ytMatch[1]) {
            return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&showinfo=0`;
        }
        return url;
    };

    useEffect(() => {
        if (!videoUrl) {
            setHasError(true);
            setLoading(false);
            return;
        }

        // Determine type and format URL
        // Check for common video extensions
        const isVideoFile = videoUrl.match(/\.(mp4|webm|ogg|mov)$/i);
        setIsIframe(!isVideoFile);
        
        if (!isVideoFile) {
            setEmbedSrc(getEmbedUrl(videoUrl));
        }

        // Reset states on new URL
        setLoading(true);
        setIsContentReady(false);
        setHasError(false);
        setTimeLeft(duration);
        endTimeRef.current = null;

    }, [videoUrl, duration]);

    // Timer Logic - Only runs when isContentReady is TRUE
    useEffect(() => {
        if (!isContentReady || canSkip) return;

        // Initialize end time when content becomes ready
        if (!endTimeRef.current) {
            endTimeRef.current = Date.now() + duration * 1000;
        }

        const timer = setInterval(() => {
            const now = Date.now();
            const remaining = Math.ceil((endTimeRef.current! - now) / 1000);

            if (remaining <= 0) {
                setTimeLeft(0);
                clearInterval(timer);
                setCanSkip(true);
                onComplete();
            } else {
                setTimeLeft(remaining);
            }
        }, 500);

        return () => clearInterval(timer);
    }, [isContentReady, canSkip, duration, onComplete]);

    // --- Handlers ---

    const handleContentLoad = () => {
        // Prevent double triggering
        if (!isContentReady) {
            setLoading(false);
            setIsContentReady(true); // Start the timer now
        }
    };

    const handleLoadError = () => {
        setLoading(false);
        setHasError(true);
        setIsContentReady(false); // Stop timer
    };

    const handleTimeUpdate = () => {
        if (videoRef.current && videoRef.current.duration) {
            // For raw video files, we rely on the video's own time
            const remaining = Math.ceil(videoRef.current.duration - videoRef.current.currentTime);
            // Only update UI if logic requires, but main timer is separate now for consistency
            // However, ensuring content is ready:
            if (!isContentReady && videoRef.current.currentTime > 0) {
                handleContentLoad();
            }
        }
    };

    const handleEnded = () => {
        setCanSkip(true);
        onComplete();
    };

    const handleCloseAttempt = () => {
        if (canSkip) {
            onClose();
        } else {
            if (confirm("Reward not collected yet. Are you sure you want to close?")) {
                onClose();
            }
        }
    };

    const handleRetry = () => {
        setLoading(true);
        setHasError(false);
        // Force iframe reload
        const currentSrc = embedSrc;
        setEmbedSrc('');
        setTimeout(() => setEmbedSrc(currentSrc), 100);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-black flex flex-col justify-center items-center">
            {/* Top Bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
                <div className={`px-4 py-1.5 rounded-full text-xs font-bold border backdrop-blur-md shadow-lg transition-colors ${canSkip ? 'bg-green-500/90 border-green-400 text-white' : 'bg-black/60 border-white/20 text-white'}`}>
                    {canSkip 
                        ? "Reward Granted" 
                        : hasError 
                            ? "Error Loading Ad"
                            : loading 
                                ? "Loading Ad..." 
                                : `Reward in: ${timeLeft > 0 ? timeLeft : 0}s`
                    }
                </div>
                <button 
                    onClick={handleCloseAttempt} 
                    className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors pointer-events-auto"
                >
                    <XIcon className="w-6 h-6" />
                </button>
            </div>

            {/* Content Area */}
            <div className="relative w-full h-full flex items-center justify-center bg-black">
                
                {/* Loader */}
                {loading && !hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-black">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
                        <p className="text-sm text-gray-400 animate-pulse">Loading Advertisement...</p>
                        <p className="text-xs text-gray-600 mt-2">Timer starts when video plays</p>
                    </div>
                )}

                {/* Error State */}
                {hasError && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 bg-black/90 p-6 text-center">
                        <div className="w-16 h-16 rounded-full bg-red-900/30 flex items-center justify-center mb-4">
                            <XIcon className="w-8 h-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-bold mb-2">Video Unavailable</h3>
                        <p className="text-sm text-gray-400 mb-6">The ad could not be loaded. Please check your internet or contact support.</p>
                        <button 
                            onClick={handleRetry}
                            className="flex items-center space-x-2 bg-primary px-6 py-2 rounded-full font-bold hover:bg-primary-dark transition-colors"
                        >
                            <RefreshIcon className="w-4 h-4" />
                            <span>Try Again</span>
                        </button>
                    </div>
                )}

                {isIframe ? (
                    embedSrc && !hasError && (
                        <iframe 
                            src={embedSrc} 
                            title="Ad Content"
                            className={`w-full h-full bg-black border-none transition-opacity duration-300 ${isContentReady ? 'opacity-100' : 'opacity-0'}`}
                            // Important: onLoad triggers when content is fully loaded
                            onLoad={handleContentLoad}
                            onError={handleLoadError}
                            // Added permissions for YouTube/Videos
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
                        />
                    )
                ) : (
                    !hasError && (
                        <video 
                            ref={videoRef}
                            src={videoUrl}
                            className={`w-full h-full object-contain transition-opacity duration-300 ${isContentReady ? 'opacity-100' : 'opacity-0'}`}
                            playsInline
                            disablePictureInPicture
                            controlsList="nodownload noremoteplayback noplaybackrate"
                            onTimeUpdate={handleTimeUpdate}
                            onEnded={handleEnded}
                            onCanPlay={handleContentLoad} 
                            onError={handleLoadError}
                            // CRITICAL: Muted is required for autoplay in most browsers
                            autoPlay
                            muted 
                        />
                    )
                )}
            </div>

            {/* Bottom Overlay (for Video only) */}
            {!isIframe && !hasError && (
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent text-center z-10 pointer-events-none">
                    <p className="text-white/80 text-xs mb-2">Advertisement</p>
                </div>
            )}
        </div>
    );
};

export default VideoAdPlayer;
