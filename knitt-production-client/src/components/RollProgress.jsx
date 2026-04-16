import { useStore } from '../store/useStore';

export default function RollProgress() {
  const session = useStore((state) => state.session);
  const machines = useStore((state) => state.machines);
  const kpis = useStore((state) => state.kpis);

  // Calculate totalCount from real-time machines data
  const totalCountFromMachines = Object.values(machines).reduce((sum, m) => sum + (m.totalCount || 0), 0);
  
  // Calculate current roll progress
  const currentCount = (totalCountFromMachines || kpis.totalCount || 0) % session.rollTarget;
  const totalRolls = Object.values(machines).reduce((sum, m) => sum + (m.rollsCompleted || 0), 0);
  
  // Show 100% if we're at the boundary (totalCount is a multiple of rollTarget)
  const isAtTarget = currentCount === 0 && totalCountFromMachines > 0;
  const percentage = isAtTarget ? 100 : ((currentCount / session.rollTarget) * 100).toFixed(1);
  
  const remaining = isAtTarget ? 0 : (session.rollTarget - currentCount);

  return (
    <div className="bg-white rounded-xs shadow-sm p-5 mb-6">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-lg font-bold m-0 text-neutral-900">Roll Progress</h3>
          <p className="text-sm text-neutral-500 mt-1">Counting in progress...</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-neutral-600 mb-2">
            Roll Count Target: {session.rollTarget} counts / roll
          </div>
          <div
            className="text-3xl font-bold"
            style={{
              color: percentage === 100 ? '#10b981' : '#8b5cf6'
            }}
          >
            {percentage}%
          </div>
        </div>
      </div>

      <div className="my-4">
        <div className="h-3 bg-neutral-200 rounded-xs overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percentage}%`,
              backgroundColor: percentage === 100 ? '#10b981' : '#8b5cf6'
            }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between items-center text-sm py-4 border-t border-neutral-200">
        <span className="text-neutral-600 font-semibold">{currentCount} counts recorded</span>
        <span className="text-neutral-600 font-semibold">{remaining} counts remaining</span>
        <span className="text-emerald-600 font-bold">Rolls Completed: {totalRolls}</span>
      </div>

      <div className="mt-3 sm:mt-4 p-2 sm:p-3 bg-purple-50 border-l-4 border-purple-400 rounded-xs text-xs text-purple-700 leading-relaxed">
        <p className="m-0 line-clamp-2 sm:line-clamp-none">
          How it works: The sensor sends 1 count per completed motion/rotation. When counts reach
          the Roll Target ({session.rollTarget}), one full roll is marked complete...
        </p>
      </div>
    </div>
  );
}
