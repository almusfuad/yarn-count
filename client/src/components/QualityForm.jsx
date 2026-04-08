import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function QualityForm() {
  const machines = useStore((state) => state.machines);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [faultType, setFaultType] = useState('');
  const [severity, setSeverity] = useState('warning');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const machinesList = Object.values(machines);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMachine || !faultType) return;

    setLoading(true);
    try {
      const response = await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: selectedMachine,
          faultType,
          severity,
          description
        })
      });

      if (response.ok) {
        setSelectedMachine('');
        setFaultType('');
        setSeverity('warning');
        setDescription('');
        alert('Quality issue logged');
      } else {
        alert('Error logging quality issue');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error logging quality issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quality-form">
      <h4>🔍 Log Quality Issue</h4>
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
          <label>Fault Type</label>
          <select value={faultType} onChange={(e) => setFaultType(e.target.value)}>
            <option value="">Select fault</option>
            <option value="Yarn tension">Yarn tension</option>
            <option value="Uneven yarn">Uneven yarn</option>
            <option value="Contamination">Contamination</option>
            <option value="Knot">Knot</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Severity</label>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div className="form-group">
          <label>Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details about the quality issue..."
          />
        </div>

        <button type="submit" disabled={loading || !selectedMachine || !faultType}>
          {loading ? 'Logging...' : 'Log Issue'}
        </button>
      </form>
    </div>
  );
}
