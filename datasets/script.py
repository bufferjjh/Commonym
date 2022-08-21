from itertools import permutations
from collections import defaultdict
import json
import random
f = open('allWords.txt')
words = []
for i in f.readlines():
    words.append(i.strip('\n'))
d=dict()
f2 = open("unigram_freq.csv")
vals = []
for i in f2.readlines():
    temp = i.strip("\n")
    temp = temp.split(',')
    temp[1] = int(temp[1])
    d[temp[0]] = temp[1]
    vals.append(temp[1])
vals.sort()
vals.reverse()

def hashWord(s):
    temp = list(s)
    temp.sort()
    return ''.join(temp)
cnt = defaultdict(int)
for i in words:
    cnt[hashWord(i)] += 1


works = []
for i in words:
    if(cnt[hashWord(i)] >= 5):
        if(len(i) >= 4 and len(i) <= 5 and i in d.keys() and d[i] > vals[1000]):
            works.append([i,cnt[hashWord(i)]])

def generatePerms(s):
    perm1 = list(s)
    perms = list(permutations(perm1))
    perms = [list(i) for i in perms]
    perms.pop(0)
    seen = []
    ret = []
    for i in range(10):
        while(True):
            idx = random.randint(0,len(perms)-1)
            if(idx not in seen):
                ret.append(perms[idx])
                break
    return ret

easy = works[0:2000]
medium = works[2000:4000]
hard = works[4000:6000]
seen = set()
output = []
yeet = 0
for i in easy:
    if(hashWord(i[0]) in seen):
        continue
    output.append([cnt[hashWord(i[0])],generatePerms(i[0])])
    seen.add(hashWord(i[0]))
    yeet += 1
for i in medium:

    output.append([i,generatePerms(i)])
for i in hard:

    output.append([i,generatePerms(i)])
outputFile = open("perms.json",'w')
outputFile.write(json.dumps(output))
outputFile.close()
print(yeet)