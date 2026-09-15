import { ArrowRight, Bell, Circle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useNotifications } from "../../contexts/notificationContext.js";
import HeaderDropdown from "./HeaderDropdown.jsx";

function timeAgo(value) {
  const seconds = Math.max(0, (Date.now() - Date.parse(value)) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function NotificationMenu({ role }) {
  const { error, hasLoaded, initialLoading, markAllAsRead, markAsRead, notifications, refreshNotifications, unreadCount } = useNotifications();
  const navigate = useNavigate();
  const destination = role === "Student" ? "/student/announcements" : role === "Admin" ? "/admin/announcements" : "/teacher/courses";
  const countLabel = unreadCount > 99 ? "99+" : String(unreadCount);
  return <HeaderDropdown label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"} onOpen={() => { void refreshNotifications().catch(() => {}); }} buttonContent={<span className="ph-notification-trigger relative inline-flex size-5 items-center justify-center"><Bell aria-hidden="true" size={20} />{unreadCount > 0 && <span aria-hidden="true" className="ph-notification-badge absolute -right-1.5 -top-1.5 min-w-4 rounded-full border-2 px-1 text-center text-[10px] font-black leading-3.5">{countLabel}</span>}</span>}>
    {({ close }) => <><div className="flex items-center justify-between gap-3 px-3 py-2"><h2 className="text-sm font-bold text-slate-950">Notifications</h2>{unreadCount > 0 && <button className="ph-action text-xs font-bold text-emerald-800 hover:underline" onClick={() => { void markAllAsRead(); }} type="button">Mark all as read</button>}</div><div className="border-t border-slate-100">{initialLoading && !hasLoaded && <p className="px-3 py-4 text-sm text-slate-600" role="status">Loading notifications...</p>}{!hasLoaded && !initialLoading && error && <div className="px-3 py-4 text-sm text-slate-600" role="alert"><p>{error}</p><button className="ph-action mt-2 text-xs font-bold text-emerald-800 hover:underline" onClick={() => { void refreshNotifications({ force: true }); }} type="button">Try again</button></div>}{hasLoaded && !notifications.length && <p className="px-3 py-4 text-sm text-slate-500">You&apos;re all caught up. No new notifications.</p>}{hasLoaded && notifications.map((item) => <button className={`ph-action block w-full border-b border-slate-100 px-3 py-3 text-left last:border-0 ${item.is_read ? "bg-white" : "bg-emerald-50/70"}`} key={item.id} onClick={() => { close(); void markAsRead(item); navigate(destination); }} type="button"><span className="flex gap-2">{!item.is_read ? <Circle aria-hidden="true" className="mt-1 shrink-0 fill-emerald-600 text-emerald-600" size={8} /> : <span className="size-2 shrink-0" />}<span className="min-w-0"><strong className="block break-words text-sm text-slate-900">{item.title}</strong><span className="mt-1 block line-clamp-2 text-xs leading-5 text-slate-600">{item.message}</span><time className="mt-1 block text-[11px] text-slate-500" dateTime={item.created_at}>{timeAgo(item.created_at)}</time></span></span></button>)}</div><Link className="mt-2 flex min-h-11 items-center justify-between gap-2 border-t border-slate-100 px-3 pt-2 text-sm font-bold text-emerald-800 hover:bg-emerald-50" onClick={close} to={destination}>View notifications <ArrowRight aria-hidden="true" size={16} /></Link></>}
  </HeaderDropdown>;
}
