'use strict'

import { app, BrowserWindow, Menu, Tray } from 'electron';
import * as path from 'path';
import { format as formatUrl } from 'url';
import Strip from './strip';

let win;
let tray;
const icon = path.join(__static, 'icon.ico');
const strip = new Strip(process.env.IP || '192.168.1.76');
const production = process.env.NODE_ENV === 'production';

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
    resizable: false,
    transparent: true,
    show: false,
    skipTaskbar: true,
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
    { type: 'separator' },
    { label: 'Quit', role: 'quit' },
  ]));
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
