import React from 'react';
import { useSocket } from '../context/SocketContext';
import { Bell, CheckCheck, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useSocket();

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Notifications Center</h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time assignment updates, in-review alerts, and overdue notices.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={markAllNotificationsRead}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-xl border border-slate-700 transition-all"
          >
            <CheckCheck className="w-4 h-4" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 shadow-xl divide-y divide-slate-800/60">
        {notifications.length === 0 ? (
          <div className="p-12 text-center text-slate-500">No notifications available.</div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => markNotificationRead(n.id)}
              className={`p-4 first:pt-0 last:pb-0 transition-all cursor-pointer hover:bg-slate-800/30 rounded-xl ${
                !n.isRead ? 'bg-cyan-950/20' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  <div
                    className={`w-2 h-2 rounded-full ${
                      !n.isRead ? 'bg-cyan-400' : 'bg-slate-700'
                    }`}
                  />
                  <h3 className="font-bold text-sm text-slate-200">{n.title}</h3>
                </div>
                <span className="text-xs text-slate-500 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatDistanceToNow(new Date(n.createdAt))} ago</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1.5 pl-4 leading-relaxed">{n.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
