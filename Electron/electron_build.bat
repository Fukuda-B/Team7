@echo off
title Team7 - Electron
rem|____________________________________________________________
rem|   Team7 Portable | Build electron | Update: 2021/05/26
rem
rem|   Requirements: LTS Node.js
rem|   Place this .bat file in the same directory as Team7/Electron/main.js
rem|____________________________________________________________

rem| portable nodejs dir
set "node_portable=D:\GitHub\node-v14.17.0-win-x64"

rem| add path
set PATH=%node_portable%;%PATH%
set NODE_PATH=%node_portable%\node_modules\npm\node_modules;%node_portable%\node_modules\npm

rem|____________________________________________________________
rem| install node-module
if not exist "node_modules" call npm install
rem| start server
call npm i -D electron-packager
call npx electron-packager . Team7 --platform=all --arch=all --overwrite
@REM call npx electron-packager . Team7 --platform=all --arch=all
