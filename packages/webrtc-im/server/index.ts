import http from "http";
import path from "path";
import express from "express";
import process from "process";
import { Server } from "socket.io";
import type { ServerHandler, ClientHandler } from "../types/signaling";
import { CLINT_EVENT, SERVER_EVENT } from "../types/signaling";
import type { ServerSocket, SocketMember } from "../types/server";
import { ERROR_CODE } from "../types/server";
import { getIpByRequest, getLocalIp } from "./utils";
import { getId } from "@block-kit/utils";

const app = express();
app.use(express.static(path.resolve(__dirname, "static")));
const httpServer = http.createServer(app);
const io = new Server<ClientHandler, ServerHandler>(httpServer);

const sockets = new WeakMap<ServerSocket, string>();
const users = new Map<string, SocketMember>();

io.on("connection", socket => {
  const socketId = getId(10);

  socket.on(CLINT_EVENT.JOIN_ROOM, payload => {
    const user: SocketMember = {
      id: socketId,
      socket: socket,
      connected: true,
      device: payload.device,
      ip: getIpByRequest(socket.request),
    };
    users.set(socketId, user);
    users.forEach(user => {
      const initialization = {
        ip: user.ip,
        id: socketId,
        device: user.device,
        self: user.id === socketId,
      };
      user.socket.emit(SERVER_EVENT.JOIN_ROOM, initialization);
    });
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
    targetUser.socket.emit(SERVER_EVENT.SEND_OFFER, payload);
  });

  socket.on(CLINT_EVENT.SEND_ICE, payload => {
    const { to } = payload;
    const targetUser = users.get(to);
    if (targetUser) {
      targetUser.socket.emit(SERVER_EVENT.SEND_ICE, payload);
    }
  });

  socket.on(CLINT_EVENT.SEND_ANSWER, payload => {
    const { to } = payload;
    const targetUser = users.get(to);
    if (targetUser) {
      targetUser.socket.emit(SERVER_EVENT.SEND_ANSWER, payload);
    }
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
