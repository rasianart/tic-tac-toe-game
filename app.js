// Tic-Tac-Toe NodeJS/Express/Socket.io Server

"use strict";

// Set up express server w/socket.io
const express = require("express");
const app = express();
const server = require("http").createServer(app);
const io = require("socket.io")(server);

// Set up port and listen on server
const port = process.env.PORT || 8000;
server.listen(port, () => {
    console.log(`Server started on port ${port}.`);
});

// Points server to public directory for client files
app.use(express.static(`${__dirname}/public`));

// Sends index.html when connection made
app.get("/", (req, res) => res.sendFile("index.html"));

// Game object that holds all game info
let gameContainer = {};

// Class for information about each player
class Player {
    constructor(playerID, assignment, turn) {
        this.playerID = playerID; // ID of the player
        this.assignment = assignment; // Holds the assignment of either 'x' or 'o'
        this.turn = turn; // Holds the turn of the player
    }
}

// Class for information about each game
class Game {
    //takes in one arguments upon new game = gameID
    constructor(gameID) {
        this.gameID = gameID;
        this.player1 = null;
        this.player2 = null;
        this.board = {
            0: "",
            1: "",
            2: "",
            3: "",
            4: "",
            5: "",
            6: "",
            7: "",
            8: "",
        };
    }
    // Add player to game
    addPlayer(playerID) {
        // checks to see if any player exists
        if (!this.player1) {
            this.player1 = new Player(playerID);
        } else {
            this.player2 = new Player(playerID);
        }
    }
    // Checks if the square is avalailable and if it is the player's turn
    checkIfSquareAvailable(square, player) {
        if (player.turn && this.board.square === "") {
            return true;
        } else {
            return false;
        }
    }
}

io.on("connection", (socket) => {
    // Called when a user creates a new game
    socket.on("newGame", () => {
        // Creates ID to be passed to other player upon game creation
        let gameID = Math.random().toString(36).substr(2, 3);

        // Instantiates a new game with the generated gameID
        gameContainer[gameID] = new Game(gameID);

        // Intantiates a new player to the new game
        gameContainer[gameID].addPlayer(socket.id);

        // Adds the gameID to the socket room
        socket.join(gameID);

        // Sends created game ID back to new player to share
        io.to(gameID).emit("gameCreated", {
            gameID: gameID,
        });
    });

    // Called when a player enters a gameID to join a game
    socket.on("joinGame", (data) => {
        // Gets gameID entered from player
        const gameID = data.gameID;

        if (gameContainer[gameID]) {
            // Add player to the game
            gameContainer[gameID].addPlayer(socket.id);

            // Joins room
            socket.join(gameID);

            // Send game data to the first player
            io.to(gameID).emit("startGame", {
                player: gameContainer[gameID].player1,
                gameID: gameID,
                board: gameContainer[gameID].board,
            });

            // Send game data to the second player
            socket.emit("startGame", {
                player: gameContainer[gameID].player2,
                gameID: gameID,
                board: gameContainer[gameID].board,
            });
        } else {
            // The player attempted to enter a gameID that does not exist
            socket.emit("invalidGame");
        }
    });

    // Called when a player selects a square of the board
    socket.on("select", function (data) {
        // Make sure it is a valid move
        let gameID = data.id;
        let validSquare = gameContainer[gameID].checkIfSquareAvailable(
            data.square,
            data.player
        );
        if (validSquare) {
        } else {
            // Emit invalid move
            socket.emit("invalid");
        }
    });
});
