import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const captainSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      minlength: [3, 'Full name must be atleast 3 characters']
    },
    email: {
      type: String,
      unique: true,
      lowercase: true,
      minlength: [5, 'Email must be atleast 5 characters long']
    },
    phone:{
      type: String,
      unique: true,
      minlength: [10, 'Phone must be atleast 10 characters long']
    },
    password:{
      type: String,
      required: true,
      minlength: [6, 'Password must be atleast 6 characters long'],
      maxlength: [50, 'Password can be atmost 50 characters long'],
      select: false
    },
    avatarImage:{
      type: String
    },
    vehicle:{
      color: {
        type: String,
        required: true,
        minlength: [3, 'Color must be atleast 3 characters']
      },
      capacity:{
        type: Number,
        required: true,
        min: [1, 'Capacity must be at least 1']
      },
      type:{
        type: String,
        required: true,
        enum: ['car', 'motorcycle', 'auto']
      },
      model:{
        type: String
      },
      plate:{
        type: String,
        required: true,
        minlength: [3, 'Plate must be at least 4 characters']
      }
    },
    isVerified:{
      type: Boolean,
      default: false,
      // select: false
    },
    location:{
      ltd: {
        type: Number
      },
      lng: {
        type: Number
      }
    },
    status:{
      type: String,
      enum: ['active', 'inactive'],
      default: 'inactive'
    },
    socketId: {
      type: String,
    },
    refreshToken:{
      type: String,
      select: false
    }
  },
  {
    timestamps: true
  }
);

captainSchema.pre('save', async function(next){
  if(!this.isModified('password')) return;

  this.password = await bcryptjs.hash(this.password, 12);
  next();
})

captainSchema.methods.comparePassword = async function(password){
  return await bcryptjs.compare(password, this.password);
}

captainSchema.methods.generateAccessToken = function(){
  return jwt.sign(
    {
      _id: this._id,
      email: this.email
    },
    process.env.CAPTAIN_ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.CAPTAIN_ACCESS_TOKEN_EXPIRY
    }
  )
}

captainSchema.methods.generateRefreshToken = function(){
  return jwt.sign(
    {
      _id: this._id,
      email: this.email
    },
    process.env.CAPTAIN_REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.CAPTAIN_REFRESH_TOKEN_EXPIRY
    }
  )
}

captainSchema.methods.generateVerificationToken = function(){
  return jwt.sign(
    {
      _id: this._id,
      email: this.email
    },
    process.env.VERIFICATION_TOKEN_SECRET,
    {
      expiresIn: process.env.VERIFICATION_TOKEN_EXPIRY
    }
  )
}

const Captain = mongoose.model('Captain', captainSchema);

export default Captain;
