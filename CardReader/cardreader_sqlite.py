import pandas as pd 
import sqlite3
import datetime as dt

#gM1.pyを利用
#IDm-M1.csvを利用
Ys = [2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2019, 2020, 2020, 2020, 2020, 2020]
Ms = [10, 10, 10, 10, 11, 11, 11, 12, 12, 12, 1, 1, 1, 1, 1]
Ds = [7, 21, 25, 28, 11, 18, 25, 2, 9, 16, 6, 16, 20, 27, 29]

for g in range(0,1):
    a = pd.read_csv('M1/M1-'+str(Ys[g])+str(Ms[g]).zfill(2)+str(Ds[g]).zfill(2)+'.csv',encoding="shift_jis")
    dates = a['年月日'].to_list()
    times = a['時刻'].to_list()
    IDs = a['IDm'].to_list()
    for b in range(len(IDs)):
        dates_li = dates[b]
        times_li = times[b]
        IDs_li = IDs[b]

        #print(dates)
        #print(時刻)
        
        #df = pd.read_csv('Studenttable.csv',encoding="cp932")
        
        df = pd.read_csv('kouginittei.csv',encoding="shift_jis")
        #文字列型をデータタイム型に変更
        now= dates_li+" "+times_li
        print(now)
        dt_now = dt.datetime.strptime(now, '%Y-%m-%d %H:%M:%S')
        dt_day = str(dt_now.year)+"/"+str(dt_now.month)+"/"+str(dt_now.day)
        print(dt_day)
        d_day=df.query('date == @dt_day')
        if(d_day.empty):
            print("今日は講義がありません")
        else:
            l_week=d_day['lecture_week'].to_string(index=False)
            time=d_day['times'].to_string(index=False)
            print(l_week)
            print(time)

            df1 = pd.read_csv('Lecture-Rules.csv',encoding="shift_jis")
            #print(df1)

            d_week = df1.query('曜日 == @l_week')
            #print(d_week)
            

            dt_time=dt.time(dt_now.hour,dt_now.minute)
            #print(dt_time)
            #print(type(dt_time))
            
            st_time=d_week["受付時間"].to_list()
            at_time=d_week["終了時間"].to_list()
            for i in range(len(at_time)):
                st_dt = dt.datetime.strptime(st_time[i],'%H:%M')
                at_dt = dt.datetime.strptime(at_time[i],'%H:%M')
                st_dtime=dt.time(st_dt.hour,st_dt.minute)
                at_dtime=dt.time(at_dt.hour,at_dt.minute)
                print(st_dtime)
                print(at_dtime)
                if(st_dtime<=dt_time and dt_time<at_dtime):
                    lecture_select=d_week.query('index=@i')
                    print(lecture_select)
                    
                    #途中です
