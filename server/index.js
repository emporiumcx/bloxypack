const path = require('path');
const express = require('express');
const http = require('http');
const hpp = require('hpp');
const cors = require('cors');
const socket = require('socket.io');
require('dotenv').config();

const frontendUrl = process.env.SERVER_FRONTEND_URL || 'http://localhost:3000';
const frontendUrls = frontendUrl.includes(',') ? frontendUrl.split(',') : [frontendUrl];

const app = express();
const server = http.createServer(app);

const io = socket(server, {
    transports: ['websocket', 'polling'],
    maxHttpBufferSize: 1e8,
    pingTimeout: 60000,
    cors: {
        origin: frontendUrls,
        credentials: true
    }
});

async function start() {
    await require('./database')();
    await require('./utils/setting').settingInitDatabase();

    app.set('trust proxy', 1);
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(hpp());
    app.use(cors({
        origin: frontendUrls,
        credentials: true
    }));

    app.set('view engine', 'ejs');
    app.set('views', path.join(__dirname, '/views'));

    app.use('/', require('./routes')(io));
    app.use('/public', express.static(path.join(__dirname, '/public')));

    require('./sockets')(io);

    const PORT = Number(process.env.PORT || process.env.SERVER_PORT || 5000);
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`BloxyWild server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}. URLS: ${frontendUrls.join(', ')}`);
    });
}

start().catch((err) => {
    console.error(`Failed to start: ${err.message}`);
    process.exit(1);
});
