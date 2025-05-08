import mongoose from 'mongoose';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

const userSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      minlength: [3, 'Full name must be atleast 3 characters']
    },
    email: {
      type: String,
      unique: true,
      required: true,
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
    isVerified:{
      type: Boolean,
      default: false,
      // select: false
    },
    socketId: {
      type: String
    },
    refreshToken:{
      type: String,
      select: false
    }
  },
  {
    timestamps: true
  }
)

userSchema.pre('save', async function(next){
  if(!this.isModified('password')) return;

  this.password = await bcryptjs.hash(this.password, 12);
  next();
})

userSchema.methods.comparePassword = async function(password){
  return await bcryptjs.compare(password, this.password);
}

userSchema.methods.generateAccessToken = function(){
  return jwt.sign(
    {
      _id: this._id,
      email: this.email
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateRefreshToken = function(){
  return jwt.sign(
    {
      _id: this._id,
      email: this.email
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

userSchema.methods.generateVerificationToken = function(){
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

const User = mongoose.model('User', userSchema);

export default User;