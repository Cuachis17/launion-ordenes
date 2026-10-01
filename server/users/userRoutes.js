/**
 * server/users/userRoutes.js
 * Rutas de usuarios para consulta de perfil, avatares, cambio de contraseña y edición.
 * Protegidas según corresponda por verifyToken, requireActive y requireAdmin.
 */

import express from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db } from './db.js';
import { verifyToken, requireActive, requireAdmin, resizeImage } from '../middleware.js';

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * POST /api/users/change-password
 * Permite al usuario activo autenticado cambiar su propia contraseña.
 */
router.post('/change-password', verifyToken, requireActive, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        message: 'Current and new password are required'
      });
    }

    const userId = req.user._id || req.user.id;
    const user = await db.findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({
        message: 'La contraseña actual es incorrecta'
      });
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    await db.update({ _id: userId }, { $set: { password: hashedPassword } });
    if (typeof db.compactDatafile === 'function') {
      db.compactDatafile();
    } else if (db.persistence?.compactDatafile) {
      db.persistence.compactDatafile();
    }

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/users
 * Obtiene la lista de usuarios. Restringido exclusivamente a administradores activos.
 */
router.get('/', verifyToken, requireActive, requireAdmin, async (req, res) => {
  try {
    const users = await db.find({}, { password: 0 });
    res.json(users);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/users/:id
 * Consulta la información de un usuario específico sin incluir la contraseña.
 */
router.get('/:id', verifyToken, requireActive, async (req, res) => {
  try {
    const user = await db.findOne({ _id: req.params.id }, { password: 0 });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error al consultar usuario:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * GET /api/users/:id/avatar
 * Sirve directamente la imagen del avatar del usuario.
 * Es público para permitir inserción de imágenes en PDFs y vistas de comprobantes.
 */
router.get('/:id/avatar', async (req, res) => {
  try {
    const user = await db.findOne({ _id: req.params.id });
    if (!user || !user.avatar) {
      return res.status(404).json({ message: 'Avatar not found' });
    }

    const absolutePath = path.resolve(user.avatar);
    if (fs.existsSync(absolutePath)) {
      res.sendFile(absolutePath);
    } else {
      res.status(404).json({ message: 'Avatar file not found on server' });
    }
  } catch (error) {
    console.error('Error al servir avatar:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PUT /api/users/:id
 * Actualiza el perfil de un usuario. Solo permitido al propio usuario o a un admin.
 * Los campos 'status' y 'role' se ignoran intencionalmente aquí.
 */
router.put('/:id', verifyToken, requireActive, upload.single('avatar'), resizeImage,
  async (req, res) => {
    try {
      const currentUserId = req.user._id || req.user.id;
      const isAdmin = req.user.role === 'admin';

      // Autorización: solo el dueño de la cuenta o un admin pueden editar
      if (currentUserId !== req.params.id && !isAdmin) {
        return res.status(403).json({
          message: 'Forbidden. No tienes permiso para editar este usuario'
        });
      }

      const { username, password } = req.body;
      const updateData = {};

      if (username) {
        updateData.username = username;
      }
      if (password) {
        const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
        updateData.password = await bcrypt.hash(password, saltRounds);
      }
      if (req.file) {
        updateData.avatar = req.file.path;
      }

      // 'status' y 'role' no se modifican desde este endpoint
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: 'No update data provided' });
      }

      const numReplaced = await db.update({ _id: req.params.id }, { $set: updateData });
      if (typeof db.compactDatafile === 'function') {
        db.compactDatafile();
      } else if (db.persistence?.compactDatafile) {
        db.persistence.compactDatafile();
      }

      if (numReplaced === 0) {
        return res.status(404).json({ message: 'User not found' });
      }

      const updatedUser = await db.findOne({ _id: req.params.id }, { password: 0 });
      res.json(updatedUser);
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/users/:id
 * Elimina un usuario de la base de datos. Solo administradores activos.
 */
router.delete('/:id', verifyToken, requireActive, requireAdmin, async (req, res) => {
  try {
    const numRemoved = await db.remove({ _id: req.params.id }, {});
    if (numRemoved === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
