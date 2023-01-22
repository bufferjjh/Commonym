function countChar(s,c) {
    let cnt = 0;
    for (let i of s) {
        if(i == c) cnt++;
    }
    return cnt;
}
function selectRandom(lst) {
    let idx = Math.floor(Math.random() * lst.length);
    return lst[idx];
}
function permsEqual(s1,s2) {
    if(s1.length != s2.length) {
        return false;
    }
    let l1 = s1.split('');
    let l2 = s2;
    l1.sort();
    l2.sort();
    for (let i = 0; i < s1.length; i++) {
        if(l1[i] != l2[i]) return false;
    }
    return true;
}
module.exports = (io, socket, WordChecker, Datasets, GameUsers, Game, SpecificWords, client) => {
    socket.on("RapidRecall:Connect", () => {
        client.incr("gameCount");
        GameUsers[socket.id] = "RapidRecall";
        Game[socket.id] = {
            words: new Set(),
            prompt: [], //mode, content
            extra: -1,
        }
    });
    socket.on("RapidRecall:WordSent", (word) => {
        //-1 -> wrong, 0 -> already used, 1 -> correct, 2 -> correct and extra
        let userQuestion = Game[socket.id].prompt;
        if(userQuestion[0] == 'perm') {
            if(!permsEqual(word, userQuestion[1])) {
                socket.emit("wordStatus","-1");
                return;
            }
        }
        else if(userQuestion[0] == 'include') {
            let works = true;
            for (let i = 0; i < userQuestion[1].length; i++) {
                /*
                if(!word.includes(userQuestion[1][i])) {
                    socket.emit("wordStatus","-1");
                    return;
                }
                */
               if(countChar(word, userQuestion[1][i]) < countChar(userQuestion[1], userQuestion[1][i])) {
                   socket.emit("wordStatus","-1");
                   return;
               }
            }
        }
        else {
            let includesSubstr = false;
            if(userQuestion[0] == 0) {
                includesSubstr = word.startsWith(userQuestion[1]);
            }
            else if(userQuestion[0] == 1) {
                includesSubstr = word.includes(userQuestion[1]);
            }
            else {
                includesSubstr = word.endsWith(userQuestion[1]);
            }
            if(!includesSubstr) {
                socket.emit("wordStatus","-1");
                return;
            }
        }
        if(Game[socket.id].words.has(word)) {
            socket.emit("wordStatus","0");
            return;
        }
        if(!WordChecker.isWord(word)) {
            socket.emit("wordStatus","-1");
            return;
        }
        Game[socket.id].words.add(word);

        if(satisfy(word, Game[socket.id].extra, SpecificWords)) {
            socket.emit("wordStatus","2");
        }
        else {
            socket.emit("wordStatus","1");
        }
    });
    socket.on("RapidRecall:GetPrompt", () => {
        let randomNum = Math.floor(Math.random() * 10); //[0,9]
        //no perms for now
        if(randomNum == 10) {
            //perms
            let randomIdx = Math.floor(Math.random() * Datasets['perms'].length);
            let generatedPerm = selectRandom(Datasets['perms'][randomIdx][1]);
            socket.emit('perm', [generatedPerm, Datasets['perms'][randomIdx][0]]);
            Game[socket.id].prompt = ['perm', generatedPerm];
        }
        else if(randomNum >= 4) {
            //substr
            let randomMode = Math.floor(Math.random() * 3);
            let randomLen = Math.floor(Math.random() * 2) + 2;
            let modes = ['pre','mid','suff'];
            let generatedSubstr = selectRandom(Datasets['substr'][modes[randomMode]][randomLen.toString()]);
            socket.emit('substr-' + modes[randomMode], generatedSubstr);
            Game[socket.id].prompt = [randomMode, generatedSubstr[0]]
        }
        else {
            //include
            let randomMode = Math.floor(Math.random() * 2);
            if(randomMode == 0) {
                let generatedLetters = selectRandom(Datasets['twoInclude']);
                socket.emit('include', generatedLetters);
                Game[socket.id].prompt = ['include', generatedLetters[0]];
            }
            else {
                let generatedLetters = selectRandom(Datasets['threeInclude']);
                socket.emit('include', generatedLetters);
                Game[socket.id].prompt = ['include', generatedLetters[0]];
            }
        }
    });
    socket.on("RapidRecall:GetExtraLife", () => {
        let num = Math.floor(Math.random() * 5);
        Game[socket.id].extra = num;
        socket.emit("RapidRecall:ExtraLife", num);
    });
    socket.on("RapidRecall:GetGameStats", () => {
        let roundWords = Game[socket.id].words;
        let longest = "";
        let score = 0;
        for (let word of roundWords) {
            if(word.length > longest.length) {
                longest = word;
            }
            score += word.length;
        }
        socket.emit("RapidRecall:RoundResults", {
            numWords: roundWords.size,
            score: score,
            longest: longest
        });
    });
}

/*
    find word longer than 9 characters
    3 of the same letters
    starts and ends with the same letter
    is an element
    word is a palindrome
*/

function satisfy(word,idx,SpecificWords) {
    if(idx == 0) {
        return word.length >= 9;
    }
    else if(idx == 1) {
        let map = {};
        for (let i = 0; i < word.length; i++) {
            map[word[i]] = (map[word[i]] || 0) + 1;
        }
        for (let i in map) {
            if(map[i] >= 3) return true;
        }
        return false;
    }
    else if(idx == 2) {
        return word[0] == word[word.length - 1];
    }
    else if(idx == 3) {
        return word in SpecificWords.Chemicals;
    }
    else if(idx == 4) {
        let l = 0;
        let r = word.length - 1;
        while(l < r) {
            if(word[l] != word[r]) {
                return false;
            }
            l++;
            r--;
        }
        return true;
    }
}