import * as blessed from 'blessed';
import { currentChat$, currentChatId$, updates$ } from '..';
import { Component } from './Component';
import { TgClient } from '../tg/tgClient';
import { IChatFullData } from '../tg/tgInterfaces';

export class Conversations extends Component {
  list: blessed.Widgets.ListElement;
  savedChats: IChatFullData[];

  constructor(private client: TgClient) {
    super();

    this.create();

    this.client.getChats().then((chats) => {
      this.savedChats = chats;
      chats.forEach((chat) => {
        this.list.addItem(`${chat.title} [${chat.unread_count}]`);
      });
      this.next();
    });

    this.list.on('select item', async (item) => {
      const index = this.list.getItemIndex(item);
      const chat = this.savedChats[index];
      if (!chat) {
        return;
      }
      if (currentChatId$.value !== -1) {
        await this.client.closeChat(currentChatId$.value);
      }
      currentChatId$.next(chat.id);
      await this.client.openChat(chat.id);
      this.client.getChatLastMessages(chat).then(messages => {
        currentChat$.next(messages);
      })
    })

    // updates$.subscribe(update => {
    //   this.list.addItem(update["@type"]);
    //   this.list.down(1);
    //
    //   this.next();
    // });
  }

  create() {
    this.list = blessed.list({
      label: 'conversations',
      border: 'line',
      top: 1,
      width: '50%',
      bottom: 2,
      fg: 'white',
      mouse: true,
      keys: true,
      interactive: true,
      style: {
        selected: {
          bg: 'grey',
        },
      },
    });

    return this.list;
  }

  getElement() {
    return this.list;
  }
}
