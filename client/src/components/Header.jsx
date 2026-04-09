import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import './Header.css';

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
    <header className="header">
      <div className="header-content">
        <div className="header-left">
          <h1 className="header-title">Amantex Ltd — Production Dashboard</h1>
          <p className="header-subtitle">Floor Monitoring · Roll & Kg Tracking · Real-Time Sensor Counts · Alerts</p>
        </div>

        <div className="header-right">
          <button
            className={`mode-toggle ${isDummyMode ? 'mode-toggle--demo' : 'mode-toggle--live'}`}
            onClick={() => setDummyMode(!isDummyMode)}
            title={isDummyMode ? 'Switch to live data' : 'Switch to demo mode'}
          >
            {isDummyMode ? '⬤ Demo' : '⬤ Live'}
          </button>

          <button className="notification-bell" title="View alerts">
            🔔
            {unackedCount > 0 && (
              <span className="notification-badge">{unackedCount > 99 ? '99+' : unackedCount}</span>
            )}
          </button>

          <div className="badge-group">
            <div className="badge">
              <span className="badge-label">Company:</span>
              <span className="badge-value">{session.company}</span>
            </div>
            <div className="badge">
              <span className="badge-label">Asset:</span>
              <span className="badge-value">{session.asset}</span>
            </div>
            <div className="badge">
              <span className="badge-label">Job:</span>
              <span className="badge-value">{session.job}</span>
            </div>
          </div>

          <div className="badge-group">
            <div className="badge">
              <span className="badge-label">Operator:</span>
              <span className="badge-value">{session.operator}</span>
            </div>
            <div className="badge">
              <span className="badge-label">Shift:</span>
              <span className="badge-value">{session.shift}</span>
            </div>
            <div className="badge badge-updated">
              <span className="badge-label">Updated:</span>
              <span className="badge-value">
                {formatTime(currentTime)}{' '}
                <span className="status-dot" style={{ color: statusColor }}>
                  {statusDot}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
