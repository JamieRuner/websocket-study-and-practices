# websocket学习记录

### websocket断开原因、心跳机制防止自动断开连接

> websocket的'close'事件接受到的信息会比websocket实例下的onclose方法接收的少，推荐使用onclose方法

```js
ws.onclose = function (e) {
  console.log('websocket 断开: ' + e.code + ' ' + e.reason + ' ' + e.wasClean)
  console.log(e)
}

ws.on('close', function close(e) {
  // e 只是一个状态码
  console.log(e);
});
```

websocket断开时，会给客户端发送一个CloseEvent事件，主要包括：

- code 状态码
- reason 原因描述
- wasClean 是否正常断开

#### websocket断开解决方案

业务上可以:

1. 客户端定时ping websocket服务，1秒内没有收到回复的消息，就自动进行重连操作

nginx上设置proxy_read_timeout

### 监控node.js客户端断开重连内存使用情况

```javascript
// 监控内存使用情况
setInterval(() => {
  const used = process.memoryUsage();
  for (let key in used) {
    console.log(`${key} ${Math.round(used[key] / 1024 / 1024 * 100) / 100} MB`);
  }
  console.log('\n');
}, 1000)

// 借助工具包读取内存快照,通过chrome浏览器开发者工具观察（F12->内存->加载快照）
const heapdump = require('heapdump');
setInterval(() => {
  heapdump.writeSnapshot(`${new Date().getTime()}.heapsnapshot`); // 每隔5s记录内存的堆快照
}, 5000);
```

### 《深入浅出Node.js》关于websocket部分的介绍

补充内容：[WebSocket学习记录](https://github.com/JamieRuner/blog/blob/main/articles/nodejs/websocket.md)

- 使用websocket只需要建立一个TCP连接就可以实现双向的通信
- 相比HTTP协议,websocket更接近于传输层协议，他并没有在HTTP协议的基础上模拟服务器端的推送，而是在TCP上独立定义的协议。让人迷惑的部分在于websocket握手部分是由HTTP完成的，使人觉得它可能是基于HTTP协议实现的。
- websocket协议主要包括两个部分：握手、数据传输




#### websocket与Node.js配合堪称完美，原因如下

- WebSocket客户端基于事件的编程几乎与Node中自定义事件相差无几。
- WebSocket实现了客户端与服务端的长连接，而Node.js的事件驱动的方式十分擅长与大量客户端保持高并发连接

#### websocket相比于HTTP的优点

- 客户端与服务端只需要建立一个TCP连接，可以节省建立连接时产生的内存开销
- websocket可以推送数据到客户端
- websocket有更加轻量级的协议头，可以减少数据传输量

#### websocket如何处理连接进来的请求（一般做法是分线程去处理，但是nodejs是单线程的）


#### cluster起多个线程时的注意事项

- worker通过cluster.fork()生成，不用new Worker()的构造器生成
- isPrimary和isMaster都能区分是否是主线程，但是得官方文档用的是isPrimary

#### websocket的应用场景

- 即时聊天通信
- 多玩家游戏
- 在线协同编程/编辑
- 实时数据流拉取和推送
- 体育/游戏实况
- 实时地图位置
- 即时Web应用程序：即时Web应用程序使用一个Web套接字在客户端显示数据，这些数据由后端服务器连续发送。在WebSocket中，数据被连续推送/传输到已经打开的同一连接中，这就是为什么WebSocket更快并提高了应用程序性能的原因。 例如在交易网站或比特币交易中，这是最不稳定的事情，它用于显示价格波动，数据被后端服务器使用Web套接字通道连续推送到客户端
- 游戏应用程序：在游戏应用程序中，你可能会注意到，服务器会持续接收数据，而不会刷新用户界面。屏幕上的用户界面会自动刷新，而且不需要建立新的连接，因此在WebSocket游戏应用程序中非常有帮助
- 聊天应用程序：聊天应用程序仅使用WebSocket建立一次连接，便能在订阅户之间交换，发布和广播消息。它重复使用相同的WebSocket连接，用于发送和接收消息以及一对一的消息传输

#### websocket常见的问题

- 断线重连，解决办法是客户端定时向服务端发送心跳
- 如何判断是否在线或则已经离线，将用户请求时间的间隔大于指定时间时，判断为离线，否者为在线
- nginx代理的websocket转发，无消息连接时会出现超时断开的问题，解决方案有两种，一种是修改nginx配置，另一种是发送定时心跳包

- 什么是 WebSocket？它与 HTTP 有哪些区别和优势？
- WebSocket 的握手过程是怎样的？
- WebSocket 支持哪些数据类型？
- 如何实现 WebSocket 的心跳机制？
- 如何处理客户端发来的消息？
- 如何广播消息给所有客户端？
- 如何处理客户端的断开连接？
- WebSocket 的安全性如何保障？
（https://wiki.wgpsec.org/knowledge/web/websocket-sec.html、https://www.51cto.com/article/758696.html）
  - 将通过 WebSocket 接收的数据在两个方向都视为不可信的。在服务器端和客户端安全地处理数据，以防止基于输入的漏洞，如 SQL 注入和跨网站脚本
  - 使用CSRF Token、请求头令牌等方案保护WebSocket握手流程，防止WebSocket握手流程被CSRF攻击所利用
  - 使用wss://协议，（基于TLS的Websockets）
  - 硬编码WebSockets的URL接口，以保证用户的输入无法篡改此URL
- 使用 WebSocket 时需要注意哪些问题？
- 与其他技术如 AJAX、Comet 比较，WebSocket 有哪些优势和不足之处？



#### 起多线程去连同一个websocket服务，会报错，这个之后再看看

- Subprotocols相关的内容，后面了解下
https://www.cnblogs.com/flydean/p/15329109.html

#### 实践的总结

- 通过升级的方式创建的websocket，他们所支持的事件和方法有一些区别；通过升级的方式获取到的websocket实例，主要是定义在内置摸扩http中。
- this指针的具体使用还有一些模糊，得查些资料学习下
-

