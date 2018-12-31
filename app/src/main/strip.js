'use strict'

import { ipcMain } from 'electron';
import WebSocket from 'ws';
global.WebSocket = WebSocket;
import ReconnectingWebSocket from 'reconnecting-websocket';

class Strip {
  constructor(ip) {
    this.amplitude = Buffer.from([0, 0]);
    this.setIp(ip);
    ipcMain.on('setStripIp', (e, value) => this.setIp(value));
    ipcMain.on('updateStrip', (e, value) => this.update(value));
  }

  connect() {
    const { amplitude, ip } = this;
    this.socket = new ReconnectingWebSocket(`ws://${ip}/`);
    this.socket.addEventListener('open', () => {
      this.socket.send(amplitude, () => {});
    });
  }

  close() {
    const { socket } = this;
    if (socket) {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(Buffer.from([0, 0]), () => {});
      }
      socket.close();
      delete this.socket;
    }
  }

  setIp(ip) {
    const { socket } = this;
    this.ip = ip;
    this.close();
    this.connect();
  }

  update({ left, right }) {
    const { amplitude, socket } = this;
    amplitude[0] = left;
    amplitude[1] = right;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(amplitude, () => {});
    }
  }
}

export default Strip;
