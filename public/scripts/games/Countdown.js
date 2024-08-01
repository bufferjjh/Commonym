const socket = io();
let username = "Guest" + Math.floor(Math.random() * 1000);
if("Commonym:Username" in localStorage) {
    username = localStorage.getItem("Commonym:Username");
}
document.getElementById("yourName").innerHTML = username;
document.getElementById("usernameDisplay").innerHTML=username;

emojis = ["apple","coconut","lemon","onion","orange","pineapple","strawberry","watermelon"];
document.getElementById("YouProfilePicture").src="/assets/images/emojis/" + emojis[Math.floor(Math.random() * emojis.length)] + ".png";
document.getElementById("OpponentProfilePicture").src="/assets/images/emojis/" + emojis[Math.floor(Math.random() * emojis.length)] + ".png";

//check for private game code
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if(urlParams.has("initGame")) {
    socket.emit("Countdown:StartPrivateGame", {
        gameCode: urlParams.get('initGame'),
        username: username,
    });
    let spanElement = document.createElement("span");
    spanElement.setAttribute("class", "badge rounded-pill text-bg-light");
    spanElement.innerHTML = "Game code: " + urlParams.get('initGame');
    document.getElementById("centerDiv").appendChild(spanElement);
    spanElement.style.fontSize = '20px';
}
else if(urlParams.has("joinGame")) {
    socket.emit("Countdown:JoinPrivate", {
        gameCode: urlParams.get('joinGame'),
        username: username,
    });
}
//not private game
else {
    socket.emit("Countdown:Connect", username);
}


/*
$('#countDownBackground').delay(3000).fadeOut(function() {
    $(this).remove();
    $('#gameContent').css({"display": "inline"})
    socket.emit('RapidRecall:GetPrompt');
    socket.emit('RapidRecall:GetExtraLife');
    setInterval(() => {
        checkTime();
    }, 1000);
});
*/
let startTime = 0;
let yourWords = [];
let yourTimes = [];
let gameOver = false;

const youInput = document.getElementById("youInput");

socket.on('successfulPairing', (opponent) => {
    const myTimeout = setTimeout(() => {
        document.getElementById("opponentName").innerHTML = opponent.username;
        $('#countDownBackground').fadeOut(function() {
            document.getElementById("gameDiv").style.display="";
            countdown();
            setTimeout(function(){youInput.focus();}, 100);
        });
    }, 1000);
});
socket.on("InvalidCode", () => {
    alert("Invalid Game code");
    window.location.href="/"
})
socket.on("Countdown:OpponentDisconnected", () => {
    if(gameOver) return;
    socket.disconnect();
    clearInterval(youTimer);
    clearGame();
    gameOverScreen(true);
    let opponentDisconnect = document.createElement('span');
    opponentDisconnect.setAttribute('class','badge rounded-pill text-bg-warning');
    opponentDisconnect.innerHTML = 'Opponent Disconnected';
    opponentDisconnect.setAttribute("style", "margin-top: 10px;")
    document.getElementById("centerContent").appendChild(opponentDisconnect);
});

let alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
for (let i of alpha) {
    let letter = document.createElement('div');
    letter.innerHTML = i;
    letter.setAttribute('class','useLetterYou');
    letter.setAttribute('id', "you" + i);
    document.getElementById("usedLettersYou").appendChild(letter);
}
for (let i of alpha) {
    let letter = document.createElement('div');
    letter.innerHTML = i;
    letter.setAttribute('class','useLetterOpponent');
    letter.setAttribute("id", "opponent" + i);
    document.getElementById("usedLettersOpponent").appendChild(letter);
}

youInput.focus();
youInput.oninput = () => {
    youInput.value = youInput.value.toUpperCase();
}
document.addEventListener("keypress", () => {
    youInput.focus();
});
document.addEventListener("click", () => {
    youInput.focus();
});
function underline(color) {
    $("#verdictUnderline").css({"background-color": color}).animate({
        "width": "400px",
    },200, function() {
        $(this).fadeOut(300, function() {$(this).removeAttr('style');})
    });
    $("#youInput").css({"color": color}).animate({
    },200, function() {
        $(this).fadeOut(200, function() {
            $(this).removeAttr('style');
        })
    });
}
function underlineOpponent(color) {
    $("#verdictUnderlineOpponent").css({"background-color": color}).animate({
        "width": "400px",
    },200, function() {
        $(this).fadeOut(300, function() {$(this).removeAttr('style');})
    });
    $("#opponentInput").css({"color": color}).animate({
    },200, function() {
        $(this).fadeOut(200, function() {
            $(this).removeAttr('style');
        })
    });
}

let firstPlayerDecided = false;
$("#youInput").keydown(function(event) {
    if (event.keyCode === 13) {
        let word = $(this).val();
        if(word.length < 3) {
            underline("red");
            youInput.value="";
            return;
        }
        if(word.length == 0) return;
        if(!firstPlayerDecided) {
            socket.emit("Countdown:FirstPlayerWord", word);
        }
        else {
            socket.emit("Countdown:WordSent", word);
        }
    }
});
youInput.addEventListener("input", () => {
    if(firstPlayerDecided) {
        socket.emit("Countdown:LetterType", youInput.value);
    }
});
function setLeft() {
    let arrow = document.getElementById("rotateArrow");
    arrow.setAttribute("class", "arrowPic");
    pulsate(document.getElementById("arrowDisplay"));
}
function setRight() {
    let arrow = document.getElementById("rotateArrow");
    arrow.setAttribute("class", "arrowPic right");
    pulsate(document.getElementById("arrowDisplay"));
}
function pulsate(obj) {
    obj.classList.remove('pulse');
    void obj.offsetWidth;
    obj.classList.add('pulse');
}

let startingPrompt = null;
socket.on("decidingPrompt", (prompt) => {
    startingPrompt = prompt;
});

function countdown() {
    let timer = document.getElementById("initialCountdown");
    setTimeout(() => {
        timer.innerHTML = "2";
        setTimeout(() => {
            timer.innerHTML = "1";
            setTimeout(() => {
                timer.remove();
                initializeGame();
            }, 1000);
        }, 1000);
    }, 1000);
}

function initializeGame() {
    $("#promptDisplay").css({"visibility":"visible"});
    $("#arrowDisplay").css({"visibility":"visible"});
    let des = "";
    if(startingPrompt.start) {
        des = "starting";
    }
    else {
        des = "ending";
    }
    let textBubble = "<div class='letterWrapper'>"+ startingPrompt.letter+"</div>"
    $("#promptDisplay").html("Word " + des + " with " + textBubble);
}
socket.on("Countdown:NotWord", () => {
    underline('red');
});

const d = new Date();
socket.on('Countdown:SuccessfulFirstWord', () => {
    pulsate(document.getElementById('YouProfilePicture'));
    underline("#90EE90");
    setRight();
    firstPlayerDecided = true;
    markOffLetters(youInput.value);
    $("#youInput").attr("readonly", true);
    document.getElementById("promptDisplay").innerHTML = "🛑 at least 3 characters";
    setOpponentTimer();
    yourWords.push(youInput.value);
    startTime = d.getTime();
});
socket.on('Countdown:LostFirstWord', (word) => {
    $("#opponentInput").html(word.substr(0,word.length-1) + "<a style='border-bottom:2px solid white;'>" + word[word.length-1] + "</a>");
    pulsate(document.getElementById('OpponentProfilePicture'));
    setLeft();
    firstPlayerDecided = true;
    markOffLettersOpponent(word);
    document.getElementById("promptDisplay").innerHTML = "🛑 at least 3 characters";
    setYouTimer();
    startTime = d.getTime();
});

let usedLettersYou = []
let usedLettersOpponent = []
let usedLettersYouCnt = 0
let usedLettersOpponentCnt = 0

for (let i = 0; i < 26; i++) {
    usedLettersYou.push(false);
    usedLettersOpponent.push(false);
}

function markOffLetters(word) {
    for (let i of word) {
        document.getElementById("you" + i).setAttribute("class", "turnedOffLetterYou");
    }
    for (let i = 0; i < word.length; i++) {
        if(!usedLettersYou[word.charCodeAt(i) - 65]) {
            usedLettersYouCnt++;
            usedLettersYou[word.charCodeAt(i) - 65] = true;
        }
    }
    if(usedLettersYouCnt == 26) {
        setTimeout(function(){
            if(!gameOver) {
                gameOver = true;
                clearGame();
                gameOverScreen(true);
                console.log("Secondary System Engaged for win");
            }
        }, 300);
    }
}
function markOffLettersOpponent(word) {
    for (let i of word) {
        document.getElementById("opponent" + i).setAttribute("class", "turnedOffLetterOpponent");
    }
    for (let i = 0; i < word.length; i++) {
        if(!usedLettersOpponent[word.charCodeAt(i) - 65]) {
            usedLettersOpponentCnt++;
            usedLettersOpponent[word.charCodeAt(i) - 65] = true;
        }
    }
    if(usedLettersOpponentCnt == 26) {
        setTimeout(function(){
            if(!gameOver) {
                gameOver = true;
                clearGame();
                gameOverScreen(false);
                console.log("Secondary System Engaged for loss");
            }
        }, 300);
    }
}
let timeLimit = 6;
let time = timeLimit;
let youTimer = null;
let opponentTimer = null;
function setYouTimer() {
    time = timeLimit;
    document.getElementById("youTimer").innerHTML = time;
    document.getElementById("t1").style.visibility = "visible";
    youTimer = setInterval(() => {
        time--;
        if(time == 0) {
            clearInterval(youTimer);
            clearGame();
            gameOverScreen(false);
            socket.emit("Countdown:Timeout");
        }
        else {
            document.getElementById("youTimer").innerHTML = time;
        }
    }, 1000);
}
function setOpponentTimer() {
    time = timeLimit;
    document.getElementById("opponentTimer").innerHTML = time;
    document.getElementById("t2").style.visibility = "visible";
    opponentTimer = setInterval(() => {
        time--;
        if(time == 0) {
            clearInterval(opponentTimer);
        }
        else {
            document.getElementById("opponentTimer").innerHTML = time;
        }
    }, 1000);
}
function clearYouTimer() {
    clearInterval(youTimer);
    document.getElementById("t1").style.visibility = "hidden";
}
function clearOpponentTimer() {
    clearInterval(opponentTimer);
    document.getElementById("t2").style.visibility = "hidden";
}
socket.on('Countdown:CorrectWord', () => {
    underline("#90EE90");
    markOffLetters(youInput.value);
    $("#youInput").attr("readonly", true);
    setRight();
    pulsate(document.getElementById("YouProfilePicture"));
    clearYouTimer();
    setOpponentTimer();
    yourWords.push(youInput.value);
    $("#opponentInput").html("");
});
socket.on("Countdown:IncorrectWord", () => {
    underline("red");
    youInput.value="";
});
socket.on("Countdown:YourTurn", (word) => {
    markOffLettersOpponent(word);
    setLeft();
    $("#youInput").attr("readonly", false);
    $("#opponentInput").html(word.substr(0,word.length-1) + "<a style='border-bottom:2px solid white;'>" + word[word.length-1] + "</a>");
    youInput.value="";
    underlineOpponent('#90EE90');
    pulsate(document.getElementById("OpponentProfilePicture"));
    setYouTimer();
    clearOpponentTimer();
    youInput.focus();
});

socket.on("Countdown:OpponentIncorrect", (word) => {
    $("#opponentInput").html(word);
    underlineOpponent("red");
});

socket.on("Countdown:OpponentWordUpdate", (word) => {
    $("#opponentInput").html(word);
})

socket.on("Countdown:AlreadyUsed", () => {
    underline("yellow");
    youInput.value="";
});
socket.on("Countdown:OpponentAlreadyUsed", () => {
    underlineOpponent("yellow");
});

socket.on("Countdown:YouWon", (words) => {
    clearGame();
    gameOverScreen(true);
});

socket.on("Countdown:YouLost", (words) => {
    clearGame();
    gameOverScreen(false);
});

function gameOverScreen(win) {
    $("#gameOverBackground").css({"background-color": "#4e54c8"}).animate({
        "height": "100%",
    }, 500, function() {
        $('#centerContent').fadeIn(200);
        if(win) {
            $("#WinOrLose").html("You Win!");
        }
        else {
            $("#WinOrLose").html("You Lost");
        }
        displayStats();
    });
}

function clearGame() {
    clearYouTimer();
    clearOpponentTimer();
    document.getElementById("gameDiv").style.display="none";
    gameOver = true;
}
function displayStats() {
    //total words, total characters, duration
    let d2 = new Date();
    let totalWords = yourWords.length;
    let totalLength = 0;
    for (let word of yourWords) {
        totalLength += word.length;
    }
    let totalSeconds = Math.floor((d2.getTime() - startTime)/1000);
    let totalMin = Math.floor(totalSeconds/60);
    
    $("#wordCnt").html(totalWords);
    $("#charCnt").html(totalLength);
    let seconds= totalSeconds % 60;
    $("#duration").html(totalMin + ":" + (Math.floor(seconds/10) + "" + (seconds%10)));

}


//does not work for second player