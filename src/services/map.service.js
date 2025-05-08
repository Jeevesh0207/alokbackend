import axios from 'axios';
import Captain from '../models/captain.model.js';

async function getAddressCoordinates(address){
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    
    const response = await axios.get(url);

    if(response.data.status === 'OK'){
      const location = response.data.results[0].geometry.location;

      return {
        ltd: location.lat,
        lng: location.lng
      }
    }
    else{
      throw new Error('Something went wrong while fetching coordinates');
    }
  } catch (err) {
    throw err;
  }
}

async function reverseGeocoding(input){
  if(!input){
    throw new Error('String containing the latitude/longitude is required');
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${input}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if(response.data.status === 'OK'){
      const data = response.data;

      if(data.status === 'ZERO_RESULTS'){
        throw new Error('No Route Found');
      }

      return data.plus_code.compound_code;
    }
    else{
      throw new Error('Something went wrong while fetching address');
    }
  } catch(err){
    throw err;
  }
}

async function getDistanceAndTime(pickup, destination){
  if(!pickup || !destination){
    throw new Error('Pickup and Destination are required');
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(pickup)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    if(response.data.status === 'OK'){
      const data = response.data.rows[0].elements[0];

      if(data.status === 'ZERO_RESULTS'){
        throw new Error('No Route Found');
      }

      return data;
    }
    else{
      throw new Error('Something went wrong while fetching distance and time');
    }
  } catch(err){
    throw err;
  }
}

async function getInputSuggestions(input){
  if(!input){
    throw new Error('Input is required.');
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${input}&key=${apiKey}`;

  try{
    const response = await axios.get(url);
    if(response.data.status === 'OK'){
      return response.data.predictions;
    }
    else{
      throw new Error('Unable to fetch suggesstions');
    }
  }catch (err){
    throw err;
  }
}

async function getDistanceBetweenCoordinates(pickup, destination){
  const R = 6371;

  const lat1Rad = (pickup.ltd * Math.PI) / 180;
  const lon1Rad = (pickup.lng * Math.PI) / 180;
  const lat2Rad = (pickup.ltd * Math.PI) / 180;
  const lon2Rad = (pickup.lng * Math.PI) / 180;

  // Difference in Coordinates
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  // Haversine Formula
  const a = Math.sin(dLat / 2)*Math.sin(dLat / 2) + Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  // Calculate Distance in kilometers
  const distance = R*c;

  return Number(distance.toFixed(2));
}

async function getCaptainsInRadius(ltd,lng,radius){
  if(!ltd || !lng || !radius){
    throw new Error('Latitude, Longitude and Radius are required');
  }

  try{
    const captains = await Captain.find({
      location: {
        $geoWithin: {
          $centerSphere: [[ltd, lng], radius / 6371]
        }
      }
     });

    return captains;
  }catch(err){
    throw err;
  }
}


export {
  getAddressCoordinates,
  getDistanceAndTime,
  getInputSuggestions,
  getCaptainsInRadius,
  reverseGeocoding
}