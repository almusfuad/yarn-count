import { useStore } from '../store/useStore';
import './KpiCards.css';

export default function KpiCards() {
  const kpis = useStore((state) => state.kpis);

  const getUtilizationColor = (value) => {
    if (value >= 80) return '#4CAF50';
    if (value >= 60) return '#ff9800';
    return '#f44336';
  };

  const cards = [
    {
      title: 'Active Machines',
      value: kpis.activeMachines,
      total: kpis.totalMachines,
      icon: '🏭',
      color: '#667eea'
    },
    {
      title: 'Total Production',
      value: kpis.totalCount,
      icon: '📦',
      color: '#764ba2'
    },
    {
      title: 'Completed Rolls',
      value: kpis.totalRolls,
      icon: '✓',
      color: '#4CAF50'
    },
    {
      title: 'Utilization',
      value: `${kpis.utilization.toFixed(1)}%`,
      icon: '⚙️',
      color: getUtilizationColor(kpis.utilization)
    },
    {
      title: 'Estimated Output',
      value: kpis.estimatedOutput,
      icon: '📈',
      color: '#00bcd4'
    },
    {
      title: 'Fault Rate',
      value: kpis.faultRate.toFixed(2),
      icon: '⚠️',
      color: '#ff5722'
    }
  ];

  return (
    <div className="kpi-cards">
      {cards.map((card, idx) => (
        <div key={idx} className="kpi-card" style={{ borderLeftColor: card.color }}>
          <span className="kpi-icon">{card.icon}</span>
          <div className="kpi-content">
            <p className="kpi-title">{card.title}</p>
            <p className="kpi-value" style={{ color: card.color }}>
              {card.value}
              {card.total && ` / ${card.total}`}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
