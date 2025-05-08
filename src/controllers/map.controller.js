import { z } from 'zod';
import { getAddressCoordinates, getDistanceAndTime, getInputSuggestions, reverseGeocoding } from '../services/map.service.js'

async function getCoordinates(req,res) {
  try {
    const addressSchema = z.object({
      address: z.string().min(3, "Address must be atleast 3 characters long")
    });
  
    const { address } = req.query;
    
    /* Input Validation */
    const validateAddress = addressSchema.parse({
      address
    });

    /* Getting Coordinates */
    const coordinates = await getAddressCoordinates(address);

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      data: {
        coordinates
      },
      message: "Coordinates Fetched Successfully",
    });
  } catch (error) {
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
      message: "Something went wrong while fetching coordinates",
      error: error
    });
  }
}

async function getDistanceTime(req,res) {
  try{
    const pathSchema = z.object({
      pickup: z.string().min(3, "Pickup must be atleast 3 characters long"),
      destination: z.string().min(3, "Destination must be atleast 3 characters long"),
    });

    const { pickup, destination } = req.query;

    /* Input Validation */
    const validateInput = pathSchema.parse({
      pickup,
      destination
    });

    const distanceTime = await getDistanceAndTime(pickup, destination);

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      data: {
        distance: distanceTime.distance,
        duration: distanceTime.duration
      },
      message: "Data fetched successfully",
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
      message: "Couldn't find Distance and Time between given points",
      error: error
    });
  }
}

async function getSuggestions(req,res) {
  try{
    const inputSchema = z.object({
      input: z.string().min(3,'Input must be atleast 3 characters long')
    });

    const { input } = req.query;

    /* Input Validation */
    const validateInput = inputSchema.parse({
      input
    })

    const suggestions = await getInputSuggestions(input);

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      data: {
        suggestions
      },
      message: "Suggestions fetched successfully",
    });
  } catch (error){
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
      message: "No Suggestions Found",
      error: error
    });
  }
}

async function reverseGeocode(req,res) {
  try{
    const inputSchema = z.object({
      input: z.string().min(3, "Input must be atleast 5 characters long"),
    });

    const { input } = req.query;

    /* Input Validation */
    const validateInput= inputSchema.parse({
      input
    });

    const address = await reverseGeocoding(input);

    res
    .status(200)
    .json({
      statusCode: 200,
      success: true,
      data: {
        address
      },
      message: "Data fetched successfully",
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
      message: "Couldn't find reverse Geocode of given points",
      error: error
    });
  }
}


export { 
  getCoordinates, 
  getDistanceTime, 
  getSuggestions,
  reverseGeocode
}