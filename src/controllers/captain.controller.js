import {z} from 'zod';
import jwt from 'jsonwebtoken'
import Captain from '../models/captain.model.js';
import BlacklistToken from '../models/blacklistToken.model.js';
import { createCaptain, forgotPasswordEmail, sendVerificationEmail, generateAccessAndRefreshToken } from '../services/captain.service.js';

async function registerCaptain(req,res){
  try{
    const captainSchema = z.object({
      fullname: z.string().min(3, {message: "Full name is required"}),
      email: z.string().email({message: "Invalid email format"}).optional(),
      password: z.string().min(6, {message: "Password must be at least 6 characters long"}),
      vehicleColor: z.string().min(3, {message: 'Vehicle Color must be atleast 3 characters long'}),
      vehicleCapacity: z.number().min(1,{message: 'Vehicle Capacity must be atleast 1'}),
      vehicleType: z.enum(['car', 'motorcycle', 'auto']),
      vehicleModel: z.string().optional(),
      vehiclePlate: z.string().min(4,{message: 'Vehicle Plate must be atleast 4 characters long'}),
    });

    const {fullname, email, phone, otp, password, vehicleColor, vehicleCapacity, vehicleType, vehicleModel, vehiclePlate} = req.body;
  
    /* Input Validation */
    const validateCaptain = captainSchema.parse({
      fullname,
      email,
      phone,
      otp,
      password,
      vehicleColor,
      vehicleCapacity, 
      vehicleType, 
      vehicleModel, 
      vehiclePlate
    });
    
    /* Check if Captain Already Exists */
    const captainExists = await Captain.findOne({email});
    if (captainExists?.isVerified === true) {
      res
      .status(409)
      .json({
        statusCode: 409,
        success: false,
        message: "Captain Already Exists. Please Login!"
      });
      return;
    }

    /* Registering Captain in Database */
    const captain = captainExists || await createCaptain({ 
      fullname, 
      email, 
      password,  
      vehicleColor, 
      vehicleCapacity, 
      vehicleType, 
      vehicleModel, 
      vehiclePlate
    });
    
    /* Generating Verification Token and Send Email */
    const verificationToken = captain.generateVerificationToken();

    await sendVerificationEmail(fullname, email, verificationToken);

    return res
    .status(201)
    .json({
      statusCode: 201,
      success: true,
      message: "Captain Registered Successfully. Please Verify your email",
    });
  }catch(error){
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
      message: "Something went wrong while registering Captain",
      error: error
    });
  }
}

async function verifyEmailAndLogin(req,res){
  try{
    const {token} = req.query;

    /* Decode token sent by Captain */
    const decodedToken = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);

    const captain = await Captain.findOne({
      _id: decodedToken._id,
      isVerified: false
    });

    if(!captain){
      res
      .status(403)
      .json({
        statusCode: 403,
        success: false,
        message: "Captain has already been verified",
      });
      return;
    }

    captain.isVerified = true;
    await captain.save();

    const loggedCaptain = await Captain.findOne(captain._id).select('-refreshToken -isVerified')

    if(!loggedCaptain){
      res
      .status(500)
      .json({
        statusCode: 500,
        success: false,
        message: "Something went wrong while logging Captain",
      });
      return;
    }

    /* Generating Access and Refresh Token */
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(loggedCaptain._id);

    const options = {
      httpOnly: true,
      secure: true
    }
    
    res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      statusCode: 200,
      success: true,
      data: {
        captain: loggedCaptain,
        refreshToken,
        accessToken
      },
      message: "Captain Verified and Logged in Successfully",
    });
  } catch(error){
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
      message: "Something went wrong while verifying Captain",
      error: error
    });
  }
}

/* Login captain with Email or Phone */
async function loginCaptain(req,res){
  try{
    const captainSchema = z.object({
      email: z.string().email({message: "Invalid email format"}).optional(),
      phone: z.string().regex(/^\d{10}$/, {message: "Phone number must be exactly 10 digits"}).optional(),
      password: z.string().min(6, {message: "Password must be at least 6 characters long"}),
    }).refine((data) => data.email || data.phone, {
      message: "Either email or phone must be provided",
      path: ["email", "phone"],
    });

    const { email, phone, password } = req.body;

    /* Input Validation */
    const validateCaptain = captainSchema.parse({
      email,
      phone,
      password
    });
    
    const identifier = email ? { email } : { phone };
    
    /* Searching Captain in Captain Table */
    const captain = await Captain.findOne({
      ...identifier,
      isVerified: true
    }).select('+password');
    
    if (!captain) {
      res
      .status(403)
      .json({
        statusCode: 403,
        success: false,
        message: "Invalid Credentials"
      });
      return;
    }
    
    /* Validating Captain Password */
    const isPasswordValid = await captain.comparePassword(password);

    if(!isPasswordValid){
      res
      .status(403)
      .json({
        statusCode: 403,
        success: false,
        message: "Invalid Credentials"
      });
      return;
    }

    const loggedCaptain = await Captain.findOne(captain._id).select('-password -refreshToken')

    if(!loggedCaptain){
      res
      .status(500)
      .json({
        statusCode: 500,
        success: false,
        message: "Something went wrong while logging Captain",
      });
      return;
    }

    /* Generating Access and Refresh Token */
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(loggedCaptain._id);

    const options = {
      httpOnly: true,
      secure: true
    }

    res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      statusCode: 200,
      success: true,
      data: {
        captain: loggedCaptain,
        refreshToken,
        accessToken
      },
      message: "Captain Logged in Successfully",
    });
  }catch(error){
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
      message: "Something went wrong while logging Captain",
      error: error
    });
  }
}

/* Returns Captain Profile */
async function getCaptainProfile(req,res){
  res
  .status(200)
  .json({
    statusCode: 200,
    success: true,
    data: {
      captain: req.captain
    },
    message: "Fetched Captain profile successfully"
  });
}

async function refreshAccessToken(req,res) {
  const token = req.cookies?.refreshToken || req.header('Authorization')?.replace('Bearer ', '');

  if(!token){
    res
    .status(401)
    .json({
      statusCode: 401,
      success: false,
      message: "Unauthorized Request",
    });
    return;
  }

  try{
    const decodedToken = jwt.verify(token, process.env.CAPTAIN_REFRESH_TOKEN_SECRET);

    const captain = await  Captain.findById(decodedToken?._id).select('+refreshToken');

    if(!captain || captain.refreshToken !== token){
      res
      .status(401)
      .json({
        statusCode: 401,
        success: false,
        message: "Invalid Refresh Token",
      });
      return;
    }

    const loggedCaptain = await Captain.findOne(captain._id).select('-password -refreshToken')

    if(!loggedCaptain){
      res
      .status(500)
      .json({
        statusCode: 500,
        success: false,
        message: "Something went wrong while logging Captain",
      });
      return;
    }

    /* Generating Access and Refresh Token */
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(captain._id);

    const options = {
      httpOnly: true,
      secure: true
    }
        
    res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      statusCode: 200,
      success: true,
      data: {
        captain: loggedCaptain,
        refreshToken,
        accessToken
      },
      message: "Captain token refreshed successfully",
    });
  } catch(error){
    res
    .status(500)
    .json({
      statusCode: 500,
      success: false,
      message: "Something went wrong while refreshing token",
      error: error
    });
  }
}

async function updateCaptainProfile(req,res){
  // 
}

async function forgotPassword(req,res){
  try{
    const captainSchema = z.object({
      email: z.string().email({message: "Invalid email format"}).optional(),
      phone: z.string().regex(/^\d{10}$/, {message: "Phone number must be exactly 10 digits"}).optional(),
    }).refine((data) => data.email || data.phone, {
      message: "Either email or phone must be provided",
      path: ["email", "phone"],
    });
  
    const {email, phone} = req.body;

    /* Input Validation */
    const validateCaptain = captainSchema.parse({
      email,
      phone
    });
    const identifier = email ? { email } : { phone };
    
    /* Searching Captain in Captain Table */
    const captain = await Captain.findOne({
      ...identifier,
      isVerified: true
    });

    if(!captain){
      res
      .status(404)
      .json({
        statusCode: 404,
        success: false,
        message: "Captain Not Found",
      });
      return;
    }
    
    /* Generating Verification Token and Send Email */
    const verificationToken = captain.generateVerificationToken();

    await forgotPasswordEmail(captain.fullname, captain.email, verificationToken);

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      message: "Reset Password e-mail successfully sent to captain",
    });
    
  }catch(error){
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
      message: "Something went wrong while sending reset password mail",
      error: error
    });
  }
}

async function resetPassword(req,res){
  try{
    const passwordSchema = z.object({
      password: z.string().min(6, {message: "Password must be at least 6 characters long"}),
    });

    const {token} = req.query;
    const {password} = req.body;

    /* Input Validation */
    const validatePassword = passwordSchema.parse({
      password
    });

    if(!token){
      res
      .status(401)
      .json({
        statusCode: 401,
        success: false,
        message: "Unauthorized Request",
      });
      return;
    }

    /* Check if Token is not Blacklisted */
    const isBlacklisted = await BlacklistToken.findOne({token});
  
    if(isBlacklisted){
      res
      .status(401)
      .json({
        statusCode: 401,
        success: false,
        message: "Unauthorized Request",
      });
      return;
    }
  
    const decodedToken = jwt.verify(token,process.env.VERIFICATION_TOKEN_SECRET);

    /* Reset Password */
    const captain = await Captain.findById(decodedToken._id);

    if(captain){
      captain.password = password;
      captain.refreshToken = undefined;
      await captain.save();
    }

    /* Blacklist Token */
    await BlacklistToken.create({
      token
    });

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      message: "Password Changed Successfully",
    });
  }catch(error){
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
      message: "Something went wrong while Changing Password",
      error: error
    });
  }
}

async function changePassword(req,res){
  // 
}

async function logoutCaptain(req,res){
  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
  
  /* Blacklist Access Token */
  await BlacklistToken.create({
    token
  });

  /* Unset Refresh token in Captain Model */
  await Captain.findByIdAndUpdate(
    req.captain._id,
    {
      $unset:{
        refreshToken: 1
      }
    }
  );

  const options = {
    httpOnly: true,
    secure: true
  }

  return res
  .status(200)
  .clearCookie('accessToken', options)
  .clearCookie('refreshToken', options)
  .json({
    statusCode: 200,
    success: true,
    message: "Captain logged out successfully",
  })
}

export {
  registerCaptain, 
  verifyEmailAndLogin,
  loginCaptain, 
  getCaptainProfile, 
  refreshAccessToken,
  updateCaptainProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  logoutCaptain
}