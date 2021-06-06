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
    },
});

// Called when game has been created
socket.on("gameCreated", (data) => {
    console.log(data);
    // Display the create game ID to share with other player
    gameContainer.status = `Share game ID with another player to begin: ${data.gameID}`;
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

    console.log(gameContainer);

    // Show the game board
    gameContainer.gameCreated = true;
});
