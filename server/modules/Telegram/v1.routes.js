/**
 * Telegram Routes V1
 * API v1 endpoints for Telegram notification management
 */

import express from 'express';

const router = express.Router();

// GET /api/v1/telegram/status - get Telegram notification status
router.get('/status', (req, res) => {
  // Import telegram module inside handler to avoid circular dependencies
  import('../../telegram.js').then(telegramModule => {
    res.json(telegramModule.getStatus());
  }).catch(error => {
    res.status(500).json({ error: error.message });
  });
});

// POST /api/v1/telegram/config - update Telegram configuration
router.post('/config', (req, res) => {
  // Import telegram module inside handler to avoid circular dependencies
  import('../../telegram.js').then(telegramModule => {
    telegramModule.updateConfig(req.body);
    res.json({ ok: true });
  }).catch(error => {
    res.status(500).json({ error: error.message });
  });
});

export default router;
