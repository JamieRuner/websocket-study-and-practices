const cluster = require("cluster");
const WebSocket = require('./simulatorBrowserWebSocketLaunch');

let worker = null;

function createWebSocket() {
  const websocket = new WebSocket('ws://127.0.0.1:8080');
  websocket.connect();
  return websocket;
}


async function sleep(timeout) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(1);
    }, timeout);
  });
}

async function start() {
  if (cluster.isPrimary) {
    worker = cluster.fork();
    worker.on('error', (error) => {
      console.info(error);
    });
    worker.on('exit', (code) => {
      if (code !== 0) {
        console.error(`worker stopped with exit code ${code}`);
      }
    });
    // sleep(2000);
  } else {
    createWebSocket();
  }
}

start();
