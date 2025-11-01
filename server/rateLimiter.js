const rateLimitState = new Map();

const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 60000,
  backoffMultiplier: 2
};

export function getRateLimitConfig() {
  return {
    maxRetries: parseInt(process.env.RATE_LIMIT_MAX_RETRIES) || DEFAULT_RETRY_CONFIG.maxRetries,
    initialDelay: parseInt(process.env.RATE_LIMIT_INITIAL_DELAY) || DEFAULT_RETRY_CONFIG.initialDelay,
    maxDelay: parseInt(process.env.RATE_LIMIT_MAX_DELAY) || DEFAULT_RETRY_CONFIG.maxDelay,
    backoffMultiplier: parseFloat(process.env.RATE_LIMIT_BACKOFF_MULTIPLIER) || DEFAULT_RETRY_CONFIG.backoffMultiplier
  };
}

export function isRateLimited(provider) {
  const state = rateLimitState.get(provider);
  if (!state) return false;

  const now = Date.now();
  if (now < state.resetTime) {
    return true;
  }

  rateLimitState.delete(provider);
  return false;
}

export function setRateLimit(provider, retryAfter = null) {
  const config = getRateLimitConfig();
  const delay = retryAfter
    ? parseInt(retryAfter) * 1000
    : config.initialDelay;

  rateLimitState.set(provider, {
    resetTime: Date.now() + delay,
    retryAfter: delay
  });

  console.warn(`⏱️ Rate limit applied to ${provider}: retry in ${delay}ms`);
}

export function getRateLimitInfo(provider) {
  const state = rateLimitState.get(provider);
  if (!state) return null;

  const now = Date.now();
  const remainingTime = Math.max(0, state.resetTime - now);

  return {
    isLimited: remainingTime > 0,
    retryAfter: remainingTime,
    resetTime: state.resetTime
  };
}

export async function callWithRetry(fn, provider, config = null) {
  const retryConfig = config || getRateLimitConfig();
  let lastError = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    if (isRateLimited(provider)) {
      const info = getRateLimitInfo(provider);
      if (info && info.retryAfter > 0) {
        console.log(`⏳ ${provider} rate limited, waiting ${info.retryAfter}ms...`);
        await sleep(info.retryAfter);
      }
    }

    try {
      const result = await fn();

      if (attempt > 0) {
        console.log(`✅ ${provider} succeeded after ${attempt} retries`);
      }

      return result;
    } catch (error) {
      lastError = error;

      if (error.status === 429 || error.message?.includes('429') || error.message?.includes('rate limit')) {
        const retryAfter = error.retryAfter || error.headers?.get('retry-after');
        setRateLimit(provider, retryAfter);

        if (attempt < retryConfig.maxRetries) {
          const delay = Math.min(
            retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
            retryConfig.maxDelay
          );

          console.warn(`⚠️ Rate limit (429) on ${provider}, retry ${attempt + 1}/${retryConfig.maxRetries} in ${delay}ms`);
          await sleep(delay);
          continue;
        }
      }

      if (error.status === 503 || error.message?.includes('503')) {
        if (attempt < retryConfig.maxRetries) {
          const delay = Math.min(
            retryConfig.initialDelay * Math.pow(retryConfig.backoffMultiplier, attempt),
            retryConfig.maxDelay
          );

          console.warn(`⚠️ Service unavailable (503) on ${provider}, retry ${attempt + 1}/${retryConfig.maxRetries} in ${delay}ms`);
          await sleep(delay);
          continue;
        }
      }

      throw error;
    }
  }

  throw lastError || new Error(`Failed after ${retryConfig.maxRetries} retries`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function clearRateLimits() {
  rateLimitState.clear();
  console.log('🔄 All rate limits cleared');
}

export function getAllRateLimits() {
  const limits = {};
  for (const [provider, state] of rateLimitState.entries()) {
    const now = Date.now();
    const remainingTime = Math.max(0, state.resetTime - now);
    limits[provider] = {
      isLimited: remainingTime > 0,
      retryAfter: remainingTime,
      resetTime: new Date(state.resetTime).toISOString()
    };
  }
  return limits;
}
