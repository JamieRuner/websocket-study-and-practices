// Node.js 模拟浏览器发起HTTP切换为websocket协议
var WebSocketInner = require('ws');
var crypto = require('crypto');
var http = require('http');
var { parse } = require('url');

var WebSocket = function(url) {
  this.lockConnect = false;
  this.timeout = 1000;
  this.serverTimeoutObj = null;
  this.timeoutObj = null;
  this.socketType = 'net'; // net | ws
  this.options = parseUrl(url);
}

var parseUrl = function(url) {
  return Object.assign(parse(url), {
    'protocolVersion': 13
  });
}

WebSocket.prototype.ping = function() {
  console.log('ping');
  const self = this;
  this.serverTimeoutObj = setTimeout(() => {
    self.socket.write ? self.socket.write('ping') : self.socket.send('ping');
    self.timeoutObj = setTimeout(() => {
      self.socket.emit('close');
    }, self.timeout);
  }, this.timeout);
}

WebSocket.prototype.reset = function() {
  console.log('reset timeout object');
  clearTimeout(this.timeoutObj);
  clearTimeout(this.serverTimeoutObj);
  return this;
}

WebSocket.prototype.onopen = function(callbacks) {
  const eventName = this.socketType === 'ws' ? 'open' : 'ready';
  this.socket.on(eventName, (data) => {
    console.log('websocket has opened');
    if (Array.isArray(callbacks) && callbacks.length > 0) {
      for (const callback of callbacks) {
        if (typeof callback === 'function') {
          callback.call(null, data);
        }
      }
    }
    this.reset().ping();
  });
}

WebSocket.prototype.onmessage = function(callbacks) {
  const eventName = this.socketType === 'ws' ? 'message' : 'data';
  this.socket.on(eventName, (event) => {
    this.reset().ping();
    let data = event.data ? event.data.toString() : event.toString();
    console.log(`received message: ${data}`);
    if (Array.isArray(callbacks) && callbacks.length > 0) {
      for (const callback of callbacks) {
        if (typeof callback === 'function') {
          callback.call(null, data);
        }
      }
    }
  });
}

WebSocket.prototype.setSocket = function(socket) {
  this.socket = socket;
}

WebSocket.prototype.connect = function() {
  var that = this;
  var key = new Buffer.from(this.options.protocolVersion + '-' + Date.now()).toString('base64');
  var shasum = crypto.createHash('sha1');
  var expected = shasum.update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  var options = {
    port: this.options.port,
    host: this.options.hostname,
    headers: {
      'Connection': 'Upgrade',
      'Upgrade': 'websocket',
      'Sec-WebSocket-Version': this.options.protocolVersion,
      'Sec-WebSocket-Key': key,
    },
  };

  var req = http.request(options);
  req.end();

  req.on('upgrade', (res, socket, upgradeHead) => {
    that.socketType = 'net';
    that.setSocket(socket);
    that.reset().ping();
    that.handleEvent();
  });
}

WebSocket.prototype.reconnect = function() {
  if (this.lockConnect) {
    return;
  }
  var self = this;
  setImmediate(() => {
    const newSocketInstance = new WebSocketInner(self.options.href);
    self.setSocket(newSocketInstance);
    self.socketType = 'ws';
    self.lockConnect = true;
  });
}

WebSocket.prototype.onclose = function(callbacks) {
  this.socket.on('close', (data) => {
    console.log('websocket has closed');
    if (Array.isArray(callbacks)) {
      for (const callback of callbacks) {
        if (typeof callback === 'function') {
          callback.call(this, data);
        }
      }
    }
    this.reconnect();
  });
}

WebSocket.prototype.onerror = function(callbacks) {
  this.socket.on('error', (error) => {
    console.log('websocket caught error!');
    if (Array.isArray(callbacks)) {
      for (const callback of callbacks) {
        if (typeof callback === 'function') {
          callback.call(this, error);
        }
      }
    }
    this.connect();
  });
}

WebSocket.prototype.handleEvent = function() {
  this.onopen();
  this.onmessage([console.log]);
  this.onclose([console.log]);
  this.onerror([console.log]);
}

module.exports = WebSocket;
