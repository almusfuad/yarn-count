import { useStore } from '../store/useStore';
import './RollProgress.css';

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
    <div className="roll-progress">
      <div className="rp-header">
        <div className="rp-left">
          <h3 className="rp-title">Roll Progress</h3>
          <p className="rp-status">Counting in progress...</p>
        </div>
        <div className="rp-right">
          <div className="rp-target">Roll Count Target: {session.rollTarget} counts / roll</div>
          <div className="rp-percentage" style={{
            color: percentage === 100 ? '#10b981' : '#8b5cf6'
          }}>
            {percentage}%
          </div>
        </div>
      </div>

      <div className="rp-bar-container">
        <div className="rp-bar-track">
          <div 
            className="rp-bar-fill" 
            style={{ 
              width: `${percentage}%`,
              backgroundColor: percentage === 100 ? '#10b981' : undefined
            }}
          ></div>
        </div>
      </div>

      <div className="rp-footer">
        <span className="rp-counts">{currentCount} counts recorded</span>
        <span className="rp-remaining">{remaining} counts remaining</span>
        <span className="rp-rolls-completed" style={{ color: '#10b981', fontWeight: 'bold' }}>
          Rolls Completed: {totalRolls}
        </span>
      </div>

      <div className="rp-info">
        <p>
          How it works: The sensor sends 1 count per completed motion/rotation. When counts reach
          the Roll Target ({session.rollTarget}), one full roll is marked complete...
        </p>
      </div>
    </div>
  );
}
