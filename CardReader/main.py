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

    def update_i(self):
        current_time = str(datetime.datetime.now())
        self.ui.statusbar.showMessage(current_time)

class Sub():
    def __init__(self, cs):
        # timer
        self.timer = QTimer()
        self.timer.timeout.connect(self.update_i)
        self.timer.start(1000/60)
        self.cs = cs
        self.update_i

    def update_i(self):
        ''' 定期実行 '''
        self.cs.update_i()

if __name__ == "__main__":
    application = Main()
    application.ready()
    sub_proc = Sub(application)

    sys.exit(application.app.exec_())
