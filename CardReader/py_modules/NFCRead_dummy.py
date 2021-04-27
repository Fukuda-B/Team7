"""
    NFC Reader(仮)
"""
import binascii
# import nfc
from time import time
import sys

class CardReader(object):
    def on_connect(self, tag):
        self.idm = '054c:06c3'
        return True
    def read_id(self):
        pass
