f = open('allWords.txt')
words = []
for i in f.readlines():
    words.append(i.strip('\n'))

'''
output = open("chemicals.txt",'w')
d=dict()
for i in words:
    d[i[1].lower()] = '1'
import json
output.write(json.dumps(d))
output.close()
'''
for i in words:
    if('r' in i and 'v' in i and len(i) > 9):
        print(i)
        break