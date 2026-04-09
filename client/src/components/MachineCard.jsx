import './MachineCard.css';

export default function MachineCard({ machine }) {
  const getStatusBadge = (status) => {
    const styles = {
      ON: { bg: '#4CAF50', color: 'white', label: '🟢 Running' },
      OFF: { bg: '#999', color: 'white', label: '⚫ Off' },
      STOPPED: { bg: '#ff9800', color: 'white', label: '🟠 Stopped' }
    };
    return styles[status] || styles.OFF;
  };

  const statusStyle = getStatusBadge(machine.status);
  const rollPercent = (machine.currentRollCount / machine.ROLL_TARGET) * 100;

  return (
    <div className="machine-card">
      <div className="card-header">
        <h3 className="machine-id">{machine.machineId}</h3>
        <span
          className="status-badge"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
        >
          {statusStyle.label}
        </span>
      </div>

      <div className="card-body">
        <div className="info-row">
          <span className="label">Total Count:</span>
          <span className="value">{machine.totalCount}</span>
        </div>

        <div className="info-row">
          <span className="label">Rolls Completed:</span>
          <span className="value">{machine.rollsCompleted}</span>
        </div>

        <div className="progress-section">
          <div className="progress-label">Current Roll Progress</div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(rollPercent, 100)}%`,
                backgroundColor: rollPercent >= 100 ? '#4CAF50' : '#667eea'
              }}
            />
          </div>
          <div className="progress-text">
            {machine.currentRollCount} / {machine.ROLL_TARGET}
          </div>
        </div>

        <div className="info-row">
          <span className="label">Runtime:</span>
          <span className="value">{machine.runtime || '00:00'}</span>
        </div>

        <div className="info-row">
          <span className="label">Downtime:</span>
          <span className="value" style={{ color: '#f44336' }}>{machine.downtime || '00:00'}</span>
        </div>

        <div className="info-row">
          <span className="label">Utilization:</span>
          <span className="value">{(machine.utilization || 0).toFixed(1)}%</span>
        </div>

        {machine.unackedAlerts > 0 && (
          <div className="alert-indicator">
            ⚠️ {machine.unackedAlerts} unacked alert{machine.unackedAlerts > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="card-footer">
        <span className="last-update">
          Last update: {machine.lastUpdated ? new Date(machine.lastUpdated).toLocaleTimeString() : 'N/A'}
        </span>
      </div>
    </div>
  );
}
