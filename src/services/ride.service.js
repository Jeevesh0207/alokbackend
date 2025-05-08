import crypto from 'crypto';
import Ride from '../models/ride.model.js';
import { getDistanceAndTime } from './map.service.js';

function getOTP(num){
  const otp = crypto.randomInt(Math.pow(10,num-1), Math.pow(10,num)).toString();

  return otp;
}

async function getFareService(pickup, destination){
  if(!pickup || !destination){
    throw new Error('Pickup and Destination are required');
  }

  const distanceTime = await getDistanceAndTime(pickup, destination);

  const baseFare = {
    auto: 25,
    motorcycle: 20,
    car: 50,
  };

  const perKmRate = {
    auto: 4,
    motorcycle: 2.5,
    car: 10,
  };

  const perMinRate = {
    auto: 2.5,
    motorcycle: 2.1,
    car: 4.3,
  };

  const fare = {
    car: Math.round(baseFare.car + ((distanceTime.distance.value / 1000) * perKmRate.car) + ((distanceTime.duration.value / 60) * perMinRate.car)),
    auto: Math.round(baseFare.auto + ((distanceTime.distance.value / 1000) * perKmRate.auto) + ((distanceTime.duration.value / 60) * perMinRate.auto)),
    motorcycle: Math.round(baseFare.motorcycle + ((distanceTime.distance.value / 1000) * perKmRate.motorcycle) + ((distanceTime.duration.value / 60) * perMinRate.motorcycle))
  }
  return {
    ...fare, 
    distance: distanceTime.distance.text,
    duration: distanceTime.duration.text
  };
}

async function createRideService({user, pickup, destination, vehicleType, paymentMode}){
  if(!user || !pickup || !destination || !vehicleType || !paymentMode){
    throw new Error('User, Pickup, Destination, VehicleType and paymentMode fields are required.')
  }

  const fare = await getFareService(pickup, destination);

  const ride = Ride.create({
    user,
    pickup,
    destination,
    vehicleType,
    paymentMode,
    otp: getOTP(4),
    fare: fare[vehicleType]
  });

  return ride;
}

async function acceptRideService({rideId, captain}) {
  if(!rideId){
    throw new Error('Invalid Input');
  }

  await Ride.findOneAndUpdate(
    {
      _id: rideId,
      status: 'pending'
    },
    {
      status: 'accepted',
      captain: captain._id
    }
  );

  const ride = await Ride.findOne({
    _id: rideId,
    status: 'accepted'
  }).populate('user').populate('captain');

  if(!ride){
    throw new Error('Ride not Found')
  }

  return ride;
}

async function startRideService({rideId, otp, captain}){
  if(!rideId || !otp){
    throw new Error('rideId and OTP are required');
  }

  const ride = await Ride.findOne({
    _id: rideId,
    status: 'accepted',
    captain
  }).populate('user')
  .populate('captain')
  .select('+otp');

  if(!ride){
    throw new Error('Ride not Found');
  }

  if(ride.otp !== otp){
    throw new Error('Invalid OTP');
  }

  await Ride.findByIdAndUpdate(
    {
      _id: rideId
    },
    {
      status: 'ongoing'
    }
  );

  return ride;
}

async function endRideService({rideId, captain}) {
  if(!rideId){
    throw new Error('Ride ID is required');
  }

  const ride = await Ride.findOne({
    _id: rideId,
    captain: captain._id,
    status: 'ongoing'
  }).populate('user')
  .populate('captain');

  if(!ride){
    throw new Error('Ride not Found');
  }

  await Ride.findOneAndUpdate(
    {
      _id: rideId
    },
    {
      status: 'completed'
    }
  );

  return ride;
}


export { 
  getFareService, 
  createRideService, 
  acceptRideService, 
  startRideService, 
  endRideService 
}