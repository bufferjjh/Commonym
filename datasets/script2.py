from collections import defaultdict
alpha = 'abcdefghijklmnopqrstuvwxyz'
writeOut = dict()
f = open('allWords.txt')
words = []
for i in f.readlines():
    words.append(i.strip('\n'))
prefix2 = defaultdict(int)
prefix3 = defaultdict(int)
contain2 = defaultdict(int)
contain3 = defaultdict(int)
end2 = defaultdict(int)
end3 = defaultdict(int)
for i in words:
    if(len(i) < 3):
        continue
    prefix2[i[0:2]] += 1
    prefix3[i[0:3]] += 1
    end3[i[-3:]] += 1
    end2[i[-2:]] += 1
    two = set()
    three = set()
    for j in range(len(i)-1):
        two.add(i[j: j + 2])
    for j in range(len(i)-2):
        three.add(i[j: j + 3])
    for j in two:
        contain2[j] += 1
    for j in three:
        contain3[j] += 1

prefix2Keys = prefix2.keys()
prefix3Keys = prefix3.keys()

contain2Keys = contain2.keys()
contains3Keys = contain3.keys()

end2Keys = end2.keys()
end3Keys = end3.keys()

def annotate(lst,d):
    return [[i,d[i]] for i in lst]

def filterOut(d):
    works = []
    for i in d.keys():
        if(d[i] >= 60):
            works.append(i)
    return works
prefixObj = dict()
prefixObj[2] = annotate(filterOut(prefix2), prefix2)
prefixObj[3] = annotate(filterOut(prefix3), prefix3)

containObj = dict()
containObj[2] = annotate(filterOut(contain2), contain2)
containObj[3] = annotate(filterOut(contain3), contain3)

endObj = dict()
endObj[2] = annotate(filterOut(end2), end2)
endObj[3] = annotate(filterOut(end3),end3)

writeOut['pre'] = prefixObj
writeOut['mid'] = containObj
writeOut['suff'] = endObj
import json
outputFile = open('substr.json', 'w')
outputFile.write(json.dumps(writeOut))
outputFile.close()