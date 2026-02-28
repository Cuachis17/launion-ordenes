import express from 'express';
import multer from 'multer';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Datastore from 'nedb-promises';
import path from 'path';
import fs from 'fs';
import { verifyToken, resizeImage } from './middleware.js';

const router = express.Router();

// Initialize Database
const db = Datastore.create({ filename: 'db/users.db', autoload: true });
db.persistence.setAutocompactionInterval(1000 * 60 * 60); // Compaction every hour

// Create default admin if database is empty
db.count({}).then(async count => {
    if (count === 0) {
        const adminUser = process.env.ADMIN_MAIL;
        const adminPass = process.env.ADMIN_PASS;
        const hashedPassword = await bcrypt.hash(adminPass, parseInt(process.env.SALT_ROUNDS));
        await db.insert({
            username: adminUser,
            phone: '0000000000',
            password: hashedPassword,
            role: 'admin',
            status: 'active',
            createdAt: new Date().toISOString()
        });
        console.log(`Default admin user created. Username: ${adminUser}, Password: ${adminPass}`);
    }
});

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Config loaded dynamically when used

// POST /register: Create a new user (Only for Admins)
router.post('/register', verifyToken, upload.single('avatar'), resizeImage, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden. Only admins can register new users.' });
        }

        const { username, password, role, phone } = req.body;

        if (!username || !password) {
            return res.status(400).json({ message: 'Username and password are required' });
        }

        // Check if user already exists
        const existingUser = await db.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ message: 'Username already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));

        // Prepare user document
        const user = {
            username,
            phone,
            password: hashedPassword,
            role: role || 'user', // Admins can assign a role, defaults to 'user'
            avatar: req.file ? req.file.path : null, // Path saved by resizeImage middleware
            status: 'active', // Status field to check if user can use the app
            createdAt: new Date().toISOString()
        };

        const newUser = await db.insert(user);

        // Remove password from response
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// POST /login: Authenticate user
router.post('/login', async (req, res) => {
    try {
        const { username, phone, password } = req.body;

        // Either username or phone needs to be provided, along with the password
        if ((!username && !phone) || !password) {
            return res.status(400).json({ message: 'Username/phone and password are required' });
        }

        // Find by username OR phone
        const query = {};
        if (username) query.username = username;
        if (phone) query.phone = phone;

        // If both present, use $or
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

        // Create token containing user id, username, and role
        const token = jwt.sign({ id: user._id, username: user.username, role: user.role }, process.env.SECRET_KEY, { expiresIn: '24h' });

        // Set cookie with token
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('launion', token, {
            maxAge: 24 * 60 * 60 * 1000, // 24 hours
            httpOnly: false, // Set to false so the frontend can read it if needed
            secure: isProduction, // Cookies must be secure if SameSite=None
            sameSite: isProduction ? 'none' : 'lax'
        });

        res.json({ token });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /verify: Verify if user is authenticated and return user info
router.get('/verify', verifyToken, async (req, res) => {
    try {
        // Fetch full user from DB to include avatar and other fields not in token
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

// POST /logout: Clear the authentication cookie
router.post('/logout', (req, res) => {
    res.clearCookie('launion', {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    });
    res.json({ message: 'Logged out successfully' });
});

// POST /users/change-password: Change user password
router.post('/users/change-password', verifyToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: 'Current and new password are required' });
        }

        const user = await db.findOne({ _id: req.user.id });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'La contraseña actual es incorrecta' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.SALT_ROUNDS));

        // Update password
        await db.update({ _id: req.user.id }, { $set: { password: hashedPassword } });
        db.persistence.compactDatafile();

        res.json({ message: 'Contraseña actualizada correctamente' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /users: Read all users
router.get('/users', verifyToken, async (req, res) => {
    try {
        // Exclude passwords from the results
        const users = await db.find({}, { password: 0 });
        res.json(users);
    } catch (error) {
        console.error('Fetch users error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /users/:id: Read one user
router.get('/users/:id', verifyToken, async (req, res) => {
    try {
        const user = await db.findOne({ _id: req.params.id }, { password: 0 });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        console.error('Fetch user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// GET /users/:id/avatar: Serve user avatar image directly
router.get('/users/:id/avatar', async (req, res) => {
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
        console.error('Fetch avatar error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// PUT /users/:id: Update user
router.put('/users/:id', verifyToken, upload.single('avatar'), resizeImage, async (req, res) => {
    try {
        const { username, password, status } = req.body;
        const updateData = {};

        if (username) updateData.username = username;
        if (password) {
            updateData.password = await bcrypt.hash(password, parseInt(process.env.SALT_ROUNDS));
        }
        if (status) {
            updateData.status = status;
        }
        if (req.file) {
            updateData.avatar = req.file.path;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No update data provided' });
        }

        const numReplaced = await db.update({ _id: req.params.id }, { $set: updateData });

        // Compact database to remove old versions of the record from the file
        db.persistence.compactDatafile();

        if (numReplaced === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const updatedUser = await db.findOne({ _id: req.params.id }, { password: 0 });
        res.json(updatedUser);

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// DELETE /users/:id: Delete user
router.delete('/users/:id', verifyToken, async (req, res) => {
    try {
        const numRemoved = await db.remove({ _id: req.params.id }, {});
        if (numRemoved === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

export default router;
