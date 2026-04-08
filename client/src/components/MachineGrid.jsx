import { useStore } from '../store/useStore';
import MachineCard from './MachineCard';
import './MachineGrid.css';

export default function MachineGrid() {
  const machines = useStore((state) => state.machines);
  const filter = useStore((state) => state.filter);
  const setFilter = useStore((state) => state.setFilter);

  const machinesArray = Object.values(machines);

  const filtered = machinesArray.filter((m) => {
    if (filter === 'ALL') return true;
    return m.status === filter;
  });

  return (
    <div className="machine-grid-container">
      <div className="filter-buttons">
        <button
          className={`filter-btn ${filter === 'ALL' ? 'active' : ''}`}
          onClick={() => setFilter('ALL')}
        >
          All ({machinesArray.length})
        </button>
        <button
          className={`filter-btn ${filter === 'ON' ? 'active' : ''}`}
          onClick={() => setFilter('ON')}
        >
          Running ({machinesArray.filter((m) => m.status === 'ON').length})
        </button>
        <button
          className={`filter-btn ${filter === 'OFF' ? 'active' : ''}`}
          onClick={() => setFilter('OFF')}
        >
          Off ({machinesArray.filter((m) => m.status === 'OFF').length})
        </button>
        <button
          className={`filter-btn ${filter === 'STOPPED' ? 'active' : ''}`}
          onClick={() => setFilter('STOPPED')}
        >
          Stopped ({machinesArray.filter((m) => m.status === 'STOPPED').length})
        </button>
      </div>

      <div className="machine-grid">
        {filtered.length > 0 ? (
          filtered.map((machine) => <MachineCard key={machine.machineId} machine={machine} />)
        ) : (
          <div className="no-machines">No machines found</div>
        )}
      </div>
    </div>
  );
}
