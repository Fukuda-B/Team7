# Team7
## Management System  
Attendance Management with Python + Node.js  
The database of the child unit is SQLite3 and the main database is MySQL  
Encryption: AES / Hashing: Argon2
  
  
---
## Overview
\- client / admin login  
![login-page](https://user-images.githubusercontent.com/60131202/119244562-e4a94680-bbac-11eb-8ddf-dcd6a017b0ba.png)  
  
\- encryption test (AES)  
  
![image](https://user-images.githubusercontent.com/60131202/120108501-5b8fa200-c1a0-11eb-9462-4d8898cb12f3.png)  
  
  
  
\- session management  
  
![image](https://user-images.githubusercontent.com/60131202/120409937-fa78f180-c38c-11eb-995e-0631a3fcf04b.png)

---
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
