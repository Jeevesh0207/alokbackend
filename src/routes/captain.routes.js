import { Router } from 'express';
import { authCaptain } from '../middlewares/auth.middlewares.js';
import { registerCaptain, verifyEmailAndLogin,loginCaptain, getCaptainProfile, refreshAccessToken, updateCaptainProfile, forgotPassword, resetPassword,changePassword, logoutCaptain } from '../controllers/captain.controller.js'

const router = Router();

router.post('/register',  registerCaptain);

router.get('/verify-email', verifyEmailAndLogin,  registerCaptain);

router.post('/login', loginCaptain);

router.get('/profile', authCaptain, getCaptainProfile)

router.get('/refresh-token', refreshAccessToken)

// Not Completed
router.patch('/update-profile', authCaptain, updateCaptainProfile) 

router.post('/forgot-password', forgotPassword)

router.patch('/reset-password', resetPassword)

// Not Completed
router.patch('/change-password', changePassword) 

router.get('/logout', authCaptain, logoutCaptain)


export default router;