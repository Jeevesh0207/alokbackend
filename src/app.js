import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { rateLimit } from 'express-rate-limit'

const app = express();

const limiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	limit: 50, // Limit each IP to 50 requests per `window`
	standardHeaders: 'draft-8',
	legacyHeaders: false,
})

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true 
}));

app.use(express.json({limit:"16kb"}));
app.use(express.urlencoded({extended: true, limit: "16kb"}));
app.use(express.static('public'));
app.use(cookieParser());
// app.use(limiter);


// Import Routes
import userRouter from './routes/user.routes.js';
import captainRouter from './routes/captain.routes.js';
import mapRouter from './routes/map.routes.js'
import rideRouter from './routes/ride.routes.js';

// Using Routes
app.use('/api/v1/user', userRouter);
app.use('/api/v1/captain', captainRouter);
app.use('/api/v1/map', mapRouter);
app.use('/api/v1/ride', rideRouter);


export {app};