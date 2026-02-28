import jwt from 'jsonwebtoken';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

// Environment variable will be used dynamically below

export const verifyToken = (req, res, next) => {
    let token = null;

    // Check for Authorization header
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    // Fallback to cookie
    else if (req.cookies && req.cookies.launion) {
        token = req.cookies.launion;
    }

    if (!token) {
        return res.status(401).json({ message: 'No token provided or invalid format' });
    }

    jwt.verify(token, process.env.SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Failed to authenticate token' });
        }

        // Save decoded user info for use in other routes
        req.user = decoded;
        next();
    });
};

export const resizeImage = async (req, res, next) => {
    if (!req.file) {
        return next();
    }

    try {
        const filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}.webp`;
        const filepath = path.join('uploads', filename);

        // Ensure uploads directory exists
        if (!fs.existsSync('uploads')) {
            fs.mkdirSync('uploads', { recursive: true });
        }

        // Resize, convert to webp (for smaller size), and save
        await sharp(req.file.buffer)
            .resize(250, 250, {
                fit: sharp.fit.inside,
                withoutEnlargement: true
            })
            .webp({ quality: 80 })
            .toFile(filepath);

        // Update req.file so subsequent middlewares/routes use the new path
        req.file.path = filepath;
        req.file.filename = filename;
        req.file.mimetype = 'image/webp';

        next();
    } catch (error) {
        console.error('Error processing image:', error);
        return res.status(500).json({ message: 'Error processing uploaded image' });
    }
};
