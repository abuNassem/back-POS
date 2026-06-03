import express from 'express';
import { authUser, logoutUser, registerUser } from './userControlar.js';

const router = express.Router();

// مسار إنشاء الحساب
router.post('/register', registerUser);

// مسار تسجيل الدخول
router.post('/login', authUser);

// مسار تسجيل الخروج
router.post('/logout', logoutUser);

export default router;