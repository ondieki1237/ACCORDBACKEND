import express from 'express';

const router = express.Router();

// Simple ping to verify CORS and connectivity
router.get('/ping', (req, res) => {
  res.json({ success: true, message: 'pong', origin: req.headers.origin || null });
});

// List registered routes (useful for debugging mounting issues)
router.get('/routes', (req, res) => {
  try {
    const results = [];
    const stack = req.app._router && req.app._router.stack ? req.app._router.stack : [];
    stack.forEach((layer) => {
      if (layer.route && layer.route.path) {
        const methods = Object.keys(layer.route.methods).join(',').toUpperCase();
        results.push({ path: layer.route.path, methods });
      } else if (layer.name === 'router' && layer.handle && layer.handle.stack) {
        layer.handle.stack.forEach((nested) => {
          if (nested.route && nested.route.path) {
            const methods = Object.keys(nested.route.methods).join(',').toUpperCase();
            results.push({ path: nested.route.path, methods });
          }
        });
      }
    });
    return res.json({ success: true, routes: results });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list routes', error: err.message });
  }
});

export default router;
