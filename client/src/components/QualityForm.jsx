import { useState } from 'react';
import { useStore } from '../store/useStore';
import * as apiClient from '../services/apiClient.js';

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
      await apiClient.logQuality({
        machineId: selectedMachine,
        faultType,
        severity,
        description
      });

      setSelectedMachine('');
      setFaultType('');
      setSeverity('warning');
      setDescription('');
      alert('Quality issue logged');
    } catch (error) {
      console.error('Error:', error);
      alert('Error logging quality issue');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xs shadow-sm p-5">
      <h4 className="text-base font-bold text-neutral-900 m-0 mb-4">🔍 Log Quality Issue</h4>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Machine</label>
          <select 
            value={selectedMachine} 
            onChange={(e) => setSelectedMachine(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select machine</option>
            {machinesList.map((m) => (
              <option key={m.machineId} value={m.machineId}>
                {m.machineId}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Fault Type</label>
          <select 
            value={faultType} 
            onChange={(e) => setFaultType(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select fault</option>
            <option value="Yarn tension">Yarn tension</option>
            <option value="Uneven yarn">Uneven yarn</option>
            <option value="Contamination">Contamination</option>
            <option value="Knot">Knot</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Severity</label>
          <select 
            value={severity} 
            onChange={(e) => setSeverity(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
            <option value="info">Info</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Details about the quality issue..."
            className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-vertical min-h-24"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !selectedMachine || !faultType}
          className="px-4 py-2.5 bg-indigo-600 text-white border-0 rounded-xs text-sm font-semibold cursor-pointer transition-all hover:bg-indigo-700 hover:-translate-y-px disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Logging...' : 'Log Issue'}
        </button>
      </form>
    </div>
  );
}
