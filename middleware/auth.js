// Admin authentication middleware

/**
 * Middleware to check if request has valid admin authentication
 * Checks for admin key in header or cookie
 */
function requireAdmin(req, res, next) {
  // Check for admin key in header
  const headerKey = req.headers['x-admin-key'];
  
  // Check for admin key in cookie (for web dashboard)
  const cookieKey = req.cookies?.adminKey;
  
  // Check for admin key in session (after login)
  const sessionKey = req.session?.adminKey;
  
  const providedKey = headerKey || cookieKey || sessionKey;
  const validKey = process.env.ADMIN_KEY;
  
  if (!validKey) {
    return res.status(500).json({ 
      error: 'Admin authentication not configured',
      message: 'ADMIN_KEY not set in environment variables'
    });
  }
  
  if (!providedKey) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Admin key required. Please login.'
    });
  }
  
  if (providedKey !== validKey) {
    return res.status(403).json({ 
      error: 'Forbidden',
      message: 'Invalid admin key'
    });
  }
  
  // Valid admin - continue
  next();
}

/**
 * Optional admin check - doesn't block request
 * Sets req.isAdmin = true if valid admin
 */
function optionalAdmin(req, res, next) {
  const headerKey = req.headers['x-admin-key'];
  const cookieKey = req.cookies?.adminKey;
  const sessionKey = req.session?.adminKey;
  
  const providedKey = headerKey || cookieKey || sessionKey;
  const validKey = process.env.ADMIN_KEY;
  
  req.isAdmin = (providedKey && validKey && providedKey === validKey);
  next();
}

module.exports = {
  requireAdmin,
  optionalAdmin
};
