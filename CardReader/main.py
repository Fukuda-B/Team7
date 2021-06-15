"""
    メイン処理部分
    author: Team7


    memo:
        https://www.finddevguides.com/Pyqt-qstatusbar-widget
        https://teratail.com/questions/263508
"""

import sys
from PyQt5 import QtCore, QtGui, QtWidgets
from PyQt5.QtCore import QTimer
import datetime
import sqlite3
import requests
# -----
from py_modules import NFCRead_dummy
import main_window

class Main(QtWidgets.QWidget):
    def __init__(self):
        ''' 画面表示 '''
        # window
        self.app = QtWidgets.QApplication(sys.argv)
        self.MainWindow = QtWidgets.QMainWindow()
        self.ui = main_window.Ui_MainWindow()
        self.ui.setupUi(self.MainWindow)
        self.MainWindow.show()

    def ready(self):
        ''' 画面更新 '''
        _translate = QtCore.QCoreApplication.translate
        self.ui.label.setText(_translate("Team7", "出席管理システム"))
        self.ui.label_2.setText(_translate("Hi", "こんにちは"))
        print('Team7 ready!')

    def update_i(self, text):
        self.ui.statusbar.showMessage(text)

class Sub():
    def __init__(self, cs):
        self.cs = cs
        self.cnt = 0
        self.fps = 60
        self.nc = Network()
        # timer
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_i)
        self.timer.start(1000/self.fps)
        self.update_i # Exec update_i()

    def update_i(self):
        ''' 定期実行 '''
        self.cnt += 1
        nws = ''
        if (self.cnt%self.fps*5 == 0):
            if (self.nc.netstat()):
                nws = 'online'
            else:
                nws = 'offline'

        current_time = str(datetime.datetime.now())
        self.cs.update_i(current_time + '   ['+nws+']')

class IC():
    def __init__(self):
        pass

    def on_connect(self, tag):
        self.idm = binascii.hexlify(tag.idm).decode().upper()
        return True

    def read_id(self):
        clf = nfc.ContactlessFrontend('usb')
        try:
            clf.connect(rdwr={'on-connect': self.on_connect})
        finally:
            clf.close()

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

class Network():
    def __init__(self):
        self.netCheck = 'http://www.google.com/'
        self.netCheckT = 3

    def netstat(self):
        try:
            r = requests.head(self.netCheck, timeout=self.netCheckT)
            return True
        except requests.ConnectionError as ex:
            return False

class Encryption():
    def __init__(self):
        self.key = 'hi_Team7'
        self.iv = 'hi_Team7'
    
    def argon2(data):
        ''' ハッシュ化 '''
        return data

    def aes_e(data):
        ''' AES暗号化 '''
        return data
    
    def aes_d(data):
        ''' AES復号 '''
        return data

if __name__ == "__main__":
    application = Main()
    application.ready()
    sub_proc = Sub(application)

    sys.exit(application.app.exec_())
