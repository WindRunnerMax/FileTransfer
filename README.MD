# FileTransfer

基于`WebRTC/WebSocket`的文件传输：

1. 局域网内可以互相发现，不需要手动输入对方`IP`地址等信息。
2. 多个设备中的任意两个设备之间可以相互传输文本消息与文件数据。
3. 设备间的数据传输采用基于`WebRTC`的`P2P`方案，无需服务器中转数据。
4. 跨局域网传输且`NAT`穿越受限的情况下，基于`WebSocket`服务器中转传输。


https://github.com/WindrunnerMax/FileTransfer/assets/33169019/b1d8d455-84e9-47c1-aa22-2fc77ffa10d1


## Development

```bash
$ pnpm install
$ npm run dev:webrtc
$ npm run dev:websocket
```
## Deployment

```bash 
$ pnpm install
$ npm run deploy:webrtc
$ npm run deploy:websocket
```
