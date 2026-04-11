import { useMemo } from 'react';
import { useStore } from '../store/useStore';

const KpiCard = ({ icon, label, value, sublabel, color }) => (
  <div className="bg-white border border-neutral-200 rounded-xs p-4 border-t-4" style={{ borderTopColor: color }}>
    <div className="flex justify-between items-start mb-3">
      <span className="text-xs font-bold uppercase tracking-wide text-neutral-400">{label}</span>
      <span className="text-lg leading-none" style={{ color }}>
        {icon}
      </span>
    </div>
    <div className="text-2xl font-bold mb-1.5" style={{ color }}>
      {value}
    </div>
    <div className="text-xs text-neutral-400">{sublabel}</div>
  </div>
);

// AlertRow component for displaying individual alerts
const AlertRow = ({ alert, onAck }) => {
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const bgColor = alert.severity === 'critical' ? '#fee2e2' : '#fffbeb';
  const borderColor = alert.severity === 'critical' ? '#ef4444' : '#f59e0b';
  const icon = alert.severity === 'critical' ? '🔴' : '⚠️';

  return (
    <div className="flex justify-between items-center p-4 rounded-xs gap-3 border-l-4" style={{ backgroundColor: bgColor, borderLeftColor: borderColor }}>
      <div className="flex gap-2.5 flex-1">
        <span className="text-lg shrink-0">{icon}</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-neutral-900 mb-1">{alert.title || 'Alert'}</div>
          <div className="text-xs text-neutral-500 mb-1">{alert.message || ''}</div>
          <div className="text-xs text-neutral-400">{formatTime(alert.timestamp)}</div>
        </div>
      </div>
      <button
        className="bg-white text-indigo-600 border border-neutral-200 rounded-xs px-2.5 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0 hover:bg-indigo-600 hover:text-white transition-all"
        onClick={() => onAck(alert.id)}
      >
        Acknowledge
      </button>
    </div>
  );
};

export default function KpiCards() {
  const machines = useStore((state) => state.machines);
  const alerts = useStore((state) => state.alerts);
  const session = useStore((state) => state.session);
  const ackAlert = useStore((state) => state.ackAlert);

  // Calculate KPIs from real-time machine data
  const calculatedKpis = useMemo(() => {
    const machineArray = Object.values(machines);
    const totalCount = machineArray.reduce((sum, m) => sum + (m.totalCount || 0), 0);
    const activeMachines = machineArray.filter((m) => m.status === 'ON').length;
    const totalMachines = machineArray.length;
    const totalRuntime = machineArray.reduce((sum, m) => sum + (m.runtimeSeconds || 0), 0);
    const totalDowntime = machineArray.reduce((sum, m) => sum + (m.downtimeSeconds || 0), 0);
    const totalRolls = machineArray.reduce((sum, m) => sum + (m.rollsCompleted || 0), 0);
    const totalKg = totalRolls * 0.7;
    const utilization = totalRuntime + totalDowntime > 0 ? (totalRuntime / (totalRuntime + totalDowntime)) * 100 : 0;
    
    return { totalCount, activeMachines, totalMachines, totalRuntime, totalDowntime, totalRolls, totalKg, utilization };
  }, [machines]);

  const unackedAlerts = useMemo(() => alerts.filter((a) => !a.acked), [alerts]);
  const criticalAlerts = useMemo(() => unackedAlerts.filter((a) => a.severity === 'critical'), [
    unackedAlerts
  ]);

  const overallSummaryCards = [
    {
      icon: '🏭',
      label: 'Total Machines',
      value: calculatedKpis.totalMachines || 0,
      sublabel: 'Across all 3 floors',
      color: '#3b82f6'
    },
    {
      icon: '✓',
      label: 'Running',
      value: calculatedKpis.activeMachines || 0,
      sublabel: `${((calculatedKpis.activeMachines || 0) / (calculatedKpis.totalMachines || 1) * 100).toFixed(1)}% capacity`,
      color: '#10b981'
    },
    {
      icon: '●',
      label: 'Stopped',
      value: (calculatedKpis.totalMachines || 0) - (calculatedKpis.activeMachines || 0),
      sublabel: 'Require attention',
      color: '#ef4444'
    },
    {
      icon: '🎱',
      label: 'Rolls Produced',
      value: calculatedKpis.totalRolls || 0,
      sublabel: `${unackedAlerts.length} pending tasks`,
      color: '#8b5cf6'
    },
    {
      icon: '⚖️',
      label: 'Total Kg',
      value: `${(calculatedKpis.totalKg || 0).toFixed(2)} kg`,
      sublabel: `${unackedAlerts.length} rolls weighed`,
      color: '#f59e0b'
    },
    {
      icon: '⚠️',
      label: 'Active Alerts',
      value: unackedAlerts.length,
      sublabel: `${criticalAlerts.length} critical`,
      color: '#fbbf24'
    }
  ];

  const currentCount = calculatedKpis.totalCount % session.rollTarget;
  const isAtTarget = currentCount === 0 && calculatedKpis.totalCount > 0;
  const remaining = isAtTarget ? 0 : (session.rollTarget - currentCount);
  const rollProgress = isAtTarget ? 100 : ((currentCount / session.rollTarget) * 100).toFixed(1);

  const machineProductionCards = [
    {
      icon: '📊',
      label: 'Live Count',
      value: (calculatedKpis.totalCount || 0).toLocaleString(),
      sublabel: `Roll #${Math.floor((calculatedKpis.totalCount || 0) / session.rollTarget) + 1}`,
      color: '#8b5cf6'
    },
    {
      icon: '🎯',
      label: 'Roll Target',
      value: session.rollTarget,
      sublabel: 'Counts per roll',
      color: '#8b5cf6'
    },
    {
      icon: '📈',
      label: 'Remaining',
      value: remaining,
      sublabel: 'Counts to next roll',
      color: '#10b981'
    },
    {
      icon: '📊',
      label: 'Roll Progress',
      value: `${rollProgress}%`,
      sublabel: `${currentCount} / ${session.rollTarget}`,
      color: '#10b981'
    },
    {
      icon: '🎱',
      label: 'Rolls Produced',
      value: (calculatedKpis.totalRolls || 0).toLocaleString(),
      sublabel: `${unackedAlerts.length} pending weight`,
      color: '#10b981'
    },
    {
      icon: '⚖️',
      label: 'Total Kg',
      value: `${(calculatedKpis.totalKg || 0).toFixed(2)} kg`,
      sublabel: `${unackedAlerts.length} rolls weighed`,
      color: '#f59e0b'
    },
    {
      icon: '⏱️',
      label: 'Runtime',
      value: `${Math.floor((calculatedKpis.totalRuntime || 0) / 3600)}h ${Math.floor(((calculatedKpis.totalRuntime || 0) % 3600) / 60)}m`,
      sublabel: `Downtime: ${Math.floor((calculatedKpis.totalDowntime || 0) / 60)}m`,
      color: '#10b981'
    },
    {
      icon: calculatedKpis.activeMachines > 0 ? '▶️' : '⏸️',
      label: 'Status',
      value: calculatedKpis.activeMachines > 0 ? 'Running' : 'Stopped',
      sublabel: `Util: ${calculatedKpis.utilization?.toFixed(1) || 0}%`,
      color: calculatedKpis.activeMachines > 0 ? '#10b981' : '#ef4444'
    }
  ];

  const handleAckAll = () => {
    unackedAlerts.forEach((alert) => {
      ackAlert(alert.id);
    });
  };

  return (
    <div className="bg-white rounded-sm shadow-sm overflow-hidden mb-6">
      {/* Section 1: Overall Summary */}
      <div className="p-5 border-b border-neutral-150">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 m-0 mb-3 md:mb-4">Overall Summary</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 md:gap-4">
          {overallSummaryCards.map((card, idx) => (
            <KpiCard key={idx} {...card} />
          ))}
        </div>
      </div>

      {/* Section 2: Active Alerts */}
      <div className="p-3 sm:p-4 md:p-5 bg-neutral-50">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-4 gap-2 sm:gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 m-0">Active Alerts</h3>
          <span className="bg-pink-100 text-pink-700 px-2.5 py-1 rounded-lg text-xs font-bold whitespace-nowrap">
            {unackedAlerts.length} Unacknowledged
          </span>
          {unackedAlerts.length > 0 && (
            <button
              className="bg-purple-600 text-white border-0 rounded-xs px-3 py-1.5 text-xs font-semibold cursor-pointer whitespace-nowrap hover:bg-purple-700 transition-colors"
              onClick={handleAckAll}
            >
              Acknowledge All
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {unackedAlerts.length > 0 ? (
            unackedAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onAck={ackAlert} />
            ))
          ) : (
            <div className="text-center text-neutral-400 italic p-5">No unacknowledged alerts</div>
          )}
        </div>
      </div>

      {/* Section 3: Machine Production */}
      <div className="p-3 sm:p-4 md:p-5 border-t border-neutral-150">
        <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 m-0 mb-3 md:mb-4">
          Machine Production — Roll & Kg Tracking ({session.asset})
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4">
          {machineProductionCards.map((card, idx) => (
            <KpiCard key={idx} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
