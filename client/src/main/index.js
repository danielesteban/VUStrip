'use strict'

import { app, BrowserWindow, ipcMain, Menu, Tray } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import Strip from './strip';

let win;
let tray;
const icon = path.join(__static, 'icon.ico');
const strip = new Strip(process.env.IP || '192.168.1.75');
const production = process.env.NODE_ENV === 'production';

const toggleSettings = () => {
  if (!win) {
    return;
  }
  const size = win.getSize();
  const width = size[0] === 64 ? 256 : 64;
  const height = 256;
  win.setMinimumSize(width, height);
  win.setSize(width, height);
  if (!win.isVisible()) {
    win.show();
  }
};
ipcMain.on('Settings::Toggle', toggleSettings);

app.on('will-quit', () => {
  strip.subscribers.length = 0;
  strip.close();
});

app.on('ready', () => {
  win = new BrowserWindow({
    icon,
    width: 64,
    height: 256,
    alwaysOnTop: true,
    frame: false,
    maximizable: false,
    minimizable: false,
    resizable: false,
    transparent: true,
    show: false,
    skipTaskbar: true,
    webPreferences: { nodeIntegration: true },
  });
  win.on('close', () => {
    app.quit();
  });
  tray = new Tray(icon);
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show();
  });
  tray.setContextMenu(Menu.buildFromTemplate([
    ...(!production ? [
      {
        label: 'DevTools',
        click: () => {
          if (!win.webContents.isDevToolsOpened()) {
            win.webContents.openDevTools({ mode: 'detach' });
          }
        },
      },
    ] : []),
    {
      label: 'Settings',
      click: toggleSettings,
    },
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
  ]));
  win.loadURL(production ? (
    formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    })
  ) : (
    `http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`
  ));
  win.show();
});
