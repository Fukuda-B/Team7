@echo off
title Team7 - Server benchmark
rem|____________________________________________________________
rem|   Team7 Portable | Start server benchmark | Update: 2021/06/06
rem
rem|   Requirements: LTS Node.js, start server & nginx
rem|   Place this .bat file in the same directory as Team7/Server/app.js.
rem|____________________________________________________________

rem| portable nodejs dir
set "node_portable=D:\GitHub\node-v14.17.0-win-x64"

rem| add path
set PATH=%node_portable%;%PATH%
set NODE_PATH=%node_portable%\node_modules\npm\node_modules;%node_portable%\node_modules\npm

rem|____________________________________________________________
rem| install node-module
call npm install -g loadtest
rem| bench server

echo "/"
call npx loadtest http://localhost:8080/ -t 20 -c 20 --keepalive
call npx loadtest -n 10000 http://localhost:8080/

echo "/main/login"
call npx loadtest http://localhost:8080/main/login -t 20 -c 20 --keepalive
call npx loadtest -n 10000 http://localhost:8080/main/login
