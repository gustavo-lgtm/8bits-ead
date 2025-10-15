"use client";
import YouTube, { YouTubeEvent, YouTubePlayer } from "react-youtube";
import { useEffect, useRef } from "react";

type Props = {
  youtubeId: string;
  thresholdPct?: number; // default 85
  onProgress?: (watchedSeconds: number, watchedPct: number) => void;
  onThresholdReached?: () => void;
  className?: string; // para customizar o container
};

export default function YouTubeProgressPlayer({
  youtubeId,
  thresholdPct = 85,
  onProgress,
  onThresholdReached,
  className = "",
}: Props) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const doneRef = useRef(false);

  const startTracking = () => {
    stopTracking();
    intervalRef.current = setInterval(async () => {
      const p = playerRef.current;
      if (!p) return;
      try {
        const current = await p.getCurrentTime();
        const duration = await p.getDuration();
        if (duration > 0) {
          const pct = (current / duration) * 100;
          onProgress?.(Math.floor(current), Math.min(100, pct));
          if (!doneRef.current && pct >= thresholdPct) {
            doneRef.current = true;
            onThresholdReached?.();
          }
        }
      } catch {}
    }, 1000);
  };

  const stopTracking = () => {
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const onReady = (e: YouTubeEvent<any>) => { playerRef.current = e.target; startTracking(); };
  const onStateChange = (e: YouTubeEvent<any>) => {
    const s = e.data; // 1 playing, 2 paused, 0 ended
    if (s === 1) startTracking();
    if (s === 2 || s === 0) stopTracking();
  };

  useEffect(() => stopTracking, []);

  return (
    <div className={`aspect-video w-full overflow-hidden rounded-2xl ${className}`}>
      <YouTube
        videoId={youtubeId}
        onReady={onReady}
        onStateChange={onStateChange}
        opts={{ playerVars: { rel: 0, modestbranding: 1, playsinline: 1 } }}
        className="w-full h-full"
        iframeClassName="w-full h-full"
      />
    </div>
  );
}
