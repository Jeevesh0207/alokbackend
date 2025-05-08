import dotenv from 'dotenv';
dotenv.config();

import http from 'http';
import {app} from './src/app.js';
import connectDB from './src/config/db.js';
import {initializeSocket} from './socket.js';


connectDB().then(() => {
  const PORT = process.env.PORT || 8000;
  const server = http.createServer(app);

  initializeSocket(server);

  server.listen(PORT, () => {
    console.log(`Server is listening on port: ${PORT}`);
  });
}).catch((err) => {
  console.log(`MongoDB Connection Failed!!! ${err}`);
});