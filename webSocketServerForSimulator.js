var http = require('http');
var crypto = require('crypto');
var WebSocket = require('./simulatorBrowserWebSocketLaunch');

var server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello World\n');
});

server.listen(8080);

server.on('upgrade', (req, socket, upgradeHead) => {
  var head = Buffer.alloc(upgradeHead.length);
  upgradeHead.copy(head);
  var key = req.headers['sec-websocket-key'];
  // var websocketProtocol = req.headers['sec-websocket-protocol'];
  var shasum = crypto.createHash('sha1');
  key = shasum.update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  var headers = [
    'HTTP/1.1 101 Switching Protocols',
    'Upgrade: websocket',
    'Connection: Upgrade',
    'Sec-WebSocket-accept: ' + key,
    // 'Sec-WebSocket-Protocol: ' + websocketProtocol,
  ];
  socket.write(headers.concat('', '').join('\r\n'));
  socket.on('data', (data) => {
    data = data.toString();
    console.log(`received data: ${data}`);
    if (data === 'ping') {
      socket.write('pong');
    }
  });
  // socket.write('hello world');
  // var websocket = new WebSocket('ws://127.0.0.1:8080');
  // websocket.setSocket(socket);
});
