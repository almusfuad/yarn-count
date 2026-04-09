import { useStore } from '../store/useStore';
import './RollHistory.css';

export default function RollHistory() {
  const kpis = useStore((state) => state.kpis);

  const rollHistory = kpis.rollHistory || [];
  const totalKg = kpis.totalKg || 0;
  const pendingWeightCount = rollHistory.filter((r) => !r.weighed).length;

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

  if (rollHistory.length === 0) {
    return (
      <div className="roll-history">
        <div className="rh-header">
          <div className="rh-title">Roll History</div>
          <div className="rh-stats">
            <span className="rh-empty">No rolls completed yet</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="roll-history">
      <div className="rh-header">
        <div className="rh-title">Roll History</div>
        <div className="rh-stats">
          <span className="rh-badge">{rollHistory.length} rolls</span>
          {pendingWeightCount > 0 && (
            <span className="rh-badge pending">{pendingWeightCount} pending weight</span>
          )}
          <span className="rh-total">Total: {totalKg.toFixed(2)} kg</span>
        </div>
      </div>

      <table className="rh-table">
        <thead>
          <tr>
            <th>Roll #</th>
            <th>Completed At</th>
            <th>Count</th>
            <th>Actual Kg</th>
            <th>Duration</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rollHistory.map((roll) => (
            <tr key={roll.rollNumber}>
              <td className="rh-roll-num">Roll #{roll.rollNumber}</td>
              <td>{formatTime(roll.completedAt)}</td>
              <td>{roll.count}</td>
              <td>
                {roll.weighed ? (
                  <span className="rh-kg">{roll.weight} kg</span>
                ) : (
                  <span className="rh-not-entered">Not entered</span>
                )}
              </td>
              <td>—</td>
              <td>
                {roll.weighed ? (
                  <span className="rh-status-badge weighed">Weighed</span>
                ) : (
                  <span className="rh-status-badge pending-wt">Pending Weight</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
