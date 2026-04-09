import { useState, useEffect } from 'react';
import './TelegramNotifications.css';

export default function TelegramNotifications() {
  const [status, setStatus] = useState(null);
  const [notifyOn, setNotifyOn] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/telegram/status');
        const data = await response.json();
        setStatus(data);
        setNotifyOn(data.notifyOn || {});
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch Telegram status:', err);
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleToggle = async (key) => {
    const updated = { ...notifyOn, [key]: !notifyOn[key] };
    setNotifyOn(updated);

    try {
      await fetch('/api/telegram/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notifyOn: updated })
      });
    } catch (err) {
      console.error('Failed to update Telegram config:', err);
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  if (loading || !status) {
    return <div className="telegram-notifications">Loading...</div>;
  }

  const recentMessages = status.recentMessages || [];

  return (
    <div className="telegram-notifications">
      <div className="tn-header">
        <div className="tn-title-row">
          <span className="tn-icon">📱</span>
          <h3 className="tn-title">Telegram Notifications</h3>
          <span className="tn-bot-pill">{status.botName}</span>
        </div>
      </div>

      <div className="tn-config-box">
        <div className="tn-config-row">
          <span className="tn-config-label">Bot</span>
          <span className="tn-config-value">{status.botName}</span>
        </div>
        <div className="tn-config-row">
          <span className="tn-config-label">Channel</span>
          <span className="tn-config-value">{status.channelName}</span>
        </div>
        <div className="tn-config-row">
          <span className="tn-config-label">Status</span>
          <span className="tn-config-value">
            <span
              className="tn-status-dot"
              style={{
                backgroundColor: status.connected ? '#16a34a' : '#dc2626',
                display: 'inline-block',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                marginRight: '6px'
              }}
            ></span>
            {status.connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="tn-notify-label">Notify On</div>
      <div className="tn-toggles">
        {['machineStop', 'floorStop', 'qualityFault', 'shiftStart'].map((key) => (
          <button
            key={key}
            className={`tn-toggle ${notifyOn[key] ? 'active' : ''}`}
            onClick={() => handleToggle(key)}
          >
            {notifyOn[key] && <span className="tn-check">✓</span>}
            <span className="tn-toggle-label">
              {key === 'machineStop'
                ? 'Machine Stop'
                : key === 'floorStop'
                  ? 'Floor Stop'
                  : key === 'qualityFault'
                    ? 'Quality Fault'
                    : 'Shift Start'}
            </span>
          </button>
        ))}
      </div>

      <div className="tn-messages-label">Recent Messages</div>
      <div className="tn-messages-list">
        {recentMessages.length > 0 ? (
          recentMessages.map((msg, idx) => {
            const isCritical = msg.text.includes('🔴') || msg.text.includes('CRITICAL');
            return (
              <div
                key={idx}
                className={`tn-message-entry ${isCritical ? 'critical' : 'warning'}`}
              >
                <div className="tn-message-text">{msg.text}</div>
                <div className="tn-message-meta">
                  <span className="tn-message-time">{formatTime(msg.timestamp)}</span>
                  {msg.sent && (
                    <span className="tn-sent-badge">
                      Sent <strong>✓</strong>
                    </span>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="tn-empty">No messages sent yet</div>
        )}
      </div>
    </div>
  );
}
