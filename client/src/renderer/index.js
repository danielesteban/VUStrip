'use strict'

import { desktopCapturer, ipcRenderer } from 'electron';
import Meter from './meter';
import Settings from './settings';

// Main Styles
document.body.style.background = '#111';
document.body.style.overflow = 'hidden';

// Amplitude meter
const meter = new Meter(
  document.getElementById('app')
);

// Settings
const settings = new Settings({
  mount: document.getElementById('app'),
  onUpdate: ({ ip }) => {
    localStorage.setItem('VUStrip::Settings', JSON.stringify({ ip }));
    ipcRenderer.send('Strip::SetIp', ip);
    ipcRenderer.send('Settings::Toggle');    
  }
});

// Subscribe to & handle strip events
ipcRenderer.send('Strip::Subscribe');
ipcRenderer.on('Strip', (e, { event, ...params }) => {
  switch (event) {
    case 'open':
      meter.connected = true;
      break;
    case 'close':
      meter.connected = false;
      break;
    case 'ip':
      meter.ip = params.ip;
      settings.input.value = params.ip;
      break;
    default:
      break;
  }
});

// Load stored settings
{
  const stored = localStorage.getItem('VUStrip::Settings');
  if (stored) {
    let settings;
    try {
      settings = JSON.parse(stored);
    } catch (e) {}
    if (settings && settings.ip) {
      ipcRenderer.send('Strip::SetIp', settings.ip);
    }
  }
}

// Capture system audio
desktopCapturer.getSources({ types: ['screen'] }, (err, sources) => {
  if (err || !sources.length) {
    return;
  }
  const source = {
    mandatory: {
      chromeMediaSource: 'desktop',
      chromeMediaSourceId: sources[0].id,
      minWidth: 1,
      minHeight: 1,
      maxWidth: 1,
      maxHeight: 1,
    },
  };
  navigator.mediaDevices.getUserMedia({
    audio: source,
    video: source,
  }).then((stream) => {
    const player = document.createElement('audio');
    player.srcObject = stream;
    player.onloadedmetadata = () => {
      player.play();
      player.muted = true;
    };
    // Start processing audio
    const ctx = new AudioContext();
    const src = ctx.createMediaStreamSource(stream);
    const node = ctx.createScriptProcessor(512, 2, 2);
    src.connect(node);
    node.connect(ctx.destination);
    const amplitude = {
      left: 0,
      right: 0,
    };
    node.onaudioprocess = ({ inputBuffer }) => {
      const scaled = {
        left: 0,
        right: 0,
      };
      // Compute stereo RMS with dampening
      ['left', 'right'].forEach((channel, i) => {
        amplitude[channel] = Math.max(
          Math.sqrt(
            inputBuffer.getChannelData(i).reduce((sum, sample) => (
              sum + (sample ** 2)
            ), 0)
            / inputBuffer.length
          ),
          amplitude[channel] * 0.95
        );
        scaled[channel] = Math.min(Math.max(Math.round(
          amplitude[channel] * 4 * 0xFF
        ), 0), 0xFF);
      });
      // Update meter & led strip
      meter.amplitude = scaled;
      ipcRenderer.send('Strip::Update', scaled);
    };
  });
});
