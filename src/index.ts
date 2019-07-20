import {BehaviorSubject, ReplaySubject, Subject} from 'rxjs';
import { Application } from './Application';
import { IMessage, IUpdateEvent } from './tg/tgInterfaces';
import { tgClientInit } from './tg/tgClient';

export const updates$ = new ReplaySubject<IUpdateEvent>();
export const error$ = new Subject<any>();
export const render$ = new BehaviorSubject<void>(null);
export const currentChatId$ = new BehaviorSubject<number>(-1);
export const currentChat$ = new BehaviorSubject<IMessage[]>([]);

console.log('loading...');

tgClientInit().then(client => {
  client.bind('td:update', updates$);
  client.bind('td:error', error$);

  client.getCurrentState().then(({updates}) => {
    updates.forEach(update => {
      updates$.next(update);
    });
  }, () => {});

  const app = new Application(client);
}, () => {
  console.error('something went wrong!');
});
