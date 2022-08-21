const socket = io();

let username = "Guest" + Math.floor(Math.random() * 1000);

if("Commonym:Username" in localStorage) {
    username = localStorage.getItem("Commonym:Username");
}

//check for private game code
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
if(urlParams.has("initGame")) {
    socket.emit("WordDraw:StartPrivateGame", {
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
    socket.emit("WordDraw:JoinPrivate", {
        gameCode: urlParams.get('joinGame'),
        username: username,
    });
}
//not private game
else {
    socket.emit("WordDraw:Connect", username);
}

let startTime = null;
let yourWords = [];

document.getElementById("youUsername").innerHTML = username;
document.getElementById("showUsername").innerHTML = username;


let currPrompt = null;

let youInput = document.getElementById("youInput");
youInput.oninput = () => {
    youInput.value = youInput.value.toUpperCase();
};

let timer = document.getElementById("prompt");
let speed = 20;
function typewriter(word, idx) {
    if(idx >= word.length) return;
    timer.innerHTML = word.substr(0,idx+1);
    setTimeout(() => {
        typewriter(word,idx+1);
    },speed);
}
function countdown() {
    typewriter("On your mark",0);
    setTimeout(() => {
        typewriter("Get set!", 0);
        setTimeout(() => {
            typewriter("GO!", 0);
            setTimeout(() => {
                displayPrompt();
            }, 1000);
        }, 1000);
    }, 1000);
}

let nextPrompt = null;

function pulsate(obj) {
    obj.classList.remove('pulse');
    void obj.offsetWidth;
    obj.classList.add('pulse');
}

socket.on("WordDraw:SuccessfulPairing", (opponentUsername) => {
    startTime = new Date();
    startTime = startTime.getTime();
    setTimeout(() => {
        $("#countDownBackground").fadeOut(() => {
            document.getElementById('gameDiv').style.display="";
            $("#opponentUsername").html(opponentUsername);
            setTimeout(() => {
                countdown();
            }, 1000);
        });
    }, 500);
});

socket.on("WordDraw:NewPrompt", (prompt) => {
    currPrompt = prompt;
    nextPrompt = setTimeout(() => {
        getNewPrompt();
    }, 10000);
});

function displayPrompt() {
    if(currPrompt[0] == 0) {
        let x = "include letters &nbsp;" + "<span class='badge text-bg-dark'>" + currPrompt[1][0][0].toUpperCase() + "</span>" + "<span class='badge text-bg-dark'>" + currPrompt[1][0][1].toUpperCase() + "</span>" + "<span class='badge text-bg-dark'>" + currPrompt[1][0][2].toUpperCase() + "</span>";
        timer.innerHTML = x;
    }
    else if(currPrompt[0] == 1) {
        let x = "include letters &nbsp;" + "<span class='badge text-bg-dark'>" + currPrompt[1][0][0].toUpperCase() + "</span>" + "<span class='badge text-bg-dark'>" + currPrompt[1][0][1].toUpperCase() + "</span>" + "<span class='badge text-bg-dark'>" + currPrompt[1][0][2].toUpperCase() + "</span>" + "<span class='badge text-bg-dark'>" +  currPrompt[1][0][3].toUpperCase() + "</span>";
        timer.innerHTML = x;
    }
    else if(currPrompt[0] == 2) {
        let arr = [];
        for (let i = 0; i < currPrompt[1][0]; i++) {
            arr.push('_');
        }
        arr[currPrompt[1][1]] = currPrompt[1][2].toUpperCase();
        timer.innerHTML = "<a style='letter-spacing: 7px; font-size: 20px;'>"+ arr.join('') + "</a>";
    }
    else {
        let arr = [];
        for (let i = 0; i < currPrompt[1][0]; i++) {
            arr.push('_');
        }
        arr[currPrompt[1][3]] = currPrompt[1][1].toUpperCase();
        arr[currPrompt[1][4]] = currPrompt[1][2].toUpperCase();
        timer.innerHTML = "<a style='letter-spacing: 7px; font-size: 20px;'>"+ arr.join('') + "</a>";
    }
    document.getElementById("wordCount").innerHTML = currPrompt[1][currPrompt[1].length-1] + " words";
}

function getNewPrompt() {
    pulsate(document.getElementById("prompt"));
    socket.emit("WordDraw:GetNewPrompt");
}
$("#youInput").keydown(function(event) {
    if (event.keyCode === 13) {
        let word = $(this).val();
        socket.emit("WordDraw:WordSent", word.toLowerCase());
    }
});

function underline(color) {
    $("#youUnderline").css({"background-color": color}).animate({
        "width": "200px",
    }, 150, function () {
        $(this).fadeOut(200, function() {
            $(this).removeAttr('style');
        })
    });
    $("#youInput").css({"color": color}).animate({
    },200, function() {
        $(this).fadeOut(200, function() {
            $(this).removeAttr('style');
            if(color == "#90EE90") {
                $(this).val("");
            }
        })
    });
}


let yourScore = 0;
let opponentScore = 0;

function incrementScore() {
    yourScore++;
    $("#yourScore").html(yourScore);
}
function incrementOpponentScore() {
    opponentScore++;
    $("#opponentsScore").html(opponentScore);
}
socket.on("WordDraw:incorrect", () => {
    underline("#ff1a1a");
})

socket.on("WordDraw:correct", () => {
    pulsate(document.getElementById("youPic"));
    pulsate(document.getElementById("prompt"));
    yourWords.push(youInput.value);
    underline("#90EE90");
    incrementScore();
    clearTimeout(nextPrompt);
    nextPrompt = setTimeout(() => {
        getNewPrompt();
    }, 10000);
});
socket.on("WordDraw:NextPrompt", (p) => {
    currPrompt = p;
    displayPrompt();
    clearTimeout(nextPrompt);
    nextPrompt = setTimeout(() => {
        getNewPrompt();
    }, 10000);
});
socket.on("WordDraw:OpponentGotWord", (word) => {
    pulsate(document.getElementById("opponentPic"));
    pulsate(document.getElementById("prompt"));
    let text = document.createElement("p");
    text.setAttribute("id", "fadeUpText");
    document.getElementById("opponentContent").appendChild(text);
    text.innerHTML = word;
    text.setAttribute("class", "fadeUp");
    setTimeout(() => {
        text.remove();
    }, 1500);
    incrementOpponentScore();
    clearTimeout(nextPrompt);
    nextPrompt = setTimeout(() => {
        getNewPrompt();
    }, 10000);
    youInput.value="";
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

socket.on("WordDraw:YouWon", () => {
    socket.disconnect();
    gameOverScreen(true);
    displayStats();
});

socket.on("WordDraw:YouLost", () => {
    socket.disconnect();
    gameOverScreen(false);
    displayStats();
});
socket.on("WordDraw:OpponentDisconnected", () => {
    socket.disconnect();
    gameOverScreen(true);
    displayStats();
});