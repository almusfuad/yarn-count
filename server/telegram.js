const https = require('https');

let config = {
  botToken: process.env.TELEGRAM_BOT_TOKEN || '',
  chatId: process.env.TELEGRAM_CHAT_ID || '',
  channelName: process.env.TELEGRAM_CHANNEL_NAME || 'Amantex Factory Alerts',
  botName: process.env.TELEGRAM_BOT_NAME || '@KnittingAlertsBot',
  notifyOn: {
    machineStop: true,
    floorStop: true,
    qualityFault: true,
    shiftStart: false
  }
};

const recentMessages = [];

function sendMessage(text) {
  if (!config.botToken || !config.chatId) return;

  const url = `https://api.telegram.org/bot${config.botToken}/sendMessage`;
  const body = JSON.stringify({ chat_id: config.chatId, text, parse_mode: 'HTML' });

  const entry = { text, timestamp: new Date().toISOString(), sent: false };
  recentMessages.unshift(entry);
  if (recentMessages.length > 20) recentMessages.pop();

  try {
    const req = https.request(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        }
      },
      (res) => {
        if (res.statusCode === 200) {
          entry.sent = true;
        }
      }
    );

    req.on('error', () => {
      // Silent fail — not critical
    });

    req.write(body);
    req.end();
  } catch (err) {
    console.error('Telegram send error:', err);
  }
}

function notifyMachineStop(machineId) {
  if (!config.notifyOn.machineStop) return;
  sendMessage(`⚠ WARNING: ${machineId} stopped — no pulse`);
}

function notifyQualityFault(machineId, faultType, severity) {
  if (!config.notifyOn.qualityFault) return;
  const emoji = severity === 'critical' ? '🔴 CRITICAL' : '⚠ WARNING';
  sendMessage(`${emoji}: Quality fault on ${machineId} — ${faultType}`);
}

function getStatus() {
  return {
    botName: config.botName,
    channelName: config.channelName,
    connected: !!(config.botToken && config.chatId),
    notifyOn: config.notifyOn,
    recentMessages: recentMessages.slice(0, 10)
  };
}

function updateConfig(newConfig) {
  if (newConfig.notifyOn) {
    config.notifyOn = { ...config.notifyOn, ...newConfig.notifyOn };
  }
}

module.exports = {
  sendMessage,
  notifyMachineStop,
  notifyQualityFault,
  getStatus,
  updateConfig
};
