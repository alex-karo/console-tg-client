import * as blessed from 'blessed';
import { Component } from './Component';
import { TgClient } from '../tg/tgClient';
import { currentChat$, currentChatId$, updates$ } from '../index';
import { IMessage, IMessageTextContent, IUpdateNewMessageEvent, IUser } from '../tg/tgInterfaces';
import { format } from 'date-fns';
import { filter } from 'rxjs/operators';

export class Chat extends Component {
  list: blessed.Widgets.ListElement;
  messages: IMessage[];
  users = new Map<number, IUser>();

  constructor(private client: TgClient) {
    super();

    this.create();

    currentChat$.subscribe(async (messages) => {
      this.messages = messages;

      for (const message of messages) {
        const { sender_user_id } = message;
        if (!sender_user_id) {
          continue;
        }
        if (this.users.has(sender_user_id)) {
          continue;
        }
        const user = await this.client.getUser(sender_user_id);
        if (user) {
          this.users.set(sender_user_id, user);
        }
      }
      messages
        .filter(msg => msg.content['@type'] === 'messageText')
        .reverse()
        .forEach((msg) => {
          this.addMessage(msg);
        });
      this.next();
    });

    updates$.pipe(
      filter<IUpdateNewMessageEvent>(update => update['@type'] === 'updateNewMessage'),
      filter<IUpdateNewMessageEvent>(update => update.message.chat_id !== currentChatId$.value),
    ).subscribe(async update => {
      if (!this.users.has(update.message.sender_user_id)) {
        const user = await this.client.getUser(update.message.sender_user_id);
        this.users.set(update.message.sender_user_id, user);
      }
      this.addMessage(update.message);
    });
  }

  create() {
    this.list = blessed.list({
      label: 'chat',
      border: 'line',
      left: '50%',
      top: 1,
      width: '50%',
      bottom: 2,
      fg: 'white',
      interactive: true,
      mouse: true,
      keys: true,
      tags: true,
    });

    return this.list;
  }

  getElement() {
    return this.list;
  }

  private addMessage(msg: IMessage) {
    const content = (msg.content as IMessageTextContent);
    const author = this.users.get(msg.sender_user_id);
    if (!author) {
      return;
    }
    const text = content.text.text;
    this.list.addItem(`[${format(msg.date * 1000, 'HH:mm')}] {green-fg}${author.first_name} ${author.last_name}{/}: ${text}`);
    this.list.down(1);
  }
}
