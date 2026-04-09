import { useMemo } from 'react';
import { useStore } from '../store/useStore';
import './KpiCards.css';

const KpiCard = ({ icon, label, value, sublabel, color }) => (
  <div className="kpi-card">
    <div className="kpi-card-header">
      <span className="kpi-label">{label}</span>
      <span className="kpi-icon" style={{ color }}>
        {icon}
      </span>
    </div>
    <div className="kpi-value" style={{ color }}>
      {value}
    </div>
    <div className="kpi-sublabel">{sublabel}</div>
  </div>
);

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
  const icon = alert.severity === 'critical' ? '🔴' : '⚠️';

  return (
    <div className="alert-row" style={{ backgroundColor: bgColor }}>
      <div className="alert-left">
        <span className="alert-icon">{icon}</span>
        <div className="alert-content">
          <div className="alert-title">{alert.title || 'Alert'}</div>
          <div className="alert-message">{alert.message || ''}</div>
          <div className="alert-timestamp">{formatTime(alert.timestamp)}</div>
        </div>
      </div>
      <button className="alert-ack-btn" onClick={() => onAck(alert.id)}>
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
  const remaining = session.rollTarget - currentCount;
  const rollProgress = ((currentCount / session.rollTarget) * 100).toFixed(1);

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
    <div className="kpi-cards">
      {/* Section 1: Overall Summary */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">Overall Summary</h3>
        <div className="kpi-cards-grid">
          {overallSummaryCards.map((card, idx) => (
            <KpiCard key={idx} {...card} />
          ))}
        </div>
      </div>

      {/* Section 2: Active Alerts */}
      <div className="kpi-section alerts-section">
        <div className="alerts-header">
          <h3 className="alerts-title">Active Alerts</h3>
          <span className="alerts-badge">{unackedAlerts.length} Unacknowledged</span>
          {unackedAlerts.length > 0 && (
            <button className="alerts-ack-all-btn" onClick={handleAckAll}>
              Acknowledge All
            </button>
          )}
        </div>

        <div className="alerts-list">
          {unackedAlerts.length > 0 ? (
            unackedAlerts.map((alert) => (
              <AlertRow key={alert.id} alert={alert} onAck={ackAlert} />
            ))
          ) : (
            <div className="alerts-empty">No unacknowledged alerts</div>
          )}
        </div>
      </div>

      {/* Section 3: Machine Production */}
      <div className="kpi-section">
        <h3 className="kpi-section-title">
          Machine Production — Roll & Kg Tracking ({session.asset})
        </h3>
        <div className="kpi-cards-grid">
          {machineProductionCards.map((card, idx) => (
            <KpiCard key={idx} {...card} />
          ))}
        </div>
      </div>
    </div>
  );
}
