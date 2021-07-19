# データベースにインポートするための形式にする
# 全科目分の結合

import csv
lecture = ["M1","M2","M3","M4","T2","T3_1","T3_2","T4","T5","W12","W3_1","W3_2","W4","W5_1","W5_2","Th2","Th34","Th5_1","Th5_2","F1","F2","F3","F4_1","F4_2"]
out = []
for SubjectID in lecture:
  Filein = f'sub/{SubjectID}.csv'
  csv_file = open(Filein, "r", encoding="cp932", errors="", newline="" )
  f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
  next(f)
  for row in f:
      out.append(row)

FileOut = f'all.csv'
header = ['lecture_id'] + ['student_id'] + ['week'] + ['result'] + ['datetime'] + ['idm']
with open(FileOut, 'w', newline="", encoding="shift-jis") as outfile:
    writer = csv.writer(outfile)
    writer.writerow(header)
    writer.writerows(out)
