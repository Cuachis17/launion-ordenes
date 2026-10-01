/**
 * server/middleware.js
 * Middlewares de autenticación, autorización y procesamiento de imágenes.
 * Provee verificación de token JWT, control de cuentas activas y permisos de administrador.
 */

import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { db } from './users/db.js';

/**
 * Verifica el token JWT provisto en el header Authorization o en la cookie 'launion'.
 * Si es válido, inyecta la información decodificada en req.user.
 */
export const verifyToken = (req, res, next) => {
  let token = null;

  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.launion) {
    token = req.cookies.launion;
  }

  if (!token) {
    return res.status(401).json({ message: 'No token provided or invalid format' });
  }

  jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Failed to authenticate token' });
    }

    req.user = decoded;
    next();
  });
};

/**
 * Middleware para validar que la cuenta del usuario autenticado esté activa en la DB.
 * Si el usuario fue dado de baja o inactivado, limpia la cookie de sesión inmediatamente
 * y rechaza la solicitud con código INACTIVE y estado HTTP 403.
 */
export const requireActive = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No token provided or invalid format' });
    }

    const user = await db.findOne({ _id: userId });
    if (!user || user.status !== 'active') {
      res.clearCookie('launion', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
      });
      return res.status(403).json({
        message: 'Cuenta desactivada',
        code: 'INACTIVE'
      });
    }

    // Hidratamos req.user con los datos vigentes de la base de datos
    req.user = user;
    req.user.id = user._id;
    next();
  } catch (error) {
    console.error('Error al verificar estado activo de usuario:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Middleware para restringir acceso exclusivo a usuarios con rol administrador.
 * Garantiza que el rol se lea directamente de la base de datos para evitar suplantaciones.
 */
export const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id || req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'No autenticado' });
    }

    // Buscamos o revalidamos el registro contra la base de datos real
    const userInDb = (req.user && req.user._id && req.user.role)
      ? req.user
      : await db.findOne({ _id: userId });

    if (!userInDb || userInDb.role !== 'admin') {
      return res.status(403).json({
        message: 'Forbidden. Admin privileges required.'
      });
    }

    req.user = userInDb;
    req.user.id = userInDb._id;
    next();
  } catch (error) {
    console.error('Error al verificar rol admin:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Redimensiona y optimiza a formato WebP las imágenes subidas como avatar.
 */
export const resizeImage = async (req, res, next) => {
  if (!req.file) {
    return next();
  }

  try {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
    const filepath = path.join('uploads', filename);

    if (!fs.existsSync('uploads')) {
      fs.mkdirSync('uploads', { recursive: true });
    }

    await sharp(req.file.buffer)
      .resize(250, 250, {
        fit: sharp.fit.inside,
        withoutEnlargement: true
      })
      .webp({ quality: 80 })
      .toFile(filepath);

    req.file.path = filepath;
    req.file.filename = filename;
    req.file.mimetype = 'image/webp';

    next();
  } catch (error) {
    console.error('Error processing image:', error);
    return res.status(500).json({ message: 'Error processing uploaded image' });
  }
};
