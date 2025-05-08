import {z} from 'zod';
import { Schema } from 'mongoose';
import Ride from '../models/ride.model.js'
import { getAddressCoordinates, getCaptainsInRadius } from '../services/map.service.js';
import { getFareService, createRideService, acceptRideService, startRideService, endRideService } from '../services/ride.service.js';
import { sendMessageToSocketId } from '../../socket.js';

async function getFare(req,res){
  try {
    const rideSchema = z.object({
      pickup: z.string().min(3, {message: "Pickup must be atleast 3 characters long"}),
      destination: z.string().min(3, {message: "Pickup must be atleast 3 characters long"})
    });

    const {pickup, destination} = req.query;

    /* Input Validation */
    const validateInput = rideSchema.parse({
      pickup,
      destination
    });
  
    const data = await getFareService(pickup, destination);
    
    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      data: {
        fare : {
          auto: data.auto,
          car: data.car,
          motorcycle: data.motorcycle
        },
        distance: data.distance,
        duration: data.duration 
      },
      message: "Fare fetched successfully"
    });
  } catch (error) {
    console.log(error);
    if(error instanceof z.ZodError){
      res
      .status(400)
      .json({
        statusCode: 400,
        success: false,
        message: "Validation Error",
        error: error
      });
      return;
    }
    
    res
    .status(500)
    .json({
      statusCode: 500,
      success: false,
      message: "Something went wrong while fetching fare",
      error: error
    });
  }
}

async function createRide(req,res){
  try {
    const rideSchema = z.object({
      pickup: z.string().min(3, {message: "Pickup must be atleast 3 characters long"}),
      destination: z.string().min(3, {message: "Pickup must be atleast 3 characters long"}),
      vehicleType: z.enum(['car', 'auto', 'motorcycle']),
      paymentMode: z.enum(['cash', 'upi', 'debit-card'])
    });
      
    const {pickup, destination, vehicleType, paymentMode} = req.body;

    /* Input Validation */
    const validateRide = rideSchema.parse({
      pickup,
      destination,
      vehicleType,
      paymentMode
    });

    const ride = await createRideService({
      user: req.user._id,
      pickup,
      destination,
      vehicleType,
      paymentMode
    });
    
    const pickupCoordinates = await getAddressCoordinates(pickup);

    const captiansInRadius = await getCaptainsInRadius(pickupCoordinates.ltd, pickupCoordinates.lng, 100);

    const rideWithUser = await Ride.findOne({_id: ride._id}).populate('user');

    captiansInRadius.map(async (captain) => {
      sendMessageToSocketId(captain.socketId, {
        event: 'new-ride',
        data: rideWithUser
      });
    });

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      data: {
        ride
      },
      message: "Fetched User profile successfully"
    });

  } catch (error) {
    console.log(error);
    if(error instanceof z.ZodError){
      res
      .status(400)
      .json({
        statusCode: 400,
        success: false,
        message: "Validation Error",
        error: error
      });
      return;
    }
    
    res
    .status(500)
    .json({
      statusCode: 500,
      success: false,
      message: "Something went wrong while creating Ride",
      error: error
    });
  }
}

async function acceptRide(req, res){
  try {
    const inputSchema = z.object({
      rideId: z.string().min(3, {message: 'rideId must be atleast 3 characters long'})
    });

    const {rideId} = req.body; 

    /* Input Validation */
    const validateInput = inputSchema.parse({
      rideId
    });

    const ride = await acceptRideService({
      rideId,
      captain: req.captain
    });

    sendMessageToSocketId(ride.user.socketId,{
      event: 'ride-accepted',
      data: ride
    });

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      data: {
        ride
      },
      message: "Ride accepted successfully"
    });
  } catch (error) {
    console.log(error);
    if(error instanceof z.ZodError){
      res
      .status(400)
      .json({
        statusCode: 400,
        success: false,
        message: "Validation Error",
        error: error
      });
      return;
    }
    
    res
    .status(500)
    .json({
      statusCode: 500,
      success: false,
      message: "Something went wrong while accepting Ride",
      error: error
    });
  }
}

async function startRide(req, res){
  try {
    const inputSchema = z.object({
      rideId: z.string().min(3, {message: 'rideId must be atleast 3 characters long'}),
      otp: z.string().length(4, {message: "OTP must be exactly 4 characters long"})
    });

    const {rideId, otp} = req.query; 

    /* Input Validation */
    const validateInput = inputSchema.parse({
      rideId,
      otp
    });
    
    const ride = await startRideService({
      rideId,
      otp,
      captain: req.captain
    });

    sendMessageToSocketId(ride.user.socketId, {
      event: 'ride-started',
      data: ride
    });

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      data: {
        ride
      },
      message: "Ride started successfully"
    });
  } catch (error) {
    console.log(error);
    if(error instanceof z.ZodError){
      res
      .status(400)
      .json({
        statusCode: 400,
        success: false,
        message: "Validation Error",
        error: error
      });
      return;
    }
    
    res
    .status(500)
    .json({
      statusCode: 500,
      success: false,
      message: "Something went wrong while starting Ride",
      error: error
    });
  }
}

async function endRide(req, res){
  try {
    const inputSchema = z.object({
      rideId: z.string().min(3, {message: 'rideId must be atleast 3 characters long'})
    });

    const {rideId} = req.body; 

    /* Input Validation */
    const validateInput = inputSchema.parse({
      rideId
    });

    const ride = await endRideService({
      rideId,
      captain: req.captain
    });

    sendMessageToSocketId(ride.user.socketId, {
      event: 'ride-ended',
      data: ride
    });

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      data: {
        ride
      },
      message: "Ride ended successfully"
    });
  } catch (error) {
    console.log(error);
    if(error instanceof z.ZodError){
      res
      .status(400)
      .json({
        statusCode: 400,
        success: false,
        message: "Validation Error",
        error: error
      });
      return;
    }
    
    res
    .status(500)
    .json({
      statusCode: 500,
      success: false,
      message: "Something went wrong while finishing Ride",
      error: error
    });
  }
}


export {
  getFare,
  createRide, 
  acceptRide, 
  startRide, 
  endRide
}