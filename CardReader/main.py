"""
    メイン画面表示部分
    author: Team7
"""

from py_modules import NFCRead_dummy
import db_mod

import sys
from PySide2 import QtWidgets

class MainWindow(QtWidgets.QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Team7 - Main")
        l_style = """QLabel {
            font-size: 16px;
        }"""
        label = QtWidgets.QLabel(self)
        label.setStyleSheet(l_style)
        label.setText("出席")
    def show_s(self):
        app = QtWidgets.QApplication()
        window = MainWindow()
        window.show()
        app.exec_()

        # app = QApplication([])
        # window = Qwidget()
        # layout = QGridLayout()
        # label = QLabel("出席", window)
        # label.setAlignment(Qt.AlignVCenter | Qt.AlignHCenter)
        # label.setFont(QFont("Monospace Regular", 16, QFont.Bold))
        # layout.addWidget(label, 0, 0)
        # window.setLayout(layout)
        # QTimer.singleShot(2000, window.close)
        # sys.exit(app.exec_())
        

class MainClass:
    def __init__(self) -> None:
        pass

    def wait(self):
        pass
    
    def add(self):
        pass

    def check(self, idm):
        pass
    
    def check_allow(self):
        MainWindow.show_s()

    def check_deny(self):
        pass

class AsyncClass:
    async def __init__(self) -> None:
        pass
    async def check(self):
        pass
