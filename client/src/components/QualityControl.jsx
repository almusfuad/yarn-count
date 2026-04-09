import { useState } from 'react';
import { useStore } from '../store/useStore';
import './QualityControl.css';

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
    <div className="quality-control">
      <h3 className="qc-title">Quality Control</h3>

      <div className="qc-kpi-row">
        <div className="qc-kpi-card">
          <div className="qc-kpi-icon">🔍</div>
          <div className="qc-kpi-content">
            <div className="qc-kpi-value">{totalFaults}</div>
            <div className="qc-kpi-label">Total Faults</div>
            <div className="qc-kpi-sublabel">This shift</div>
          </div>
        </div>

        <div className="qc-kpi-card">
          <div className="qc-kpi-icon">🚨</div>
          <div className="qc-kpi-content">
            <div className="qc-kpi-value">{criticalFaults}</div>
            <div className="qc-kpi-label">Critical Faults</div>
            <div className="qc-kpi-sublabel">Immediate action</div>
          </div>
        </div>

        <div className="qc-kpi-card">
          <div className="qc-kpi-icon">📉</div>
          <div className="qc-kpi-content">
            <div className="qc-kpi-value">{faultRate}</div>
            <div className="qc-kpi-label">Fault Rate</div>
            <div className="qc-kpi-sublabel">Per 1,000 units</div>
          </div>
        </div>
      </div>

      <div className="qc-content">
        <div className="qc-left-card">
          <h4 className="qc-card-title">Log Quality Fault</h4>

          <form onSubmit={handleSubmit} className="qc-form">
            <div className="qc-form-row">
              <div className="qc-form-group">
                <label className="qc-label">
                  Floor <span className="qc-required">*</span>
                </label>
                <select
                  value={selectedFloor}
                  onChange={(e) => {
                    setSelectedFloor(e.target.value);
                    setSelectedMachine('');
                  }}
                  className="qc-select"
                >
                  <option value="">— Floor —</option>
                  {uniqueFloors.map((floor) => (
                    <option key={floor} value={floor}>
                      {floor}
                    </option>
                  ))}
                </select>
              </div>

              <div className="qc-form-group">
                <label className="qc-label">
                  Machine <span className="qc-required">*</span>
                </label>
                <select
                  value={selectedMachine}
                  onChange={(e) => setSelectedMachine(e.target.value)}
                  className="qc-select"
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

            <div className="qc-form-row">
              <div className="qc-form-group">
                <label className="qc-label">
                  Fault Type <span className="qc-required">*</span>
                </label>
                <select
                  value={faultType}
                  onChange={(e) => setFaultType(e.target.value)}
                  className="qc-select"
                >
                  <option value="">— Type —</option>
                  {FAULT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div className="qc-form-group">
                <label className="qc-label">
                  Severity <span className="qc-required">*</span>
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="qc-select"
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

            <div className="qc-form-group">
              <label className="qc-label">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the fault..."
                className="qc-textarea"
              />
            </div>

            <button type="submit" className="qc-submit-btn">
              {submitted ? '✓ Logged' : 'Submit Fault Report'}
            </button>

            <div className="qc-info-strip">
              <span className="qc-info-icon">⚠</span>
              <span className="qc-info-text">
                Critical faults trigger an <strong>in-app alert</strong> and{' '}
                <strong>Telegram notification</strong> automatically.
              </span>
            </div>
          </form>
        </div>

        <div className="qc-right-card">
          <div className="qc-card-header">
            <h4 className="qc-card-title">Fault Log</h4>
            <span className="qc-log-badge">{totalFaults}</span>
          </div>

          <table className="qc-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Floor</th>
                <th>Machine</th>
                <th>Fault Type</th>
                <th>Severity</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {qualityLogs.length > 0 ? (
                qualityLogs.map((log, idx) => {
                  const floorKey = log.machineId?.split('-')[0] || '';
                  const pillClass = FLOOR_PILL_COLORS[floorKey];
                  const severityStyle = getSeverityBadgeStyle(log.severity || 'minor');

                  return (
                    <tr key={idx}>
                      <td>{formatTime(log.timestamp)}</td>
                      <td>
                        {pillClass && (
                          <span
                            className="qc-floor-pill"
                            style={{ background: pillClass.bg, color: pillClass.color }}
                          >
                            {floorKey}
                          </span>
                        )}
                      </td>
                      <td className="qc-machine-cell">{log.machineId || '—'}</td>
                      <td>{log.faultType || '—'}</td>
                      <td>
                        <span
                          className="qc-severity-badge"
                          style={{ background: severityStyle.bg, color: severityStyle.color }}
                        >
                          {(log.severity || 'minor').charAt(0).toUpperCase() +
                            (log.severity || 'minor').slice(1)}
                        </span>
                      </td>
                      <td className="qc-notes">
                        {log.description ? log.description.substring(0, 25) + (log.description.length > 25 ? '...' : '') : '—'}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="qc-empty">
                    No faults logged yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
