import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';

export default function Header() {
  const connectionStatus = useStore((state) => state.connectionStatus);
  const isDummyMode = useStore((state) => state.isDummyMode);
  const setDummyMode = useStore((state) => state.setDummyMode);
  const session = useStore((state) => state.session);
  const alerts = useStore((state) => state.alerts);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  const statusDot = connectionStatus === 'connected' ? '●' : '●';
  const statusColor = connectionStatus === 'connected' ? '#4CAF50' : '#f44336';
  const unackedCount = alerts.filter((a) => !a.acked).length;

  return (
    <header className="w-full text-white px-3 sm:px-4 md:px-6 py-2 sm:py-3 shadow-lg" style={{ background: 'linear-gradient(to right, #1a0533, #3b1a6e, #6d28d9)' }}>
      <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-8">
        {/* Left: Title and Subtitle */}
        <div className="shrink-0 pt-0.5">
          <h1 className="text-base sm:text-lg font-bold m-0 tracking-tight">Amantex Ltd — Production Dashboard</h1>
          <p className="text-xs opacity-70 mt-1 font-normal hidden sm:block">Floor Monitoring - Roll & Kg Tracking - Real-Time Sensor Counts - Alerts</p>
        </div>

        {/* Right: Status Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap justify-start sm:justify-end w-full sm:w-auto sm:flex-nowrap sm:self-center">
          {/* Live Status Badge */}
          <button
            className={`${
              isDummyMode
                ? 'bg-amber-600 bg-opacity-20 text-amber-300 hover:bg-opacity-30'
                : 'bg-emerald-600 bg-opacity-20 text-emerald-300 hover:bg-opacity-30'
            } rounded-full px-2 sm:px-3 py-1 text-xs font-semibold cursor-pointer shrink-0 transition-all duration-200 flex items-center gap-1 sm:gap-1.5 whitespace-nowrap`}
            onClick={() => setDummyMode(!isDummyMode)}
            title={isDummyMode ? 'Switch to live data' : 'Switch to demo mode'}
          >
            <span className={`inline-block w-2 h-2 rounded-full ${isDummyMode ? 'bg-amber-400' : 'bg-emerald-400'}`}></span>
            <span className="hidden xs:inline">{isDummyMode ? 'Demo' : 'Live'}</span>
          </button>

          {/* Alerts Bell */}
          <button
            className="relative bg-opacity-20 rounded-full w-8 h-8 text-sm cursor-pointer flex items-center justify-center text-white hover:bg-opacity-30 transition-all shrink-0"
            title="View alerts"
          >
            🔔
            {unackedCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                {unackedCount > 99 ? '99+' : unackedCount}
              </span>
            )}
          </button>

          {/* Company Badge */}
          <div className="hidden md:flex bg-opacity-20 rounded-full px-2 py-1 text-xs items-center gap-1 text-white">
            <span className="text-white opacity-80 font-medium">Company:</span>
            <span className="font-semibold text-white">{session.company}</span>
          </div>

          {/* Asset Badge */}
          <div className="hidden md:flex bg-opacity-20 rounded-full px-2 py-1 text-xs items-center gap-1 whitespace-nowrap text-white">
            <span className="text-white opacity-80 font-medium">Asset:</span>
            <span className="font-semibold text-white">{session.asset}</span>
          </div>

          {/* Job Badge */}
          <div className="hidden lg:flex bg-opacity-20 rounded-full px-2 py-1 text-xs items-center gap-1 whitespace-nowrap text-white">
            <span className="text-white opacity-80 font-medium">Job:</span>
            <span className="font-semibold text-white">{session.job}</span>
          </div>

          {/* Operator Badge */}
          <div className="hidden lg:flex bg-opacity-20 rounded-full px-2 py-1 text-xs items-center gap-1 whitespace-nowrap text-white">
            <span className="text-white opacity-80 font-medium">Operator:</span>
            <span className="font-semibold text-white">{session.operator}</span>
          </div>

          {/* Shift Badge */}
          <div className="hidden xl:flex bg-opacity-20 rounded-full px-2 py-1 text-xs items-center gap-1 whitespace-nowrap text-white">
            <span className="text-white opacity-80 font-medium">Shift:</span>
            <span className="font-semibold text-white">{session.shift}</span>
          </div>

          {/* Updated Badge */}
          <div className="hidden sm:flex bg-opacity-20 rounded-full px-2 py-1 text-xs items-center gap-1.5 whitespace-nowrap text-white">
            <span className="text-white opacity-80 font-medium">Updated:</span>
            <span className="font-semibold text-white">{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
