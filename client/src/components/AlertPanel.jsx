import { useStore } from '../store/useStore';

// AlertPanel displays a list of recent unacknowledged alerts
export default function AlertPanel() {
  const alerts = useStore((state) => state.alerts);
  const ackAlert = useStore((state) => state.ackAlert);

  const unackedAlerts = alerts.filter((a) => !a.acked);
  const displayAlerts = unackedAlerts.slice(0, 5);

  const getSeverityStyles = (severity) => {
    const styles = {
      critical: 'bg-red-50 border-l-4 border-red-500',
      warning: 'bg-yellow-50 border-l-4 border-orange-400',
    };
    return styles[severity] || styles.warning;
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-3.75">
        <h3 className="m-0 text-base text-neutral-900">Alerts</h3>
        <span className="bg-red-500 text-white px-2.5 py-1 rounded-lg text-xs font-bold min-w-7 text-center">
          {unackedAlerts.length}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5">
        {displayAlerts.length > 0 ? (
          displayAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-3 rounded-xs flex justify-between items-start gap-2.5 text-xs ${getSeverityStyles(
                alert.severity
              )}`}
            >
              <div className="flex-1">
                <div className="font-bold text-neutral-900 mb-1">{alert.machineId}</div>
                <div className="text-neutral-500 word-break mb-1">{alert.type || alert.message}</div>
                <div className="text-neutral-400 text-xs">
                  {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'N/A'}
                </div>
              </div>
              <button
                className="bg-white text-neutral-600 border border-neutral-300 rounded-xs px-2 py-1 text-xs font-semibold cursor-pointer shrink-0 hover:bg-neutral-100 transition-colors"
                onClick={() => ackAlert(alert.id)}
                title="Acknowledge alert"
              >
                ✓
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-neutral-400">No active alerts</div>
        )}
      </div>
    </div>
  );
}
