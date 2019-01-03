const meter = document.getElementById('meter');

const ip = '192.168.1.76';
let socket;

const connect = () => {
  socket = new WebSocket(`ws://${ip}/`);
  socket.onclose = () => {
    connect();
  };
};
connect();

const animate = () => {
  vumeter.getMeasurement(({ amplitude }) => {
    amplitude = Math.min(Math.max(amplitude, 0), 10) / 10;
    meter.style.background = `rgba(0, 128, 0, ${amplitude})`;
    const scaled = Math.round(amplitude * 0xFF) & 0xFF;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(new Uint8Array([scaled, scaled]));
    }
    setTimeout(animate, 1000 / 30);
  }, () => {});
};

document.addEventListener('deviceready', () => {
  animate();
}, false);
