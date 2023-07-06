const WebSocket = require('ws');
const heapdump = require('heapdump');

heapdump.writeSnapshot('init.heapsnapshot'); // 记录初始内存的堆快照

let lockReconnect = false;
let url = 'ws://127.0.0.1:8080';
let ws = null;

start();

// 监控内存使用情况
setInterval(() => {
  const used = process.memoryUsage();
  for (let key in used) {
    console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
  console.log('\n');
}, 1000)

setInterval(() => {
  heapdump.writeSnapshot(`${new Date().getTime()}.heapsnapshot`); // 每隔5s记录内存的堆快照
}, 5000);


function start() {
  try {
    ws = new WebSocket(url);
    initWebSocket();
  } catch (e) {
    reconnect();
    console.log(e);
  }
}

function initWebSocket() {

  ws.onopen = (event) => {
    heartCheck.reset().start();
    ws.send(`我是client，你好啊，websocket服务器: ${event}`);
  };

  ws.onmessage = (event) => {
    heartCheck.reset().start();
    console.log('received: %s', event.data);
  }

  ws.onclose = (event) => {
    reconnect();
    // console.log(event);
  }

  ws.onerror = (event) => {
    reconnect();
    // console.log(event);
  };

}

function reconnect() {
  if (lockReconnect) {
    return;
  }
  lockReconnect = true;
  setImmediate(() => {
    start()
    lockReconnect = false;
  });
}

const heartCheck = {
  timeout: 1000,
  timeoutObj: null,
  serverTimeoutObj: null,
  reset: function () {
    clearTimeout(this.timeoutObj);
    clearTimeout(this.serverTimeoutObj);
    return this;
  },
  start: function () {
    var self = this;
    this.timeoutObj = setTimeout(() => {
      ws.send('ping');
      console.log('ping');
      self.serverTimeoutObj = setTimeout(() => {
        ws.close();
      }, self.timeout);
    }, self.timeout);
  }

};



// 1. 重新连接，就是重新创建websocket实例
// 2. 监听close事件，如果触发，那么进行重连
