
import React from 'react';
import { StaffActivity } from '../types';

interface LiveActivityFeedProps {
  activities: StaffActivity[];
}

const LiveActivityFeed: React.FC<LiveActivityFeedProps> = ({ activities }) => {
  return (
    <aside className="hidden lg:flex w-72 bg-white border-l border-slate-200 flex-col animate-in slide-in-from-right duration-500">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Store Live Feed</h3>
        <span className="flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
        {activities.length === 0 ? (
          <div className="py-20 text-center opacity-30">
            <svg className="w-10 h-10 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <p className="text-xs font-medium">No recent activity</p>
          </div>
        ) : (
          activities.map((activity) => (
            <div key={activity.id} className="relative pl-6 pb-4 border-l border-slate-100 last:pb-0 animate-in fade-in slide-in-from-bottom-2">
              <div className="absolute left-[-5px] top-0 w-[9px] h-[9px] rounded-full bg-indigo-500 border-2 border-white" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 font-bold mb-0.5">
                  {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <p className="text-xs leading-tight">
                  <span className="font-bold text-slate-800">{activity.user}</span>{' '}
                  <span className="text-slate-500">{activity.action}</span>
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-4 border-t border-slate-100 bg-slate-50/30">
        <p className="text-[10px] text-slate-400 font-medium text-center italic">
          BroadcastChannel active. Terminals synced.
        </p>
      </div>
    </aside>
  );
};

export default LiveActivityFeed;
