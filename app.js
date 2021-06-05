//
// Tic-Tac-Toe NodeJS/Express/Socket.io Server
//

// Set up express server w/socket.io
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Set up port and listen on server
const port = process.env.PORT || 8000;
server.listen(port, () => {
    console.log(`Server started on port ${port}.`);
});

// Points server to public directory for client files
app.use(express.static(`${__dirname}/public`));

// Sends index.html when connection made
app.get('/', (req, res) => res.sendFile('index.html'));

io.on('connection', (socket) => {
    console.log(socket.id);
});