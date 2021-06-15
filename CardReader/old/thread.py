import time
import threading

class AddDaemon(object):
    def __init__(self):
        self.stuff = 'hi there this is AddDaemon'

    def add(self):
        while True:
            print(self.stuff)
            time.sleep(3)


class RemoveDaemon(object):
    def __init__(self):
        self.stuff = 'hi this is RemoveDaemon'

    def rem(self):
        while True:
            print(self.stuff)
            time.sleep(1)

def main():
    a = AddDaemon()
    r = RemoveDaemon()
    t1 = threading.Thread(target=r.rem)
    t2 = threading.Thread(target=a.add)
    t1.setDaemon(True)
    t2.setDaemon(True)
    t1.start()
    t2.start()
    time.sleep(10)

if __name__ == '__main__':
    main()