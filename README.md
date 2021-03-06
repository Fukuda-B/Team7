# Team7
出席管理システム Team7の概要  
- 鍵導出関数(Argon2)と、暗号化(AES)により安全な通信/処理  
- ネットワークが一時的に使えなくても、カードリーダ内部のデータベースで処理を行える
- 定期的にサーバとカードリーダ内のデータの同期  
- ユーザ名とパスワードを使って個人のPCからアクセスできる  
- 講義情報の変更も ブラウザ / クライアントアプリ で簡単にできる  
- .csv / .xlsx フォーマットで出力可能  
- WebAPI鍵の認証により不正な出席情報の追加を防ぐ  
  
使い方  
---
最新版のPythonとNode.JS、nginxをダウンロードし、インストールしてください  
-> [Python - Download](https://www.python.org/downloads/)  
-> [Node.js - Download](https://nodejs.org/ja/download/)  
-> [nginx - Download](https://nginx.org/en/download.html)
  
---  
\[ [Team7/Server](./Server) \]  
`npm install`でnodejs-moduleをインストールし、`node app.js`でServer/app.jsを実行します。  
Windows向けですが、起動までの処理を一括で行うバッチファイル Server/server_start.batがあります。  
バッチファイルの実行方法は以下の通りです。  
```cmd
cd Server
./server_start.bat
```
現在 MySQLのデータベースは、プライベートレポジトリで管理しています。  
  
nginxのnginx.confファイルを編集または、nginx/nginx.confで置き換えてください。  
nodeは[localhost:3000](http://localhost:3000)、nginxは[localhost:8080](http://localhost:8080)からnodeへリバースプロキシを行っています。

---    
\[ [Team7/CardReader](./CardReader) \]  
初めて実行する場合は、`pip install -r requirements.txt`で実行に必要なライブラリをインストールしてください。  
実行方法は、以下の通りです。
```cmd
cd CardReader
python main.py
```
WebAPI_Key.txtには、管理者に与えられたWebAPI_Keyの値をコピーして貼り付けてください。  
現在 カードリーダ内部のデータは、プライベートレポジトリで管理しています。  

---    
\[ [Team7/Electron](./Electron) \]  
`npm install`でnodejs-moduleをインストールし、`npm start`でElectron/main.jsを実行します。  

Windows向けですが、起動までの処理を一括で行うバッチファイル Electron/electron_start.batがあります。  
バッチファイルの実行方法は以下の通りです。  
```cmd
cd Electron
./electron_start.bat
```
  
Windows, Linux, MacOS向けにアプリケーション化するバッチファイルもあります。  
バッチファイルの実行方法は以下の通りです。  
```cmd
cd Electron
./electron_build.bat
```
  
---
ディレクトリ構造 (簡易)  
---
```
Team7  
　├ CardReader (カードリーダ)  
　│　└ main.py  
　│　└ main_window.py  
　│　　　└ generator  
　│　　　　　└ idm_csv_gen.py  
　│　　　　　└ attend_csv_gen.py  
　│　　　　　└ csv_join.py  
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

