"""
    DataBase Module (SQLite3)
    author: Team7
"""

import sqlite3
connection = sqlite3.connect('attendance.sqlite3')
cur = connection.cursor()

# SELECT * FROM [テーブル名]
cur.execute('SELECT * FROM test')
print(cur.fetchall())

cur.close()
connection.close()
