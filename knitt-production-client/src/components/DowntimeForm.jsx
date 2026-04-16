import { useState } from 'react';
import { useStore } from '../store/useStore';
import * as apiClient from '../services/apiClient.js';

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
      await apiClient.logDowntime({
        machineId: selectedMachine,
        reason,
        remarks
      });

      setSelectedMachine('');
      setReason('');
      setRemarks('');
      alert('Downtime logged');
    } catch (error) {
      console.error('Error:', error);
      alert('Error logging downtime');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xs shadow-sm p-5">
      <h4 className="text-base font-bold text-neutral-900 m-0 mb-4">⏹️ Log Downtime</h4>
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
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Reason</label>
          <select 
            value={reason} 
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
          >
            <option value="">Select reason</option>
            <option value="Maintenance">Maintenance</option>
            <option value="Thread breakage">Thread breakage</option>
            <option value="Mechanical issue">Mechanical issue</option>
            <option value="Electrical issue">Electrical issue</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Remarks (optional)</label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Additional details..."
            className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 resize-vertical min-h-24"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading || !selectedMachine || !reason}
          className="px-4 py-2.5 bg-indigo-600 text-white border-0 rounded-xs text-sm font-semibold cursor-pointer transition-all hover:bg-indigo-700 hover:-translate-y-px disabled:bg-neutral-300 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? 'Logging...' : 'Log Downtime'}
        </button>
      </form>
    </div>
  );
}
