import { Router } from "express";
import { authUser } from '../middlewares/auth.middlewares.js';
import { getCoordinates, getDistanceTime, getSuggestions, reverseGeocode } from '../controllers/map.controller.js'

const router = Router();

router.get('/get-coordinates', authUser, getCoordinates);

router.get('/get-distanceTime', authUser, getDistanceTime);

router.get('/get-suggestions', authUser, getSuggestions);

router.get('/reverse-geocode', authUser, reverseGeocode);


export default router;