import { useStore } from '../store/useStore';
import './Header.css';

export default function Header() {
  const connectionStatus = useStore((state) => state.connectionStatus);

  const statusColor = {
    connected: '#4CAF50',
    disconnected: '#f44336',
    error: '#ff9800'
  }[connectionStatus];

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-title">
          <h1>📊 Yarn Count Monitor</h1>
          <p>Real-Time Factory Production Dashboard</p>
        </div>
        
        <div className="header-status">
          <div className="connection-indicator">
            <div
              className="status-dot"
              style={{ backgroundColor: statusColor }}
              title={`Connection: ${connectionStatus}`}
            />
            <span className="status-text">{connectionStatus}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
