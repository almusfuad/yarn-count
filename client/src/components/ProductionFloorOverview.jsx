import { useStore } from '../store/useStore';


const FLOOR_LABELS = {
  F1: 'Circular Knitting',
  F2: 'Flat Knitting',
  F3: 'Warp Knitting'
};

const FLOOR_COLORS = {
  F1: 'linear-gradient(135deg, #3b1a6e, #6f42c1)',
  F2: 'linear-gradient(135deg, #0e7490, #06b6d4)',
  F3: 'linear-gradient(135deg, #7c3aed, #a78bfa)'
};

// Helper function to get bar color based on percentage
const getProgressColor = (percentage) => {
  if (percentage < 30) {
    return '#ef4444'; // Red - Low progress
  } else if (percentage < 70) {
    return '#f59e0b'; // Amber/Orange - Medium progress
  } else if (percentage <= 100) {
    return '#10b981'; // Green - High progress
  } else {
    return '#3b82f6'; // Blue - Over target
  }
};

const formatDuration = (seconds) => {
  if (!seconds) return '0m 0s';
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m ${secs}s`;
  }
  return `${mins}m ${secs}s`;
};

const formatNumber = (num) => {
  return num.toLocaleString();
};

export default function ProductionFloorOverview() {
  const machines = useStore((state) => state.machines);
  const session = useStore((state) => state.session);

  // Calculate floor data directly (not in useMemo to ensure live updates)
  const machineList = Object.values(machines);
  const floors = {};

  machineList.forEach((m) => {
    const floorKey = m.machineId.split('-')[0];
    if (!floors[floorKey]) {
      floors[floorKey] = [];
    }
    floors[floorKey].push(m);
  });

  const floorKeysSorted = Object.keys(floors).sort();
  const floorTarget = session.floorTarget || 800;

  const getFloorStats = (floorMachines) => {
    const running = floorMachines.filter((m) => m.status === 'ON').length;
    const stopped = floorMachines.filter((m) => m.status !== 'ON').length;
    const liveCount = floorMachines.reduce((sum, m) => sum + (m.totalCount || 0), 0);
    const rolls = floorMachines.reduce((sum, m) => sum + (m.rollsCompleted || 0), 0);
    const runtimeSeconds = floorMachines.reduce((sum, m) => sum + (m.runtimeSeconds || 0), 0);
    const downtimeSeconds = floorMachines.reduce(
      (sum, m) => sum + (m.downtimeSeconds || 0),
      0
    );
    const totalSeconds = runtimeSeconds + downtimeSeconds;
    const utilization =
      totalSeconds > 0 ? ((runtimeSeconds / totalSeconds) * 100).toFixed(1) : '0.0';

    return {
      running,
      stopped,
      liveCount,
      rolls,
      runtimeSeconds,
      utilization
    };
  };

  const calculateProgressPercentage = (current, target) => {
    return Math.min((current / target) * 100, 100);
  };

  const calculateTotalCount = () => {
    return floorKeysSorted.reduce((sum, floorKey) => {
      const floorMachines = floors[floorKey];
      return sum + (getFloorStats(floorMachines).liveCount || 0);
    }, 0);
  };

  const totalCount = calculateTotalCount();
  const combinedTarget = floorTarget * floorKeysSorted.length;
  const overallPercentage = calculateProgressPercentage(totalCount, combinedTarget);

  return (
    <div className="flex flex-col gap-5 mb-6">
      <h3 className="text-base font-bold text-neutral-900 m-0">Production Floor Overview</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {floorKeysSorted.map((floorKey) => {
          const floorMachines = floors[floorKey];
          const stats = getFloorStats(floorMachines);

          return (
            <div key={floorKey} className="bg-white rounded-xs shadow-sm overflow-hidden">
              <div
                className="px-5 py-4 text-white"
                style={{ background: FLOOR_COLORS[floorKey] }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-lg font-bold">Floor {floorKey.substring(1)}</div>
                    <div className="text-sm opacity-90">{FLOOR_LABELS[floorKey]}</div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-base">●</span>
                      <span>Running</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-1 p-2 sm:p-3 bg-neutral-50">
                {floorMachines.map((machine) => (
                  <div
                    key={machine.machineId}
                    className={`
                      flex flex-col items-center justify-center gap-1 p-2 rounded-xs text-xs font-bold
                      ${machine.status === 'ON' 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-red-500 text-white'}
                    `}
                  >
                    <div className="truncate text-center text-xs">{machine.machineId.split('-')[1] || machine.machineId}</div>
                    <div className="text-xs font-semibold">{machine.status === 'ON' ? 'RUN' : 'STOP'}</div>
                  </div>
                ))}
              </div>

              <div className="px-3 py-2 flex gap-3 text-xs text-neutral-600 bg-neutral-50 border-t border-neutral-200">
                <span>● {stats.running} Running</span>
                <span>● {stats.stopped} Stopped</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 p-2 sm:p-3 border-t border-neutral-200">
                <div>
                  <div className="text-xs text-neutral-500 mb-1 font-bold uppercase">LIVE COUNT</div>
                  <div className="text-sm font-bold text-neutral-900">{formatNumber(stats.liveCount)}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1 font-bold uppercase">ROLLS PRODUCED</div>
                  <div className="text-sm font-bold text-neutral-900">{stats.rolls}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1 font-bold uppercase">RUNTIME</div>
                  <div className="text-sm font-bold text-neutral-900">{formatDuration(stats.runtimeSeconds)}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-500 mb-1 font-bold uppercase">UTIL</div>
                  <div className="text-sm font-bold text-neutral-900">{stats.utilization}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xs shadow-sm p-5">
        <div className="flex justify-between items-center mb-5">
          <div className="text-base font-bold text-neutral-900">Floor Production Progress</div>
          <div className="text-sm text-neutral-500">
            Target: {floorTarget} / floor · {combinedTarget} combined
          </div>
        </div>

        <div className="space-y-3">
          {floorKeysSorted.map((floorKey) => {
            const floorMachines = floors[floorKey];
            const stats = getFloorStats(floorMachines);
            const percentage = calculateProgressPercentage(stats.liveCount, floorTarget);
            const barColor = getProgressColor(percentage);

            return (
              <div key={floorKey} className="flex items-center gap-3">
                <div className="w-20 text-sm font-semibold text-neutral-700">Floor {floorKey.substring(1)}</div>
                <div className="flex-1 h-3 bg-neutral-200 rounded-xs overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: barColor
                    }}
                  ></div>
                </div>
                <div className="w-12 text-right text-sm font-bold" style={{ color: barColor }}>
                  {percentage.toFixed(1)}%
                </div>
                <div className="w-24 text-right text-sm text-neutral-600">
                  {formatNumber(stats.liveCount)} / {floorTarget}
                </div>
              </div>
            );
          })}

          <div className="flex items-center gap-3 pt-3 mt-3 border-t border-neutral-200">
            <div className="w-20 text-sm font-bold text-neutral-900">Overall</div>
            <div className="flex-1 h-3 bg-neutral-200 rounded-xs overflow-hidden">
              <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${overallPercentage}%`,
                  backgroundColor: getProgressColor(overallPercentage)
                }}
              ></div>
            </div>
            <div className="w-12 text-right text-sm font-bold" style={{ color: getProgressColor(overallPercentage) }}>
              {overallPercentage.toFixed(1)}%
            </div>
            <div className="w-24 text-right text-sm text-neutral-600">
              {formatNumber(totalCount)} / {combinedTarget}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
