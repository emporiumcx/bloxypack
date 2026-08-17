const path = require('path');
const express = require('express');
const http = require('http');
const hpp = require('hpp');
const cors = require('cors');
const socket = require('socket.io');
require('dotenv').config();

// Default frontend URL if not specified in environment
const frontendUrl = process.env.SERVER_FRONTEND_URL || 'http://localhost:3000';
const frontendUrls = frontendUrl.includes(',') ? frontendUrl.split(',') : [frontendUrl];

// Init express app & create http server
const app = express();
const server = http.createServer(app);

// Create socket server
const io = socket(server, {
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
    cors: {
        origin: frontendUrls,
        credentials: true
    }
});

// Load database
require('./database')();

// Init page settings
require('./utils/setting').settingInitDatabase();

// Enable if you are behind a reverse proxy
app.set('trust proxy', 1);

// Set other middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(cors({
    origin: frontendUrls,
    credentials: true
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '/views'));

// Mount routes
app.use('/', require('./routes')(io));
app.use('/public', express.static(path.join(__dirname, 'public')));

// Mount sockets
require('./sockets')(io);

// Set app port
const PORT = process.env.SERVER_PORT || 5000;

server.listen(PORT, () => console.log(`WildPVP server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}. URLS: ${frontendUrls.join(', ')}`));
