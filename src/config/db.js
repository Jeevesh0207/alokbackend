import mongoose from 'mongoose'

async function connectDB(){
  try{
    const connectionInstance = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.DB_NAME
    });

    console.log(`MongoDB Connected !! DB HOST: ${connectionInstance.connection.host}`);
  } catch(err){
    console.log(`MongoDB Connection Failed: ${err}`);
    process.exit(1);
  }
}

export default connectDB;