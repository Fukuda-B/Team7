/*
    Team7 electron | Update: 2021/06/08

*/

'use strict';

const { Menu, Tray } = require('electron');
var electron = require('electron');
var paht = require('path');
var app = electron.app;
var BrowserWindow = electron.BrowserWindow;
let mainWindow; // main window | gc (garbage collection) measures
let tray = null; // task tray  | gc (garbage collection) measures

var icon =  __dirname + '/icon.ico';
var default_zoom = 0.9;
var start_page = 'http://localhost:8080/';
var issue_page = 'https://github.com/Fukuda-B/Team7/issues';
app.disableHardwareAcceleration(); // disable gpu render and save memory

app.setAboutPanelOptions({
    applicationName: 'Team7',
    applicationVersion: 'Version: v0.2.7 (electron)\nElectron: '+process.versions.electron+'\nChrome: '+process.versions.chrome+'\nNode.js: '+process.versions.node+'\nV8: '+process.versions.v8,
    // copyright: 'Copyright (C) 2021 Team7',
    version: 'build20210608',
    // credits: '',
    authors: ['Team7'],
    website: 'https://github.com/Fukuda-B/Team7',
    iconPath: icon
});

// if close all window, exit program.
app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit()
});

// start electron
app.on('ready', function() {

    // task tray
    const tray_menu = Menu.buildFromTemplate([
        { role: 'quit', label: 'Quit'},
    ])
    tray = new Tray(icon);
    tray.setToolTip(app.name);
    tray.setContextMenu(tray_menu);


    // window menu
    const menu_list = Menu.buildFromTemplate([
        {
            label: "File",
            submenu: [
                { role: 'close', label:'Exit'}
            ]
        }, {
            label: "View",
            submenu: [
                { role:'reload', label:'Reload'},
                { type:'separator'},
                { role:'resetZoom', label:'Reset Zoom'},
                { role:'zoomIn', label:'Zoom in'},
                { role:'zoomOut', label:'Zoom out'},
                { type:'separator'},
                { role:'toggleDevTools', label:'Toggle dev tools'},
            ]
        }, {
            label: "Go",
            submenu: [
                {
                    label:'My Page',
                    click: () => {
                        mainWindow.loadURL(start_page+'main');
                    }
                },
                { type:'separator'},
                {
                    label:'Logout',
                    click: () => {
                        mainWindow.loadURL(start_page+'main/logout');
                    }
                },
            ]
        }, {
            label: "Help",
            submenu: [
                {
                    label:'Report issue',
                    click: async () => {
                        const { shell } = require('electron');
                        await shell.openExternal(issue_page);
                    }
                },
                { type:'separator'},
                { role:'about', label:`About ${app.name}` }
            ]
        }
    ]);
    Menu.setApplicationMenu(menu_list);

    mainWindow = new BrowserWindow({
        // titleBarStyle: 'hidden',
        width: 1000, height: 720,
        webPreferences: { nodeIntegration : false }, // DbXSS
        title: "Team7",
        icon: icon,
    });
    mainWindow.webContents.setZoomFactor(default_zoom);
    mainWindow.loadURL(start_page+'main');

    mainWindow.on('closed', function() {
        mainWindow = null;
    });
});
