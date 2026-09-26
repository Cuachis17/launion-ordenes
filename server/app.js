import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import verifyRoutes from './routes.js';
import tarifasRoutes from './tarifas/routes.js';

dotenv.config();
const PORT = process.env.PORT || 3000;

const app = express();

const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.replace(/['"]/g, '').split(',').map(origin => origin.trim())
    : [];
app.use(cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(cookieParser());

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use('/api', verifyRoutes);
app.use('/api/tarifas', tarifasRoutes);

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
