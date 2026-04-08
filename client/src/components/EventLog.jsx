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

  return (
    <div className="event-log">
      <div className="event-header">
        <h2>📜 Event Log</h2>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          {machineIds.map((id) => (
            <option key={id} value={id}>
              {id === 'ALL' ? 'All Machines' : id}
            </option>
          ))}
        </select>
      </div>

      <div className="event-list">
        {filtered.length > 0 ? (
          filtered.map((event, idx) => (
            <div key={idx} className="event-item">
              <div className="event-time">
                {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : 'N/A'}
              </div>
              <div className="event-machine">{event.machineId}</div>
              <div className="event-type">{event.type}</div>
              <div className="event-message">{event.message}</div>
            </div>
          ))
        ) : (
          <div className="no-events">No events</div>
        )}
      </div>
    </div>
  );
}
