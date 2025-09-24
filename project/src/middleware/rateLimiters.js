import rateLimit from 'express-rate-limit';

const ONE_MIN = 60 * 1000;

// General (lenient) global limiter
export const generalLimiter = rateLimit({
  windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // keep existing window
  max: process.env.RATE_LIMIT_MAX_GLOBAL ? Number(process.env.RATE_LIMIT_MAX_GLOBAL) : 1000, // higher default
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.set('Retry-After', String(Math.ceil((process.env.RATE_LIMIT_WINDOW || 15) * 60)));
    return res.status(429).json({ success: false, message: 'Too many requests (global). Try again later.' });
  }
});

// Auth-aware limiter for authenticated routes (per-user)
export const authUserLimiter = rateLimit({
  windowMs: ONE_MIN,
  max: 60, // 60 requests per minute per user
  keyGenerator: (req /*, res*/) => {
    // prefer user id when available, fallback to IP
    return req.user && req.user._id ? String(req.user._id) : req.ip;
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.set('Retry-After', String(Math.ceil(ONE_MIN / 1000)));
    return res.status(429).json({ success: false, message: 'Too many requests. Slow down.' });
  }
});

// Stricter limiter for auth endpoints (login/register)
export const authEndpointLimiter = rateLimit({
  windowMs: ONE_MIN,
  max: 10,
  keyGenerator: (req) => req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.set('Retry-After', String(Math.ceil(ONE_MIN / 1000)));
    return res.status(429).json({ success: false, message: 'Too many auth attempts. Try again later.' });
  }
});