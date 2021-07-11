import binascii
import nfc
from time import time 
import sys

class MyCardReader(object):

    def on_connect(self,tag):
        print("touched")
        self.idm = binascii.hexlify(tag.idm).decode().upper()
        return True

    def read=id(self):
        clf = nfc.ContactlessFronted('usb')
        try:
            clf.connect(rdwr={'on-connect':self.on_connect})
            finally:
                clf.close()

if_name_=='_main_':
    cr = MyCardReader()
    start_time = time()
    while True:
        print("touch card:")
        cr.read_id()
        print("released")
        print("IDm = {}".format(cr.idm))
        current_time = time()
        print("time = 3.2f" % (current_time - start_time))
        if current_time - start_time > 10.0:
            sys.exit()
