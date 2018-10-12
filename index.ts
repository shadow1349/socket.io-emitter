import * as client from 'redis';
const parser = require('socket.io-parser');
const msgpack = require('notepack.io');

export class Emitter {
  redis: client.RedisClient;
  opts: client.ClientOpts;
  nsp: string;
  prefix: string;
  rooms: string[] = [];
  flags: any = {
    json: true,
    volatile: true,
    broadcast: true
  };

  constructor(
    opts: client.ClientOpts = { host: 'localhost', port: 6379 },
    nsp: string = '/',
    prefix: string = 'socket.io'
  ) {
    this.opts = opts;
    this.redis = new client.RedisClient(this.opts);
    this.nsp = nsp;
    this.prefix = prefix;
  }

  in = this.to;
  to(room: string) {
    if (!~this.rooms.indexOf(room)) {
      this.rooms.push(room);
    }

    return this;
  }

  of(namespace: string) {
    return new Emitter(this.opts, namespace);
  }

  emit(...args: any[]) {
    const data = Array.prototype.slice.call(args);
    const packet = { type: parser.EVENT, data: data, nsp: this.nsp };

    const opts = {
      rooms: this.rooms,
      flags: this.flags
    };

    const msg = msgpack.encode(['emitter', packet, opts]);
    let channel = `${this.prefix}#${this.nsp}#`;

    if (opts.rooms && opts.rooms.length === 1) {
      channel = `${channel}${opts.rooms[0]}#`;
    }

    this.redis.publish(channel, msg);
    this.rooms = [];

    return this;
  }
}
