const { WebSocketServer } = require('ws');

const wss = new WebSocketServer({ port: 8080 });

wss.on('connection', (ws) => {
  ws.on('error', console.error);

  ws.on('message', (data) => {
    if (data.toString() === 'ping') {
      ws.send('pong');
    }
    console.log('received: %s', data);
    console.log(`pid: ${process.pid}`);
  });

  ws.on('close', (e) => {
    console.log(e);
  });

  ws.send('进来一个连接请求');
});
