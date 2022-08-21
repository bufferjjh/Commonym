'''
track=dict()
f = open('allWords.txt')
words = []
for i in f.readlines():
    words.append(i.strip('\n'))
l = 0
for i in words:
    i1 = sorted(list(i))
    seen = set()
    for a in range(len(i1)):
        for b in range(a, len(i1)):
            for c in range(b, len(i1)):
                for d in range(c, len(i1)):
                    seen.add(i1[a] + i1[b] + i1[c] + i1[d])
    for j in seen:
        if(j not in track.keys()):
            track[j] = 1
        else:
            track[j] += 1
    l += 1
    print(l, end='\r')
import pickle

with open('include4.txt', 'wb') as fh:
   pickle.dump(track, fh)
'''

import pickle
pickle_off = open ("include4.txt", "rb")
emp = pickle.load(pickle_off)

k = list(emp.keys())
k.sort(key=lambda x: emp[x])
k.reverse()

obj = []
for i in range(5000):
    obj.append([k[i],emp[k[i]]])
import json
w = open("fourInclude.json","w")
w.write(json.dumps(obj))
