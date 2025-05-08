import User from '../models/user.model.js'
import mailSender from '../utils/mailSender.js';

async function createUser({fullname, email, password}){
  try{
    const user = await User.create({
      fullname,
      email, 
      password,
      phone: '1234567890' 
    });
    return user; 
  }catch(err){
    throw Error(`Some error occured while creating User: ${err}`)
  }
}

async function generateAccessAndRefreshToken(id){
  try{
    const user = await User.findById({_id: id});

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return {accessToken,refreshToken};
  } catch(err){
    throw new Error(`Something went wrong while generating refresh and access token ${err}`)
  }
}

async function sendVerificationEmail(fullname, email, verificationToken){
  const firstName = fullname.split(' ')[0];
  const verificationLink = `${process.env.FRONTEND_URL}/validate-email?token=${verificationToken}`;

  try{
    const mailResponse = await mailSender(
      email,
      "Verify Your Email - Action Required",
      `Dear ${firstName},
      <p>
        Thank you for registering with RideBook App. To complete your registration, please verify your email address by clicking the link below:
      </p>

      <a href=${verificationLink}>Verify Email</a>

      <p>
        For security reasons, this link is valid only for 1 hour. If you do not verify within this time, you will need to request a new verification link.
      </p>

      <p>
      If you didn't request this, please ignore this email or contact our support team immediately.
      </p>
      
      <p>
      Regards,
      <br/>
      RideBook Team
      </p>`
    );
  } catch (err){
      throw new Error(`Something went wrong while sending email ${err}`);
  }
}

async function forgotPasswordEmail(fullname, email, verificationToken){
  const firstName = fullname.split(' ')[0];
  const resetPasswordLink = `${process.env.FRONTEND_URL}/reset-password?token=${verificationToken}`;

  try{
    const mailResponse = await mailSender(
      email,
      "Reset Your Password - Ride Book",
      `Dear ${firstName},
      <p>
        We received a request to reset your password for your Ride Book User account. Click the button below to set a new password:
      </p>

      <a href=${resetPasswordLink}>Reset Password</a>

      <p>
        For security reasons, this link is valid only for 1 hour. If you do not verify within this time, you will need to request a new verification link.
      </p>

      <p>
      If you didn't request this, please ignore this email or contact our support team immediately.
      </p>
      
      <p>
      Regards,
      <br/>
      RideBook Team
      </p>`
    );
  } catch (err){
      throw new Error(`Something went wrong while sending email ${err}`);
  }
}

export { 
  createUser, 
  forgotPasswordEmail,
  sendVerificationEmail,
  generateAccessAndRefreshToken
}