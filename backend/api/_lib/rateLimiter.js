import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

// Initialize Redis only if the env vars are present. 
// If missing, we'll bypass rate limiting to prevent breaking the app during setup.
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Create multiple limiters for different use cases
const limiters = {
  // Strict limit for auth routes (e.g. 5 requests per minute)
  auth: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/auth',
  }) : null,
  
  // Moderate limit for AI endpoints (e.g. 20 requests per minute)
  ai: redis ? new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(20, '1 m'),
    analytics: true,
    prefix: '@upstash/ratelimit/ai',
  }) : null,
};

/**
 * Applies rate limiting to an incoming request based on IP address.
 * @param {Request} req - The incoming HTTP request
 * @param {'auth' | 'ai'} type - The type of limiter to use
 * @returns {Promise<{ success: boolean, limit: number, remaining: number, reset: number }>}
 */
export async function checkRateLimit(req, type = 'ai') {
  if (!redis || !limiters[type]) {
    // If Upstash isn't configured, bypass rate limiting.
    return { success: true, limit: 100, remaining: 100, reset: Date.now() + 60000 };
  }

  // Get IP from Vercel headers, or fallback to a default
  const ip = req.headers['x-real-ip'] || req.headers['x-forwarded-for'] || '127.0.0.1';
  
  const { success, limit, remaining, reset } = await limiters[type].limit(ip);
  return { success, limit, remaining, reset };
}
