'use strict';

/**
 * Global error handler — must be registered LAST in Express.
 */
function errorHandler(err, req, res, _next) {
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err);

  // MySQL duplicate entry
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ success: false, message: 'A record with that value already exists.' });
  }

  const status  = err.status  || err.statusCode || 500;
  const message = err.expose  ? err.message : 'Internal server error.';

  res.status(status).json({ success: false, message });
}

module.exports = errorHandler;
