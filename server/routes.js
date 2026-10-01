/**
 * server/routes.js
 * Enrutador principal de autenticación y registro de usuarios en /api.
 * Incluye login, logout, verificación de sesión y delega rutas de usuarios.
 */

import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './users/db.js';
import { verifyToken, requireActive, requireAdmin, resizeImage } from './middleware.js';
import userRoutes from './users/userRoutes.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Delegamos rutas de usuarios (/api/users/*)
router.use('/users', userRoutes);

/**
 * POST /api/register
 * Crea un nuevo usuario. Solo permitido para administradores activos.
 */
router.post(
  '/register',
  verifyToken,
  requireActive,
  requireAdmin,
  upload.single('avatar'),
  resizeImage,
  async (req, res) => {
    try {
      const { username, password, role, phone } = req.body;

      if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
      }

      const existingUser = await db.findOne({ username });
      if (existingUser) {
        return res.status(409).json({ message: 'Username already exists' });
      }

      const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      const user = {
        username,
        phone,
        password: hashedPassword,
        role: role || 'user',
        avatar: req.file ? req.file.path : null,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      const newUser = await db.insert(user);
      const { password: _, ...userWithoutPassword } = newUser;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * POST /api/login
 * Autentica usuarios por usuario o teléfono y emite cookie/token JWT.
 */
router.post('/login', async (req, res) => {
  try {
    const { username, phone, password } = req.body;

    if ((!username && !phone) || !password) {
      return res.status(400).json({ message: 'Username/phone and password are required' });
    }

    const query = {};
    if (username) query.username = username;
    if (phone) query.phone = phone;

    const dbQuery = (username && phone) ? { $or: [{ username }, { phone }] } : query;
    const user = await db.findOne(dbQuery);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'User account is not active' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const secretKey = process.env.SECRET_KEY;
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      secretKey,
      { expiresIn: '24h' }
    );

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('launion', token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: false,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax'
    });

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/verify
 * Verifica autenticación y estado activo del usuario, retornando sus datos actualizados.
 */
router.get('/verify', verifyToken, requireActive, async (req, res) => {
  try {
    const user = await db.findOne({ _id: req.user.id }, { password: 0 });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user: { ...user, id: user._id } });
  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * POST /api/logout
 * Limpia la cookie de autenticación.
 */
router.post('/logout', (req, res) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.clearCookie('launion', {
    httpOnly: false,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax'
  });
  res.json({ message: 'Logged out successfully' });
});

export default router;
