'use strict'

class Settings {
  constructor({
    mount,
    onUpdate,
  }) {
    const div = document.createElement('div');
    div.style.position = 'absolute';
    div.style.top = '84px';
    div.style.left = '64px';
    div.style.width = '192px';
    const form = document.createElement('form');
    form.style.display = 'flex';
    form.style.alignItems = 'center';
    form.style.flexDirection = 'column';
    form.style.color = '#999';
    form.appendChild(document.createTextNode('Board IP:'));
    const input = document.createElement('input');
    input.name = 'ip';
    input.required = true;
    input.style.margin = '5px 0 10px';
    input.style.width = '80%';
    form.appendChild(input);
    const button = document.createElement('button');
    button.appendChild(document.createTextNode('Connect'));
    button.type = 'submit';
    form.appendChild(button);
    form.addEventListener('submit', this.onSubmit.bind(this), false);
    div.appendChild(form);
    mount.appendChild(div);
    this.input = input;
    this.onUpdate = onUpdate;
  }

  onSubmit(e) {
    e.preventDefault();
    const { target: { ip: { value: ip } } } = e;
    const { onUpdate } = this;
    if (!ip) {
      return;
    }
    onUpdate({ ip });
  }
}

export default Settings;
