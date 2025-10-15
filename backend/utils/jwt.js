const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// JWT secret from environment or generate a random one
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString('hex');
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.randomBytes(32).toString('hex');

class JWTUtils {
  constructor() {
    // We'll manage refresh tokens in memory for now (in production, use Redis or database)
    this.refreshTokens = new Map();
  }

  // Generate access token
  generateAccessToken(user) {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      schoolId: user.school_id,
      fullName: user.full_name
    };

    return jwt.sign(payload, JWT_SECRET, {
      expiresIn: '1h',
      issuer: 'quranakh',
      audience: 'quranakh-users'
    });
  }

  // Generate refresh token
  generateRefreshToken(user) {
    const tokenId = crypto.randomBytes(16).toString('hex');
    
    const payload = {
      id: user.id,
      tokenId,
      type: 'refresh'
    };

    const token = jwt.sign(payload, JWT_REFRESH_SECRET, {
      expiresIn: '7d',
      issuer: 'quranakh'
    });

    // Store refresh token metadata
    this.refreshTokens.set(tokenId, {
      userId: user.id,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    return token;
  }

  // Generate both tokens
  generateTokens(user) {
    return {
      accessToken: this.generateAccessToken(user),
      refreshToken: this.generateRefreshToken(user),
      expiresIn: 3600, // 1 hour in seconds
      tokenType: 'Bearer'
    };
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET, {
        issuer: 'quranakh',
        audience: 'quranakh-users'
      });
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_REFRESH_SECRET, {
        issuer: 'quranakh'
      });

      // Check if token exists in storage
      const tokenData = this.refreshTokens.get(decoded.tokenId);
      
      if (!tokenData) {
        throw new Error('Refresh token not found');
      }

      if (tokenData.expiresAt < new Date()) {
        this.refreshTokens.delete(decoded.tokenId);
        throw new Error('Refresh token expired');
      }

      return decoded;
    } catch (error) {
      throw new Error(error.message || 'Invalid refresh token');
    }
  }

  // Revoke refresh token
  revokeRefreshToken(tokenId) {
    return this.refreshTokens.delete(tokenId);
  }

  // Revoke all refresh tokens for a user
  revokeAllUserTokens(userId) {
    for (const [tokenId, data] of this.refreshTokens.entries()) {
      if (data.userId === userId) {
        this.refreshTokens.delete(tokenId);
      }
    }
  }

  // Clean up expired tokens (run periodically)
  cleanupExpiredTokens() {
    const now = new Date();
    for (const [tokenId, data] of this.refreshTokens.entries()) {
      if (data.expiresAt < now) {
        this.refreshTokens.delete(tokenId);
      }
    }
  }
}

// Export singleton instance
module.exports = new JWTUtils();