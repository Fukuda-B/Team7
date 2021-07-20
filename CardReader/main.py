"""
    メイン処理部分
    author: Team7

-----
    スレッディング構成
        Main --> Sub
        Sub  -/> IC (Deamonとして別スレッドで常時監視)
        Sub  -/> Network (別スレッドでイベント発生時実行)

    別スレッドのため、
    ICカード読み取り, ランダムなデータでテストの両方を行うことができる。
-----
    memo:
        https://passlib.readthedocs.io/en/stable/lib/passlib.hash.argon2.html
        https://www.finddevguides.com/Pyqt-qstatusbar-widget
        https://teratail.com/questions/263508
        aiohttp| https://docs.aiohttp.org/en/stable/client_quickstart.html
"""

# ----- 初期化処理 -----
# 起動時にライブラリの自動インストール
import sys
import subprocess
def install():
    f = open('requirements.txt', 'r')
    packages = f.readlines()
    for i in range(len(packages)):
        subprocess.check_call([sys.executable, "-m", "pip", "install", packages[i]])
    f.close()
# install() # 初回以外は実行する必要なし

# 基本的なライブラリをインポートする
from asyncio.tasks import gather
from PyQt5 import QtCore, QtGui, QtWidgets
import time
import datetime
import csv
import json
import sqlite3
import binascii
import nfc
import asyncio
import aiohttp
import aiofiles
# import requests
import threading
from gtts import gTTS
import playsound
from passlib.hash import argon2
from pathlib import Path
from io import BytesIO
import random
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding

# モジュールの読み込み
import main_window # メインウィンドウを表示するモジュール
import gen # 出席ジェネレータ

# ----- 定数宣言 -----
SERVER_URI = 'http://localhost:3000/api/v1/team7'
WebAPI_URI = [
    "http://localhost:3000/api/v1/lecture_rules",
    "http://localhost:3000/api/v1/student_timetable",
    "http://localhost:3000/api/v1/lecture_date"
]
# SERVER_URI = 'http://172.28.92.72:8080/api/v1/team7' # 実習用PC Team7-sub IP
try:
    f = open('WebAPI_Key.txt', 'r', encoding='utf-8')
    API_KEY = f.read()
    f.close()
except:
    # API_KEY = 'ee038e2b7542dcfa599e96aefccd33cdc199adf5f061274689aa0b9341f5cef890884b03c9641338f7dd7bd2e791e43f5a26b7639a828f54a49738b751163a08a8e7f74ba21f90de8ca1de10edd91bf67169839c10bc0359cad86b70887aa887b046f0c63582f6f63612d12033ca856fe28db812ab1cb8e2b00c1b40c6a72b350f93f4691f0b3c008c174cb8465fccd6c75989047965804ec8d283ea71144e935ec35b2e40a59819c6a55b0d504549b7685dfaabb06bc19a3a8ba1964f34258be47569686ce26cabef94cd0c0dc318253c28ac4785fdd0b05f2b27345f74ed0a9e710ed5312f1a072e4b1397145877bf1e272104449ba76531208462e9bd525891b10169bfbaf63108728e9b133c7bba4cfdaa891cd593c5d1348ae3f4111372a8efb48dec8c2b19e9216ca5563a92142a14e12d49e9e8456860f9c4589f2b7cca4bbc48c76f2b16e679ba0a8a30636af08ac3041cb40ba1bfd9e15f751adf31ddee18397604730eb5de5c187c492385c4d030358ca5ad6ed8ef710dacd209b92159abd87790a4f4a34b12d419feea50cc664900f5d2a40c72596fe4d1a897636d74d89ffb0017adde134d086041312181ca5de8ddee8b3b7d0bc73c2a68c9562b16820665cc1633122a55f88024e8f6e4e07c9c430d589ca23c435391cd7bf61e3fc7edc1ecc177110edbe0a02c0116d1e4902e36d762b35875691fcba3694eaee8376030f57b9aeb31d7470021bd1985cc16a2e084aae867aa7664dab724687782f88d1afff9c7940b154f18ccaecfcdb50af38284d60156d649c9e48a5b6602fa0590e830d07168f923e09d125fd04aaa8a8925bffbac472a4b0a1729c9b8d27ebd5ce9337901d68449e7e7930e70e70726a9bbf99a8bf95c8e6220592edb6d120a51f8ee7386412a6f8976e14cdd6b67ff19c13021d51f22c402d5430d5c7d15ee68719ccddeb5daebe62768205e8f430d314094e9e107e704b3fed730238c25151e1c02fb5be9cb66462f0475aadab607a199a7f9cb1294046e7cdfb186735f4df67317e2aa4d11b12bfbe81ac49352267397851161cef30418c5051eb51e80c35a819f38b79e340dc7ff8c2945aad4b86bc5ad9186467dc9dfd9ab32875a67aca78d0c55f2a6fcb5bc2cb03a11b7253adc17a7fcf54c24ddb5c99262ac425268c4ee5efcff09f835368ecd038ae704b6c6af163e88ae6a168f2c0b367b471a10692330df5c5d8dd8ee337965ea7812ec2d647c20680a8c0ef26262e4881341155678ca74aa77aa80ebc795ad59'
    print('WebAPI_Key.txt が存在しません。\n管理者 - 開発者向けページから値をコピーしてWebAPI_Key.txtを作成してください。')

DATABASE = 'attendance.db' # 出席を保存するデータベース
DB_TABLE = 'attendance' # 出席を保存するテーブル

# ----- Main -----
# 画面の表示処理を行う
class Main(QtWidgets.QWidget):
    def __init__(self):
        ''' 画面表示 '''
        # window
        self.app = QtWidgets.QApplication(sys.argv)
        self.MainWindow = QtWidgets.QMainWindow()
        self.ui = main_window.Ui_MainWindow()
        self.ui.setupUi(self.MainWindow)
        self.MainWindow.show()
        # self.MainWindow.showMaximized()
        # self.MainWindow.showFullScreen()
        # self.ui.actionConnect(self.MainWindow)

    def ready(self):
        ''' 画面更新 '''
        _translate = QtCore.QCoreApplication.translate
        self.ui.label.setText(_translate("Team7", "出席管理システム"))
        self.ui.label_2.setText(_translate("Touch ID Card", "IDカードをタッチ"))
        # print('Team7 ready!')

    async def update_i(self, date, nws):
        ''' ステータスバー更新 '''
        if nws: # オンライン状態
            self.ui.statusbar.setStyleSheet("background-color : #5BFF7F")
            text = str(date + '  [online]')
        else: # オフライン状態
            self.ui.statusbar.setStyleSheet("background-color : #FF69A3")
            text = str(date + '  [offline]')
        self.ui.statusbar.showMessage(text)

    def update_main(self, mtext, stext):
        ''' 表示内容の更新 '''
        self.ui.label.setText(mtext)
        self.ui.label_2.setText(stext)


# ----- Sub -----
# 表示以外の内部処理
class Sub():
    def __init__(self, cs):
        self.cs = cs # main ui
        self.cnt = 0 # exec count
        self.fps = 60 # update frame rate
        # network
        self.nc_check = 3 # network check interval (s)
        self.db_check = 180 # database check interval (s)
        self.nc = Network()
        self.nws = '-' # network status
        # timer
        self.timer = QtCore.QTimer()
        self.timer.timeout.connect(self.interval)
        self.timer.start(1000/self.fps)
        # ic card
        ic_card = IC(self.cs)
        self.thread_handle=threading.Thread(target=ic_card.start) # 別スレッドとして生成
        self.thread_handle.setDaemon(True)
        self.thread_handle.start()

        # ec = Encryption()
        # print(ec.aes_d(ec.aes_e("test")))

    def interval(self):
        ''' 定期実行 '''
        self.cnt += 1
        # loop = asyncio.get_event_loop()
        # gather = asyncio.gather( # 並行処理
        #     self.update_n(), # ネットワークの接続状況の更新
        #     self.update_i(), # 画面の更新
        # )
        # loop.run_until_complete(gather)
        asyncio.run(self.update_n())
        asyncio.run(self.update_i())

    async def update_i(self):
        current_time = str(datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S'))
        asyncio.create_task(self.cs.update_i(current_time, self.nws)) # 画面の更新

    async def update_n(self):
        ''' ネットワークの接続状況の確認, データベース更新 '''
        if (self.cnt%(self.fps*self.nc_check) == 0):
            res = asyncio.create_task(self.nc.netstat())
            self.nws = await res

        if (self.cnt%(self.fps*self.db_check) == 0):
            asyncio.create_task(self.nc.get(0))


# ----- Attendance -----
# 出席の判定、履修確認など
class Attendance():
    def __init__(self):
        self.lecture_rules = "./lecture_rules.csv" # サーバから受け取った科目ルールのcsv (utf-8)
        self.student_timetable = "./student_timetable.csv" # 履修状況のcsv (utf-8)
        self.lecture_date = "./lecture_date.csv" # 何回目の講義か
        self.before_time = 15 # 開始時間前の許容範囲 (分)

    def check_taking_lecture(self, lecture_id, idm):
        ''' 履修しているか確認する '''
        csv_file = open(self.student_timetable, "r", encoding="utf-8", errors="", newline="" )
        f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
        head_list = next(f) # header
        try: lecture_index = head_list.index(lecture_id) # 指定された科目の列
        except ValueError: return False # lecture_id の 講義がない場合
        arr = []
        idm_list = [] # idmだけ
        # print(f)
        res = False
        for row in f:
            arr.append(row)
            idm_list.append(row[3])
            if str(row[3]) == str(idm): break
        student_index = idm_list.index(str(idm)) # idmのインデックス取得
        try: result_val = arr[student_index][lecture_index] # 履修状況の値を取得してみる
        except ValueError: return False # 値が存在しない場合
        if result_val == "履修": return True # 履修者
        else: return False

    def check_lecture(self, youbi, dt):
        # dtはdatetime型であることに注意
        ''' 指定された曜日,時間の科目を取得 '''
        csv_file = open(self.lecture_rules, "r", encoding="utf-8", errors="", newline="" )
        f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
        next(f) # header
        arr = []
        for row in f:
            arr.append(row)

        dt_time = datetime.time( # 指定時刻
            int(datetime.datetime.strftime(dt,'%H')),
            int(datetime.datetime.strftime(dt, '%M')),
            int(datetime.datetime.strftime(dt, '%S'))
        )
        dt_time = datetime.datetime.combine(datetime.date.today(), dt_time)

        res = []
        for i in range(len(arr)):
            if str(arr[i][10]) != str(youbi): continue
            cp_stmp = list(map(int, arr[i][4].split(':'))) # 開始時刻の取り出し
            cp_stime_base = datetime.time(cp_stmp[0], cp_stmp[1], 0) # time型にする
            cp_stime_base = datetime.datetime.combine(datetime.date.today(), cp_stime_base) # time deltaはtime型では計算できないので今日の日付を加える
            cp_stime = cp_stime_base - datetime.timedelta(minutes=self.before_time) # 開始時間前の範囲を計算

            cp_etmp = list(map(int, arr[i][5].split(':'))) # 終了時刻の取り出し
            cp_etime = datetime.time(cp_etmp[0], cp_etmp[1], 59) # time型にする
            cp_etime = datetime.datetime.combine(datetime.date.today(), cp_etime)

            if dt_time >= cp_stime and dt_time < cp_etime:
                res.append(arr[i])
        return res

    def check_attend(self, dt, lecture_id):
        # dtはdatetime型であることに注意
        ''' 指定された時刻で出欠を判定 '''
        csv_file = open(self.lecture_rules, "r", encoding="utf-8", errors="", newline="" )
        f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
        next(f) # header
        arr = []
        lecture_index_list = []
        for row in f:
            arr.append(row)
            lecture_index_list.append(row[0])
        try: lecture_index = lecture_index_list.index(lecture_id) # 指定された科目の列
        except ValueError: return False # lecture_id の 講義がない場合
        lecture_arr = arr[lecture_index]

        dt_time = datetime.time( # 指定時刻
            int(datetime.datetime.strftime(dt,'%H')),
            int(datetime.datetime.strftime(dt, '%M')),
            int(datetime.datetime.strftime(dt, '%S'))
        )
        dt_time = datetime.datetime.combine(datetime.date.today(), dt_time)

        cp_stmp = list(map(int, lecture_arr[4].split(':'))) # 開始時刻の取り出し
        cp_stime_base = datetime.time(cp_stmp[0], cp_stmp[1], 0) # datetime型にする
        cp_stime_base = datetime.datetime.combine(datetime.date.today(), cp_stime_base)
        cp_stime = cp_stime_base - datetime.timedelta(minutes=self.before_time) # 開始時間前の範囲を計算

        cp_etmp = list(map(int, lecture_arr[5].split(':'))) # 終了時刻の取り出し
        cp_etime = datetime.time(cp_etmp[0], cp_etmp[1], 59) # datetime型にする
        cp_etime = datetime.datetime.combine(datetime.date.today(), cp_etime)

        cp_atime = cp_stime_base + datetime.timedelta(minutes=int(lecture_arr[6])) # 出席限度時刻の計算
        cp_ltime = cp_stime_base + datetime.timedelta(minutes=int(lecture_arr[7])) # 遅刻限度時刻の計算

        if dt_time >= cp_stime and dt_time < cp_etime: # 開始時間より後 & 終了時間前 か判定
            if dt_time < cp_atime : return '出席' # 出席判定
            elif dt_time < cp_ltime : return '遅刻' # 遅刻判定
            else: return '欠席' # 欠席判定
        else: return '時間外です' # 時間外
        return False

    def get_username(self, idm):
        ''' idmからユーザ名取得 '''
        csv_file = open(self.student_timetable, "r", encoding="utf-8", errors="", newline="" )
        f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
        next(f) # header
        arr = []
        for row in f:
            arr.append(row)
        for i in range(len(arr)):
            if arr[i][3] == idm: return arr[i][1]
        return False # リストに存在しない

    def get_weeks(self, dt, lecture_id):
        # dtはdatetime型であることに注意
        ''' 何回目の講義か取得 '''
        csv_file = open(self.lecture_date, "r", encoding="utf-8", errors="", newline="" )
        f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
        next(f) # header
        arr = []
        for row in f:
            arr.append(row)
        dt_date = str(datetime.datetime.strftime(dt, '%Y-%m-%d'))
        for i in range(len(arr)):
            if arr[i][0] == lecture_id:
                for j in range(len(arr[i])): # とりあえず1000まで探索
                    if arr[i][j] == dt_date: return j
        return False

# ----- IC -----
# ICカードのidm読み取り
class IC():
    def __init__(self, cs):
        self.cs = cs # main ui
        self.net = Network() # connect api server
        self.db = Database() # database
        self.flag = False # delay
        self.last = '' # last idm
        self.min_doubled = 10 # 重複するidmの一定時間読み込み禁止時間 (s)
        self.cs.ui.pushButton.clicked.connect(self.on_connect_dummy) # デバッグ用ボタンをクリックした時のイベント
        self.attendance = Attendance() # class Attendance
        self.gen_lec = '' # attendance generator (lecture_id)
        self.gen_val = '' # attendance generator (tmp)
        self.debug_flag = False
        self.now_lec = '' # now lecture

    def ck_lecture(self):
        ''' 現在の講義を確認 '''
        now_dt = datetime.datetime.now()
        youbi = datetime.datetime.strftime(now_dt, '%a')
        lecture_id = self.attendance.check_lecture(youbi, now_dt) # 講義のID
        if len(lecture_id) > 1:
            f = open('Subjects_Priority.txt', 'r', encoding='utf-8')
            sp = f.read()
            sp_l = sp.split('\n')
            for i in range(len(sp_l)):
                if sp_l[i] == lecture_id[1]:
                    lecture_id = lecture_id[1] # 置き換え
                    break
            if len(lecture_id) > 1: lecture_id = lecture_id[0] # 置き換えられてない = lecture_id[0]
        if lecture_id and len(lecture_id[0]) > 0:
            self.now_lec = [str(lecture_id[0][1]), str(lecture_id[0][0])]
        else: self.now_lec = []

    def on_connect(self, tag):
        ''' タッチされたときの動作 '''
        self.idm = binascii.hexlify(tag.idm).decode().upper()
        if (time.monotonic() - self.flag) > self.min_doubled or self.idm != self.last:
            # self.cs.update_main("出席", "IDm : "+str(self.idm))

            now_date = str(datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S'))
            asyncio.run(self.net.send({"idm":self.idm, "date":now_date})) # データの送信

            dt = datetime.datetime.now() # 現在時刻
            youbi = datetime.datetime.strftime(dt, '%a')

            lecture_id = self.attendance.check_lecture(youbi, dt) # 講義のID
            if len(lecture_id) > 1:
                f = open('Subjects_Priority.txt', 'r', encoding='utf-8')
                sp = f.read()
                sp_l = sp.split('\n')
                for i in range(len(sp_l)):
                    if sp_l[i] == lecture_id[1]:
                        lecture_id = lecture_id[1] # 置き換え
                        break
                if len(lecture_id) > 1: lecture_id = lecture_id[0] # 置き換えられてない = lecture_id[0]
    
            if self.attendance.check_taking_lecture(lecture_id, self.idm): # 履修者の判定
                lecture_no = self.attendance.get_weeks(dt, lecture_id) # 講義の第何回目か
                user_name =  self.attendance.get_username(self.idm) # 出席した人の名前
                user_idm = self.idm # 出席した人のidm
                result = self.attendance.check_attend(dt, lecture_id) # 出席/遅刻/欠席
                # now_date = now_date # 現在の時刻
                # self.db.add_at(lecture_id, lecture_no, user_name, user_idm, result, now_date) # add data to sqlite

                # if self.net.stat:
                #     asyncio.run(self.net.send({"idm":user_idm, "date":now_date})) # データの送信
                # self.sound()
                send_data = {
                    "lecture_id": self.now_lec,
                    # "lecture_id": lecture_id,
                    "week": lecture_no,
                    # "user_name": user_name,
                    "student_id": student_id,
                    "result": result,
                    "date": now_date,
                    "user_idm": user_idm,
                }
                asyncio.run(self.net.send(send_data)) # データの送信
                self.cs.update_main(result, "IDm : "+str(user_idm))
            else: # 履修者ではない場合
                self.cs.update_main("履修者ではありません", "IDカードをタッチ") # 表示


        else:
            self.flag = time.monotonic()
        # self.sound()
        self.last = self.idm
        self.flag = time.monotonic()

    def on_connect_dummy(self):
        ''' デバッグ用 '''
        # now_date = str(datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S'))

        if len(self.now_lec) > 0:
            lecture_id = self.now_lec[1]
        else:
            lecture_id = 'M2'
        # lecture_id = 'M2' # 講義のID

        if len(self.gen_val) < 1 or len(self.gen_lec) < 1:
            self.gen_lec = lecture_id
            self.gen_val = gen.gen(lecture_id) # データが無いときは、データ生成

        row_val = self.gen_val[0] #  [lecture_id, student_id, week, result(null), datetime, idm]
        if self.attendance.check_taking_lecture(lecture_id, row_val[5]): # 履修者の判定
            lecture_no = row_val[2] # 講義の第何回目か
            # user_name = self.attendance.get_username(self.idm) # 出席した人の名前
            user_idm = row_val[5]
            student_id = row_val[1] # 出席した人の名前
            # user_idm = '012E44A7A51'+self.rand_hex_gen(5) # 出席した人のidm
            dt = datetime.datetime.strptime(row_val[4], '%Y-%m-%d %H:%M:%S')
            result = self.attendance.check_attend(dt, str(self.gen_lec)) # 出席/遅刻/欠席
            # now_date = now_date # 現在の時刻
            self.gen_val.pop(0) # 消す

            # データベース処理は、ネットワーク側で処理するように変更
            # self.db.add_at(lecture_id, lecture_no, student_id, user_idm, result, now_date) # add data to sqlite
            # self.db.add_at(lecture_id, lecture_no, student_id, user_idm, result, row_val[4]) # add data to sqlite

            send_data = {
                "lecture_id": lecture_id,
                "week": lecture_no,
                # "user_name": user_name,
                "student_id": student_id,
                "result": result,
                # "date": now_date,
                "date": row_val[4],
                "user_idm": user_idm,
            }
            asyncio.run(self.net.send(send_data)) # データの送信
            # self.sound()
            self.cs.update_main(result, "IDm : "+str(user_idm)) # 表示
            self.debug_flag = True
        else: # 履修者ではない場合
            self.cs.update_main("履修者ではありません", "IDカードをタッチ") # 表示
            self.debug_flag = True

    def rand_hex_gen(self, length:int):
        ''' ランダムな16進数の生成 (デバッグ用) '''
        mlist = ['0','1','2','3','4','5','6','7','8','9','A','B','C','D','E','F']
        res = ''
        for _ in range(length):
            res += random.choice(mlist)
        return res

    def sound(self):
        tts = gTTS('ピッ!', lang='ja')
        tts.save('b.mp3')
        playsound.playsound('b.mp3')

    def read_id(self):
        try:
            clf = nfc.ContactlessFrontend('usb')
            clf.connect(rdwr={'on-connect': self.on_connect})
            clf.close()
        except IOError:
            # print('No such device')
            return False

    def start(self):
        ''' タッチ待ち '''
        while True:
            self.ck_lecture() # 現在の講義を確認
            self.read_id() # idm読み込み待ち
            time.sleep(1.5)
            if self.debug_flag:
                time.sleep(1.5)
                if len(self.now_lec) > 0: self.cs.update_main(self.now_lec[0]+'('+self.now_lec[1]+')', "ICカードをタッチ") # 講義がある時間帯
                else: self.cs.ready() # 初期状態に戻す (講義時間外)
                self.debug_flag = False
            else:
                if len(self.now_lec) > 0: self.cs.update_main(self.now_lec[0]+'('+self.now_lec[1]+')', "ICカードをタッチ") # 講義がある時間帯
                else: self.cs.ready() # 初期状態に戻す (講義時間外)


# ----- Database -----
# ローカルデータベースの読み書き
class Database():
    def __init__(self):
        self.fname = DATABASE
        self.tname = DB_TABLE
        # create database if not exists
        # | No. | Lecture ID | Lecture No. | User Name | User ID | Result | Datetime | 
        Path(self.fname).touch(exist_ok=True)
        self.sql('CREATE TABLE IF NOT EXISTS ' + str(self.tname) + '('+\
            'lecture_id TEXT NOT NULL, '+\
            'lecture_no INTERGER NOT NULL, '+\
            'user_name TEXT, '+\
            'user_idm TEXT NOT NULL, '+\
            'result TEXT NOT NULL, '+\
            "datetime TEXT)")
            # "datetime TEXT DEFAULT (datetime(CURRENT_TIMESTAMP,'localtime'))")

    def sql(self, q):
        connection = sqlite3.connect(self.fname)
        cur = connection.cursor()
        print(q) # クエリの表示
        cur.execute(q)
        # print(cur.fetchall())
        val = cur.fetchall()
        cur.close()
        connection.commit()
        connection.close()
        return val

    def add_at(self, lecture_id, lecture_no, user_name, user_idm, result, datetime): # add attendance
        try:
            self.sql('INSERT INTO '+ str(self.tname) + ' VALUES ("'+lecture_id+'",'+lecture_no+',"'+user_name+'","'+user_idm+'","'+result+'","'+datetime+'")')
            return True
        except: return False

    def get_all(self):
        try:
            return self.sql('SELECT * FROM '+ str(self.tname))
        except: return False

    def del_all(self):
        try:
            self.sql('DELETE FROM '+ str(self.tname))
            return True
        except: return False

# ----- Network -----
# ネットワーク接続状況やサーバへのデータ送信処理
class Network():
    def __init__(self):
        self.netCheck = 'https://www.google.com/'
        # self.netCheck = SERVER_URI
        self.netCheckT = 3 # connection timeout
        self.server = SERVER_URI
        self.apiKey = API_KEY
        self.apiuri = WebAPI_URI
        self.stat = False
        self.db = Database()

    async def netstat(self):
        ''' ネットワークの接続確認 '''
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.netCheck, compress=True):
                    self.stat = True
                    db_data = self.db.get_all() # 一時的なデータベースに存在するか確認
                    if len(db_data) > 0: await self.send_multi(db_data)
                    return True
        except:
            self.stat = False
            return False
        # try:
        #     requests.head(self.netCheck, timeout=self.netCheckT)
        #     return True
        # except requests.ConnectionError:
        #     return False

    async def send(self, data):
        data["multiple"] = "False"
        data["x"] = self.apiKey # 送信データにAPIの暗号鍵追加
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.server, data=data) as resp:
                    # print(resp)
                    # res = resp.text()
                    # return True
                    if (resp.headers['Content-Length']=='2' and resp.status==200): # 正常終了
                        return True
                    else: # エラー時
                        self.db.add_at(
                            data.lecture_id,
                            data.week,
                            data.student_id,
                            data.result,
                            data.date,
                            data.user_idm) # 内部データベースに追加
                        return False
        except:
            return False

    async def send_multi(self, datas):
        data = {}
        data["datas"] = json.dumps(datas)
        data["multiple"] = "True"
        data["x"] = self.apiKey # 送信データにAPIの暗号鍵追加
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.server, data=data, timeout=600) as resp:
                    # print(resp.status == 200)
                    # res = resp.text()
                    # return True
                    # print(resp.text)
                    # print(resp.status)
                    if (resp.headers['Content-Length']=='2' and resp.status==200): # 正常終了
                        self.db.del_all() # 正常に送信したら、内部データベースを更新
                        return True
                    else: return False
        except:
            return False

    async def get(self, opt):
        data = {}
        data["x"] = self.apiKey # 送信データにAPIの暗号鍵追加
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.apiuri[opt], data=data) as resp: # タイムアウトは長め
                    print(resp)
                    if resp.status == 200:
                        if opt == 1: fname = 'lecture_rules_.csv'
                        elif opt == 2: fname = 'student_timetable_.csv'
                        else : fname = 'lecture_date_.csv'
                        f = await aiofiles.open(fname, mode='wb')
                        await f.write(await resp.read())
                        await f.close()
                        print('end')
                        return
        except:
            return False


# ----- Encryption -----
# 暗号化/復号、ハッシュ導出
class Encryption():
    def __init__(self):
        self.key = 'hi_Team7'.encode('utf-8')
        self.iv = 'hi_Team7'.encode('utf-8')
        self.salt = 'hi_Team7'.encode('utf-8')
        # $argon2id$v=19$m=10240,t=5,p=2$aGlfVGVhbTc$DRHCMsKSR6ACYFzC6Vrk69JuglH+bHLkPJQT76cDNIHhnoUMTTtmOI5K4e2AufEzMBvgOyZLtKECgEyjvnGcD+BpBR1wksLwtrrGyg+iOubPV4QjOPfqzttI/HcsyRQfNaNogZUaVu3SALqxXDkUEbNKRKVnHGVcxgoy+/+Zu5E # TeamB
        self.iv_aes = 'aGlfVGVhbTc$DRHC'.encode('utf-8') # TeamB
        self.key_aes = 'SALqxXDkUEbNKRKVnHGVcxgoy+/+Zu5E'.encode('utf-8')

    def argon2(self, data):
        ''' ハッシュ化 (同じパラメータでも、nodejs(サーバ側)と出力は異なることに注意) '''
        return argon2.using(type="ID", salt=self.salt, parallelism=2, rounds=5, memory_cost=1024*10, digest_size=128).hash(data)

    def aes_e(self, data):
        ''' AES暗号化 パディングはPKCS7-256'''
        if (type(data) is not bytes): # bytes型に変換して暗号化する
            data = data.encode("shift-jis")
        padder = padding.PKCS7(256).padder() # change padding
        padded_data = padder.update(data)
        padded_data += padder.finalize()

        cipher = Cipher(algorithms.AES(self.key_aes), modes.CBC(self.iv_aes))
        encryptor = cipher.encryptor()
        ct = encryptor.update(padded_data) + encryptor.finalize()
        return ct

    def aes_d(self, ct):
        ''' AES復号 パディングはPKCS7-256'''
        cipher = Cipher(algorithms.AES(self.key_aes), modes.CBC(self.iv_aes))
        decryptor = cipher.decryptor()
        data = decryptor.update(ct) + decryptor.finalize()

        unpadder = padding.PKCS7(256).unpadder()
        data = unpadder.update(data)
        return (data + unpadder.finalize()).decode("shift-jis")

# 実行
if __name__ == "__main__":
    application = Main()
    application.ready()
    sub_proc = Sub(application)

    # nn = Network()
    # loop = asyncio.get_event_loop()
    # loop.run_until_complete(nn.send({"idm":"b"}))

    sys.exit(application.app.exec_())
