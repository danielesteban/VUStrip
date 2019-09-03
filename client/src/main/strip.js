'use strict'

import { ipcMain } from 'electron';
import WebSocket from 'ws';
global.WebSocket = WebSocket; // ugly hack for reconnecting-websocket
import ReconnectingWebSocket from 'reconnecting-websocket';

class Strip {
  constructor(ip) {
    this.amplitude = Buffer.from([0, 0]);
    this.subscribers = [];
    this.setIp(ip);
    ipcMain.on('Strip::SetIp', (e, value) => this.setIp(value));
    ipcMain.on('Strip::Update', (e, value) => this.update(value));
    ipcMain.on('Strip::Subscribe', ({ sender }) => this.subscribe(sender));
  }

  connect() {
    const { amplitude, ip } = this;
    this.socket = new ReconnectingWebSocket(`ws://${ip}/`);
    this.socket.addEventListener('open', () => {
      this.socket.send(amplitude, () => {});
      this.emit({ event: 'open' });
    });
    this.socket.addEventListener('error', () => (
      this.emit({ event: 'close' })
    ));
    this.socket.addEventListener('close', () => (
      this.emit({ event: 'close' })
    ));
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
    this.emit({ event: 'ip', ip });
    this.close();
    this.connect();
  }

  emit(event) {
    const { subscribers } = this;
    subscribers.forEach(client => (
      client.send('Strip', event)
    ));
  }

  subscribe(client) {
    const { ip, socket, subscribers } = this;
    subscribers.push(client);
    client.send('Strip', { event: (socket && socket.readyState === WebSocket.OPEN) ? 'open' : 'close' });
    client.send('Strip', { event: 'ip', ip });
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
