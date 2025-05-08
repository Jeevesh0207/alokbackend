import { Server } from 'socket.io'
import User from './src/models/user.model.js';
import Captain from './src/models/captain.model.js';

let io;

function initializeSocket(server){
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join', async(data) => {
      const {userId, userType} = data;

      console.log(`User ${userId} joined as ${userType}`);

      if(userType === 'user'){
        await User.findByIdAndUpdate(userId, {socketId: socket.id});
      }
      else if(userType === 'captain'){
        await Captain.findByIdAndUpdate(userId, {socketId: socket.id});
      }
    });

    socket.on('update-captain-location', async (data) => {
      const {captainId, location} = data;

      if(!location || !location.ltd || !location.lng){
        return socket.emit('error', {
          message: 'Invalid Location data'
        });
      }
      
      await Captain.findByIdAndUpdate(captainId, 
        {
          location: {
            ltd: location.ltd,
            lng: location.lng
          }
        }
      );
    });

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
    
    socket.on('error', (error) => {
      console.log(`Socket error: ${error}`);
    });
  });
}

function sendMessageToSocketId(socketId, messageObject){
  if(io){
    const {event, data} = messageObject;
    io.to(socketId).emit(event,data);
  }
  else{
    console.log('Socket.io not initialized');
  }
}

export {
  initializeSocket,
  sendMessageToSocketId
}