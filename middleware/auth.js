const jwt = require('jsonwebtoken');
const User = require('@/models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
function generateToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Verify JWT token middleware
async function authenticate(req, res, next) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    // Update last active
    user.stats.lastActive = new Date();
    await user.save();

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
}

// Optional authentication (for public routes)
async function optionalAuthenticate(req, res, next) {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user) {
        // Update last active
        user.stats.lastActive = new Date();
        await user.save();

        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // If token is invalid, just continue without user
    next();
  }
}

module.exports = {
  generateToken,
  authenticate,
  optionalAuthenticate
};