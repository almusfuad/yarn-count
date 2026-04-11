import { useState } from 'react';
import { useStore } from '../store/useStore';


const FAULT_TYPES = ['Yarn Breakage', 'Dropped Stitch', 'Tension Error', 'Yarn Contamination', 'Knot', 'Other'];
const SEVERITIES = ['Critical', 'Major', 'Minor'];

const FLOOR_PILL_COLORS = {
  F1: { bg: '#ede9fe', color: '#4c1d95' },
  F2: { bg: '#cffafe', color: '#155e75' },
  F3: { bg: '#f3e8ff', color: '#6b21a8' }
};

export default function QualityControl() {
  const kpis = useStore((state) => state.kpis);
  const machines = useStore((state) => state.machines);

  const [selectedFloor, setSelectedFloor] = useState('');
  const [selectedMachine, setSelectedMachine] = useState('');
  const [faultType, setFaultType] = useState('');
  const [severity, setSeverity] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const machineList = Object.values(machines);
  const uniqueFloors = [...new Set(machineList.map((m) => m.machineId.split('-')[0]))].sort();

  const floorsOnMachines = selectedFloor
    ? machineList.filter((m) => m.machineId.startsWith(selectedFloor))
    : [];

  const qualityLogs = kpis.qualityLogs || [];

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedMachine || !faultType || !severity) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const response = await fetch('/api/quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          machineId: selectedMachine,
          faultType,
          severity: severity.toLowerCase(),
          description
        })
      });

      if (response.ok) {
        setSubmitted(true);
        setSelectedFloor('');
        setSelectedMachine('');
        setFaultType('');
        setSeverity('');
        setDescription('');
        setTimeout(() => setSubmitted(false), 2000);
      }
    } catch (err) {
      console.error('Failed to submit quality fault:', err);
    }
  };

  const getFloorDisplay = (machineId) => {
    const floorKey = machineId.split('-')[0];
    return floorKey;
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

  const getSeverityBadgeStyle = (severity) => {
    const styles = {
      critical: { bg: '#fee2e2', color: '#991b1b' },
      major: { bg: '#fed7aa', color: '#9a3412' },
      minor: { bg: '#d1fae5', color: '#065f46' }
    };
    return styles[severity.toLowerCase()] || styles.minor;
  };

  const totalFaults = qualityLogs.length;
  const criticalFaults = qualityLogs.filter((q) => q.severity === 'critical').length;
  const faultRate = (kpis.totalCount || 0) > 0 ? ((totalFaults / (kpis.totalCount || 1)) * 1000).toFixed(2) : '0.00';

  return (
    <div className="flex flex-col gap-5 mb-6">
      <h3 className="text-base font-bold text-neutral-900 m-0">Quality Control</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xs shadow-sm p-4 flex items-start gap-4">
          <div className="text-2xl">🔍</div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-neutral-900">{totalFaults}</div>
            <div className="text-xs font-semibold uppercase text-neutral-600">Total Faults</div>
            <div className="text-xs text-neutral-500">This shift</div>
          </div>
        </div>

        <div className="bg-white rounded-xs shadow-sm p-4 flex items-start gap-4">
          <div className="text-2xl">🚨</div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-neutral-900">{criticalFaults}</div>
            <div className="text-xs font-semibold uppercase text-neutral-600">Critical Faults</div>
            <div className="text-xs text-neutral-500">Immediate action</div>
          </div>
        </div>

        <div className="bg-white rounded-xs shadow-sm p-4 flex items-start gap-4">
          <div className="text-2xl">📉</div>
          <div className="flex-1">
            <div className="text-2xl font-bold text-neutral-900">{faultRate}</div>
            <div className="text-xs font-semibold uppercase text-neutral-600">Fault Rate</div>
            <div className="text-xs text-neutral-500">Per 1,000 units</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-xs shadow-sm p-5">
          <h4 className="text-base font-bold text-neutral-900 m-0 mb-4">Log Quality Fault</h4>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
                  Floor <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setSelectedMachine('');
                  }}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">— Floor —</option>
                  {uniqueFloors.map((floor) => (
                    <option key={floor} value={floor}>
                      {floor}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
                  Machine <span className="text-red-600">*</span>
                </label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 disabled:bg-neutral-100 disabled:text-neutral-400 disabled:cursor-not-allowed"
                  disabled={!selectedFloor}
                >
                  <option value="">— Machine —</option>
                  {floorsOnMachines.map((machine) => (
                    <option key={machine.machineId} value={machine.machineId}>
                      {machine.machineId}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
                  Fault Type <span className="text-red-600">*</span>
                </label>
                <select
                  value={faultType}
                  onChange={(e) => setFaultType(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">— Type —</option>
                  {FAULT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">
                  Severity <span className="text-red-600">*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100"
                >
                  <option value="">— Severity —</option>
                  {SEVERITIES.map((sev) => (
                    <option key={sev} value={sev}>
                      {sev}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-2">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the fault..."
                className="w-full px-3 py-2 border border-neutral-300 rounded-xs text-sm font-inherit focus:outline-none focus:border-purple-600 focus:ring-2 focus:ring-purple-100 resize-vertical min-h-20 sm:min-h-24"
              />
            </div>

            <button type="submit" className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-purple-600 text-white border-0 rounded-xs text-sm font-semibold cursor-pointer transition-all hover:bg-purple-700 hover:-translate-y-px">
              {submitted ? '✓ Logged' : 'Submit Fault Report'}
            </button>

            <div className="flex gap-2 p-3 bg-amber-50 rounded-xs text-xs text-amber-700">
              <span className="shrink-0 font-bold">⚠</span>
              <span>
                Critical faults trigger an <strong>in-app alert</strong> and{' '}
                <strong>Telegram notification</strong> automatically.
              </span>
            </div>
          </form>
        </div>

        <div className="bg-white rounded-xs shadow-sm p-3 sm:p-4 md:p-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-0">
            <h4 className="text-base font-bold text-neutral-900 m-0">Fault Log</h4>
            <span className="px-2.5 py-1 bg-neutral-200 text-neutral-700 rounded-xs text-xs font-bold">{totalFaults}</span>
          </div>

          <div className="overflow-x-auto -mx-3 sm:mx-0 sm:overflow-x-visible">
            <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="text-left px-3 py-2 font-semibold text-neutral-600">Time</th>
                <th className="text-left px-3 py-2 font-semibold text-neutral-600">Floor</th>
                <th className="text-left px-3 py-2 font-semibold text-neutral-600">Machine</th>
                <th className="text-left px-3 py-2 font-semibold text-neutral-600">Fault Type</th>
                <th className="text-left px-3 py-2 font-semibold text-neutral-600">Severity</th>
                <th className="text-left px-3 py-2 font-semibold text-neutral-600">Notes</th>
              </tr>
            </thead>
            <tbody>
              {qualityLogs.length > 0 ? (
                qualityLogs.map((log, idx) => {
                  const floorKey = log.machineId?.split('-')[0] || '';
                  const pillClass = FLOOR_PILL_COLORS[floorKey];
                  const severityStyle = getSeverityBadgeStyle(log.severity || 'minor');

                  return (
                    <tr key={idx} className="border-b border-neutral-150 hover:bg-neutral-50">
                      <td className="px-3 py-2 text-neutral-600">{formatTime(log.timestamp)}</td>
                      <td className="px-3 py-2">
                        {pillClass && (
                          <span
                            className="px-2 py-1 rounded-xs text-xs font-semibold"
                            style={{ background: pillClass.bg, color: pillClass.color }}
                          >
                            {floorKey}
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-neutral-600">{log.machineId || '—'}</td>
                      <td className="px-3 py-2 text-neutral-600">{log.faultType || '—'}</td>
                      <td className="px-3 py-2">
                        <span
                          className="px-2 py-1 rounded text-xs font-semibold"
                          style={{ background: severityStyle.bg, color: severityStyle.color }}
                        >
                          {(log.severity || 'minor').charAt(0).toUpperCase() +
                            (log.severity || 'minor').slice(1)}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-neutral-600 max-w-xs truncate">
                        {log.description ? log.description.substring(0, 25) + (log.description.length > 25 ? '...' : '') : '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-neutral-400">
                    No faults logged yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </div>
  );
}
