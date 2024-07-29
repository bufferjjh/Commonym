const socket = io();
socket.emit("RapidRecall:Connect");
let currentSecond = -1;
let lives = 3;
let gameOver = false;
let userWordObj = document.getElementById("userWord");

let correctBeep = document.getElementById("correctBeep");
let gameCloseSound = document.getElementById("gameCloseSound");


document.addEventListener("click", () => {
    userWordObj.focus();
});

$('#countDownBackground').delay(3000).fadeOut(function() {
    $(this).remove();
    $('#gameContent').css({"display": "inline"})
    socket.emit('RapidRecall:GetPrompt');
    socket.emit('RapidRecall:GetExtraLife');
    setInterval(() => {
        checkTime();
    }, 1000);
    setTimeout(function(){userWordObj.focus();}, 100);
});
$("#userWord").keydown(function(event) {
    if (event.keyCode === 13) {
        let word = $(this).val();
        if(word == "" || gameOver) return;
        socket.emit("RapidRecall:WordSent", word.toLowerCase());
    }
});

function underline(color) {
    $("#verdictUnderline").css({"background-color": color}).animate({
        "width": "500px",
    },200, function() {
        $(this).fadeOut(300, function() {$(this).removeAttr('style');})
    });
    $("#userWord").css({"color": color}).animate({
    },200, function() {
        $(this).fadeOut(200, function() {
            $(this).removeAttr('style');
            if(color == "#90EE90") {
                $(this).val("");
            }
        })
    });
}

function wrongAnswer() {
    underline("red");
}
function correctAnswer() {
    underline("#90EE90");
    socket.emit('RapidRecall:GetPrompt');
}
function alreadyUsed() {
    underline("orange");
}

let prompt = document.getElementById("gamePrompt");
let optionCount = document.getElementById("optionsCount");
socket.on('perm', (perm) => {
    currentSecond = 6;
    document.getElementById('timeLeft').innerHTML = currentSecond + 's';
    let badgeWord = "";
    for (let i = 0; i < perm[0].length; i++) {
        badgeWord += "<span class='badge text-bg-secondary'>" + perm[0][i].toUpperCase() + "</span>";
    }
    prompt.innerHTML = "Make a word out of " + badgeWord;
    optionCount.innerHTML = perm[1] + " words";
});
socket.on('substr-pre', (sub) => {
    currentSecond = 6;
    document.getElementById('timeLeft').innerHTML = currentSecond + 's';
    prompt.innerHTML = "A word <a style='color: orange'>starting</a> with " + "<span class='badge text-bg-dark'>" + sub[0].toUpperCase() + "</span>";
    optionCount.innerHTML = sub[1] + " words";
});
socket.on('substr-mid', (sub) => {
    currentSecond = 6;
    document.getElementById('timeLeft').innerHTML = currentSecond + 's';
    prompt.innerHTML = "A word containing " + "<span class='badge text-bg-dark'>" + sub[0].toUpperCase() + "</span>";
    optionCount.innerHTML = sub[1] + " words";
});
socket.on('substr-suff', (sub) => {
    currentSecond = 6;
    document.getElementById('timeLeft').innerHTML = currentSecond + 's';
    prompt.innerHTML = "A word <a style='color: purple'>ending</a> with " + "<span class='badge text-bg-dark'>" + sub[0].toUpperCase() + "</span>";
    optionCount.innerHTML = sub[1] + " words";
});
socket.on('include', (letters) => {
    currentSecond = 6;
    document.getElementById('timeLeft').innerHTML = currentSecond + 's';
    if(letters[0].length == 2) {
        prompt.innerHTML = "A word including both " + "<span class='badge text-bg-dark'>" + letters[0][0].toUpperCase() + "</span> and " + "<span class='badge text-bg-dark'>" + letters[0][1].toUpperCase() + "</span>"
    }
    else {
        prompt.innerHTML = "A word containing letters " + "<span class='badge text-bg-dark'>" + letters[0][0].toUpperCase() + "</span>&nbsp" + "<span class='badge text-bg-dark'>" + letters[0][1].toUpperCase() + "</span> and "+ "<span class='badge text-bg-dark'>" + letters[0][2].toUpperCase() + "</span>";
    }
    optionCount.innerHTML = letters[1] + " words";
});


socket.on('wordStatus', (status) => {
    if(status == 2) {
        lives++;
        document.getElementById('lives').innerHTML = lives;
        socket.emit("RapidRecall:GetExtraLife");
        correctAnswer();
        correctBeep.play();
    }
    else if(status == 1) {
        correctAnswer();
        correctBeep.play();
    }
    else if (status == 0) {
        document.getElementById("userWord").value="";
        alreadyUsed();
    }
    else {
        wrongAnswer();
        document.getElementById("userWord").value="";
    }
});

socket.on('RapidRecall:ExtraLife', (idx) => {
    let options = [
        "find word longer than 9 characters",
        "find a word with 3 or more of the same letters",
        "find a word that starts and ends with the same letter",
        "find an element of the periodic table",
        "find a word that is a palindrome"
    ];
    document.getElementById('extraLifePrompt').innerHTML = options[idx];
});

function checkTime() {
    if(currentSecond == -1) {
        return;
    }
    else if(currentSecond == 1) {
        if(lives == 1) {
            gameOver = true;
            document.getElementById('gameContent').style.display = 'None';
            currentSecond = -1;
            socket.emit("RapidRecall:GetGameStats")
            gameOverScreen();
            gameCloseSound.play();
        }
        else {
            lives--;
            socket.emit('RapidRecall:GetPrompt');
            wrongAnswer();
            document.getElementById('lives').innerHTML = lives;
            document.getElementById("userWord").value = "";
        }
        return;
    }
    else {
        currentSecond -= 1;
        document.getElementById('timeLeft').innerHTML = currentSecond + 's';
    }
}

socket.on('RapidRecall:RoundResults', (results) => {
    document.getElementById('roundScore').innerHTML=results.score;
    document.getElementById('wordCount').innerHTML=results.numWords;
    document.getElementById("longestWord").innerHTML=results.longest;
});
function gameOverScreen() {
    $("#gameOverBackground").css({"background-color": "#4e54c8"}).animate({
        "height": "100%",
    }, 500, function() {
        $('#centerContent').fadeIn(200);
    });
}
