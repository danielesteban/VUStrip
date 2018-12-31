'use strict'

class Meter {
  constructor(mount) {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.verticalAlign = 'middle';
    this.canvas.style.webkitAppRegion = 'drag';
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    mount.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.chunkCount = 20;
    this._amplitude = { left: 0, right: 0 };
    this.needsUpdate = true;
    this.animate();
  }

  get amplitude() {
    return this._amplitude;
  }

  set amplitude(channels) {
    const { chunkCount } = this;
    ['left', 'right'].forEach((channel) => {
      this._amplitude[channel] = channels[channel] * chunkCount / 0xFF;
    });
    this.needsUpdate = true;
  }

  animate() {
    const { needsUpdate } = this;
    requestAnimationFrame(this.animate.bind(this));
    if (needsUpdate) {
      this.needsUpdate = false;
      this.render();
    }
  }

  render() {
    const {
      amplitude,
      canvas,
      chunkCount,
      ctx,
    } = this;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111';
    ctx.fillRect(1, 1, canvas.width - 2, canvas.height - 2);
    const chunkHeight = (canvas.height * 0.9) / chunkCount;
    const channelOffset = canvas.width / 5;
    const rect = {
      width: canvas.width / 4,
      height: chunkHeight * 0.75,
    };
    rect.x = canvas.width * 0.5 - rect.width * 0.5;
    rect.y = canvas.height * 0.05 + chunkHeight * 0.5 - rect.height * 0.5;
    for (let i = 0; i < chunkCount; i += 1) {
      ['left', 'right'].forEach((channel) => {
        ctx.fillStyle = i < amplitude[channel] ? '#900' : '#300';
        ctx.fillRect(
          rect.x + channelOffset * (channel === 'left' ? 1 : -1),
          rect.y + chunkHeight * (chunkCount - 1 - i),
          rect.width,
          rect.height
        );
      });
    }
  }
}

export default Meter;
