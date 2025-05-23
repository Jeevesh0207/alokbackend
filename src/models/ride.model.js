import mongoose from 'mongoose'

const rideSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  captain: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Captain'
  },
  pickup: {
    type: String,
    required: true
  },
  destination: {
    type: String,
    required: true
  },
  fare: {
    type: Number,
    required: true
  },
  otp:{
    type: String,
    required: true,
    select: false
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'ongoing', 'completed', 'cancelled'],
    default: 'pending',
  },
  duration: {
    type: Number
  },
  distance: {
    type: Number,
  },
  paymentMode: {
    type: String,
    enum: ['cash', 'upi', 'debit-card'],
    default: 'cash'
  },
  paymentID: {
    type: String,
  },
  orderId: {
    type: String
  },
  signature: {
    type: String
  }
});


const Ride = mongoose.model('Ride', rideSchema);

export default Ride