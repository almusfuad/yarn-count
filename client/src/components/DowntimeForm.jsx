import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function DowntimeForm() {
  const machines = useStore((state) => state.machines);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  const machinesList = Object.values(machines);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMachine || !reason) return;

    setLoading(true);
    try {
      const response = await fetch('/api/downtime', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: selectedMachine,
          reason,
          remarks
        })
      });

      if (response.ok) {
        setSelectedMachine('');
        setReason('');
        setRemarks('');
        alert('Downtime logged');
      } else {
        alert('Error logging downtime');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error logging downtime');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="downtime-form">
      <h4>⏹️ Log Downtime</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Machine</label>
          <select value={selectedMachine} onChange={(e) => setSelectedMachine(e.target.value)}>
            <option value="">Select machine</option>
            {machinesList.map((m) => (
              <option key={m.machineId} value={m.machineId}>
                {m.machineId}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Reason</label>
          <select value={reason} onChange={(e) => setReason(e.target.value)}>
            <option value="">Select reason</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Thread breakage">Thread breakage</option>
            <option value="Mechanical issue">Mechanical issue</option>
            <option value="Electrical issue">Electrical issue</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Remarks (optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional details..."
          />
        </div>

        <button type="submit" disabled={loading || !selectedMachine || !reason}>
          {loading ? 'Logging...' : 'Log Downtime'}
        </button>
      </form>
    </div>
  );
}
