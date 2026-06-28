import jwt from 'jsonwebtoken';
import prisma from '../config/db.js';

export const findUserByUsername = async (username) => {
  return prisma.user.findUnique({
    where: { username },
    select: {
      id: true,
      fullName: true,
      username: true,
      passwordHash: true,
      role: true,
      phone: true,
      isActive: true,
      isDeleted: true,
    },
  });
};

export const findUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id, isDeleted: false },
    select: {
      id: true,
      fullName: true,
      username: true,
      role: true,
      phone: true,
      isActive: true,
      isDeleted: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });
};

export const updateLastLogin = async (userId) => {
  await prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
};

export const generateTokens = (user) => {
  const payload = { id: user.id, username: user.username, role: user.role };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  });
  const refreshToken = jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  });
  return { accessToken, refreshToken };
};
