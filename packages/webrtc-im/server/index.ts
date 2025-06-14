import http from "http";
import path from "path";
import express from "express";
import process from "process";
import { Server } from "socket.io";
import type { ServerHandler, ClientHandler, ServerJoinRoomEvent } from "../types/signaling";
import { CLINT_EVENT, SERVER_EVENT } from "../types/signaling";
import type { ServerSocket, SocketMember } from "../types/server";
import { ERROR_CODE } from "../types/server";
import { getSocketIp, getLocalIp } from "./utils";
import { LRUSession } from "./session";

const app = express();
app.use(express.static(path.resolve(__dirname, "static")));
const httpServer = http.createServer(app);
const io = new Server<ClientHandler, ServerHandler>(httpServer);

const sockets = new WeakMap<ServerSocket, string>();
const users = new Map<string, SocketMember>();
const session = new LRUSession();

io.on("connection", socket => {
  const sessionId = socket.handshake.auth.sessionId;
  const userId = session.getId(sessionId || socket.id);
  const { ip: userIp, hash: userIpHash } = getSocketIp(socket.request);
  sockets.set(socket, userId);

  socket.on(CLINT_EVENT.JOIN_ROOM, payload => {
    const user: SocketMember = {
      id: userId,
      socket: socket,
      connected: true,
      device: payload.device,
      ip: userIp,
      hash: userIpHash,
    };
    const newUser: ServerJoinRoomEvent[number] = {
      id: userId,
      ip: user.ip,
      hash: user.hash,
      device: payload.device,
    };
    socket.emit(SERVER_EVENT.INIT_USER, newUser);
    const currentUsers: ServerJoinRoomEvent = [...users.values()].map(user => ({
      ip: user.ip,
      id: user.id,
      hash: user.hash,
      device: user.device,
    }));
    socket.emit(SERVER_EVENT.JOIN_ROOM, currentUsers);
    users.forEach(user => {
      user.socket.emit(SERVER_EVENT.JOIN_ROOM, [newUser]);
    });
    users.set(userId, user);
  });

  socket.on(CLINT_EVENT.SEND_OFFER, payload => {
    const { to } = payload;
    const targetUser = users.get(to);
    if (!targetUser) {
      socket.emit(SERVER_EVENT.SEND_ERROR, {
        code: ERROR_CODE.NOT_FOUNT,
        message: `Target user ${to} not fount`,
      });
      return void 0;
    }
    targetUser.socket.emit(SERVER_EVENT.SEND_OFFER, { ...payload, from: userId });
  });

  socket.on(CLINT_EVENT.SEND_ICE, payload => {
    const { to } = payload;
    const targetUser = users.get(to);
    if (targetUser) {
      targetUser.socket.emit(SERVER_EVENT.SEND_ICE, { ...payload, from: userId });
    }
  });

  socket.on(CLINT_EVENT.SEND_ANSWER, payload => {
    const { to } = payload;
    const targetUser = users.get(to);
    if (targetUser) {
      targetUser.socket.emit(SERVER_EVENT.SEND_ANSWER, { ...payload, from: userId });
    }
  });

  socket.on(CLINT_EVENT.SEND_ERROR, payload => {
    const { to, code, message } = payload;
    const targetUser = users.get(to);
    if (targetUser) {
      targetUser.socket.emit(SERVER_EVENT.SEND_ERROR, { code, message });
    }
  });

  socket.on(CLINT_EVENT.LEAVE_ROOM, () => {
    users.delete(userId);
    users.forEach(user => {
      user.socket.emit(SERVER_EVENT.LEAVE_ROOM, { id: userId });
    });
  });

  socket.on("disconnect", () => {
    const id = sockets.get(socket);
    if (!id) return void 0;
    users.delete(id);
    sockets.delete(socket);
    users.forEach(user => {
      user.socket.emit(SERVER_EVENT.LEAVE_ROOM, { id });
    });
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

const PORT = Number(process.env.PORT) || 3000;
httpServer.listen(PORT, () => {
  const ip = getLocalIp();
  console.log(`Listening on port http://localhost:${PORT} ...`);
  ip.forEach(item => {
    console.log(`Listening on port http://${item}:${PORT} ...`);
  });
});
