module.exports = (io, socket, GameUsers, Games,client) => {  
    socket.on("disconnect", (reason) => {
        if(!GameUsers.hasOwnProperty(socket.id)) {
            return;
        }
        let userWebsiteLocation = GameUsers[socket.id];
        if(userWebsiteLocation == "RapidRecall") {
            if(Games.RapidRecall[socket.id] !== null) {
                let numWords = Games.RapidRecall[socket.id].words.size;
                client.get("wordCount", function(err,data) {
                    let curr = JSON.parse(data);
                    client.set("wordCount", curr + numWords);
                });
            }
        }
        else if(userWebsiteLocation == "Countdown") {
            if(Games.Countdown[socket.id] == undefined) {
                return;
            }
            else if(Games.Countdown.PairingUsers.includes(socket.id)) {
                let idx = Games.Countdown.PairingUsers.indexOf(socket.id);
                Games.Countdown.PairingUsers.splice(idx,1);
            }
            else if(Games.Countdown[socket.id].hasOwnProperty("privateGame")) {
                delete Games.Countdown.PrivateGames[Games.Countdown[socket.id].privateGame];
            }
            else if(Games.Countdown.ActiveGames[socket.id] !== undefined) {
                let numWords = Games.Countdown[socket.id].cnt;
                client.get("wordCount", function(err,data) {
                    let curr = JSON.parse(data);
                    client.set("wordCount", curr + numWords);
                });
                let currUser = Games.Countdown[socket.id];
                let currGame = Games.Countdown.ActiveGames[socket.id];
                if(currUser.isPlayer1) {
                    io.to(currGame.player2).emit("Countdown:OpponentDisconnected");
                }
                else {
                    io.to(currGame.player1).emit("Countdown:OpponentDisconnected");
                }
            }
            //delete game
            delete Games.Countdown.ActiveGames[socket.id];
        }
        else if(userWebsiteLocation == "WordDraw") {
            if(Games.WordDraw[socket.id] == undefined) {
                return;
            }
            else if(Games.WordDraw.PairingUsers.includes(socket.id)) {
                let idx = Games.WordDraw.PairingUsers.indexOf(socket.id);
                Games.WordDraw.PairingUsers.splice(idx,1);
            }
            else if(Games.WordDraw.PrivateGames.hasOwnProperty(socket.id)) {
                delete Games.WordDraw.PrivateGames[socket.id];
            }
            else if(Games.WordDraw.hasOwnProperty(socket.id)) {
                let numWords = Games.WordDraw[socket.id].cnt;
                client.get("wordCount", function(err,data) {
                    let curr = JSON.parse(data);
                    client.set("wordCount", curr + numWords);
                });
                let opponentId =  Games.WordDraw[socket.id].opponent;
                io.to(opponentId).emit("WordDraw:OpponentDisconnected");
                delete Games.WordDraw[socket.id].game;
            }
        }
        delete Games[GameUsers[socket.id]][socket.id];
        delete GameUsers[socket.id];
    });
}