//Initialize socket instance
const socket = io();

// Create game container
const container = new Vue({
    el: "#container",
    data: {
        initGame: true,
        gameCreate: false,
        status: "",
    },
    methods: {
        newGame: function () {
            socket.emit("newGame");
            this.initGame = false;
        },
        joinGame: () => {},
    },
});

// Called when game has been created
socket.on("gameCreated", (data) => {
    console.log(data);
    // Display the create game ID to share with other player
    container.status = `Share game ID with another player to begin: ${data.gameID}`;
});
