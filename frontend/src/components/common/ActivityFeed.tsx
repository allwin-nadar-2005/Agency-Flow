import React from 'react';
import { ActivityLog } from '../../types';
import { useSocket } from '../../context/SocketContext';
import { formatDistanceToNow } from 'date-fns';
import { RefreshCw, Activity, ArrowRight } from 'lucide-react';

interface ActivityFeedProps {
  activities?: ActivityLog[];
  title?: string;
  showCatchupButton?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities: customActivities,
  title = 'Real-Time Activity Feed',
  showCatchupButton = true,
}) => {
  const { realtimeActivities, fetchCatchupEvents } = useSocket();
  const [isCatchingUp, setIsCatchingUp] = React.useState(false);

  const activities = customActivities || realtimeActivities;

  const handleCatchup = async () => {
    setIsCatchingUp(true);
    await fetchCatchupEvents();
    setTimeout(() => setIsCatchingUp(false), 500);
  };

  const getStatusColor = (status?: string | null) => {
    switch (status) {
      case 'TODO':
        return 'text-slate-400 bg-slate-800/80';
      case 'IN_PROGRESS':
        return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
      case 'IN_REVIEW':
        return 'text-amber-400 bg-amber-500/10 border border-amber-500/20';
      case 'COMPLETED':
        return 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20';
      default:
        return 'text-slate-400 bg-slate-800';
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-base">{title}</h3>
            <p className="text-xs text-slate-400">Live updates streamed via Socket.IO</p>
          </div>
        </div>

        {showCatchupButton && (
          <button
            onClick={handleCatchup}
            disabled={isCatchingUp}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700/80 text-xs font-semibold text-cyan-400 rounded-lg border border-slate-700 transition-all disabled:opacity-50"
            title="Fetch last 20 missed events from Postgres database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isCatchingUp ? 'animate-spin' : ''}`} />
            <span>DB Catchup</span>
          </button>
        )}
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
        {activities.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No activity logged yet.
          </div>
        ) : (
          activities.map((act) => (
            <div
              key={act.id}
              className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-start space-x-3 text-xs hover:border-slate-700/80 transition-all"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-600 to-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                {act.actor?.name?.charAt(0) || 'U'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold text-slate-100 truncate">
                    {act.actor?.name || 'System'}
                  </span>
                  <span className="text-[10px] text-slate-500 shrink-0 ml-2">
                    {formatDistanceToNow(new Date(act.createdAt))} ago
                  </span>
                </div>

                <p className="text-slate-400 mt-1 leading-relaxed">{act.message}</p>

                {act.previousStatus && act.newStatus && (
                  <div className="flex items-center space-x-2 mt-2">
                    <span
                      className={`px-2 py-0.5 rounded font-medium text-[10px] ${getStatusColor(
                        act.previousStatus
                      )}`}
                    >
                      {act.previousStatus}
                    </span>
                    <ArrowRight className="w-3 h-3 text-slate-500" />
                    <span
                      className={`px-2 py-0.5 rounded font-medium text-[10px] ${getStatusColor(
                        act.newStatus
                      )}`}
                    >
                      {act.newStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
