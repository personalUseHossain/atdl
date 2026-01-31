// lib/rateLimit.js
const rateLimit = (options) => {
  const tokens = new Map();
  
  return {
    check: async (limit, token) => {
      const now = Date.now();
      const windowStart = now - options.interval;
      
      if (!tokens.has(token)) {
        tokens.set(token, []);
      }
      
      const tokenTimestamps = tokens.get(token);
      
      // Remove old timestamps
      while (tokenTimestamps.length && tokenTimestamps[0] <= windowStart) {
        tokenTimestamps.shift();
      }
      
      // Check if under limit
      if (tokenTimestamps.length < limit) {
        tokenTimestamps.push(now);
        tokens.set(token, tokenTimestamps);
        return false; // Not rate limited
      }
      
      return true; // Rate limited
    }
  };
};

export default rateLimit;