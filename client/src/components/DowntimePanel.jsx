import { useState } from 'react';
import { useStore } from '../store/useStore';

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
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
      <div className="bg-white rounded-xs shadow-sm p-5">
        <h3 className="text-base font-bold text-neutral-900 m-0 mb-4">Log Downtime Reason</h3>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
              Downtime Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
            >
              <option value="">— Select a reason —</option>
              {downtimeReasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
              Remarks (Optional)
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add any additional notes..."
              className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 resize-vertical min-h-20 sm:min-h-24"
            />
          </div>

          <button
            type="submit"
            className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white border-0 rounded-xs text-sm font-semibold cursor-pointer transition-all mt-2 hover:bg-purple-700 hover:-translate-y-px disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitted ? '✓ Submitted' : 'Submit Downtime Log'}
          </button>

          <div className="flex gap-2 mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-xs text-xs text-yellow-700">
            <span className="shrink-0 font-bold">ℹ</span>
            <span>
              If no reason is selected, downtime is recorded as "No Reason Selected" and flagged
              for follow-up.
            </span>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-xs shadow-sm p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-base font-bold text-neutral-900 m-0">Unassigned Downtime</h3>
          {unassignedDowntimes.length > 0 && (
            <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-xs text-xs font-bold">
              {unassignedDowntimes.length}
            </span>
          )}
        </div>

        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="border-b border-neutral-200">
              <th className="text-left px-3 py-2 font-semibold text-neutral-600">Start Time</th>
              <th className="text-left px-3 py-2 font-semibold text-neutral-600">End Time</th>
              <th className="text-left px-3 py-2 font-semibold text-neutral-600">Duration</th>
              <th className="text-left px-3 py-2 font-semibold text-neutral-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {unassignedDowntimes.length > 0 ? (
              unassignedDowntimes.map((downtime, idx) => (
                <tr key={idx} className="border-b border-neutral-150 hover:bg-neutral-50">
                  <td className="px-3 py-2 text-neutral-600">{formatTime(downtime.timestamp)}</td>
                  <td className="px-3 py-2 text-neutral-600">—</td>
                  <td className="px-3 py-2 text-neutral-600">—</td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-xs text-xs font-semibold">
                      No Reason Selected
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="text-center py-8 text-neutral-400">
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
