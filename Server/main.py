"""
    メイン画面表示部分
"""

from py_modules import NFCRead_dummpy

import sys
from PyQt5.QtWidgets import QApplication, QWidget, QGridLayout, QLabel
from PyQt5.QtCore import Qt, QTimer
from PyQt5.GtGui import QFont

app = QApplication([])
window = Qwidget()
layout = QGridLayout()
label = QLabel("出席", window)
label.setAlignment(Qt.AlignVCenter | Qt.AlignHCenter)
label.setFont(QFont("Monospace Regular", 16, QFont.Bold))
layout.addWidget(label, 0, 0)
window.setLayout(layout)
QTimer.singleShot(2000, window.close)
sys.exit(app.exec_())
