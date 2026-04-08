import { useState } from 'react';
import { useStore } from '../store/useStore';
import './RollPanel.css';

export default function RollPanel() {
  const machines = useStore((state) => state.machines);
  const [selectedMachine, setSelectedMachine] = useState('');
  const [weight, setWeight] = useState('');
  const [loading, setLoading] = useState(false);

  const machinesWithRolls = Object.values(machines).filter((m) =>
    Object.keys(m).includes('rollsCompleted')
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMachine || !weight) return;

    setLoading(true);
    try {
      const response = await fetch('/api/roll-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ machineId: selectedMachine, weight: parseFloat(weight) })
      });

      if (response.ok) {
        setWeight('');
        alert('Roll weight logged successfully');
      } else {
        alert('Error logging roll weight');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error logging roll weight');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="roll-panel">
      <h4>📋 Log Roll Weight</h4>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Machine</label>
          <select value={selectedMachine} onChange={(e) => setSelectedMachine(e.target.value)}>
            <option value="">Select machine</option>
            {machinesWithRolls.map((m) => (
              <option key={m.machineId} value={m.machineId}>
                {m.machineId}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Weight (KG)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <button type="submit" disabled={loading || !selectedMachine || !weight}>
          {loading ? 'Logging...' : 'Log Weight'}
        </button>
      </form>
    </div>
  );
}
