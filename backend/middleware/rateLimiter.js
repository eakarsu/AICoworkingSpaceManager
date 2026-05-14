/**
 * Rate limiter middleware (express-rate-limit based).
 * - aiRateLimiter: 20 AI calls per hour per authenticated user (or IP fallback)
 * - generalRateLimiter: 200 requests per 15 minutes (general API protection)
 */
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = rateLimit;

const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const userId = req.user?.id || req.user?.userId;
    return userId ? `user_${userId}` : ipKeyGenerator(req);
  },
  message: {
    error: 'AI rate limit exceeded. Maximum 20 AI calls per hour. Try again later.'
  },
  skip: (req) => req.user?.role === 'admin'
});

const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});

module.exports = { aiRateLimiter, generalRateLimiter };
