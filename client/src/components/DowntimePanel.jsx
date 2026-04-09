import { useState } from 'react';
import { useStore } from '../store/useStore';
import './DowntimePanel.css';

export default function DowntimePanel() {
  const machines = useStore((state) => state.machines);
  const alerts = useStore((state) => state.alerts);

  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const downtimeReasons = [
    'Mechanical Failure',
    'Electrical Issue',
    'Operator Break',
    'Setup/Changeover',
    'Maintenance',
    'Quality Issue',
    'Material Issue',
    'Other'
  ];

  const unassignedDowntimes = alerts.filter((a) => !a.acked && a.type === 'downtime');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const machineId = Object.keys(machines)[0];
    if (!machineId) {
      alert('No machines available');
      return;
    }

    try {
      const response = await fetch('/api/downtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId,
          reason: reason || 'No Reason Selected',
          remarks
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setReason('');
        setRemarks('');
        setTimeout(() => setSubmitted(false), 2000);
      }
    } catch (err) {
      console.error('Failed to submit downtime log:', err);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  return (
    <div className="downtime-panel">
      <div className="dp-left-card">
        <h3 className="dp-card-title">Log Downtime Reason</h3>

        <form onSubmit={handleSubmit} className="dp-form">
          <div className="dp-form-group">
            <label className="dp-label">Downtime Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="dp-select"
            >
              <option value="">— Select a reason —</option>
              {downtimeReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="dp-form-group">
            <label className="dp-label">Remarks (Optional)</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any additional notes..."
              className="dp-textarea"
            />
          </div>

          <button type="submit" className="dp-submit-btn">
            {submitted ? '✓ Submitted' : 'Submit Downtime Log'}
          </button>

          <div className="dp-info-strip">
            <span className="dp-info-icon">ℹ</span>
            <span className="dp-info-text">
              If no reason is selected, downtime is recorded as "No Reason Selected" and flagged
              for follow-up.
            </span>
          </div>
        </form>
      </div>

      <div className="dp-right-card">
        <div className="dp-card-header">
          <h3 className="dp-card-title">Unassigned Downtime</h3>
          {unassignedDowntimes.length > 0 && (
            <span className="dp-unassigned-badge">{unassignedDowntimes.length}</span>
          )}
        </div>

        <table className="dp-table">
          <thead>
            <tr>
              <th>Start Time</th>
              <th>End Time</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {unassignedDowntimes.length > 0 ? (
              unassignedDowntimes.map((downtime, idx) => (
                <tr key={idx}>
                  <td>{formatTime(downtime.timestamp)}</td>
                  <td>—</td>
                  <td>—</td>
                  <td>
                    <span className="dp-status-badge">No Reason Selected</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="dp-empty">
                  No unassigned downtime
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
