import http from "http";
import express from "express";
import process from "process";
import { Server } from "socket.io";
import {
  CLINT_EVENT,
  SERVER_EVENT,
  ServerHandler,
  ClientHandler,
  SocketEventParams,
} from "../types/websocket";
import { ERROR_TYPE, Member, ServerSocket } from "../types/server";
import { getIpByRequest, getLocalIp } from "./utils";

const app = express();
app.use(express.static("build/static"));
const httpServer = http.createServer(app);
const io = new Server<ClientHandler, ServerHandler>(httpServer);

const authenticate = new WeakMap<ServerSocket, string>();
const room = new Map<string, Member>();

io.on("connection", socket => {
  socket.on(CLINT_EVENT.JOIN_ROOM, ({ id, device }) => {
    // 验证
    if (!id) return void 0;
    authenticate.set(socket, id);
    // 加入房间
    room.set(id, { socket, device });
    // 房间通知消息
    const initialization: SocketEventParams["JOINED_MEMBER"]["initialization"] = [];
    room.forEach((instance, key) => {
      initialization.push({ id: key, device: instance.device });
      instance.socket.emit(SERVER_EVENT.JOINED_ROOM, { id, device });
    });
    socket.emit(SERVER_EVENT.JOINED_MEMBER, { initialization });
  });

  socket.on(CLINT_EVENT.SEND_OFFER, ({ origin, offer, target }) => {
    // 验证
    if (authenticate.get(socket) !== origin) return void 0;
    if (!mapper.has(target)) {
      socket.emit(SERVER_EVENT.NOTIFY_ERROR, {
        code: ERROR_TYPE.PEER_NOT_FOUND,
        message: `Peer ${target} Not Found`,
      });
    }
    // 转发`Offer`
    const targetSocket = mapper.get(target)?.socket;
    if (targetSocket) {
      targetSocket.emit(SERVER_EVENT.FORWARD_OFFER, { origin, offer, target });
    }
  });

  socket.on(CLINT_EVENT.SEND_ANSWER, ({ origin, answer, target }) => {
    // 验证
    if (authenticate.get(socket) !== origin) return void 0;
    // 转发`Answer`
    const targetSocket = mapper.get(target)?.socket;
    if (targetSocket) {
      targetSocket.emit(SERVER_EVENT.FORWARD_ANSWER, { origin, answer, target });
    }
  });

  socket.on(CLINT_EVENT.LEAVE_ROOM, () => {
    // 验证
    const id = authenticate.get(socket);
    if (id) {
      // 退出房间
      room.delete(id);
      room.forEach(instance => {
        instance.socket.emit(SERVER_EVENT.LEFT_ROOM, { id });
      });
    }
  });

  socket.on("disconnect", () => {
    // 验证
    const id = authenticate.get(socket);
    if (id) {
      // 退出房间
      room.delete(id);
      room.forEach(instance => {
        instance.socket.emit(SERVER_EVENT.LEFT_ROOM, { id });
      });
    }
  });
});

process.on("SIGINT", () => {
  console.info("SIGINT Received, exiting...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.info("SIGTERM Received, exiting...");
  process.exit(0);
});

const PORT = 3000;
httpServer.listen(PORT, () => {
  const ip = getLocalIp();
  console.log(`Listening on port http://localhost:${PORT} ...`);
  ip.forEach(item => {
    console.log(`Listening on port http://${item}:${PORT} ...`);
  });
});
