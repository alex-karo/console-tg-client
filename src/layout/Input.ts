import * as blessed from 'blessed';
import { Component } from './Component';
import { TgClient } from '../tg/tgClient';
import { currentChatId$ } from '../index';

export class Input extends Component {
  textBox: blessed.Widgets.TextboxElement;

  constructor(private client: TgClient) {
    super();

    this.create();

    this.textBox.on('submit', async (text: string) => {
      if (!text || currentChatId$.value === -1) {
        return;
      }

      await this.client.sendTextMessage(text, currentChatId$.value);
      this.textBox.setValue('');
    })
  }

  create() {
    this.textBox = blessed.textbox({
      border: 'line',
      height: 3,
      bottom: 0,
      inputOnFocus: true,
      keys: true,
      mouse: true,
      fg: 'white',
    });

    return this.textBox;
  }

  getElement() {
    return this.textBox;
  }
}
