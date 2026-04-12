import { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { dummyTelegramStatus } from '../services/dummyData';
import * as apiClient from '../services/apiClient.js';


export default function TelegramNotifications() {
  const isDummyMode = useStore((state) => state.isDummyMode);
  const notificationBadge = useStore((state) => state.notificationBadge);
  const notificationMessages = useStore((state) => state.notificationMessages);
  const clearNotificationBadges = useStore((state) => state.clearNotificationBadges);
  const [status, setStatus] = useState(null);
  const [notifyOn, setNotifyOn] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [acknowledgedAlerts, setAcknowledgedAlerts] = useState(new Set());

  useEffect(() => {
    if (isDummyMode) {
      // Use dummy data in demo mode
      setStatus(dummyTelegramStatus);
      setNotifyOn(dummyTelegramStatus.notifyOn || {});
      setLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const data = await apiClient.getTelegramStatus();
        setStatus(data);
        setNotifyOn(data.notifyOn || {});
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch Telegram status:', err);
        // Use dummy data as fallback
        setStatus(dummyTelegramStatus);
        setNotifyOn(dummyTelegramStatus.notifyOn || {});
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [isDummyMode]);

  const handleToggle = async (key) => {
    const updated = { ...notifyOn, [key]: !notifyOn[key] };
    setNotifyOn(updated);

    try {
      await apiClient.updateTelegramConfig({ notifyOn: updated });
    } catch (err) {
      console.error('Failed to update Telegram config:', err);
    }
  };

  const handleBadgeClick = () => {
    setShowAllNotifications(true);
  };

  const handleAcknowledgeAlert = (alertId) => {
    setAcknowledgedAlerts((prev) => new Set([...prev, alertId]));
  };

  const handleAcknowledgeAll = () => {
    const allMessages = isDummyMode ? notificationMessages : (status?.recentMessages || []);
    const alertIds = allMessages
      .filter((msg) => {
        const isCritical = msg.text?.includes('🔴') || msg.severity === 'critical' || msg.text?.includes('CRITICAL');
        const isSuccess = msg.text?.includes('✅') || msg.severity === 'success';
        return (isCritical || !isSuccess) && !acknowledgedAlerts.has(msg.id || msg.timestamp);
      })
      .map((msg) => msg.id || msg.timestamp);
    setAcknowledgedAlerts((prev) => new Set([...prev, ...alertIds]));
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
    return <div className="bg-white rounded-xs shadow-sm p-5">Loading...</div>;
  }

  const totalUnread = (notificationBadge.critical || 0) + (notificationBadge.warning || 0) + (notificationBadge.success || 0);
  const displayMessages = (isDummyMode ? notificationMessages : (status.recentMessages || [])).slice(-2);

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-white rounded-xs shadow-sm p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📱</span>
            {totalUnread > 0 && (
              <div className="flex gap-2">
                {notificationBadge.critical > 0 && (
                  <button 
                    className="px-2.5 py-1 rounded-xs bg-red-100 text-red-700 text-xs font-bold cursor-pointer hover:bg-red-200"
                    onClick={handleBadgeClick}
                    title="Click to view"
                  >
                    🔴 {notificationBadge.critical}
                  </button>
                )}
                {notificationBadge.warning > 0 && (
                  <button 
                    className="px-2.5 py-1 rounded-xs bg-amber-100 text-amber-700 text-xs font-bold cursor-pointer hover:bg-amber-200"
                    onClick={handleBadgeClick}
                    title="Click to view"
                  >
                    ⚠️ {notificationBadge.warning}
                  </button>
                )}
                {notificationBadge.success > 0 && (
                  <button 
                    className="px-2.5 py-1 rounded-xs bg-emerald-100 text-emerald-700 text-xs font-bold cursor-pointer hover:bg-emerald-200"
                    onClick={handleBadgeClick}
                    title="Click to view"
                  >
                    ✅ {notificationBadge.success}
                  </button>
                )}
              </div>
            )}
            <h3 className="text-base font-bold text-neutral-900">Telegram Notifications</h3>
          </div>
            <span className="px-2.5 py-1 rounded-xs bg-neutral-100 text-neutral-700 text-xs font-semibold">{status.botName}</span>
        </div>

        <div className="space-y-2 mb-4 p-3 bg-neutral-50 rounded-xs">
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Bot</span>
            <span className="font-semibold text-neutral-900">{status.botName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-neutral-600">Channel</span>
            <span className="font-semibold text-neutral-900">{status.channelName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-neutral-600">Status</span>
            <div className="flex items-center gap-2">
              <span
                style={{
                  backgroundColor: status.connected ? '#16a34a' : '#dc2626',
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%'
                }}
              ></span>
              <span className="font-semibold text-neutral-900">
                {status.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs font-bold uppercase text-neutral-500 mb-2 sm:mb-3">Notify On</div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-2">
          {['machineStop', 'floorStop', 'qualityFault', 'shiftStart'].map((key) => (
            <button
              key={key}
              onClick={() => handleToggle(key)}
              className={`
                px-3 py-2 rounded-xs border-2 text-sm font-semibold transition-all
                ${notifyOn[key]
                  ? 'border-teal-500 bg-teal-500 text-white'
                  : 'border-neutral-300 bg-neutral-50 text-neutral-600 hover:border-neutral-400'
                }
              `}
            >
              {notifyOn[key] && <span className="mr-1">✓</span>}
              {key === 'machineStop'
                ? 'Machine Stop'
                : key === 'floorStop'
                  ? 'Floor Stop'
                  : key === 'qualityFault'
                    ? 'Quality Fault'
                    : 'Shift Start'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xs shadow-sm p-5 flex flex-col max-h-96">
        <div className="text-xs font-bold uppercase text-neutral-500 mb-3">Recent Messages</div>
        <div className="space-y-2 overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-neutral-300 scrollbar-track-neutral-100">
          {displayMessages.length > 0 ? (
            displayMessages.map((msg) => {
              const isCritical = msg.text?.includes('🔴') || msg.severity === 'critical' || msg.text?.includes('CRITICAL');
              return (
                <div
                  key={msg.id || msg.timestamp}
                  className={`p-3 rounded-xs ${
                    isCritical ? 'bg-red-50 border-l-4 border-red-400' : 'bg-amber-50 border-l-4 border-amber-400'
                  }`}
                >
                  <div className={`text-sm font-semibold ${isCritical ? 'text-red-700' : 'text-amber-700'}`}>
                    {msg.text}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-xs text-neutral-500">{formatTime(msg.timestamp)}</span>
                    {msg.sent && (
                      <span className="text-xs text-emerald-600 font-semibold">
                        Sent ✓
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-sm text-neutral-400 text-center py-4">No messages sent yet</div>
          )}
        </div>
      </div>

      {showAllNotifications && (
        <div 
          className="fixed inset-0 z-50 bg-gray-500 bg-opacity-10 pointer-events-none flex items-center justify-center p-3 sm:p-4"
        >
          <div 
            className="bg-white rounded-xs shadow-lg w-full sm:max-w-2xl max-h-screen sm:max-h-96 flex flex-col pointer-events-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 sm:p-5 border-b border-neutral-200 gap-2 sm:gap-0">
              <div>
                <h2 className="text-lg font-bold text-neutral-900 mb-1">Active Alerts</h2>
                {(() => {
                  const allMessages = isDummyMode ? notificationMessages : (status?.recentMessages || []);
                  const unacknowledgedCount = allMessages.filter((msg) => {
                    const isCritical = msg.text?.includes('🔴') || msg.severity === 'critical' || msg.text?.includes('CRITICAL');
                    const isSuccess = msg.text?.includes('✅') || msg.severity === 'success';
                    return (isCritical || !isSuccess) && !acknowledgedAlerts.has(msg.id || msg.timestamp);
                  }).length;
                  return unacknowledgedCount > 0 && (
                    <span className="text-xs text-neutral-500">{unacknowledgedCount} Unacknowledged</span>
                  );
                })()}
              </div>
              <div className="flex gap-2">
                {(() => {
                  const allMessages = isDummyMode ? notificationMessages : (status?.recentMessages || []);
                  const hasUnacknowledged = allMessages.some((msg) => {
                    const isCritical = msg.text?.includes('🔴') || msg.severity === 'critical' || msg.text?.includes('CRITICAL');
                    const isSuccess = msg.text?.includes('✅') || msg.severity === 'success';
                    return (isCritical || !isSuccess) && !acknowledgedAlerts.has(msg.id || msg.timestamp);
                  });
                  return hasUnacknowledged && (
                    <button 
                      className="px-3 py-2 bg-purple-600 text-white rounded-xs text-sm font-semibold hover:bg-purple-700"
                      onClick={handleAcknowledgeAll}
                    >
                      Acknowledge All
                    </button>
                  );
                })()}
                <button 
                  className="px-2 py-1 text-neutral-400 hover:text-neutral-600 text-xl font-bold"
                  onClick={() => setShowAllNotifications(false)}
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {(() => {
                const allMessages = isDummyMode ? notificationMessages : (status?.recentMessages || []);
                const filteredMessages = allMessages.filter((msg) => {
                  const isCritical = msg.text?.includes('🔴') || msg.severity === 'critical' || msg.text?.includes('CRITICAL');
                  const isSuccess = msg.text?.includes('✅') || msg.severity === 'success';
                  return (isCritical || !isSuccess) && !acknowledgedAlerts.has(msg.id || msg.timestamp);
                });
                return filteredMessages.length > 0 ? (
                  filteredMessages.map((msg) => {
                    const isCritical = msg.text?.includes('🔴') || msg.severity === 'critical' || msg.text?.includes('CRITICAL');
                    const alertId = msg.id || msg.timestamp;
                    return (
                      <div
                        key={alertId}
                        className={`p-4 rounded-xs border-l-4 flex items-start justify-between gap-4 ${
                          isCritical ? 'bg-red-50 border-red-400' : 'bg-amber-50 border-amber-400'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="text-sm font-bold flex items-center gap-2">
                            <span className="text-lg">{isCritical ? '🔴' : '⚠️'}</span>
                            <span className={isCritical ? 'text-red-700' : 'text-amber-700'}>
                              {msg.text}
                            </span>
                          </div>
                          <div className="text-xs text-neutral-500 mt-1">{formatTime(msg.timestamp)}</div>
                        </div>
                        <button
                          className="px-3 py-2 bg-neutral-200 text-neutral-700 rounded-xs text-sm font-semibold hover:bg-neutral-300 shrink-0"
                          onClick={() => handleAcknowledgeAlert(alertId)}
                        >
                          Acknowledge
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center text-sm text-neutral-400 py-8">All alerts acknowledged</div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
