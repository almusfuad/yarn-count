import { useState } from 'react';
import { useStore } from '../store/useStore';


export default function EventLog() {
  const events = useStore((state) => state.events);
  const machines = useStore((state) => state.machines);
  const [filter, setFilter] = useState('ALL');

  const machineIds = ['ALL', ...new Set(Object.keys(machines))];

  const filtered = events.filter((e) => {
    if (filter === 'ALL') return true;
    return e.machineId === filter;
  });

  const formatTime = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getEventType = (type) => {
    const typeMap = {
      'roll_completed': 'Roll Completed',
      'fault_detected': 'Fault Detected',
      'machine_status': 'Machine Status',
      'setup_complete': 'Setup Complete',
      'machine_online': 'Machine Online',
      'machine_stopped': 'Machine Stopped'
    };
    return typeMap[type] || type;
  };

  return (
    <div className="bg-white rounded-xs shadow-sm p-5">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold m-0">📜 Event Log</h2>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
        >
          {machineIds.map((id) => (
            <option key={id} value={id}>
              {id === 'ALL' ? 'All Machines' : id}
            </option>
          ))}
        </select>
      </div>

      <div className="w-full flex flex-col max-h-96">
        <div className="grid grid-cols-3 gap-4 pb-3 border-b border-neutral-200 mb-3">
          <div className="font-bold text-neutral-500 text-xs uppercase">Time</div>
          <div className="font-bold text-neutral-500 text-xs uppercase">Event</div>
          <div className="font-bold text-neutral-500 text-xs uppercase">Source</div>
        </div>

        <div className="flex flex-col gap-3 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100">
          {filtered.length > 0 ? (
            filtered.map((event, idx) => {
              const isOnlineEvent = event.type === 'machine_online';
              const isStoppedEvent = event.type === 'machine_stopped';
              return (
                <div
                  key={idx}
                  className={`grid grid-cols-3 gap-4 py-3 border-b border-neutral-200 text-sm ${
                    isOnlineEvent
                      ? 'bg-emerald-50'
                      : isStoppedEvent
                      ? 'bg-orange-50'
                      : ''
                  }`}
                >
                  <div className="text-neutral-600">{formatTime(event.timestamp)}</div>
                  <div className="flex flex-col gap-1">
                    <span
                      className={`inline-block w-fit px-2 py-1 rounded-xs text-xs font-semibold ${
                        isOnlineEvent
                          ? 'bg-emerald-500 text-white'
                          : isStoppedEvent
                          ? 'bg-red-500 text-white'
                          : 'bg-purple-500 text-white'
                      }`}
                    >
                      {getEventType(event.type)}
                    </span>
                    {event.message && (
                      <span className="text-neutral-500 text-xs">{event.message}</span>
                    )}
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-xs text-xs font-semibold ${
                      event.source === 'System' 
                        ? 'bg-pink-500 text-white'
                        : event.source === 'Sensor'
                        ? 'bg-indigo-500 text-white'
                        : 'bg-neutral-200 text-neutral-700'
                    }`}>
                      {event.source}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-8 text-neutral-400">No events</div>
          )}
        </div>
      </div>
    </div>
  );
}
