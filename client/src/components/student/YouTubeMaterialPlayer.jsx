import { useEffect, useRef, useState } from "react";
import api from "../../services/api.js";
import { mergeRanges } from "../../utils/youtube.js";

let youtubeApiPromise;
function loadYouTubeApi() {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (youtubeApiPromise) return youtubeApiPromise;
  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previousReady?.(); resolve(window.YT); };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.onerror = () => reject(new Error("The YouTube player could not be loaded."));
    document.head.append(script);
  });
  return youtubeApiPromise;
}

export default function YouTubeMaterialPlayer({ material, onCompleted, onError }) {
  const hostRef = useRef(null);
  const playerRef = useRef(null);
  const rangesRef = useRef(material.completion?.watchedRanges || []);
  const lastTimeRef = useRef(null);
  const persistTimer = useRef(null);
  const persistRef = useRef(null);
  const [status, setStatus] = useState(material.completion?.isCompleted ? "completed" : material.completion?.progressPercent ? "progress" : "ready");
  const [error, setError] = useState("");

  async function persist() {
    const player = playerRef.current;
    const duration = player?.getDuration?.() || 0;
    if (!duration || !rangesRef.current.length) return;
    try {
      const response = await api.patch(`/student/materials/${material.id}/video-progress`, {
        durationSeconds: duration,
        lastPositionSeconds: player.getCurrentTime?.() || 0,
        watchedRanges: rangesRef.current,
      });
      if (response.data.data.isCompleted) {
        setStatus("completed");
        onCompleted?.(material.id, response.data.data);
      } else setStatus("progress");
    } catch (cause) {
      const message = cause.response?.data?.message || "Video progress could not be saved.";
      setError(message);
      onError?.(message);
    }
  }
  useEffect(() => { persistRef.current = persist; });

  useEffect(() => {
    let disposed = false;
    loadYouTubeApi().then((YT) => {
      if (disposed || !hostRef.current) return;
      playerRef.current = new YT.Player(hostRef.current, {
        videoId: material.videoId,
        playerVars: { playsinline: 1, rel: 0 },
        events: {
          onStateChange(event) {
            const playing = event.data === YT.PlayerState.PLAYING;
            if (!playing) {
              persistRef.current?.();
              lastTimeRef.current = null;
              return;
            }
            lastTimeRef.current = event.target.getCurrentTime();
          },
          onError() { setError("This video cannot be played inside PhinmaHub. Please contact your teacher."); },
        },
      });
    }).catch((cause) => setError(cause.message));
    const interval = window.setInterval(() => {
      const player = playerRef.current;
      if (!player || document.hidden || player.getPlayerState?.() !== window.YT?.PlayerState?.PLAYING) return;
      const current = player.getCurrentTime();
      const previous = lastTimeRef.current;
      if (previous !== null && current > previous && current - previous <= 2.5) rangesRef.current = mergeRanges([...rangesRef.current, [previous, current]], player.getDuration());
      lastTimeRef.current = current;
      if (!persistTimer.current) persistTimer.current = window.setTimeout(() => { persistTimer.current = null; persistRef.current?.(); }, 12_000);
    }, 1000);
    return () => {
      window.clearInterval(interval);
      if (persistTimer.current) window.clearTimeout(persistTimer.current);
      persistRef.current?.();
      playerRef.current?.destroy?.();
      playerRef.current = null;
      disposed = true;
    };
  }, [material.id, material.videoId]);

  return <div className="mt-4"><div className="aspect-video w-full overflow-hidden rounded-lg bg-slate-950" ref={hostRef} /><p className="mt-2 text-xs font-semibold text-slate-600">{status === "completed" ? "✓ Completed" : status === "progress" ? "◔ In progress" : "○ Not started"}</p>{error && <p className="mt-2 text-sm font-semibold text-red-700" role="alert">{error}</p>}</div>;
}
