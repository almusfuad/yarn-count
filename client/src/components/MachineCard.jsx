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
    <div className="bg-white rounded-xs overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all">
      <div className="bg-linear-to-r from-indigo-500 to-purple-600 text-white px-4 py-3 flex justify-between items-center">
        <h3 className="text-lg font-bold m-0">{machine.machineId}</h3>
        <span
          className="px-3 py-1.5 rounded-full text-xs font-semibold uppercase"
          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
        >
          {statusStyle.label}
        </span>
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="text-neutral-400 font-semibold">Total Count:</span>
          <span className="text-neutral-900 font-bold">{machine.totalCount}</span>
        </div>

        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="text-neutral-400 font-semibold">Rolls Completed:</span>
          <span className="text-neutral-900 font-bold">{machine.rollsCompleted}</span>
        </div>

        <div className="my-4 p-3 bg-neutral-50 rounded-xs">
          <div className="text-xs text-neutral-400 font-semibold mb-2 uppercase">Current Roll Progress</div>
          <div className="h-2 bg-neutral-300 rounded-xs overflow-hidden mb-1.5">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${Math.min(rollPercent, 100)}%`,
                backgroundColor: rollPercent >= 100 ? '#4CAF50' : '#667eea'
              }}
            />
          </div>
          <div className="text-xs text-neutral-600 text-center font-semibold">
            {machine.currentRollCount} / {machine.ROLL_TARGET}
          </div>
        </div>

        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="text-neutral-400 font-semibold">Runtime:</span>
          <span className="text-neutral-900 font-bold">{machine.runtime || '00:00'}</span>
        </div>

        <div className="flex justify-between items-center mb-3 text-sm">
          <span className="text-neutral-400 font-semibold">Downtime:</span>
          <span className="text-red-500 font-bold">{machine.downtime || '00:00'}</span>
        </div>

        <div className="flex justify-between items-center text-sm">
          <span className="text-neutral-400 font-semibold">Utilization:</span>
          <span className="text-neutral-900 font-bold">{(machine.utilization || 0).toFixed(1)}%</span>
        </div>

        {machine.unackedAlerts > 0 && (
          <div className="mt-3 p-3 bg-yellow-50 border-l-4 border-orange-400 text-yellow-700 text-xs rounded-xs font-semibold">
            ⚠️ {machine.unackedAlerts} unacked alert{machine.unackedAlerts > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 text-xs text-neutral-400">
        <span className="block text-right">
          Last update: {machine.lastUpdated ? new Date(machine.lastUpdated).toLocaleTimeString() : 'N/A'}
        </span>
      </div>
    </div>
  );
}
