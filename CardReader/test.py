import sys
from PyQt5.QtWidgets import *
from PyQt5.QtCore import *


class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.initUI()
        self.timer = QTimer()
        self.timer.timeout.connect(self.startTimer)
        self.timer.start(2000)

    def initUI(self):
        widget = QWidget()
        self.setCentralWidget(widget)

        layout = QVBoxLayout()
        widget.setLayout(layout)

        # ボタンを配置する。
        self.button = QPushButton("タイマースタート")
        self.button.clicked.connect(self.startTimer)
        layout.addWidget(self.button)

    def startTimer(self):
        self.timer = QTimer()
        self.timer.timeout.connect(self.on_timeout)  # QTimer が timeout した場合に呼び出す関数を登録
        self.timer.start(2000)  # タイマーをスタートさせる

    def on_timeout(self):
        """start() で設定したミリ秒ごとにこの処理が呼ばれます
        """
        print("timeout")


if __name__ == '__main__':
    app = QApplication(sys.argv)
    windows = MainWindow()
    windows.show()
    app.exec_()
    sys.exit(0)