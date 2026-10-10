/**
 * CORS Middleware with Environment-driven Origins
 * Configurable via PUBLIC_SITE_URL, ADMIN_URL, STAFF_APP_URL, API_URL
 */

function configureCors() {
  const allowedOrigins = [
    process.env.PUBLIC_SITE_URL,
    process.env.ADMIN_URL,
    process.env.STAFF_APP_URL,
    process.env.API_URL
  ].filter(Boolean).map(url => {
    try {
      const parsed = new URL(url);
      return parsed.origin;
    } catch (_) {
      return url.replace(/\/$/, '');
    }
  });

  return (req, res, next) => {
    const origin = req.headers.origin;

    if (!origin) {
      // Same-origin or non-browser request
      return next();
    }

    const isAllowed = allowedOrigins.length === 0 || 
                      allowedOrigins.includes(origin) || 
                      origin.includes('localhost') || 
                      origin.includes('127.0.0.1');

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token, X-Requested-With');
    }

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }

    next();
  };
}

module.exports = {
  configureCors
};

