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

客户端的逻辑

```javascript
var lockReconnect = false;  //避免ws重复连接
var ws = null;          // 判断当前浏览器是否支持WebSocket
var wsUrl = serverConfig.socketUrl;
createWebSocket(wsUrl);   //连接ws

function createWebSocket(url) {
    try{
        if('WebSocket' in window){
            ws = new WebSocket(url);
        }
        initEventHandle();
    }catch(e){
        reconnect(url);
        console.log(e);
    }
}

function initEventHandle() {
    ws.onclose = function () {
        reconnect(wsUrl);
        console.log("llws连接关闭!"+new Date().toLocaleString());
    };
    ws.onerror = function () {
        reconnect(wsUrl);
        console.log("llws连接错误!");
    };
    ws.onopen = function () {
        heartCheck.reset().start();      //心跳检测重置
        console.log("llws连接成功!"+new Date().toLocaleString());
    };
    ws.onmessage = function (event) {    //如果获取到消息，心跳检测重置
        heartCheck.reset().start();      //拿到任何消息都说明当前连接是正常的
        console.log("llws收到消息啦:" +event.data);
        if(event.data!='pong'){
            let data = JSON.parse(event.data);
        }
    };
}
// 监听窗口关闭事件，当窗口关闭时，主动去关闭websocket连接，防止连接还没断开就关闭窗口，server端会抛异常。
window.onbeforeunload = function() {
    ws.close();
}

function reconnect(url) {
    if(lockReconnect) return;
    lockReconnect = true;
    setTimeout(function () {     //没连接上会一直重连，设置延迟避免请求过多
        createWebSocket(url);
        lockReconnect = false;
    }, 2000);
}

//心跳检测
var heartCheck = {
    timeout: 1000,        //1分钟发一次心跳
    timeoutObj: null,
    serverTimeoutObj: null,
    reset: function(){
        clearTimeout(this.timeoutObj);
        clearTimeout(this.serverTimeoutObj);
        return this;
    },
    start: function(){
        var self = this;
        this.timeoutObj = setTimeout(function(){
            //这里发送一个心跳，后端收到后，返回一个心跳消息，
            //onmessage拿到返回的心跳就说明连接正常
            ws.send("ping");
            console.log("ping!")
            self.serverTimeoutObj = setTimeout(function(){//如果超过一定时间还没重置，说明后端主动断开了
                ws.close();     //如果onclose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onclose导致重连两次
            }, self.timeout)
        }, this.timeout)
    }
}
```

服务端的逻辑

```java
// 收到客户端消息后调用的方法
 @OnMessage
 public void onMessage(String message, Session session) {
     if(message.equals("ping")){
     }else{
     。。。。
     }
}
```

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

#### 起多线程去连同一个websocket服务，会报错，这个之后再看看

- Subprotocols相关的内容，后面了解下
https://www.cnblogs.com/flydean/p/15329109.html

#### 实践的总结

- 通过升级的方式创建的websocket，他们所支持的事件和方法有一些区别；通过升级的方式获取到的websocket实例，主要是定义在内置摸扩http中。
- this指针的具体使用还有一些模糊，得查些资料学习下
-

