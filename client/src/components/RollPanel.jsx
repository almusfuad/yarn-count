import { useState } from 'react';
import { useStore } from '../store/useStore';

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
    <div className="bg-white rounded-xs shadow-sm p-5">
      <h4 className="m-0 mb-4 text-base font-bold text-neutral-900">📋 Log Roll Weight</h4>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-neutral-500 mb-1.5 uppercase">Machine</label>
          <select
            value={selectedMachine}
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select machine</option>
            {machinesWithRolls.map((m) => (
              <option key={m.machineId} value={m.machineId}>
                {m.machineId}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col">
          <label className="text-xs font-semibold text-neutral-500 mb-1.5 uppercase">Weight (KG)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0.00"
           className="px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !selectedMachine || !weight}
          className="px-4 py-2.5 bg-indigo-600 text-white border-0 rounded-xs text-sm font-semibold cursor-pointer transition-all mt-1.5 hover:bg-indigo-700 hover:-translate-y-px disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Logging...' : 'Log Weight'}
        </button>
      </form>
    </div>
  );
}
