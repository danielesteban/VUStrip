'use strict'

import { app, BrowserWindow, Menu, Tray } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import Strip from './strip';

let win;
let tray;
const ip = process.env.IP || '192.168.1.76';
const icon = path.join(__static, 'icon.ico');
const strip = new Strip(ip);
const production = process.env.NODE_ENV === 'production';

app.on('will-quit', () => {
  strip.close();
});

app.on('ready', () => {
  win = new BrowserWindow({
    icon,
    width: 64,
    height: 256,
    alwaysOnTop: true,
    frame: false,
    resizable: false,
    transparent: true,
    show: false,
    skipTaskbar: true,
  });
  tray = new Tray(icon);
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: `IP: ${ip}` },
    ...(!production ? [
      { type: 'separator' },
      {
        label: 'DevTools',
        click: () => {
          if (!win.webContents.isDevToolsOpened()) {
            win.webContents.openDevTools({ mode: 'detach' });
          }
        },
      },
    ] : []),
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
  ]));
  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show();
  });
  win.on('show', () => {
    tray.setHighlightMode('always');
  });
  win.on('hide', () => {
    tray.setHighlightMode('never');
  });
  win.on('close', () => {
    app.quit();
  });
  if (production) {
    win.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }));
  } else {
    win.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  win.show();
});
