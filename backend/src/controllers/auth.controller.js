import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { findUserByUsername, findUserById, updateLastLogin, generateTokens } from '../services/auth.service.js';
import { success, error } from '../utils/apiResponse.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await findUserByUsername(username);
    if (!user) return error(res, 'Invalid username or password', 401);

    if (!user.isActive || user.isDeleted) return error(res, 'Account is disabled', 403);

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return error(res, 'Invalid username or password', 401);

    await updateLastLogin(user.id);

    const { accessToken, refreshToken } = generateTokens(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
      },
    }, 'Login successful');
  } catch (err) {
    console.error(err);
    return error(res, 'An unexpected error occurred');
  }
};

export const refresh = async (req, res) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) return error(res, 'No refresh token provided', 401);

    const decoded = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await findUserById(decoded.id);
    if (!user || !user.isActive) return error(res, 'Account is disabled', 403);

    const payload = { id: user.id, username: user.username, role: user.role };

    // Generate new access token
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    });

    // Rotate refresh token: issue a new one with fresh expiry
    const newRefreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
    });

    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return success(res, {
      accessToken,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
      },
    }, 'Token refreshed');
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return error(res, 'Invalid or expired refresh token', 401);
    }
    console.error(err);
    return error(res, 'An unexpected error occurred');
  }
};

export const me = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user) return error(res, 'User not found', 404);
    return success(res, { user }, 'User fetched');
  } catch (err) {
    console.error(err);
    return error(res, 'An unexpected error occurred');
  }
};
