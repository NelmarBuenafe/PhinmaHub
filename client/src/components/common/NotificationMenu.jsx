import { ArrowRight, Bell, Circle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../services/api.js";
import HeaderDropdown from "./HeaderDropdown.jsx";

function timeAgo(value) {
  const seconds = Math.max(0, (Date.now() - Date.parse(value)) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationMenu({ role }) {
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const active = useRef(true);
  const navigate = useNavigate();
  const destination = role === "Student" ? "/student/announcements" : role === "Admin" ? "/admin/announcements" : "/teacher/courses";
  const loadCount = useCallback(async () => { try { const response = await api.get("/notifications/unread-count"); if (active.current) setUnread(response.data.data?.count || 0); } catch { /* Header remains usable when unavailable. */ } }, []);
  const loadItems = useCallback(async () => { setLoading(true); setError(""); try { const response = await api.get("/notifications"); if (active.current) setItems(response.data.data || []); await loadCount(); } catch { if (active.current) setError("We couldn't load notifications. Please try again."); } finally { if (active.current) setLoading(false); } }, [loadCount]);
  useEffect(() => { active.current = true; const initialTimer = window.setTimeout(loadCount, 0); const timer = window.setInterval(loadCount, 60000); return () => { active.current = false; window.clearTimeout(initialTimer); window.clearInterval(timer); }; }, [loadCount]);
  async function markRead(item) { if (!item.is_read) { setItems((current) => current.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry)); setUnread((count) => Math.max(0, count - 1)); try { await api.patch(`/notifications/${item.id}/read`); } catch { loadItems(); } } navigate(destination); }
  async function markAllRead() { setItems((current) => current.map((item) => ({ ...item, is_read: true }))); setUnread(0); try { await api.patch("/notifications/read-all"); } catch { loadItems(); } }
  const countLabel = unread > 99 ? "99+" : String(unread);
  return <HeaderDropdown label={unread ? `Notifications, ${unread} unread` : "Notifications"} onOpen={loadItems} buttonContent={<span className="ph-notification-trigger relative inline-flex size-5 items-center justify-center"><Bell aria-hidden="true" size={20} />{unread > 0 && <span aria-hidden="true" className="ph-notification-badge absolute -right-1.5 -top-1.5 min-w-4 rounded-full border-2 px-1 text-center text-[10px] font-black leading-3.5">{countLabel}</span>}</span>}>
    {({ close }) => <><div className="flex items-center justify-between gap-3 px-3 py-2"><h2 className="text-sm font-bold text-slate-950">Notifications</h2>{unread > 0 && <button className="ph-action text-xs font-bold text-emerald-800 hover:underline" onClick={markAllRead} type="button">Mark all as read</button>}</div><div className="border-t border-slate-100">{loading && <p className="px-3 py-4 text-sm text-slate-600" role="status">Loading notifications...</p>}{error && <p className="px-3 py-4 text-sm text-slate-600" role="alert">{error}</p>}{!loading && !error && !items.length && <p className="px-3 py-4 text-sm text-slate-500">No notifications yet.</p>}{!loading && !error && items.map((item) => <button className={`ph-action block w-full border-b border-slate-100 px-3 py-3 text-left last:border-0 ${item.is_read ? "bg-white" : "bg-emerald-50/70"}`} key={item.id} onClick={() => { close(); markRead(item); }} type="button"><span className="flex gap-2">{!item.is_read ? <Circle aria-hidden="true" className="mt-1 shrink-0 fill-emerald-600 text-emerald-600" size={8} /> : <span className="size-2 shrink-0" />}<span className="min-w-0"><strong className="block break-words text-sm text-slate-900">{item.title}</strong><span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600">{item.message}</span><time className="mt-1 block text-[11px] text-slate-500" dateTime={item.created_at}>{timeAgo(item.created_at)}</time></span></span></button>)}</div><Link className="mt-2 flex min-h-11 items-center justify-between gap-2 border-t border-slate-100 px-3 pt-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50" onClick={close} to={destination}>View notifications <ArrowRight aria-hidden="true" size={16} /></Link></>}
  </HeaderDropdown>;
}
