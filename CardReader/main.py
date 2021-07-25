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
from cryptography.fernet import Fernet
import aiohttp
import aiofiles

# モジュールの読み込み
import main_window # メインウィンドウを表示するモジュール
import gen # 出席ジェネレータ

# ----- 定数宣言 -----
DEBUG_LECTURE_ID = 'AUTO' # 'AUTO' は時間に合わせて自動でデバッグする講義を選択
# DEBUG_LECTURE_ID = 'T4' #  講義IDを指定するとボタンを押したときに入力される科目が変わる
ENCRYPT_OPTION = True # 内部データの暗号化 (True = 暗号化する / False = 暗号化しない) | 値の変更後は、内部データの更新のために2度再起動が必要
DATE_DEBUG = True # 講義がない日でも、指定の曜日になったら講義を開始する (デバッグ用)

SERVER_URI = 'http://localhost:3000/api/v1/team7'
# SERVER_URI = 'http://172.28.92.72:8080/api/v1/team7' # 実習用PC Team7-sub IP
WebAPI_URI = [
    "http://localhost:3000/api/v1/lecture_rules",
    "http://localhost:3000/api/v1/student_timetable",
    "http://localhost:3000/api/v1/lecture_date"
]
try:
    f = open('WebAPI_Key.txt', 'r', encoding='utf-8')
    API_KEY = f.read()
    f.close()
except:
    # API_KEY = '2722d1e002fc3ec912b02aaa02e0cf8f03f673472dfd0e3cafa0a6e83dd547efb71950afd26087ebf816a926b9fb2a783c3d7d7da5cd33da7ff7606b18566edddc64760534d71aa836aa3f6febaa7117e8aa4061129ffab472c05a104e59d7276b98dd179581ed0cf8a20a9f1b2a956d3982f294a8a6f7c638c580b3216b10ca9d297b45cc497fef9c7fb2bf9aa9b2c3ed669f158127fe77e771e4b7e608f6ae857d53914c2f4f6b7e375d2a3c0634b01372a1cfeecbc195031267d53a777d5892b8f7bc7ed5651d1d031852db8dec9aea9e134b78b1043f4e23d678c77a1380d85f991d7a12d2c2fc6545f41d7a15ffe7a9ebe95a033bb0591e3c0188a454d3df02991d9dc3af61ccb830e26b51f49ff489796002b146a3d8803b1a6e9c5c742ffe98566c806ea2e4f45b9c4318eeb211aa5d6be872890381899b932d0d9eae370eb1bc0e2231ae703515eece06546d9b6aa14a35d33292764fd12321e1f6669ce523713a85eb77c083222bc93d1829a6ade75d19a550d75927f1ec853760e6ab993067c97f4c6e101952410ae7272613b0657dace3c8690fea17c149c887433acc3a4e83cc45cdfe7915ec75b59f8e9df042f17c44f9e312089c5eefdc55f647ccb19cd6bd449829225f9593af0a3b38c06981134cb3ead05d7e71dd6ee23c77a015bf7600d393789ee004fedbc2282ae963be255011a9bc8e1811b79217c455babd8dd35ea90f24fa086ab127c258afe65a131ccd7f3954b2c145571c88e7cecc363c9caaf0285c366b7ccd2225f72a1c68bf50f186a402a03ad3e6b64c6fe779de361823e2746d71f818d684ede9b307b5fd18fa5e8d212e50c26604c5ebd77fbca34419334e621181533bc3fbdc9fda801c7e8c04e87c8f694d4da4c2b32959cd163e73381593bdb4a1984317ae28f611b16bc34d5e239267899cefa7a00495d9a3df3a2e4f30ed2b61448dde9eab2c0dec07d2aba86a42f779770b7e43a608e450a3921db5dff220e057667a6bbda5238649506090006aa2eebb244794b82d372b8d3e73037753a73d5548dba4d840490f5d33585efd8afd2ac8465e998a42c584b5412805e48f15b217aaee09b9f183fbf7ea46a3c908ccb9285863d117c5b10baeb37f54dd10de2f957e8936912f98325b73035f313de5998cc44fe279f85d9a70ea3462fdd78f80007f62f56fc91ecfd744741277fd68f15b7b82fca779644f451c84f8d32580c448a21dec4078398cb41c175e0dc8fce38ba52c585b09e2f45dbbd2b6fb91845fb570f4dd'
    print('WebAPI_Key.txt が存在しません。\n管理者 - 開発者向けページから値をコピーしてWebAPI_Key.txtを作成してください。\nTeam7/CardReader ディレクトリで実行されていることを確認してください。')


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
        self.ui.label_3.setText(_translate("", ""))
        # print('Team7 ready!')

    async def update_i(self, date, nws, db_last_update):
        ''' ステータスバー更新 '''
        if ENCRYPT_OPTION: enc_stat = '有効' # 内部データの暗号化状態
        else: enc_stat = '無効'

        if nws: # オンライン状態
            self.ui.statusbar.setStyleSheet("background-color : #5BFF7F")
            text = str('現在時刻：'+date+'  [online]  | 内部データ 最終更新日時：'+db_last_update+'  暗号化：'+enc_stat)
        else: # オフライン状態
            self.ui.statusbar.setStyleSheet("background-color : #FF69A3")
            text = str('現在時刻：'+date+'  [offline] | 内部データ 最終更新日時：'+db_last_update+'  暗号化：'+enc_stat)
        self.ui.statusbar.showMessage(text)

    def update_main(self, mtext, stext, sstext):
        ''' 表示内容の更新 '''
        self.ui.label.setText(mtext) # 中央
        self.ui.label_2.setText(stext) # 1番下
        self.ui.label_3.setText(sstext) # label_2の上

# ----- Sub -----
# 表示以外の内部処理
class Sub():
    def __init__(self, cs):
        self.cs = cs # main ui
        self.cs.ui.action_8.triggered.connect(lambda : self.cnt_reset()) # 内部データの更新
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
        self.thread_handle = threading.Thread(target = ic_card.start) # 別スレッドとして生成
        self.thread_handle.setDaemon(True)
        self.thread_handle.start()

        # ec = Encryption()
        # print(ec.aes_d(ec.aes_e("test")))

    def cnt_reset(self):
        self.cnt = 0

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
        asyncio.create_task(self.cs.update_i(current_time, self.nws, self.nc.db_last_update)) # 画面の更新

    async def update_n(self):
        ''' ネットワークの接続状況の確認, データベース更新 '''
        if (self.cnt%(self.fps*self.nc_check) == 0 or self.cnt < 2):
            res = asyncio.create_task(self.nc.netstat()) # ネットワーク状態の確認
            self.nws = await res

        if (self.cnt%(self.fps*self.db_check) == 0 or self.cnt < 2):
            await asyncio.create_task(self.nc.get(0)) # 講義ルールの更新
            await asyncio.create_task(self.nc.get(1)) # 履修情報の更新
            await asyncio.create_task(self.nc.get(2)) # 講義日の更新

# ----- Attendance -----
# 出席の判定、履修確認など
class Attendance():
    def __init__(self):
        self.lecture_rules = "./lecture_rules.tm7" # 暗号化された科目ルールデータ (shift-jis)
        self.student_timetable = "./student_timetable.tm7" # 暗号化された履修状況データ (shift-jis)
        self.lecture_date = "./lecture_date.tm7" # 暗号化された講義日データ
        self.before_time = 15 # 開始時間前の許容範囲 (分)
        # Path(self.lecture_rules).touch(exist_ok=True)
        # Path(self.student_timetable).touch(exist_ok=True)
        # Path(self.lecture_date).touch(exist_ok=True)
        self.enc = Encryption() # 暗号化/複合クラス

    def open_tm7_file(self, fname):
        ''' ".tm7"ファイルを開く '''
        try:
            json_open = open(fname, 'r')
            json_val = json_open.read()
            json_load = json.loads(self.enc.fernet_d(json_val)) # データの復号
            return json_load
        except:
            print('内部データファイルが存在しません。')
            return False

    def check_taking_lecture(self, lecture_id, idm):
        ''' 履修しているか確認する '''
        # csv_file = open(self.student_timetable, "r", encoding="utf-8", errors="", newline="" )
        # f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
        # head_list = next(f) # header
        json_load = self.open_tm7_file(self.student_timetable)
        head_list = json_load.pop(0)
        try: lecture_index = head_list.index(lecture_id) # 指定された科目の列
        except ValueError: return False # lecture_id の 講義がない場合
        arr = []
        idm_list = [] # idmだけ
        # print(f)
        res = False
        for row in json_load:
            arr.append(row)
            idm_list.append(row[3])
            if str(row[3]) == str(idm): break
        try:
            student_index = idm_list.index(str(idm)) # idmのインデックス取得
            result_val = arr[student_index][lecture_index] # 履修状況の値を取得してみる
        except ValueError: return False # 値が存在しない場合
        if result_val == "履修": return True # 履修者
        else: return False

    def check_lecture(self, dt):
        # dtはdatetime型であることに注意
        ''' 指定された日, 時間の科目を取得
            DATE_DEBUG = True の場合、指定された日付に講義がない場合、曜日で判定
        '''
        # csv_file = open(self.lecture_rules, "r", encoding="utf-8", errors="", newline="" )
        # f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
        # next(f) # header
        json_load = self.open_tm7_file(self.lecture_rules)
        json_load.pop(0)
        json_load2 = self.open_tm7_file(self.lecture_date)
        json_load2.pop(0)
        arr = []
        arr2 = []
        for row in json_load: arr.append(row)
        for row in json_load2: arr2.append(row)

        youbi = datetime.datetime.strftime(dt, '%a') # 曜日の取得
        dt_time = datetime.time( # 指定時刻
            int(datetime.datetime.strftime(dt, '%H')),
            int(datetime.datetime.strftime(dt, '%M')),
            int(datetime.datetime.strftime(dt, '%S'))
        )
        dt_time = datetime.datetime.combine(datetime.date.today(), dt_time)

        res = []
        td_lecture = []
        dt_date = datetime.datetime.strftime(dt, '%Y-%m-%d')
        for i in range(len(arr2)): # 講義の日付から判定
            for j in range(len(arr2[i])):
                if str(dt_date) == str(arr2[i][j]):
                    # td_lecture.append([arr2[i][0], j-1])
                    td_lecture.append(arr2[i][0])

        if DATE_DEBUG and len(td_lecture) < 1: # デバッグ用
            for i in range(len(arr)):
                if str(arr[i][10]) == str(youbi):
                    td_lecture.append(arr[i][0])

        for i in range(len(arr)):
            # if str(arr[i][10]) != str(youbi): continue
            if not str(arr[i][0]) in td_lecture: continue
            cp_stmp = list(map(int, arr[i][4].split(':'))) # 開始時刻の取り出し
            cp_stime_base = datetime.time(cp_stmp[0], cp_stmp[1], 0) # time型にする
            cp_stime_base = datetime.datetime.combine(datetime.date.today(), cp_stime_base) # time deltaはtime型では計算できないので今日の日付を加える
            cp_stime = cp_stime_base - datetime.timedelta(minutes=self.before_time) # 開始時間前の範囲を計算

            cp_etmp = list(map(int, arr[i][5].split(':'))) # 終了時刻の取り出し
            cp_etime = datetime.time(cp_etmp[0], cp_etmp[1], 59) # time型にする
            cp_etime = datetime.datetime.combine(datetime.date.today(), cp_etime)

            if dt_time >= cp_stime and dt_time < cp_etime:
                res.append(arr[i])
        # print(res)
        return res

    def check_attend(self, dt, lecture_id):
        # dtはdatetime型であることに注意
        ''' 指定された時刻で出欠を判定 '''
        # csv_file = open(self.lecture_rules, "r", encoding="utf-8", errors="", newline="" )
        # f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
        # next(f) # header
        json_load = self.open_tm7_file(self.lecture_rules)
        json_load.pop(0)
        arr = []
        lecture_index_list = []
        for row in json_load:
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
        ''' idmからユーザ名を取得 '''
        # csv_file = open(self.student_timetable, "r", encoding="utf-8", errors="", newline="" )
        # f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
        # next(f) # header
        json_load = self.open_tm7_file(self.student_timetable)
        json_load.pop(0)
        arr = []
        for row in json_load:
            arr.append(row)
        for i in range(len(arr)):
            if arr[i][3] == idm: return arr[i][1]
        return False # リストに存在しない

    def get_userid(self, idm):
        ''' idmから学籍番号を取得 '''
        json_load = self.open_tm7_file(self.student_timetable)
        json_load.pop(0)
        arr = []
        for row in json_load:
            arr.append(row)
        for i in range(len(arr)):
            if arr[i][3] == idm: return arr[i][0]
        return False # リストに存在しない

    def get_weeks(self, dt, lecture_id):
        # dtはdatetime型であることに注意
        ''' 何回目の講義か取得 '''
        # csv_file = open(self.lecture_date, "r", encoding="utf-8", errors="", newline="" )
        # f = csv.reader(csv_file, delimiter=",", doublequote=True, lineterminator="\r\n", quotechar='"', skipinitialspace=True)
        # next(f) # header
        json_load = self.open_tm7_file(self.lecture_date)
        json_load.pop(0)
        arr = []
        for row in json_load:
            arr.append(row)
        dt_date = str(datetime.datetime.strftime(dt, '%Y-%m-%d'))
        for i in range(len(arr)):
            if arr[i][0] == lecture_id:
                for j in range(len(arr[i])):
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
        self.read_que = False # カードリーダ本体のidm読み込み待ち状態

    def ck_lecture(self):
        ''' 現在の講義を確認 '''
        now_dt = datetime.datetime.now()
        lecture_id = self.attendance.check_lecture(now_dt) # 講義のID
        change_flag = False 
        if len(lecture_id) > 1:
            f = open('Subjects_Priority.txt', 'r', encoding='utf-8')
            sp = f.read()
            sp_l = sp.split('\n')
            for i in range(len(lecture_id)):
                if lecture_id[i][0] in sp_l:
                    lecture_id = lecture_id[i] # 置き換え
                    change_flag = True
                    break
            if change_flag == False: lecture_id = lecture_id[0] # 置き換えられてない = lecture_id[0]
            self.now_lec = [str(lecture_id[1]), str(lecture_id[0])]
        elif lecture_id:
            self.now_lec = [str(lecture_id[0][1]), str(lecture_id[0][0])]
        else: self.now_lec = []

    def on_connect(self, tag):
        ''' タッチされたときの動作 '''
        self.idm = binascii.hexlify(tag.idm).decode().upper()
        if (time.monotonic() - self.flag) > self.min_doubled or self.idm != self.last:
            # self.cs.update_main("出席", "IDm : "+str(self.idm))

            now_date = str(datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S'))
            asyncio.run(self.net.send({"idm":self.idm, "date":now_date})) # データの送信

            self.ck_lecture() # 現在の講義更新
            if len(self.now_lec) < 1:
                self.cs.update_main("講義時間外です", "IDカードをタッチ", "") # 表示
            else:
                lecture_id = self.now_lec[1] # 講義IDを代入
                if self.attendance.check_taking_lecture(lecture_id, self.idm): # 履修者の判定
                    lecture_no = self.attendance.get_weeks(dt, lecture_id) # 講義の第何回目か
                    student_id =  self.attendance.get_userid(self.idm) # 出席した人の名前
                    user_idm = self.idm # 出席した人のidm
                    result = self.attendance.check_attend(dt, lecture_id) # 出席/遅刻/欠席/時間外です
                    if result != '時間外です': # 時間外以外
                        # now_date = now_date # 現在の時刻
                        # self.db.add_at(lecture_id, lecture_no, user_name, user_idm, result, now_date) # add data to sqlite

                        # if self.net.stat:
                        #     asyncio.run(self.net.send({"idm":user_idm, "date":now_date})) # データの送信
                        # self.sound()
                        send_data = {
                            "lecture_id": lecture_id,
                            # "lecture_id": lecture_id,
                            "week": lecture_no,
                            # "user_name": user_name,
                            "student_id": student_id,
                            "result": result,
                            "date": now_date,
                            "user_idm": user_idm,
                        }
                        asyncio.run(self.net.send(send_data)) # データの送信
                        self.cs.update_main(result, "IDm : "+str(user_idm), str(self.now_lec)+" 第"+lecture_no+"回目 - 学籍番号："+student_id)
                else: # 履修者ではない場合
                    self.cs.update_main("履修者ではありません", "IDカードをタッチ", "") # 表示


        else:
            self.flag = time.monotonic()
        # self.sound()
        self.last = self.idm
        self.flag = time.monotonic()

    def on_connect_dummy(self):
        ''' デバッグ用 '''
        # now_date = str(datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S'))

        # if len(self.now_lec) > 0:
        #     lecture_id = self.now_lec[1]
        # else:
            # lecture_id = 'M2'
            # lecture_id = 'T4'
        # lecture_id = 'T4' # 講義のID
        # lecture_id = 'M2' # 講義のID
        if DEBUG_LECTURE_ID == 'AUTO' and self.now_lec:
            lecture_id = self.now_lec[1]
        elif DEBUG_LECTURE_ID != 'AUTO' : lecture_id = DEBUG_LECTURE_ID
        else: lecture_id = 'T4' # AUTO && self.now_lecがない場合、他

        if len(self.gen_val) < 1 or len(self.gen_lec) < 1:
            self.gen_lec = lecture_id
            self.gen_val = gen.gen(lecture_id) # データが無いときは、データ生成

        random_row = random.randint(0, len(self.gen_val)-1)
        row_val = self.gen_val[random_row] #  [lecture_id, student_id, week, result(null), datetime, idm]
        if self.attendance.check_taking_lecture(lecture_id, row_val[5]): # 履修者の判定
            lecture_no = row_val[2] # 講義の第何回目か
            # user_name = self.attendance.get_username(self.idm) # 出席した人の名前
            user_idm = row_val[5] # idm
            # student_id = row_val[1] # 出席した人の学籍番号
            student_id = self.attendance.get_userid(user_idm) # 出席した人の名前
            # user_idm = '012E44A7A51'+self.rand_hex_gen(5) # 出席した人のidm
            dt = datetime.datetime.strptime(row_val[4], '%Y-%m-%d %H:%M:%S')
            result = self.attendance.check_attend(dt, str(self.gen_lec)) # 出席/遅刻/欠席/時間外です
            if result != '時間外です': # 時間外以外
                # now_date = now_date # 現在の時刻
                self.gen_val.pop(random_row) # 消す

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
                # self.cs.update_main(result, "IDm : "+str(user_idm)) # 表示
                self.cs.update_main(result, "IDm : "+str(user_idm), str(lecture_id)+" 第"+lecture_no+"回目 - 学籍番号："+student_id)
                self.debug_flag = True
        else: # 履修者ではない場合
            self.cs.update_main("履修者ではありません", "IDカードをタッチ", "") # 表示
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
            if self.read_que == False:
                self.read_que = True
                self.read_id() # idm読み込み待ち
                self.read_que = False
                time.sleep(2)
                if self.debug_flag == False:
                    self.cs.ready()
            if self.debug_flag:
                time.sleep(2)
                if len(self.now_lec) > 0: self.cs.update_main(self.now_lec[0]+'('+self.now_lec[1]+')', "ICカードをタッチ", "") # 講義がある時間帯
                else: self.cs.ready() # 初期状態に戻す (講義時間外)
                self.debug_flag = False
            else:
                if len(self.now_lec) > 0: self.cs.update_main(self.now_lec[0]+'('+self.now_lec[1]+')', "ICカードをタッチ", "") # 講義がある時間帯
                else: self.cs.ready() # 初期状態に戻す (講義時間外)


# ----- Database -----
# ローカルデータベースの読み書き
class Database():
    def __init__(self):
        self.fname = 'attendance.db' # 出席を保存するデータベース
        self.tname = 'attendance' # 出席を保存するテーブル
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
        # print(q) # クエリの表示
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
# ネットワーク接続状況やサーバへの非同期データ送信処理
class Network():
    def __init__(self):
        # self.netCheck = 'https://www.google.com/'
        self.netCheck = SERVER_URI
        self.netCheckT = 3 # connection timeout
        self.server = SERVER_URI
        self.apiKey = API_KEY
        self.apiuri = WebAPI_URI
        self.stat = False
        self.db = Database()
        self.db_last_update = '同期中'
        self.enc = Encryption() # 暗号化/複合クラス

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
        self.db_last_update = '同期中'
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
        ''' 内部データの更新 '''
        data = {}
        data["x"] = self.apiKey # 送信データにAPIの暗号鍵追加
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.apiuri[opt], data=data) as resp: # タイムアウトは長め
                    # print(resp)
                    resp_text = await resp.text()
                    if resp.status == 200:
                        if opt == 0: fname = 'lecture_rules.tm7'
                        elif opt == 1: fname = 'student_timetable.tm7'
                        else : fname = 'lecture_date.tm7'
                        async with aiofiles.open(fname, mode='w') as f:
                            resp_text = self.enc.fernet_e(resp_text)
                            await f.write(resp_text)
                            await f.close()
                        # print('end')
                        self.db_last_update = str(datetime.datetime.now().strftime('%Y/%m/%d %H:%M:%S'))
                        return True
        except:
            return False


# ----- Encryption -----
# 暗号化/復号、ハッシュ導出
# https://cryptography.io/en/latest/hazmat/primitives/symmetric-encryption/
class Encryption():
    def __init__(self):
        self.key = 'hi_Team7'.encode('utf-8')
        self.iv = 'hi_Team7'.encode('utf-8')
        self.salt = 'hi_Team7'.encode('utf-8')
        # $argon2id$v=19$m=10240,t=5,p=2$aGlfVGVhbTc$DRHCMsKSR6ACYFzC6Vrk69JuglH+bHLkPJQT76cDNIHhnoUMTTtmOI5K4e2AufEzMBvgOyZLtKECgEyjvnGcD+BpBR1wksLwtrrGyg+iOubPV4QjOPfqzttI/HcsyRQfNaNogZUaVu3SALqxXDkUEbNKRKVnHGVcxgoy+/+Zu5E # TeamB
        self.iv_aes = 'aGlfVGVhbTc$DRHC'.encode('utf-8') # TeamB
        self.key_aes = 'SALqxXDkUEbNKRKVnHGVcxgoy+/+Zu5E'.encode('utf-8')
        self.key_fer = "Sx6hWZYjOwvvWYgR6k9XPC2gMLy10xkFyrUO44OO11E="

    def argon2(self, data):
        ''' ハッシュ化 (同じパラメータでも、nodejs(サーバ側)と出力は異なることに注意) '''
        return argon2.using(type="ID", salt=self.salt, parallelism=2, rounds=5, memory_cost=1024*10, digest_size=128).hash(data)

    def aes_e(self, data):
        ''' AES暗号化 パディングはPKCS7-256'''
        if ENCRYPT_OPTION: # 暗号化設定が有効か
            if (type(data) is not bytes): # bytes型に変換して暗号化する
                data = data.encode("shift-jis")
            padder = padding.PKCS7(256).padder() # change padding
            padded_data = padder.update(data)
            padded_data += padder.finalize()

            cipher = Cipher(algorithms.AES(self.key_aes), modes.CBC(self.iv_aes))
            encryptor = cipher.encryptor()
            ct = encryptor.update(padded_data) + encryptor.finalize()
            return ct
        else: return data

    def aes_d(self, ct):
        ''' AES復号 パディングはPKCS7-256'''
        if ENCRYPT_OPTION: # 暗号化設定が有効か
            cipher = Cipher(algorithms.AES(self.key_aes), modes.CBC(self.iv_aes))
            decryptor = cipher.decryptor()
            data = decryptor.update(ct) + decryptor.finalize()

            unpadder = padding.PKCS7(256).unpadder()
            data = unpadder.update(data) + unpadder.finalize()
            res = data.decode("shift-jis")
            print(res)
            return res
        else: return ct

    def fernet_e(self, data):
        ''' Fernet 暗号化 '''
        if ENCRYPT_OPTION: # 暗号化設定が有効か
            f = Fernet(self.key_fer)
            token = f.encrypt(data.encode())
            token = token.decode('shift-jis')
            return token
        else: return data

    def fernet_d(self, token):
        ''' Fernet 復号 '''
        if ENCRYPT_OPTION: # 暗号化設定が有効か
            f = Fernet(self.key_fer)
            token = token.encode()
            data = f.decrypt(token)
            data = data.decode()
            return data
        else: return token

# 実行
if __name__ == "__main__":
    application = Main()
    application.ready()
    sub_proc = Sub(application)

    print('Welcome to Team7!')
    sys.exit(application.app.exec_())
