const express = require('express');
const router = express.Router();

/**
 * POST /admin/login
 * Admin login endpoint
 * Body: { password }
 */
router.post('/login', (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        success: false,
        error: 'Password is required'
      });
    }
    
    const validPassword = process.env.ADMIN_KEY;
    
    if (!validPassword) {
      return res.status(500).json({
        success: false,
        error: 'Admin authentication not configured'
      });
    }
    
    if (password !== validPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid password'
      });
    }
    
    // Valid password - return admin key for client to store
    res.json({
      success: true,
      message: 'Login successful',
      data: {
        adminKey: validPassword,
        expiresIn: '7d' // Info only, not enforced yet
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Login failed',
      message: error.message
    });
  }
});

/**
 * POST /admin/logout
 * Admin logout (client-side, just confirmation)
 */
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logout successful'
  });
});

/**
 * GET /admin/verify
 * Verify if admin key is valid
 */
router.get('/verify', (req, res) => {
  const providedKey = req.headers['x-admin-key'];
  const validKey = process.env.ADMIN_KEY;
  
  if (!validKey) {
    return res.status(500).json({
      success: false,
      error: 'Admin authentication not configured'
    });
  }
  
  if (providedKey === validKey) {
    res.json({
      success: true,
      valid: true
    });
  } else {
    res.status(401).json({
      success: false,
      valid: false,
      error: 'Invalid admin key'
    });
  }
});

module.exports = router;
