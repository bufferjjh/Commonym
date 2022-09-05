const socket = io();

if("Commonym:Username" in localStorage) {
    document.getElementById("username").innerHTML = localStorage.getItem("Commonym:Username");
}
else {
    let username = "Guest" + Math.floor(Math.random() * 1000);
    localStorage.setItem("Commonym:Username", username);
    document.getElementById("username").innerHTML = username;
}
function changeUsername() {
    let newUsername = document.getElementById("changeUsernameInput").value;
    document.getElementById("username").innerHTML = newUsername;
    localStorage.setItem("Commonym:Username", newUsername);
}

//get number of users online for each game
fetch('/getUsersOnline')
    .then((r) => r.json())
    .then(data => {
        /*
        document.getElementById("RapidRecallPlaying").innerHTML = "<a style='color: #00c04b'>⦿</a> " + Math.max(0,data.RapidRecall) + " playing";
        document.getElementById("CountdownPlaying").innerHTML = "<a style='color: #00c04b'>⦿</a> " + Math.max(0,data.Countdown) + " playing";
        document.getElementById("WordDrawPlaying").innerHTML = "<a style='color: #00c04b'>⦿</a> " + Math.max(0,data.WordDraw) + " playing";
        */
        document.getElementById("usersOnline").innerHTML = data.totalUsers;
        document.getElementById("wordsFound").innerHTML = data.WordCount;
        document.getElementById("gamesPlayed").innerHTML = data.GameCount;
    })

function createCountdown() {
    fetch('/getCode')
    .then((r) => r.json())
    .then(data => {
        window.location.href = '/Countdown?initGame=' + data.code;
    })
}
function createWordDraw() {
    fetch('/getCode')
        .then((r) => r.json())
        .then(data => {
            window.location.href = '/WordDraw?initGame=' + data.code;
        })
}

function search(ele) {
    if(event.key === 'Enter') {
        fetch('/isValid?' + new URLSearchParams({"code": ele.value.toUpperCase()}))    
        .then((r) => r.json())
        .then(data => {
            if(data.status == "none") {
                ele.classList.remove('shake');
                void ele.offsetWidth;
                ele.classList.add('shake');
            }
            else {
                window.location.href = '/' + data.status + '?joinGame=' + ele.value.toUpperCase();
            }
        })
    }
}