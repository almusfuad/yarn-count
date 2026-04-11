import { useStore } from '../store/useStore';
import MachineCard from './MachineCard';

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
    <div className="flex flex-col gap-3.75">
      <div className="flex gap-2.5 flex-wrap">
        <button
          className={`px-4 py-2 border rounded-full cursor-pointer text-sm font-semibold transition-all ${
            filter === 'ALL'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-neutral-500 border-neutral-300 hover:border-indigo-600 hover:text-indigo-600'
          }`}
          onClick={() => setFilter('ALL')}
        >
          All ({machinesArray.length})
        </button>
        <button
          className={`px-4 py-2 border rounded-full cursor-pointer text-sm font-semibold transition-all ${
            filter === 'ON'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-neutral-500 border-neutral-300 hover:border-indigo-600 hover:text-indigo-600'
          }`}
          onClick={() => setFilter('ON')}
        >
          Running ({machinesArray.filter((m) => m.status === 'ON').length})
        </button>
        <button
          className={`px-4 py-2 border rounded-full cursor-pointer text-sm font-semibold transition-all ${
            filter === 'OFF'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-neutral-500 border-neutral-300 hover:border-indigo-600 hover:text-indigo-600'
          }`}
          onClick={() => setFilter('OFF')}
        >
          Off ({machinesArray.filter((m) => m.status === 'OFF').length})
        </button>
        <button
          className={`px-4 py-2 border rounded-full cursor-pointer text-sm font-semibold transition-all ${
            filter === 'STOPPED'
              ? 'bg-indigo-600 text-white border-indigo-600'
              : 'bg-white text-neutral-500 border-neutral-300 hover:border-indigo-600 hover:text-indigo-600'
          }`}
          onClick={() => setFilter('STOPPED')}
        >
          Stopped ({machinesArray.filter((m) => m.status === 'STOPPED').length})
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.75">
        {filtered.length > 0 ? (
          filtered.map((machine) => <MachineCard key={machine.machineId} machine={machine} />)
        ) : (
          <div className="text-center py-10 px-5 text-neutral-400 text-base">No machines found</div>
        )}
      </div>
    </div>
  );
}
