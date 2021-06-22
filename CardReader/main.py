"""
    メイン処理部分
    author: Team7


    memo:
        https://passlib.readthedocs.io/en/stable/lib/passlib.hash.argon2.html
        https://www.finddevguides.com/Pyqt-qstatusbar-widget
        https://teratail.com/questions/263508
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
import sqlite3
import binascii
import nfc
import asyncio
import aiohttp
# import requests
import threading
from gtts import gTTS
import playsound
from passlib.hash import argon2
from io import BytesIO
# モジュールの読み込み
import main_window # メインウィンドウを表示するモジュール

# ----- 定数宣言 -----
SERVER_URI = 'http://localhost:8080/api/v1/team7'
API_KEY = ''

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
        ''' ネットワークの接続状況の確認 '''
        if (self.cnt%(self.fps*self.nc_check) == 0):
            res = asyncio.create_task(self.nc.netstat())
            self.nws = await res

# ----- IC -----
# ICカードのidm読み取り
class IC():
    def __init__(self, cs):
        self.cs = cs # main ui
        self.flag = False # delay
        self.last = '' # last idm

    def on_connect(self, tag):
        ''' タッチされたときの動作 '''
        self.idm = binascii.hexlify(tag.idm).decode().upper()
        if (time.monotonic() - self.flag) > 10 or self.idm != self.last:
            self.cs.update_main("出席", "IDm : "+str(self.idm))
        else:
            self.flag = time.monotonic()
        # self.sound()
        self.last = self.idm
        self.flag = time.monotonic()

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
            self.read_id()
            time.sleep(1)
            self.cs.ready() # 初期状態に戻す
            # if self.cs_flag:
            #     if (time.monotonic() - self.flag) > 2.0:
            #         self.cs.ready() # 初期状態に戻す
            #         self.cs_flag = False
                # else:
                #     self.flag = time.monotonic()

# ----- Database -----
# データベースの読み書き
class Database():
    def __init__(self):
        self.fname = 'attendance.sqlite3'

    def query(self, q):
        connection = sqlite3.connect(self.fname)
        cur = connection.cursor()
        cur.execute(q)
        print(cur.fetchall())
        cur.close()
        connection.close()

# ----- Network -----
# ネットワーク接続状況やサーバへのデータ送信処理
class Network():
    def __init__(self):
        self.netCheck = 'http://www.google.com/'
        self.netCheckT = 3 # connection timeout
        self.server = SERVER_URI
        self.apiKey = API_KEY

    async def netstat(self):
        ''' ネットワークの接続確認 '''
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(self.netCheck, compress=True):
                    return True
        except:
            return False
        # try:
        #     requests.head(self.netCheck, timeout=self.netCheckT)
        #     return True
        # except requests.ConnectionError:
        #     return False

    async def send(self, data):
        data["key"] = self.apiKey
        async with aiohttp.ClientSession() as session:
            async with session.post(self.server, data=data) as resp:
                res = resp.text()


# ----- Encryption -----
# 暗号化/復号、ハッシュ導出
class Encryption():
    def __init__(self):
        self.key = 'hi_Team7'.encode('utf-8')
        self.iv = 'hi_Team7'.encode('utf-8')
        self.salt = 'hi_Team7'.encode('utf-8')

    def argon2(self, data):
        ''' ハッシュ化 '''
        data = argon2.using(type="ID", salt=self.salt, parallelism=2, rounds=5, memory_cost=1024*10, digest_size=128).hash(data)
        return data

    def aes_e(self, data):
        ''' AES暗号化 '''
        return data
    
    def aes_d(self, data):
        ''' AES復号 '''
        return data

# 実行
if __name__ == "__main__":
    application = Main()
    application.ready()
    sub_proc = Sub(application)

    sys.exit(application.app.exec_())
