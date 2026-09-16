import { useEffect, useRef, useState } from "react";
import api from "../../services/api.js";
import { mergeRanges } from "../../utils/youtube.js";

export default function UploadedVideoMaterialPlayer({ material, onCompleted, onError }) {
  const videoRef = useRef(null);
  const rangesRef = useRef(material.completion?.watchedRanges || []);
  const lastTimeRef = useRef(null);
  const persistTimer = useRef(null);
  const persistRef = useRef(null);
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState(material.completion?.isCompleted ? "completed" : material.completion?.progressPercent ? "progress" : "ready");
  const [error, setError] = useState("");

  async function persist() {
    const video = videoRef.current;
    if (!video?.duration || !rangesRef.current.length) return;
    try {
      const response = await api.patch(`/student/materials/${material.id}/video-progress`, {
        durationSeconds: video.duration,
        lastPositionSeconds: video.currentTime || 0,
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
    let active = true;
    api.get(`/student/materials/${material.id}/access`)
      .then((response) => { if (active) setUrl(response.data.data.url); })
      .catch((cause) => {
        const message = cause.response?.data?.message || "This video could not be loaded right now.";
        if (active) setError(message);
        onError?.(message);
      });
    return () => { active = false; };
  }, [material.id, onError]);

  useEffect(() => () => {
    if (persistTimer.current) window.clearTimeout(persistTimer.current);
    persistRef.current?.();
  }, []);

  function notePlayback() {
    const video = videoRef.current;
    if (!video || video.paused || document.hidden) return;
    const current = video.currentTime;
    const previous = lastTimeRef.current;
    if (previous !== null && current > previous && current - previous <= 2.5) {
      rangesRef.current = mergeRanges([...rangesRef.current, [previous, current]], video.duration);
    }
    lastTimeRef.current = current;
    if (!persistTimer.current) {
      persistTimer.current = window.setTimeout(() => {
        persistTimer.current = null;
        persistRef.current?.();
      }, 12_000);
    }
  }

  function pauseOrSeek() {
    persistRef.current?.();
    lastTimeRef.current = null;
  }

  return <div className="mt-4">
    {url && <video className="aspect-video w-full rounded-lg bg-slate-950" controls controlsList="nodownload" onEnded={pauseOrSeek} onPause={pauseOrSeek} onPlay={(event) => { lastTimeRef.current = event.currentTarget.currentTime; }} onSeeking={pauseOrSeek} onTimeUpdate={notePlayback} playsInline ref={videoRef} src={url} />}
    {!url && !error && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">Loading protected video…</p>}
    <p className="mt-2 text-xs font-semibold text-slate-600">{status === "completed" ? "✓ Completed" : status === "progress" ? "◔ In progress" : "○ Not started"}</p>
    {error && <p className="mt-2 text-sm font-semibold text-red-700" role="alert">{error}</p>}
  </div>;
}
