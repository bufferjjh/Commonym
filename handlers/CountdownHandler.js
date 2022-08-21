let pairingUsers = [];
let ActiveGames = {};
let privateGames = {};
let alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
let ending = 'ABDEGKLMNPRSTWY';
module.exports = (io, socket, WordChecker, GameUsers, Game, client) => {
    Game.ActiveGames = ActiveGames;
    Game.PairingUsers = pairingUsers;
    Game.PrivateGames = privateGames;
    socket.on("Countdown:StartPrivateGame", (res) => {
        GameUsers[socket.id] = "Countdown";
        privateGames[res.gameCode] = socket.id;
        Game[socket.id] = {
            username: res.username,
            isPlayer1: true,
            lastWord:"",
            privateGame: res.gameCode,
            cnt: 0,
        }
    });
    socket.on("Countdown:JoinPrivate", (res) => {
        GameUsers[socket.id] = "Countdown";
        if(privateGames[res.gameCode] == null) {
            socket.emit("InvalidCode");
        }
        else {
            let p1 = privateGames[res.gameCode];
            let p2 = socket.id;
            Game[socket.id] = {
                username: res.username,
                isPlayer1: false,
                lastWord:"",
                cnt: 0,
            }
            let currGame = {
                player1: p1,
                player2: p2,
                turn: false,
                lettersPlayer1: new Set(),
                lettersPlayer2: new Set(),
                decidingLetter: "",
                start: false,
                firstPlayerDecided: false,
                words: new Set()
            }
            ActiveGames[p1] = currGame;
            ActiveGames[p2] = currGame;
            io.to(p1).emit("successfulPairing", Game[p2]);
            io.to(p2).emit("successfulPairing", Game[p1]);
            client.incr("gameCount");
            let start_end = Math.floor(Math.random() * 2);
            if(start_end == 0 || start_end == 1) {
                currGame.start = true;
                currGame.decidingLetter = alpha[Math.floor(Math.random() * 26)];
            }
            else {
                decidingLetter = ending[Math.floor(Math.random()*ending.length)];
                currGame.decidingLetter = decidingLetter;
            }
            io.to(p1).emit("decidingPrompt", {
                letter: currGame.decidingLetter,
                start: currGame.start,
            });
            io.to(p2).emit("decidingPrompt", {
                letter: currGame.decidingLetter,
                start: currGame.start,
            });
            delete privateGames[res.gameCode];
            delete Game[p1].privateGame;
        }
    });
    socket.on("Countdown:Connect", (gameName) => {
        GameUsers[socket.id] = "Countdown";
        pairingUsers.push(socket.id);
        let playerObj = {
            username: gameName,
            isPlayer1: false,
            lastWord: "",
            cnt: 0,
        }
        Game[socket.id] = playerObj;
        while(pairingUsers.length > 1) {
            let p1 = pairingUsers.pop();
            let p2 = pairingUsers.pop();
            client.incr("gameCount");
            let currGame = {
                player1: p1,
                player2: p2,
                turn: false,
                lettersPlayer1: new Set(),
                lettersPlayer2: new Set(),
                decidingLetter: "",
                start: false,
                firstPlayerDecided: false,
                words: new Set()
            }
            Game[p1].isPlayer1 = true;
            ActiveGames[p1] = currGame;
            ActiveGames[p2] = currGame;
            io.to(p1).emit("successfulPairing", Game[p2]);
            io.to(p2).emit("successfulPairing", Game[p1]);
            
            let start_end = Math.floor(Math.random() * 2);
            if(start_end == 0 || start_end == 1) {
                currGame.start = true;
                currGame.decidingLetter = alpha[Math.floor(Math.random() * 26)];
            }
            else {
                decidingLetter = ending[Math.floor(Math.random()*ending.length)];
                currGame.decidingLetter = decidingLetter;
            }
            io.to(p1).emit("decidingPrompt", {
                letter: currGame.decidingLetter,
                start: currGame.start,
            });
            io.to(p2).emit("decidingPrompt", {
                letter: currGame.decidingLetter,
                start: currGame.start,
            });
        }
    });
    socket.on('Countdown:FirstPlayerWord', (word) => {
        let currPlayer = Game[socket.id];
        let currGame = ActiveGames[socket.id];
        if(currGame.firstPlayerDecided) {
            return;
        }
        if(!checkStartingWord(word, currGame, WordChecker)) {
            socket.emit("Countdown:NotWord");
            return;
        }
        currGame.firstPlayerDecided = true;
        currPlayer.lastWord = word;
        currPlayer.cnt++;
        if(currPlayer.isPlayer1) {
            io.to(currGame.player1).emit("Countdown:SuccessfulFirstWord");
            io.to(currGame.player2).emit("Countdown:LostFirstWord", word);
        }
        else {
            io.to(currGame.player2).emit("Countdown:SuccessfulFirstWord");
            io.to(currGame.player1).emit("Countdown:LostFirstWord",word);
            currGame.turn = true;
        }
    });
    socket.on('Countdown:WordSent', (word) => {
        let currGame = ActiveGames[socket.id];
        let currPlayer = Game[socket.id];
        //turn: true -> player 1 turn
        if(currPlayer.isPlayer1) {
            if(!currGame.turn) return;
            if(currGame.words.has(word)) {
                io.to(currGame.player1).emit("Countdown:AlreadyUsed");
                io.to(currGame.player2).emit("Countdown:OpponentAlreadyUsed");
            }
            else if(checkCorrect(word, Game[currGame.player2].lastWord, WordChecker)) {
                for (let letter of word) {
                    currGame.lettersPlayer1.add(letter);
                }
                if(currGame.lettersPlayer1.size == 26) {
                    io.to(currGame.player1).emit("Countdown:YouWon", currGame.words);
                    io.to(currGame.player2).emit("Countdown:YouLost", currGame.words);
                    return;
                }
                io.to(currGame.player1).emit("Countdown:CorrectWord");
                io.to(currGame.player2).emit("Countdown:YourTurn", word);
                currGame.turn = !currGame.turn;
                currGame.words.add(word);
            }
            else {
                io.to(currGame.player1).emit("Countdown:IncorrectWord");
                io.to(currGame.player2).emit("Countdown:OpponentIncorrect", word);
            }
        }
        else {
            if(currGame.turn) return;
            if(currGame.words.has(word)) {
                io.to(currGame.player2).emit("Countdown:AlreadyUsed");
                io.to(currGame.player1).emit("Countdown:OpponentAlreadyUsed");
            }
            else if(checkCorrect(word,Game[currGame.player1].lastWord, WordChecker)) {
                for (let letter of word) {
                    currGame.lettersPlayer2.add(letter);
                }
                if(currGame.lettersPlayer2.size == 26) {
                    io.to(currGame.player2).emit("Countdown:YouWon", currGame.words);
                    io.to(currGame.player1).emit("Countdown:YouLost", currGame.words);
                    return;
                }
                io.to(currGame.player2).emit("Countdown:CorrectWord");
                io.to(currGame.player1).emit("Countdown:YourTurn", word);
                currGame.turn = !currGame.turn;
                currGame.words.add(word);
            }
            else {
                io.to(currGame.player2).emit("Countdown:IncorrectWord");
                io.to(currGame.player1).emit("Countdown:OpponentIncorrect", word);
            }
        }
        currPlayer.lastWord = word;
        currPlayer.cnt++;
    });
    socket.on("Countdown:LetterType", (word) => {
        let currPlayer = Game[socket.id];
        let currGame = ActiveGames[socket.id];
        if(currPlayer.isPlayer1) {
            io.to(currGame.player2).emit("Countdown:OpponentWordUpdate", word);
        }
        else {
            io.to(currGame.player1).emit("Countdown:OpponentWordUpdate", word);
        }
    });
    socket.on("Countdown:Timeout", () => {
        let currPlayer = Game[socket.id];
        let currGame = ActiveGames[socket.id];
        if(currPlayer.isPlayer1) {
            io.to(currGame.player2).emit("Countdown:YouWon");
        }
        else {
            io.to(currGame.player1).emit("Countdown:YouWon");
        }
    });
}

function checkStartingWord(word, currGame, WordChecker) {
    let start = currGame.start;
    if(word.length < 3) return false;
    if(start) {
        if(word[0] != currGame.decidingLetter) return false;
    }
    else {
        if(word[word.length - 1] != currGame.decidingLetter) return false;
    }
    return WordChecker.isWord(word);
}

function checkCorrect(nextWord, oldWord, WordChecker) {
    if(nextWord[0] != oldWord[oldWord.length-1]) {
        return false;
    }
    return WordChecker.isWord(nextWord);
}
/*
    Game {
        player1: socket.id,
        player2: socket.id,
        turn: true | false,
        lettersPlayer1: set(),
        lettersPlayer2: set(),
        firstPlayerDecided: false
    }
    Game[socket.io] -> {
        username:
        isPlayer1: true | false
    }
*/