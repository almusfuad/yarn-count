import { useStore } from '../store/useStore';
import './AlertPanel.css';

export default function AlertPanel() {
  const alerts = useStore((state) => state.alerts);
  const ackAlert = useStore((state) => state.ackAlert);

  const unackedAlerts = alerts.filter((a) => !a.acked);
  const displayAlerts = unackedAlerts.slice(0, 5);

  return (
    <div className="alert-panel">
      <div className="panel-header">
        <h3>Alerts</h3>
        <span className="alert-badge">{unackedAlerts.length}</span>
      </div>

      <div className="alert-list">
        {displayAlerts.length > 0 ? (
          displayAlerts.map((alert) => (
            <div key={alert.id} className={`alert-item alert-${alert.severity || 'warning'}`}>
              <div className="alert-content">
                <div className="alert-machine">{alert.machineId}</div>
                <div className="alert-message">{alert.type || alert.message}</div>
                <div className="alert-time">
                  {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
              <button
                className="alert-ack-btn"
                onClick={() => ackAlert(alert.id)}
                title="Acknowledge alert"
              >
                ✓
              </button>
            </div>
          ))
        ) : (
          <div className="no-alerts">No active alerts</div>
        )}
      </div>
    </div>
  );
}
