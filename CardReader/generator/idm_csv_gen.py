# データベースにインポートするための形式にする
# フォルダr内の履修者リスト(utf-8)から、学籍番号とIDmのリスト(Shift-jis)生成

import csv

lecture = ["M1","M2","M3","M4","T2","T3_1","T3_2","T4","T5","W12","W3_1","W3_2","W4","W5_1","W5_2","Th2","Th34","Th5_1","Th5_2","F1","F2","F3","F4_1","F4_2"]
for lec in range(len(lecture)):
  csv_file = open("r/履修者-"+lecture[lec]+".csv", "r", encoding="utf-8", errors="", newline="" )
  f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)

  next(f)
  data = []
  for row in f:
      data.append(row)

  out = []
  for i in range(len(data)):
    inp = [data[i][4]]
    inp.append(data[i][0])
    out.append(inp)
  with open("idm/IDm-"+lecture[lec]+".csv", "w", newline="", encoding="cp932") as f:
      writer = csv.writer(f)
      writer.writerow(['IDm','学籍番号'])
      writer.writerows(out)
