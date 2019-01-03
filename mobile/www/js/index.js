'use strict'

const ip = '192.168.1.76';
let socket;

const meter = new Meter(
  document.getElementById('app')
);
meter.ip = ip;

const connect = () => {
  socket = new WebSocket(`ws://${ip}/`);
  socket.onopen = () => {
    meter.connected = true;
  };
  socket.onclose = () => {
    meter.connected = false;
    setImmediate(connect);
  };
};
connect();

const animate = () => {
  vumeter.getMeasurement(({ amplitude }) => {
    amplitude = Math.min(Math.max(amplitude, 0), 10) / 10;
    const scaled = Math.round(amplitude * 0xFF) & 0xFF;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(new Uint8Array([scaled, scaled]));
    }
    meter.amplitude = {
      left: scaled,
      right: scaled,
    };
    requestAnimationFrame(animate);
  }, () => {});
};

document.addEventListener('deviceready', () => {
  animate();
}, false);
