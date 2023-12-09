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
import { CONNECTION_STATE, ERROR_TYPE, Member, ServerSocket } from "../types/server";
import { getLocalIp, updateMember } from "./utils";

const app = express();
app.use(express.static("build/static"));
const httpServer = http.createServer(app);
const io = new Server<ClientHandler, ServerHandler>(httpServer);

const authenticate = new WeakMap<ServerSocket, string>();
const room = new Map<string, Member>();
const peer = new Map<string, string>();

io.on("connection", socket => {
  socket.on(CLINT_EVENT.JOIN_ROOM, ({ id, device }) => {
    // 验证
    if (!id) return void 0;
    authenticate.set(socket, id);
    // 加入房间
    room.set(id, { socket, device, state: CONNECTION_STATE.READY });
    // 房间通知消息
    const initialization: SocketEventParams["JOINED_MEMBER"]["initialization"] = [];
    room.forEach((instance, key) => {
      initialization.push({ id: key, device: instance.device });
      instance.socket.emit(SERVER_EVENT.JOINED_ROOM, { id, device });
    });
    socket.emit(SERVER_EVENT.JOINED_MEMBER, { initialization });
  });

  socket.on(CLINT_EVENT.SEND_REQUEST, ({ origin, target }, cb) => {
    // 验证
    if (authenticate.get(socket) !== origin) return void 0;
    // 转发`Request`
    const member = room.get(target);
    if (member) {
      if (member.state !== CONNECTION_STATE.READY) {
        cb?.({ code: ERROR_TYPE.PEER_BUSY, message: `Peer ${target} Is Busy` });
        return void 0;
      }
      updateMember(room, origin, "state", CONNECTION_STATE.CONNECTING);
      member.socket.emit(SERVER_EVENT.FORWARD_REQUEST, { origin, target });
    } else {
      cb?.({ code: ERROR_TYPE.PEER_NOT_FOUND, message: `Peer ${target} Not Found` });
    }
  });

  socket.on(CLINT_EVENT.SEND_RESPONSE, ({ origin, code, reason, target }) => {
    // 验证
    if (authenticate.get(socket) !== origin) return void 0;
    // 转发`Response`
    const targetSocket = room.get(target)?.socket;
    if (targetSocket) {
      updateMember(room, origin, "state", CONNECTION_STATE.CONNECTED);
      updateMember(room, target, "state", CONNECTION_STATE.CONNECTED);
      peer.set(origin, target);
      peer.set(target, origin);
      targetSocket.emit(SERVER_EVENT.FORWARD_RESPONSE, { origin, code, reason, target });
    }
  });

  socket.on(CLINT_EVENT.SEND_UNPEER, ({ origin, target }) => {
    // 验证
    if (authenticate.get(socket) !== origin) return void 0;
    // 处理自身的状态
    peer.delete(origin);
    updateMember(room, origin, "state", CONNECTION_STATE.READY);
    // 验证
    if (peer.get(target) !== origin) return void 0;
    // 转发`Unpeer`
    const targetSocket = room.get(target)?.socket;
    if (targetSocket) {
      // 处理`Peer`状态
      updateMember(room, target, "state", CONNECTION_STATE.READY);
      peer.delete(target);
      targetSocket.emit(SERVER_EVENT.FORWARD_UNPEER, { origin, target });
    }
  });

  socket.on(CLINT_EVENT.LEAVE_ROOM, () => {
    // 验证
    const id = authenticate.get(socket);
    if (id) {
      const peerId = peer.get(id);
      peer.delete(id);
      if (peerId) {
        // 状态复位
        peer.delete(peerId);
        updateMember(room, peerId, "state", CONNECTION_STATE.READY);
      }
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
      const peerId = peer.get(id);
      peer.delete(id);
      if (peerId) {
        // 状态复位
        peer.delete(peerId);
        updateMember(room, peerId, "state", CONNECTION_STATE.READY);
      }
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
