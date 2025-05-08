import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';
import Captain from '../models/captain.model.js';
import BlacklistToken from '../models/blacklistToken.model.js';

async function authUser(req,res,next){
  try{
    const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');

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

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    const user = await User.findById(decodedToken?._id).select('-password -refreshToken');

    if(!user){
      res
      .status(401)
      .json({
        statusCode: 401,
        success: false,
        message: "Invalid Access Token",
      })
      return;
    }

    req.user = user;
    next();
  } catch(error){
    res
    .status(401)
    .json({
      statusCode: 401,
      success: false,
      message: "Invalid Access Token",
      error: error
    });
    return;
  }
}

async function authCaptain(req,res,next){
  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
  
  if(!token){
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: "Unauthorized Request",
    });
  }
  
  const isBlacklisted = await BlacklistToken.findOne({token});

  if(isBlacklisted){
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: "Unauthorized Request",
    })
  }

  try{
    const decodedToken = jwt.verify(token, process.env.CAPTAIN_ACCESS_TOKEN_SECRET);

    const captain = await Captain.findById(decodedToken?._id).select('-password -refreshToken');

    if(!captain){
      return res.status(401).json({
        statusCode: 401,
        success: false,
        message: "Invalid Access Token",
      })
    }

    req.captain = captain;
    next();
  } catch(err){
    return res.status(401).json({
      statusCode: 401,
      success: false,
      message: "Invalid Access Token",
      error: err
    })
  }
}

export {
  authUser,
  authCaptain
}