idm_csv_gen.py: もらったcsvファイルから、各教科のIDmと学籍番号のcsvを作る (./r/*)
attend_csv_gen.py: idm_csv_gen.pyで作ったcsvファイルから、出席状況のcsvを作る (欠席率を指定することもできる) (./sub/)
csv_join.py: attend_csv_gen.pyで作った出席状況のcsvを全科目を1つのcsvにまとめる
