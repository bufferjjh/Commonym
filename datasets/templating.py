'''
f = open('allWords.txt')
words = []
for i in f.readlines():
    words.append(i.strip('\n'))

d=dict()
for i in words:
    if(len(i) not in d.keys()):
        d[len(i)] = []
    d[len(i)].append(i)
obj = []
for l in range(4,8):
    for pos in range(1, l - 1):
        for letter in "abcdefghijklmnopqrstuvwxyz":
            cnt = 0
            for w in d[l]:
                if(w[pos] == letter):
                    cnt += 1
            obj.append([l,pos,letter,cnt])
import pickle

with open('template.txt', 'wb') as fh:
   pickle.dump(obj, fh)
'''

'''
import pickle
f = open('allWords.txt')
words = []
for i in f.readlines():
    words.append(i.strip('\n'))
words = set(words)
pickle_off = open ("template.txt", "rb")
emp = pickle.load(pickle_off)

print(len(emp))
emp = [i for i in emp if i[-1] > 500]
emp.sort(key=lambda x: x[-1])
def f(lst):
    temp = ['.'] * lst[0]
    temp[lst[1]] = lst[2]
    print(''.join(temp))
import json
output = open("templates.json","w")
output.write(json.dumps(emp))

'''
'''
f = open('allWords.txt')
words = []
for i in f.readlines():
    words.append(i.strip('\n'))
obj = []
d=dict()
for i in words:
    if(len(i) not in d.keys()):
        d[len(i)] = []
    d[len(i)].append(i)
for l in range(4,6):
    for a in "abcdefghijklmnopqrstuvwxyz":
        for b in "abcdefghijklmnopqrstuvwxyz":
            for i in range(l):
                for j in range(i+1,l):
                    cnt=0
                    for w in d[l]:
                        if(len(w) != l):
                            continue
                        if(w[i] == a and w[j] == b):
                            cnt += 1
                    obj.append([l,a,b,i,j,cnt])
import pickle

with open('template2.txt', 'wb') as fh:
   pickle.dump(obj, fh)
'''
import pickle
pickle_off = open("template2.txt", "rb")
obj1 = pickle.load(pickle_off)
obj1.sort(key = lambda x: x[-1])
obj1.reverse()

five = 30
four = 20
print(len(obj1))
def filterOut():
    keep = []
    for i in obj1:
        if(i[0] == 5 and i[-1] >= five):
            keep.append(i)
    return keep
ret = filterOut()
ret = ret[0:len(ret)//(2) + 30]

import json
output = open("templates2.json","w")
output.write(json.dumps(ret))
print(ret[-1])