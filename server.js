const express = require('express');
const path = require('path');
const app = express();
const http = require('http');
const server = http.Server(app);
const io = require('socket.io')(server);
const fs = require('fs');

//redis-13589.c9.us-east-1-2.ec2.cloud.redislabs.com:13589
const redis = require('ioredis');
const client = redis.createClient(JSON.parse(fs.readFileSync("./redisAuth.json")));
client.on('connect',() => {
    console.log('connected to redis successfully!');
})
client.on('error',(error) => {
    console.log('Redis connection error :', error);
})
client.exists("wordCount", function(err,reply) {
    if(reply !== 1) {
        client.set("wordCount",0);
    }
});
client.exists("gameCount", function(err,reply) {
    if(reply !== 1) {
        client.set("gameCount",0);
    }
});

app.use(express.static('public'))

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname, './pages/index.html'));
});
app.get('/about', function(req, res) {
    res.sendFile(path.join(__dirname, './pages/about.html'));
});
app.get('/RapidRecall', function(req,res) {
    res.sendFile(path.join(__dirname, './pages/single/RapidRecall.html'));
});
app.get('/Countdown', function(req,res) {
    res.sendFile(path.join(__dirname, './pages/multi/Countdown.html'));
});
app.get('/WordDraw', function(req,res) {
    res.sendFile(path.join(__dirname, './pages/multi/WordDraw.html'));
});
app.get('/getUsersOnline', function(req,res) {
    client.get("gameCount", function(err1, reply1) {
        client.get("wordCount", function(err2,reply2) {
            res.send({
                RapidRecall: Object.keys(Games.RapidRecall).length,
                Countdown: Object.keys(Games.Countdown).length-3,
                WordDraw: Object.keys(Games.WordDraw).length-3,
                totalUsers: io.engine.clientsCount,
                GameCount: reply1,
                WordCount: reply2,
            })
        })
    })
})
app.get('/getCode', function(req,res) {
    res.send({code: generateGameCode()})
});
app.get('/isValid', function(req,res) {
    let code = req.query.code;
    if(Games.Countdown.PrivateGames.hasOwnProperty(code)) {
        res.send({status: "Countdown"});
    }
    else if(Games.WordDraw.PrivateGames.hasOwnProperty(code)) {
        res.send({status: "WordDraw"});
    }
    else {
        res.send({status: "none"});
    }
});
function generateGameCode() {
    let alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = "";
    for (let i = 0; i < 4; i++) {
        code += alpha[Math.floor(Math.random() * 26)];
    }
    if(Games.Countdown.PrivateGames.hasOwnProperty(code) || Games.WordDraw.PrivateGames.hasOwnProperty(code)) {
        return generateGameCode();
    }
    return code;
}
var PORT = process.env.PORT || 5000;

server.listen(PORT, function() {
    console.log('server running');
});

const WordChecker = require('./functions/WordChecker');
WordChecker.readWords('./datasets/allWords.txt');

const SpecificWords = {
    Chemicals: JSON.parse(fs.readFileSync('./datasets/chemicals.json')),
}

const Datasets = {
    "substr": JSON.parse(fs.readFileSync('./datasets/substr.json')),
    "perms": JSON.parse(fs.readFileSync('./datasets/perms.json')),
    "twoInclude": JSON.parse(fs.readFileSync('./datasets/twoInclude.json')),
    "threeInclude": JSON.parse(fs.readFileSync('./datasets/threeInclude.json')),
    "fourInclude": JSON.parse(fs.readFileSync('./datasets/fourInclude.json')),
    "template1": JSON.parse(fs.readFileSync('./datasets/template.json')),
    "template2": JSON.parse(fs.readFileSync('./datasets/template2.json')),
}
const DisconnectHandler = require('./handlers/DisconnectHandler');
const RapidRecallHandler = require('./handlers/RapidRecallHandler');
const CountdownHandler = require('./handlers/CountdownHandler');
const WordDrawHandler = require('./handlers/WordDrawHandler');
const GameUsers = {};
//socket.id -> location
const Games = {
    RapidRecall: {},
    Countdown: {},
    WordDraw: {},
};

const onConnection = (socket) => {
    try {
        DisconnectHandler(io,socket,GameUsers, Games, client);
        RapidRecallHandler(io, socket, WordChecker, Datasets, GameUsers, Games.RapidRecall,SpecificWords, client);
        CountdownHandler(io,socket,WordChecker, GameUsers, Games.Countdown, client);
        WordDrawHandler(io, socket, WordChecker, GameUsers, Games.WordDraw, Datasets, client);
    }
    catch(err) {
        console.log("An Error Occured: " + err.message);
    }
}

io.on('connection', onConnection);

/*
    revise three include check -- rapid recall
    revise three include json file to not only contain distinct characters
    create four include
*/