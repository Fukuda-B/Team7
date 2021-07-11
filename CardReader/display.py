import sys
from PyQt5.QtWidgets 
import GApplication, QWidget, QGridLayout, QLabel
from PyQt5.QtCore import Qt, QTimer
from PyQt5.QtGui import QFont

app = QApplication([])
window = QWidget()
layout = QGridLayout()
label = Qlabel("出席",window)
label.setAlignment(Qt.AlignVCenter | Qt.AlignHCenter)
label.setFont(QFont("Monospace Regular",100,QFont.Bold))
layout.addWidget(label,0,0)
window.setLayout(layout)
window.showFullScreen()
QTimer.singleShot(2000,window.close)
sys.exit(app.exec_())
