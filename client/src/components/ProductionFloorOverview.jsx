import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import './ProductionFloorOverview.css';

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

const FLOOR_BAR_COLORS = {
  F1: '#6f42c1',
  F2: '#0891b2',
  F3: '#7c3aed',
  Overall: '#374151'
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

  const floorData = useMemo(() => {
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

    return {
      floors,
      floorKeysSorted,
      floorTarget
    };
  }, [machines, session]);

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
    return floorData.floorKeysSorted.reduce((sum, floorKey) => {
      const floorMachines = floorData.floors[floorKey];
      return sum + (getFloorStats(floorMachines).liveCount || 0);
    }, 0);
  };

  const totalCount = calculateTotalCount();
  const combinedTarget = floorData.floorTarget * floorData.floorKeysSorted.length;
  const overallPercentage = calculateProgressPercentage(totalCount, combinedTarget);

  return (
    <div className="pfo-container">
      <h3 className="pfo-title">Production Floor Overview</h3>

      <div className="pfo-floors-grid">
        {floorData.floorKeysSorted.map((floorKey) => {
          const floorMachines = floorData.floors[floorKey];
          const stats = getFloorStats(floorMachines);

          return (
            <div key={floorKey} className="pfo-floor-card">
              <div
                className="pfo-floor-header"
                style={{ background: FLOOR_COLORS[floorKey] }}
              >
                <div>
                  <div className="pfo-floor-name">Floor {floorKey.substring(1)}</div>
                  <div className="pfo-floor-label">{FLOOR_LABELS[floorKey]}</div>
                </div>
                <div className="pfo-header-right">
                  <span className="pfo-connection-dot">●</span>
                  <span className="pfo-status-text">Running</span>
                </div>
              </div>

              <div className="pfo-machines-grid">
                {floorMachines.map((machine) => (
                  <div
                    key={machine.machineId}
                    className={`pfo-machine-card ${machine.status === 'ON' ? 'running' : 'stopped'}`}
                  >
                    <div className="pfo-machine-id">{machine.machineId}</div>
                    <div className="pfo-machine-status">
                      {machine.status === 'ON' ? 'RUN' : 'STOP'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pfo-legend">
                <span>● {stats.running} Running</span>
                <span>● {stats.stopped} Stopped</span>
              </div>

              <div className="pfo-kpi-row">
                <div className="pfo-kpi-item">
                  <div className="pfo-kpi-label">Live Count</div>
                  <div className="pfo-kpi-value">{formatNumber(stats.liveCount)}</div>
                </div>
                <div className="pfo-kpi-item">
                  <div className="pfo-kpi-label">Rolls Produced</div>
                  <div className="pfo-kpi-value">{stats.rolls}</div>
                </div>
                <div className="pfo-kpi-item">
                  <div className="pfo-kpi-label">Runtime</div>
                  <div className="pfo-kpi-value">{formatDuration(stats.runtimeSeconds)}</div>
                </div>
                <div className="pfo-kpi-item">
                  <div className="pfo-kpi-label">Util</div>
                  <div className="pfo-kpi-value">{stats.utilization}%</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pfo-progress-section">
        <div className="pfo-progress-header">
          <span className="pfo-progress-title">Floor Production Progress</span>
          <span className="pfo-progress-subtitle">
            Target: {floorData.floorTarget} / floor · {combinedTarget} combined
          </span>
        </div>

        <div className="pfo-progress-bars">
          {floorData.floorKeysSorted.map((floorKey) => {
            const floorMachines = floorData.floors[floorKey];
            const stats = getFloorStats(floorMachines);
            const percentage = calculateProgressPercentage(stats.liveCount, floorData.floorTarget);

            return (
              <div key={floorKey} className="pfo-bar-row">
                <div className="pfo-bar-label">Floor {floorKey.substring(1)}</div>
                <div className="pfo-bar-track">
                  <div
                    className="pfo-bar-fill"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: FLOOR_BAR_COLORS[floorKey]
                    }}
                  ></div>
                </div>
                <div className="pfo-bar-percentage" style={{ color: FLOOR_BAR_COLORS[floorKey] }}>
                  {percentage.toFixed(1)}%
                </div>
                <div className="pfo-bar-count">
                  {formatNumber(stats.liveCount)} / {floorData.floorTarget}
                </div>
              </div>
            );
          })}

          <div className="pfo-bar-row overall">
            <div className="pfo-bar-label">Overall</div>
            <div className="pfo-bar-track">
              <div
                className="pfo-bar-fill"
                style={{
                  width: `${overallPercentage}%`,
                  backgroundColor: FLOOR_BAR_COLORS.Overall
                }}
              ></div>
            </div>
            <div className="pfo-bar-percentage" style={{ color: FLOOR_BAR_COLORS.Overall }}>
              {overallPercentage.toFixed(1)}%
            </div>
            <div className="pfo-bar-count">
              {formatNumber(totalCount)} / {combinedTarget}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
