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
      'roll_completed': 'roll_completed',
      'fault_detected': 'fault_detected',
      'machine_status': 'machine_status',
      'setup_complete': 'setup_complete'
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
            filtered.map((event, idx) => (
              <div key={idx} className="event-row">
                <div className="event-col-time">{formatTime(event.timestamp)}</div>
                <div className="event-col-event">
                  <span className="event-badge">{getEventType(event.type)}</span>
                </div>
                <div className="event-col-source">
                  <span className="event-source-badge">{event.source}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="no-events">No events</div>
          )}
        </div>
      </div>
    </div>
  );
}
