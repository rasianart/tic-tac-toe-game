//Initialize socket instance
const socket = io();

// Create the game object that will house the status of the players and the board
const gameContainer = new Vue({
    el: "#container",
    data: {
        initGame: true,
        gameCreated: false,
        status: "",
        gameID: null,
        board: null,
        yourPlayer: null,
    },
    methods: {
        // Socket emission upon new game click
        newGame: function () {
            socket.emit("newGame");
            this.initGame = false;
        },
        // On keyup:enter attempt to join game if valid
        joinGame: function () {
            if (this.gameID) {
                socket.emit("joinGame", { gameID: this.gameID.toString() });
            } else {
                // Notify player that game ID must be present to submit
                gameContainer.status = "Must input game ID.";
            }
        },
        // Checks if valid turn and square then emits move
        selectSquare: function (selectedSquare) {
            // Resets game status
            gameContainer.status = "";
            if (this.yourPlayer.turn && this.board[selectedSquare] === "") {
                socket.emit("selectSquare", {
                    gameID: this.gameID.toString(),
                    player: this.yourPlayer,
                    square: selectedSquare,
                });
            } else if (!this.yourPlayer.turn) {
                // Other palyler's turn
                gameContainer.status =
                    "Wait until other player selects before you select.";
            } else {
                // Invalid selection
                gameContainer.status = "Invalid selection.";
            }
        },
    },
});

// Called when game has been created
socket.on("gameCreated", (data) => {
    // Display the create game ID to share with other player
    gameContainer.status = `Share game ID with another player to begin: ${data.gameID}`;
    // Sets you up as first player
    gameContainer.turn = true;
});

// Called when gameID is invalid
socket.on("invalidGame", (data) => {
    // Displays a notification of invalid id
    gameContainer.status = `Invalid Game ID`;
});

// Called when both players have joined the game
socket.on("startGame", function (data) {
    // Hide the inti Game UI
    gameContainer.initGame = false;
    gameContainer.status = "";

    // Assign the gameContainer object properies of the created game and player
    gameContainer.gameID = data.gameID;
    gameContainer.board = data.board;
    gameContainer.yourPlayer = data.player;

    // Show the game board
    gameContainer.gameCreated = true;
});

// Called when square has been selected and next players turn
socket.on("nextTurn", function (data) {
    // Updates the board
    gameContainer.board = data.board;
    gameContainer.yourPlayer.turn = !gameContainer.yourPlayer.turn;
});

// Called when game is lost and restarts
socket.on("gameOver", function (data) {
    // Restarts the board
    gameContainer.status = "You have lost the game.";
    gameContainer.board = data.board;
    gameContainer.yourPlayer.turn = !gameContainer.yourPlayer.turn;
});

// Called when game is won and restarts
socket.on("winGame", function (data) {
    // Restarts the board
    gameContainer.status = "You have won the game.";
    gameContainer.board = data.board;
});

// Called when game is a tie and game restarts
socket.on("tieGame", function (data) {
    // Restarts the board
    gameContainer.status = "Tie Game.";
    gameContainer.board = data.board;
    gameContainer.yourPlayer.turn = !gameContainer.yourPlayer.turn;
});
