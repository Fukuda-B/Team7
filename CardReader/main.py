"""
    メイン処理部分
    author: Team7


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
# SERVER_URI = 'http://localhost:8080/api/v1/team7'
SERVER_URI = 'http://172.28.92.72:8080/api/v1/team7'
API_KEY = 'ee038e2b7542dcfa599e96aefccd33cdc199adf5f061274689aa0b9341f5cef890884b03c9641338f7dd7bd2e791e43f5a26b7639a828f54a49738b751163a08a8e7f74ba21f90de8ca1de10edd91bf67169839c10bc0359cad86b70887aa887b046f0c63582f6f63612d12033ca856fe28db812ab1cb8e2b00c1b40c6a72b350f93f4691f0b3c008c174cb8465fccd6c75989047965804ec8d283ea71144e935ec35b2e40a59819c6a55b0d504549b7685dfaabb06bc19a3a8ba1964f34258be47569686ce26cabef94cd0c0dc318253c28ac4785fdd0b05f2b27345f74ed0a9e710ed5312f1a072e4b1397145877bf1e272104449ba76531208462e9bd525891b10169bfbaf63108728e9b133c7bba4cfdaa891cd593c5d1348ae3f4111372a8efb48dec8c2b19e9216ca5563a92142a14e12d49e9e8456860f9c4589f2b7cca4bbc48c76f2b16e679ba0a8a30636af08ac3041cb40ba1bfd9e15f751adf31ddee18397604730eb5de5c187c492385c4d030358ca5ad6ed8ef710dacd209b92159abd87790a4f4a34b12d419feea50cc664900f5d2a40c72596fe4d1a897636d74d89ffb0017adde134d086041312181ca5de8ddee8b3b7d0bc73c2a68c9562b16820665cc1633122a55f88024e8f6e4e07c9c430d589ca23c435391cd7bf61e3fc7edc1ecc177110edbe0a02c0116d1e4902e36d762b35875691fcba3694eaee8376030f57b9aeb31d7470021bd1985cc16a2e084aae867aa7664dab724687782f88d1afff9c7940b154f18ccaecfcdb50af38284d60156d649c9e48a5b6602fa0590e830d07168f923e09d125fd04aaa8a8925bffbac472a4b0a1729c9b8d27ebd5ce9337901d68449e7e7930e70e70726a9bbf99a8bf95c8e6220592edb6d120a51f8ee7386412a6f8976e14cdd6b67ff19c13021d51f22c402d5430d5c7d15ee68719ccddeb5daebe62768205e8f430d314094e9e107e704b3fed730238c25151e1c02fb5be9cb66462f0475aadab607a199a7f9cb1294046e7cdfb186735f4df67317e2aa4d11b12bfbe81ac49352267397851161cef30418c5051eb51e80c35a819f38b79e340dc7ff8c2945aad4b86bc5ad9186467dc9dfd9ab32875a67aca78d0c55f2a6fcb5bc2cb03a11b7253adc17a7fcf54c24ddb5c99262ac425268c4ee5efcff09f835368ecd038ae704b6c6af163e88ae6a168f2c0b367b471a10692330df5c5d8dd8ee337965ea7812ec2d647c20680a8c0ef26262e4881341155678ca74aa77aa80ebc795ad59'
DATABASE = 'attendance.db'

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
        self.net = Network() # connect api server
        self.flag = False # delay
        self.last = '' # last idm

    def on_connect(self, tag):
        ''' タッチされたときの動作 '''
        self.idm = binascii.hexlify(tag.idm).decode().upper()
        if (time.monotonic() - self.flag) > 10 or self.idm != self.last:
            self.cs.update_main("出席", "IDm : "+str(self.idm))

            self.net.send({"idm":self.idm, "date":datetime.datetime.now()})
            # con_loop = asyncio.get_event_loop()
            # con_loop.run_until_complete(self.net.send({"idm":self.idm, "date":datetime.datetime.now()})) # とりあえず送信

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
        self.fname = DATABASE

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
        data["x"] = self.apiKey # 送信データにAPIの暗号鍵追加
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(self.server, data=data) as resp:
                    # res = resp.text()
                    return True
        except:
            return False


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

    # nn = Network()
    # loop = asyncio.get_event_loop()
    # loop.run_until_complete(nn.send({"idm":"b"}))

    sys.exit(application.app.exec_())
