## Team7
Attendance Management with Python + Node.js  
The database of the child unit is SQLite3 and the main database is MySQL  
Encryption: AES / Hashing: Argon2
  
## Usage
Download & Install Node.js -> [Node.js - Download](https://nodejs.org/ja/download/)  

\-\-\-  
\[ [Team7/Server](./Server) \]  
Install nodejs-module and start the server ( Windows - powershell ) :  
```cmd
cd Server
./server_start.bat
```

\-\-\-    
\[ [Team7/Electron](./Electron) \]  
Install nodejs-module and start ( Windows - powershell ) :  
```cmd
cd Electron
./electron_start.bat
```
  
Build electron package for Windows, Linux, MacOS :  
```cmd
cd Electron
./electron_build.bat
```

## Directory  
```
Team7  
　├ CardReader (カードリーダ)  
　│　└ main.py  
　│　└ main_window.py  
　│
　├ Electron   (クライアントアプリ)  
　│　└ main.js  
　│
　├ Nginx  
　│　└ nginx.conf  
　│
　├ Server    (サーバ)  
　│　└ app.js    (ルーティング)  
　│　└ routes  
　│　　　└ main.js     (メイン処理)  
　│　　　└ api.js      (webapi処理モジュール)  
　│　　　└ database.js (データベースモジュール)  
　│　　　└ cryp.js     (暗号化モジュール)  
　│　　　└ output.js   (csv, xlsx 処理モジュール)  
　│　└ public (表示用ファイル)  
　│　　　└ css  
　│　　　└ img  
　│　　　└ js  
　│　└ view   (ejs レンダリングファイル)  
  
```

