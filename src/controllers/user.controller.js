import {z} from 'zod';
import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import BlacklistToken from '../models/blacklistToken.model.js';
import { createUser, forgotPasswordEmail, sendVerificationEmail, generateAccessAndRefreshToken } from '../services/user.service.js';

async function registerUser(req,res){
  try{
    const userSchema = z.object({
      fullname: z.string().min(3, {message: "Full name is required"}),
      email: z.string().email({message: "Invalid email format"}),
      password: z.string().min(6, {message: "Password must be at least 6 characters long"}),
    });
    
    const {fullname, email, password} = req.body;
    
    /* Input Validation */
    const validateUser = userSchema.parse({
      fullname,
      email,
      password
    });
    
    /* Check if User Already Exists */
    const userExists = await User.findOne({email});
    if (userExists?.isVerified === true) {
      res
      .status(409)
      .json({
        statusCode: 409,
        success: false,
        message: "User Already Exists. Please Login!"
      });
      return;
    }

    /* Registering User in Database */
    const user = userExists || await createUser({ fullname, email, password });
    
    /* Generating Verification Token and Send Email */
    const verificationToken = user.generateVerificationToken();

    await sendVerificationEmail(fullname, email, verificationToken);

    res
    .status(201)
    .json({
      statusCode: 201,
      success: true,
      message: "User registered successfully. Please verify your email",
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
      message: "Something went wrong while registering User",
      error: error.message
    });
  }
}

async function verifyEmailAndLogin(req,res){
  try{
    const {token} = req.query;

    /* Decode token sent by User */
    const decodedToken = jwt.verify(token, process.env.VERIFICATION_TOKEN_SECRET);
    
    const user = await User.findOne({
      _id: decodedToken._id,
      isVerified: false
    });
  
    if(!user){
      res
      .status(403)
      .json({
        statusCode: 403,
        success: false,
        message: "User has already been verified",
      });
      return;
    }
  
    user.isVerified = true;
    await user.save();
    
    const loggedUser = await User.findOne(user._id).select('-refreshToken -isVerified')

    if(!loggedUser){
      res
      .status(500)
      .json({
        statusCode: 500,
        success: false,
        message: "Something went wrong while logging User",
      });
      return;
    }

    /* Generating Access and Refresh Token */
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(loggedUser._id);

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
        user: loggedUser,
        refreshToken,
        accessToken
      },
      message: "User Verified and Logged in Successfully",
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
      message: "Something went wrong while verifying User",
      error: error
    });
  }
}

/* Login user with Email or Phone */
async function loginUser(req,res){
  try{
    const userSchema = z.object({
      email: z.string().email({message: "Invalid email format"}).optional(),
      phone: z.string().regex(/^\d{10}$/, {message: "Phone number must be exactly 10 digits"}).optional(),
      password: z.string().min(6, {message: "Password must be at least 6 characters long"}),
    }).refine((data) => data.email || data.phone, {
      message: "Either email or phone must be provided",
      path: ["email", "phone"],
    });
  
    const { email, phone, password } = req.body;

    /* Input Validation */
    const validateUser = userSchema.parse({
      email,
      phone,
      password
    });
    
    const identifier = email ? { email } : { phone };
    
    /* Searching User in User Table */
    const user = await User.findOne({
      ...identifier,
      isVerified: true
    }).select('+password');
    
    if (!user) {
      res
      .status(403)
      .json({
        statusCode: 403,
        success: false,
        message: "Invalid Credentials"
      });
      return;
    }
    
    /* Validating User Password */
    const isPasswordValid = await user.comparePassword(password);

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

    const loggedUser = await User.findOne(user._id).select('-password -refreshToken')

    if(!loggedUser){
      res
      .status(500)
      .json({
        statusCode: 500,
        success: false,
        message: "Something went wrong while logging User",
      });
      return;
    }
    
    /* Generating Access and Refresh Token */
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(loggedUser._id);

    const options = {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      path: '/'
    }
    
    res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json({
      statusCode: 200,
      success: true,
      data: {
        user: loggedUser,
        refreshToken,
        accessToken
      },
      message: "User Logged in Successfully",
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
      message: "Something went wrong while logging User",
      error: error
    });
  }
}

/* Returns User Profile */
async function getUserProfile(req,res){
  res
  .status(200)
  .json({
    statusCode: 200,
    success: true,
    data: {
      user: req.user
    },
    message: "Fetched User profile successfully"
  });
}

async function refreshAccessToken(req, res){
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
    const decodedToken = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);

    const user = await  User.findById(decodedToken?._id).select('+refreshToken');

    if(!user || user.refreshToken !== token){
      res
      .status(401)
      .json({
        statusCode: 401,
        success: false,
        message: "Invalid Refresh Token",
      });
      return;
    }

    const loggedUser = await User.findOne(user._id).select('-password -refreshToken')

    if(!loggedUser){
      res
      .status(500)
      .json({
        statusCode: 500,
        success: false,
        message: "Something went wrong while logging User",
      });
      return;
    }

    /* Generating Access and Refresh Token */
    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

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
        user: loggedUser,
        refreshToken,
        accessToken
      },
      message: "User token refreshed successfully",
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

async function updateUserProfile(req,res){
  // 
}

async function forgotPassword(req,res){
  try{
    const userSchema = z.object({
      email: z.string().email({message: "Invalid email format"}).optional(),
      phone: z.string().regex(/^\d{10}$/, {message: "Phone number must be exactly 10 digits"}).optional(),
    }).refine((data) => data.email || data.phone, {
      message: "Either email or phone must be provided",
      path: ["email", "phone"],
    });
  
    const {email, phone} = req.body;

    /* Input Validation */
    const validateUser = userSchema.parse({
      email,
      phone
    });
    const identifier = email ? { email } : { phone };
    
    /* Searching User in User Table */
    const user = await User.findOne({
      ...identifier,
      isVerified: true
    });

    if(!user){
      res
      .status(404)
      .json({
        statusCode: 404,
        success: false,
        message: "User Not Found",
      });
      return;
    }
    
    /* Generating Verification Token and Send Email */
    const verificationToken = user.generateVerificationToken();

    await forgotPasswordEmail(user.fullname, user.email, verificationToken);

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      message: "Reset Password e-mail successfully sent to user",
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
    const user = await User.findById(decodedToken._id);

    if(user){
      user.password = password;
      user.refreshToken = undefined;
      await user.save();
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

async function logoutUser(req,res){
  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
  
  /* Blacklist Access Token */
  await BlacklistToken.create({
    token
  });

  /* Unset Refresh token in User Model */
  await User.findByIdAndUpdate(
    req.user._id,
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

  res
  .status(200)
  .clearCookie('accessToken', options)
  .clearCookie('refreshToken', options)
  .json({
    statusCode: 200,
    success: true,
    message: "User logged out successfully",
  })
}


export {
  registerUser, 
  verifyEmailAndLogin,
  loginUser, 
  getUserProfile, 
  refreshAccessToken,
  updateUserProfile,
  forgotPassword,
  resetPassword,
  changePassword,
  logoutUser
}