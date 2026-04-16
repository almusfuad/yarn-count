import { useStore } from '../store/useStore';

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
      <div className="bg-white rounded-xs shadow-sm p-5 mb-6">
        <div className="flex justify-between items-center">
          <div className="font-bold text-neutral-900">Roll History</div>
          <div className="flex gap-2 items-center">
            <span className="text-neutral-400 text-sm">No rolls completed yet</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xs shadow-sm p-5 mb-6 w-full">
      <div className="flex justify-between items-center mb-4">
        <div className="font-bold text-neutral-900">Roll History</div>
        <div className="flex gap-2 items-center">
              <span className="bg-neutral-200 text-neutral-700 px-2.5 py-1 rounded-xs text-xs font-bold">
            {rollHistory.length} rolls
          </span>
          {pendingWeightCount > 0 && (
              <span className="bg-yellow-100 text-yellow-700 px-2.5 py-1 rounded-xs text-xs font-bold">
              {pendingWeightCount} pending
            </span>
          )}
          <span className="text-neutral-600 text-sm">Total: {totalKg.toFixed(2)} kg</span>
        </div>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left px-3 py-2 font-semibold text-neutral-600">Roll #</th>
            <th className="text-left px-3 py-2 font-semibold text-neutral-600">Completed At</th>
            <th className="text-left px-3 py-2 font-semibold text-neutral-600">Count</th>
            <th className="text-left px-3 py-2 font-semibold text-neutral-600">Actual Kg</th>
            <th className="text-left px-3 py-2 font-semibold text-neutral-600">Duration</th>
            <th className="text-left px-3 py-2 font-semibold text-neutral-600">Status</th>
          </tr>
        </thead>
        <tbody>
          {rollHistory.map((roll) => (
            <tr key={roll.rollNumber} className="border-b border-neutral-150 hover:bg-neutral-50">
              <td className="px-3 py-2 font-bold text-neutral-900">Roll #{roll.rollNumber}</td>
              <td className="px-3 py-2 text-neutral-600">{formatTime(roll.completedAt)}</td>
              <td className="px-3 py-2 text-neutral-600">{roll.count}</td>
              <td className="px-3 py-2">
                {roll.weighed ? (
                  <span className="text-neutral-900 font-semibold">{roll.weight} kg</span>
                ) : (
                  <span className="text-neutral-400">Not entered</span>
                )}
              </td>
              <td className="px-3 py-2">—</td>
              <td className="px-3 py-2">
                {roll.weighed ? (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded-xs text-xs font-semibold">Weighed</span>
                ) : (
                  <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-xs text-xs font-semibold">Pending Weight</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
