@echo off
title Team7 - Server
rem|____________________________________________________________
rem|   Team7 Install & Start server | Update: 2021/05/25
rem|
rem|   Requirements: Up-to-date Node.js installation
rem|   Place it in the same directory as Team7/Server/app.js.
rem|____________________________________________________________

rem| install node-module
if not exist "node_modules" call npm install

rem| start server
call node app.js
