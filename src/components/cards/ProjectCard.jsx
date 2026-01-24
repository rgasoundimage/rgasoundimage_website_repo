import { useState, useEffect, useRef } from "react";

import { Card, CardContent } from "@/components/ui/card";

import {
  Play,
  VolumeX,
  Volume2,
  Maximize,
} from "lucide-react";

const ProjectCard = ({ title, tag, desc, video }) => {
    const videoRef = useRef(null);
    const hideTimeoutRef = useRef(null);
  
    const [muted, setMuted] = useState(true);
    const [progress, setProgress] = useState(0);
    const [showUI, setShowUI] = useState(false);
    const [isFakeFullscreen, setIsFakeFullscreen] = useState(false);
  
    const revealUI = () => {
      setShowUI(true);
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = setTimeout(() => {
        setShowUI(false);
      }, 2000);
    };
  
    useEffect(() => {
      return () => clearTimeout(hideTimeoutRef.current);
    }, []);
  
    const handleFullscreen = (e) => {
      e.stopPropagation();
      if (!videoRef.current) return;
  
      if (videoRef.current.requestFullscreen) {
        videoRef.current.requestFullscreen();
      } else if (videoRef.current.webkitRequestFullscreen) {
        videoRef.current.webkitRequestFullscreen();
      }
    };
  
    const isMobile =
      typeof window !== "undefined" &&
      window.matchMedia("(max-width: 768px)").matches;
  
    return (
      <Card className="rounded-2xl overflow-hidden transition hover:shadow-md">
        {/* Video Area */}
        <div
          className="relative aspect-video bg-black overflow-hidden cursor-pointer group"
          onMouseEnter={() => setShowUI(true)}
          onMouseLeave={() => setShowUI(false)}
          onClick={() => {
            if (!videoRef.current) return;
            revealUI();
            videoRef.current.paused
              ? videoRef.current.play()
              : videoRef.current.pause();
          }}
        >
          {video ? (
            <>
              {/* Video */}
              <video
                ref={videoRef}
                src={video}
                className="w-full h-full object-cover"
                preload="metadata"
                playsInline
                muted={muted}
                onTimeUpdate={() => {
                  if (!videoRef.current) return;
                  const percent =
                    (videoRef.current.currentTime /
                      videoRef.current.duration) *
                    100;
                  setProgress(percent || 0);
                }}
              />
  
              {/* Play Indicator */}
              <div
                className={`
                  pointer-events-none
                  absolute inset-0 flex items-center justify-center
                  transition-opacity duration-300
                  ${videoRef.current?.paused && !showUI
                    ? "opacity-100"
                    : "opacity-0"
                  }
                `}
              >
                <Play size={44} className="text-white/90 drop-shadow" />
              </div>
  
              {/* Scrubber */}
              <div
                className={`
                  absolute bottom-0 left-0 right-0 h-1.5
                  bg-white/20
                  transition-opacity duration-300
                  ${showUI ? "opacity-100" : "opacity-0"}
                `}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!videoRef.current) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const clickX = e.clientX - rect.left;
                  videoRef.current.currentTime =
                    (clickX / rect.width) *
                    videoRef.current.duration;
                }}
              >
                <div
                  className="h-full bg-white transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
  
              {/* Mute Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMuted(!muted);
                  revealUI();
                }}
                className={`
                  absolute bottom-3 right-3 z-20
                  bg-black/60 text-white p-2 rounded-full
                  transition-opacity duration-300
                  ${showUI ? "opacity-100" : "opacity-0"}
                `}
                aria-label="Toggle mute"
              >
                {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
  
              {/* Fullscreen Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  revealUI();
  
                  if (isMobile) {
                    setIsFakeFullscreen(true);
                  } else {
                    handleFullscreen(e);
                  }
                }}
                className={`
      absolute bottom-3 left-3 z-20
      bg-black/60 text-white p-2 rounded-full
      transition-opacity duration-300
      ${showUI ? "opacity-100" : "opacity-0"}
    `}
                aria-label="Fullscreen"
              >
                <Maximize size={18} />
              </button>
  
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-400">
              <Play />
            </div>
          )}
        </div>
  
        {/* Text Content */}
        <CardContent className="p-5 space-y-1">
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {tag}
          </p>
          <p className="font-medium">{title}</p>
          <p className="text-sm text-slate-600">{desc}</p>
        </CardContent>
        {isFakeFullscreen && (
          <div className="fixed inset-0 z-50 bg-black flex items-center justify-center px-4">
            <button
              onClick={() => setIsFakeFullscreen(false)}
              className="absolute top-4 right-4 z-10 bg-black/60 text-white p-2 rounded-full"
              aria-label="Close video"
            >
              ✕
            </button>
            <div className="w-full max-w-5xl aspect-video">
              <video
                src={video}
                className="w-full h-full object-contain"
                controls
                autoPlay
                playsInline
              />
            </div>
          </div>
        )}
      </Card>
    );
  };

  export default ProjectCard;