import { useState } from 'react';
import { useStore } from '../store/useStore';
import './EventLog.css';

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
    <div className="event-log">
      <div className="event-log-header">
        <h2>📜 Event Log</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="event-filter-select">
          {machineIds.map((id) => (
            <option key={id} value={id}>
              {id === 'ALL' ? 'All Machines' : id}
            </option>
          ))}
        </select>
      </div>

      <div className="event-table">
        <div className="event-table-header">
          <div className="event-col-time">TIME</div>
          <div className="event-col-event">EVENT</div>
          <div className="event-col-source">SOURCE</div>
        </div>

        <div className="event-list">
          {filtered.length > 0 ? (
            filtered.map((event, idx) => {
              const isOnlineEvent = event.type === 'machine_online';
              const isStoppedEvent = event.type === 'machine_stopped';
              return (
                <div 
                  key={idx} 
                  className={`event-row ${isOnlineEvent ? 'event-online' : isStoppedEvent ? 'event-stopped' : ''}`}
                >
                  <div className="event-col-time">{formatTime(event.timestamp)}</div>
                  <div className="event-col-event">
                    <div className="event-badge-wrapper">
                      <span className={`event-badge ${isOnlineEvent ? 'online' : isStoppedEvent ? 'stopped' : ''}`}>
                        {getEventType(event.type)}
                      </span>
                      {event.message && <span className="event-message">{event.message}</span>}
                    </div>
                  </div>
                  <div className="event-col-source">
                    <span className="event-source-badge">{event.source}</span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="no-events">No events</div>
          )}
        </div>
      </div>
    </div>
  );
}
