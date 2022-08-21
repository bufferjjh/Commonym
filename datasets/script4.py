'''
f = open('allWords.txt')
words = []
for i in f.readlines():
    words.append(i.strip('\n'))
d=dict()
cnt = 0
for i in words:
    i1 = sorted(list(i))
    seen= set()
    for a in range(len(i1)):
        for b in range(a, len(i1)):
            for c in range(b, len(i1)):
                seen.add(i1[a]+i1[b]+i1[c])
    for w in seen:
        if(w not in d.keys()):
            d[w] = 1
        else:
            d[w] += 1
    cnt +=1
    print(cnt, end='\r')
import pickle
with open('include3.txt', 'wb') as fh:
   pickle.dump(d, fh)
'''

import pickle
pickle_off = open ("include3.txt", "rb")
d = pickle.load(pickle_off)
k = list(d.keys())
k = [i for i in k if d[i] >= 5000]
print(len(k))
k = [[i,d[i]] for i in k]
import json
out = open("threeInclude.json", 'w')
out.write(json.dumps(k))

