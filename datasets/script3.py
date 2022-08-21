f = open('allWords.txt')
words = []
for i in f.readlines():
    words.append(i.strip('\n'))

two = dict()
alpha = 'abcdefghijklmnopqrstuvwxyz'
vals = []
for i in range(26):
    for j in range(i + 1, 26):
        cnt = 0
        for w in words:
            if(alpha[i] in w and alpha[j] in w):
                cnt += 1
        two[alpha[i] + alpha[j]] = cnt
        vals.append(alpha[i] + alpha[j])
def annotate(lst):
    return lst
import json
vals=[[i,two[i]] for i in vals]
output = open("twoInclude.json",'w')
output.write(json.dumps(vals) + "\n")
output.close()