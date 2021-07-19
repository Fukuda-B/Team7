import os
import random
from datetime import datetime
import csv
from operator import itemgetter, attrgetter

# 欠席率 (ランダム)
oyasumi = 0.05

lecture = ["M1","M2","M3","M4","T2","T3_1","T3_2","T4","T5","W12","W3_1","W3_2","W4","W5_1","W5_2","Th2","Th34","Th5_1","Th5_2","F1","F2","F3","F4_1","F4_2"]
# ランダムな時間と秒を発生させる関数
# 年，月，日，開始時間は固定，乱数の分布として正規分布を設定
def generate_random_datetimes(Y, M, D, H, m0, mu, sigma, N):
    MinMax = 59
    rand_datetimes = []
    for i in range(N):
        ValMin = int(random.normalvariate(mu, sigma))
        m = m0+ValMin
        Hp = H
        Mp = m
        # 分が59を超えたら時間を+1，分を-60
        if Mp > MinMax:
            Hp += 1
            Mp -= MinMax+1
        # 分が負の値となったら時間を-1，分を+60
        elif Mp < 0:
            Hp -= 1
            Mp += MinMax+1
        # 一旦datetime型のnowに今の時刻を入れる
        now = datetime.now()
        # 設定したランダム日時に入れ替える
        # 秒は一様乱数で1から59までの値を入れる
        rand_datetime = now.replace(year=Y, month=M, day=D, hour=Hp, minute=Mp,
                                    second=random.randint(1,59))
        rand_datetimes.append(rand_datetime)
    return rand_datetimes

for SubjectID in lecture:
    tmp_lecture = []

    ddddd = {
    "M1":{ "H": 8, "m0": 50 },
    "M2":{ "H": 10, "m0": 30 },
    "M3":{ "H": 12, "m0": 50 },
    "M4":{ "H": 14, "m0": 30 },
    "T2":{ "H": 10, "m0": 30 },
    "T3_1":{ "H": 12, "m0": 50 },
    "T3_2":{ "H": 12, "m0": 50 },
    "T4":{ "H": 14, "m0": 30 },
    "T5":{ "H": 16, "m0": 10 },
    "W12":{ "H": 8, "m0": 50 },
    "W3_1":{ "H": 12, "m0": 50 },
    "W3_2":{ "H": 12, "m0": 50 },
    "W4":{ "H": 14, "m0": 30 },
    "W5_1":{ "H": 16, "m0": 10 },
    "W5_2":{ "H": 16, "m0": 10 },
    "Th2":{ "H": 10, "m0": 30 },
    "Th34":{ "H": 12, "m0": 50 },
    "Th5_1":{ "H": 16, "m0": 10 },
    "Th5_2":{ "H": 16, "m0": 10 },
    "F1":{ "H": 8, "m0": 50 },
    "F2":{ "H": 10, "m0": 30 },
    "F3":{ "H": 12, "m0": 50 },
    "F4_1":{ "H": 14, "m0": 30 },
    "F4_2":{ "H": 14, "m0": 30 },
    }

    # 講義の回ごとの年，月，日のリスト．時間割にしたがって設定
    Ys = [2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2020, 2020, 2020, 2020, 2020] 
    Ms = [10, 10, 10, 10, 11, 11, 11, 12, 12, 12, 1, 1, 1, 1, 1]
    Ds = [7, 21, 25, 28, 11, 18, 25, 2, 9, 16, 6, 16, 20, 27, 29]
    # 開始時刻
    H = ddddd[SubjectID]["H"]
    m0 = ddddd[SubjectID]["m0"]
    # 講義回ごとの正規分布の平均(mus)と標準偏差(sigmas)
    mus = [3, 5, 5, 7, 9, 10, 10, 10, 10, 10, 12, 10, 11, 8, 7]
    sigmas = [5, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10]

    # 履修者のIDmのリストの入ったCSVファイルを開く
    DataIDm = []
    fileIDm = f'idm/IDm-{SubjectID}.csv'
    with open(fileIDm, 'r') as file:
        reader = csv.reader(file)
        next(reader)
        for row in reader:
            DataIDm.append(row)

    # リストYsの長さ(=講義回)でループ
    for i in range(len(Ys)):
        Y = Ys[i]
        M = Ms[i]
        D = Ds[i]
        mu = mus[i]
        sigma = sigmas[i]
        N = len(DataIDm)
        RD = generate_random_datetimes(Y, M, D, H, m0, mu, sigma, N)

        oyasumi_i = []

        # DataRDがランダムな時間を格納するリスト
        DataRD = []
        for j in range(len(RD)):
            YMD = '{:%Y-%m-%d}'.format(RD[j])
            HTS = '{:%X}'.format(RD[j])
            DataRD.append(YMD+' '+HTS)

        # 時間の順にソートする
        DataRD.sort(key=itemgetter(1))

        # シャッフル
        numbers = [j for j in range(len(DataIDm))]
        random.shuffle(numbers)

        # リストにIDmを付加する
        for j in range(len(RD)):
            k = numbers[j]
            tmp = []
            tmp.append(SubjectID) # lecture_id
            tmp.append(DataIDm[k][1]) # student_id
            tmp.append(i+1) # week
            tmp.append("") # result
            tmp.append(DataRD[j]) # datetime
            tmp.append(DataIDm[k][0]) # idm
            DataRD[j] = tmp
        tmp_lecture.extend(DataRD)

    for j in reversed(range(len(tmp_lecture))): # おやすみ
        if random.random() <= oyasumi:
            tmp_lecture.pop(j)

    # ファイルに出力
    # データを出力するディレクトリがなければ作成 
    os.makedirs('sub', exist_ok=True)
    header = ['lecture_id'] + ['student_id'] + ['week'] + ['result'] + ['datetime'] + ['idm']
    FileOut = f'sub/{SubjectID}.csv'
    with open(FileOut, 'w', newline="", encoding="shift-jis") as outfile:
        writer = csv.writer(outfile)
        writer.writerow(header)
        writer.writerows(tmp_lecture)
