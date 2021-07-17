from datetime import datetime

Now = datetime.now()
DStart = "{:%Y-%m-%d}".format(Now)
DEnd = DStart
TStart = input("Input start time in the form HH:MM ->")
TEnd = input("Input end time in the form HH:MM ->")
SStart = DEnd + " " +TEnd
DTStart = datetime.fromisoformat(SStart)
DTEnd = datetime.fromisoformat(SEnd)

if Now > DTStart:
    if Now > DTEnd:
        print("遅刻")
    else:
        print("出席")
