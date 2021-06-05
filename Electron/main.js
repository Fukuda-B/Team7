/*
    Team7 electron | Update: 2021/05/26

*/

'use strict';

var electron = require('electron');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
let mainWindow; // Don't overwrite this.

// if close all window, exit program.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

// start electron
app.on('ready', function() {
    mainWindow = new BrowserWindow({
        // titleBarStyle: 'hidden',
        width: 1000, height: 720,
        webPreferences: { nodeIntegration : false } // DbXSS
    });
    mainWindow.loadURL('http://localhost:8080/');

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});
