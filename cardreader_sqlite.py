import pandas as pd 
import sqlite3

#gM1.pyを利用

Ys = [2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2020, 2020, 2020, 2020, 2020]
Ms = [10, 10, 10, 10, 11, 11, 11, 12, 12, 12, 1, 1, 1, 1, 1]
Ds = [7, 21, 25, 28, 11, 18, 25, 2, 9, 16, 6, 16, 20, 27, 29]
for g in range(0,2):
    a = pd.read_csv('M1/M1-'+str(Ys[g])+str(Ms[g]).zfill(2)+str(Ds[g]).zfill(2)+'.csv',encoding="shift_jis")
    dates = a['年月日'].to_list()
    times = a['時刻'].to_list()
    IDs = a['IDm'].to_list()
    for b in range(len(IDs)):
        dates_li = dates[b]
        times_li = times[b]
        IDs_li = IDs[b]

        #print(dates)
        print(dates_li)
        #print(時刻)
        
        df = pd.read_csv('Studenttable.csv',encoding="cp932")

        lists1 = ['M1','M2','M3','M4','T2','T3_1','T3_2','T4','T5','W3_1','W3_2','W4','W5_1','W5_2','W12','Th2','Th34','Th5_1','Th5_2','F1','F2','F3','F4_1','F4_2']
        lists2 = ["第1回","第2回","第3回","第4回","第5回","第6回","第7回","第8回","第9回","第10回","第11回","第12回","第13回","第14回","第15回","第16回",]
        select_list=[]

        for list in lists1:
            df = pd.read_csv('kougidate/履修者-'+str(list)+'.csv')
            df_IDm =df.query(" IDm== @IDs_li" )

            print(df_IDm)

            #ここから時間比較
            #if not(df_IDm.empty):


        
