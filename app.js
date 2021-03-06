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
            this.player1 = new Player(playerID, "x", true);
        } else {
            this.player2 = new Player(playerID, "o", false);
        }
    }
    // Checks if the square is avalailable and if it is the player's turn
    checkIfSquareAvailable(square, player) {
        if (player.turn && this.board[square] === "") {
            return true;
        } else {
            return false;
        }
    }
    // Selects valid square on board
    selectSquare(square, player) {
        this.board[square] = player.assignment;
        this.player1.turn = !this.player1.turn;
        this.player2.turn = !this.player2.turn;
    }
    // Checks for game win
    checkGameWin(player) {
        const boardCheck = this.board;

        // Check all horizontal rows for win
        if (
            boardCheck[0] &&
            boardCheck[0] === boardCheck[1] &&
            boardCheck[0] === boardCheck[2]
        ) {
            return "win";
        }
        if (
            boardCheck[3] &&
            boardCheck[3] === boardCheck[4] &&
            boardCheck[3] === boardCheck[5]
        ) {
            return "win";
        }
        if (
            boardCheck[6] &&
            boardCheck[6] === boardCheck[7] &&
            boardCheck[6] === boardCheck[8]
        ) {
            return "win";
        }

        // Check all vertical rows for win
        if (
            boardCheck[0] &&
            boardCheck[0] === boardCheck[3] &&
            boardCheck[0] === boardCheck[6]
        ) {
            return "win";
        }
        if (
            boardCheck[1] &&
            boardCheck[1] === boardCheck[4] &&
            boardCheck[1] === boardCheck[7]
        ) {
            return "win";
        }
        if (
            boardCheck[2] &&
            boardCheck[2] === boardCheck[5] &&
            boardCheck[2] === boardCheck[8]
        ) {
            return "win";
        }

        // Check all diagonals for win
        if (
            boardCheck[0] &&
            boardCheck[0] === boardCheck[4] &&
            boardCheck[0] === boardCheck[8]
        ) {
            return "win";
        }
        if (
            boardCheck[2] &&
            boardCheck[2] === boardCheck[4] &&
            boardCheck[1] === boardCheck[6]
        ) {
            return "win";
        }

        // Checks to see if any squares are still empty to continue game
        for (let square in boardCheck) {
            if (!boardCheck[square]) {
                return "continue";
            }
        }

        // If no win and no squares left - game is a tie
        return "tie";
    }
    resetBoard() {
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
    socket.on("selectSquare", function (data) {
        // Make sure it is a valid move
        let gameID = data.gameID;
        let validSquare = gameContainer[gameID].checkIfSquareAvailable(
            data.square,
            data.player
        );
        if (validSquare) {
            // Select square on game board and switches turns
            gameContainer[gameID].selectSquare(data.square, data.player);

            // Checks if there is a win or tie on the game board
            const gameStatus = gameContainer[gameID].checkGameWin(data.player);

            if (gameStatus === "win") {
                // Reset board
                gameContainer[gameID].resetBoard();

                // Send game data to room/other player
                io.to(gameID).emit("gameOver", {
                    board: gameContainer[gameID].board,
                });

                // Send game data to the current socket/player winner
                socket.emit("winGame", {
                    board: gameContainer[gameID].board,
                });
            } else if (gameStatus === "tie") {
                // Tie game, no win

                // Reset board
                gameContainer[gameID].resetBoard();

                // Send game data to room
                io.to(gameID).emit("tieGame", {
                    board: gameContainer[gameID].board,
                });
            } else if (gameStatus === "continue") {
                // No win yet, game still ongoing
                // Send game data to room
                io.to(gameID).emit("nextTurn", {
                    board: gameContainer[gameID].board,
                });
            }
        } else {
            // Emit invalid move
            socket.emit("Invalid square.");
        }
    });
});
