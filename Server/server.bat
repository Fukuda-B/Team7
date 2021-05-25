@echo off
title Team7 - Server
rem|____________________________________________________________
rem|   Team7 Portable | Start server | Update: 2021/05/25
rem
rem|   Requirements: LTS Node.js
rem|   Place it in the same directory as Team7/Server/app.js.
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
call node app.js
