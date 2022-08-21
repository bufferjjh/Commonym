let pairingUsers = [];
let ActiveGames = {};
let privateGames = {};
function selectRandom(lst) {
    let idx = Math.floor(Math.random() * lst.length);
    return lst[idx];
}
function getPrompt(Datasets) {
    let twoInclude = Datasets['twoInclude'];
    let threeInclude = Datasets['threeInclude'];
    let fourInclude = Datasets['fourInclude'];
    let template1 = Datasets["template1"];
    let template2 = Datasets["template2"];
    let mode = 0;
    //limit to twoInclude and threeInclude for now
    let sets = [threeInclude, fourInclude, template1,template2];
    return [mode, selectRandom(sets[mode])];
}
function initializeGame(io,game, Game,Datasets) {
    io.to(game.player1).emit("WordDraw:SuccessfulPairing", Game[game.player2].name);
    io.to(game.player2).emit("WordDraw:SuccessfulPairing", Game[game.player1].name);
    game.prompt = getPrompt(Datasets);
    io.to(game.player1).emit("WordDraw:NewPrompt", game.prompt);
    io.to(game.player2).emit("WordDraw:NewPrompt", game.prompt);
}
module.exports = (io, socket, WordChecker, GameUsers, Game, Datasets, client) => {
    Game.ActiveGames = ActiveGames;
    Game.PairingUsers = pairingUsers;
    Game.PrivateGames = privateGames;
    socket.on("WordDraw:StartPrivateGame", (res) => {
        GameUsers[socket.id] = "WordDraw";
        privateGames[res.gameCode] = socket.id;
        Game[socket.id] = {
            name: res.username,
            opponent: null,
            game:null,
            cnt: 0
        }
    });
    socket.on("WordDraw:JoinPrivate", (res) => {
        if(privateGames[res.gameCode] == null) {
            socket.emit("invalidCode");
        }
        else {
            GameUsers[socket.id] = "WordDraw";
            client.incr("gameCount");
            let game = {
                player1: privateGames[res.gameCode],
                player2: socket.id,
                player1Score: 0,
                player2Score: 0,
                words: new Set(),
                prompt: null,
            }
            Game[socket.id] = {
                name: res.username,
                opponent: privateGames[res.gameCode],
                game: game,
                cnt:0
            }
            Game[game.player1].game = game;
            Game[game.player1].opponent = socket.id;
            delete privateGames[res.gameCode];
            initializeGame(io,game, Game, Datasets);
        }
    });
    socket.on("WordDraw:Connect", (username) => {
        GameUsers[socket.id] = "WordDraw";
        pairingUsers.push(socket.id);
        Game[socket.id] = {
            name: username,
            opponent: null,
            game: null,
            cnt: 0
        };
        while(pairingUsers.length > 1) {
            let p1 = pairingUsers.pop();
            let p2 = pairingUsers.pop();
            client.incr("gameCount");
            Game[p1].opponent = p2;
            Game[p2].opponent = p1;
            let game = {
                player1: p1,
                player2: p2,
                player1Score: 0,
                player2Score: 0,
                words: new Set(),
                prompt: null,
            }
            Game[p1].game = game;
            Game[p2].game = game;
            initializeGame(io,game, Game, Datasets);
        }
    });
    socket.on("WordDraw:WordSent", (word) => {
        let works = checkWord(word, socket.id, Game, WordChecker);
        let currGame = Game[socket.id].game;
        if(!works) {
            socket.emit("WordDraw:incorrect");
        }
        else {
            Game[socket.id].cnt++;
            socket.emit("WordDraw:correct");
            io.to(Game[socket.id].opponent).emit("WordDraw:OpponentGotWord", word);
            currGame.prompt = getPrompt(Datasets);
            socket.emit("WordDraw:NextPrompt", currGame.prompt);
            io.to(Game[socket.id].opponent).emit("WordDraw:NextPrompt", currGame.prompt);
            if(currGame.player1 == socket.id) {
                currGame.player1Score++;
                if(currGame.player1Score == 10) {
                    io.to(Game[socket.id].opponent).emit("WordDraw:YouLost");
                    io.to(socket.id).emit("WordDraw:YouWon");
                }
            }
            else {
                currGame.player2Score++;
                if(currGame.player2Score == 10) {
                    io.to(Game[socket.id].opponent).emit("WordDraw:YouLost");
                    io.to(socket.id).emit("WordDraw:YouWon");
                }
            }

        }
    });
    socket.on("WordDraw:GetNewPrompt", () => {
        let player = Game[socket.id];
        let game = player.game;
        if(game.player2 == socket.id) return;
        //only accept requests from one player (player 1)
        game.prompt = getPrompt(Datasets);
        io.to(game.player1).emit("WordDraw:NextPrompt", game.prompt);
        io.to(game.player2).emit("WordDraw:NextPrompt", game.prompt);
    });
}

function checkWord(word, socketId, Game, WordChecker) {
    let currPrompt = Game[socketId].game.prompt;
    if(currPrompt[0] == 0) {
        for (let i of currPrompt[1][0]) {
            if(countChar(word, i) < countChar(currPrompt[1][0],i)) {
                return false;
            }
        }
    }
    else if(currPrompt[0] == 1) {
        for (let i of currPrompt[1][0]) {
            if(countChar(word, i) < countChar(currPrompt[1][0],i)) {
                return false;
            }
        }
    }
    else if(currPrompt[0] == 2) {
        if(word.length < currPrompt[1][0]) {
            return false;
        }
        if(word[currPrompt[1][1]] != currPrompt[1][2]) {
            return false;
        }
    }
    else {
        if(word.length < currPrompt[1][0]) {
            return false;
        }
        if(word[currPrompt[1][3]] != currPrompt[1][1]) {
            return false;
        }
        if(word[currPrompt[1][4]] != currPrompt[1][2]) {
            return false;
        }
    }
    return WordChecker.isWord(word);
}
function countChar(s,c) {
    let cnt = 0;
    for (let i of s) {
        if(i == c) cnt++;
    }
    return cnt;
}