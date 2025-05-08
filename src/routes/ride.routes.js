import { Router } from "express";
import { authUser, authCaptain } from '../middlewares/auth.middlewares.js'
import { getFare, createRide, acceptRide, startRide, endRide } from '../controllers/ride.controller.js'

const router = Router();

router.get('/get-fare', authUser, getFare);

router.post('/create', authUser, createRide);

router.post('/accept-ride', authCaptain, acceptRide);

router.get('/start-ride', authCaptain, startRide);

router.post('/end-ride', authCaptain, endRide);


export default router;