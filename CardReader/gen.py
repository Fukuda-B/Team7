"""
    gen.py 出席ジェネレータ
    author: Team7

-----
    ./generator/* の idm_csv_gen.py, attend_csv_gen.pyで各csvを生成しておくこと

"""
import csv
def gen(lecture_id):
    ''' 出席情報を取得 '''
    csv_file = open("generator/sub/"+str(lecture_id)+".csv", "r", encoding="utf-8", errors="", newline="" )
    f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
    next(f) # header
    arr = []
    for row in f:
        arr.append(row)
    return arr

if __name__ == "__main__":
    print(gen("M1"))