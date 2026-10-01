/**
 * server/users/adminRoutes.js
 * Rutas administrativas para la gestión de usuarios y estados de cuenta.
 * Todas las rutas requieren verifyToken + requireActive + requireAdmin.
 */

import express from 'express';
import { db } from './db.js';
import { verifyToken, requireActive, requireAdmin } from '../middleware.js';

const router = express.Router();

// Aplica autenticación, cuenta activa y verificación estricta de admin en DB
router.use(verifyToken, requireActive, requireAdmin);

/**
 * GET /api/admin/users
 * Retorna la lista de usuarios sin contraseñas para el panel de administración.
 */
router.get('/users', async (req, res) => {
  try {
    const users = await db.find({}, { password: 0 });
    const formatted = users.map(user => ({
      _id: user._id,
      username: user.username,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
      createdAt: user.createdAt,
      avatar: user.avatar || null
    }));
    res.json(formatted);
  } catch (error) {
    console.error('Error al listar usuarios para admin:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

/**
 * PATCH /api/admin/users/:id/status
 * Modifica el estado activo/inactivo de un usuario.
 * Impide que un administrador se desactive a sí mismo (HTTP 409).
 */
router.patch('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const targetId = req.params.id;

    if (status !== 'active' && status !== 'inactive') {
      return res.status(400).json({
        message: "El campo status debe ser 'active' o 'inactive'"
      });
    }

    // Un administrador no puede desactivar su propia cuenta
    const currentAdminId = req.user._id || req.user.id;
    if (currentAdminId === targetId && status === 'inactive') {
      return res.status(409).json({
        message: 'No puedes desactivar tu propia cuenta de administrador'
      });
    }

    const existingUser = await db.findOne({ _id: targetId });
    if (!existingUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    await db.update({ _id: targetId }, { $set: { status } });
    if (typeof db.compactDatafile === 'function') {
      db.compactDatafile();
    } else if (db.persistence?.compactDatafile) {
      db.persistence.compactDatafile();
    }

    const updatedUser = await db.findOne({ _id: targetId }, { password: 0 });
    res.json(updatedUser);
  } catch (error) {
    console.error('Error al actualizar status del usuario:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;
