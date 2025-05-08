import nodemailer from 'nodemailer';

export default async function mailSender(email,title,body){
  try {
    let transporter = nodemailer.createTransport({
      service: 'Gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS
      }
    });
    
    const mailOptions = {
      from: 'ridebook20f@gmail.com',
      to: email,
      subject: title,
      html: body
    };
  
    // transporter.sendMail(mailOptions, (error, info) => {
    //   if (error) {
    //     console.error("Error sending email: ", error);
    //   } else {
    //     console.log("Email sent: ", info.response);
    //   }
    // });
    return await new Promise((resolve, reject) => {
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Error sending email: ", error);
          reject(error);
        } else {
          console.log("Email sent: ", info.response);
          resolve(info);
        }
      });
    });
  } catch (error) {
    throw new Error(`Mail sender failed: ${error.message}`);
  }
}