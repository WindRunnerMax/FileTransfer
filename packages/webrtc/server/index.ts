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
} from "../types/signaling";
import { CONNECTION_STATE, Member, ServerSocket } from "../types/server";

const app = express();
app.use(express.static("build/static"));
const httpServer = http.createServer(app);
const io = new Server<ClientHandler, ServerHandler>(httpServer);

const authenticate = new WeakMap<ServerSocket, string>();
const mapper = new Map<string, Member>();

io.on("connection", socket => {
  socket.on(CLINT_EVENT.JOIN_ROOM, ({ id, device }) => {
    if (!id) return void 0;
    authenticate.set(socket, id);
    const initialization: SocketEventParams["JOINED_MEMBER"]["initialization"] = [];
    mapper.forEach((value, key) => {
      initialization.push({ id: key, device });
      value.socket.emit(SERVER_EVENT.JOINED_ROOM, { id, device });
    });
    mapper.set(id, { socket, device, state: CONNECTION_STATE.NORMAL });
    socket.emit(SERVER_EVENT.JOINED_MEMBER, { initialization });
  });

  socket.on(CLINT_EVENT.SEND_OFFER, ({ origin, sdp, target }) => {
    if (authenticate.get(socket) !== origin) return void 0;
    const targetSocket = mapper.get(target)?.socket;
    if (targetSocket) {
      targetSocket.emit(SERVER_EVENT.FORWARD_OFFER, { origin, sdp, target });
    }
  });

  socket.on(CLINT_EVENT.SEND_ANSWER, ({ origin, sdp, target }) => {
    if (authenticate.get(socket) !== origin) return void 0;
    const targetSocket = mapper.get(target)?.socket;
    if (targetSocket) {
      targetSocket.emit(SERVER_EVENT.FORWARD_ANSWER, { origin, sdp, target });
    }
  });

  socket.on(CLINT_EVENT.LEAVE_ROOM, ({ id }) => {
    if (authenticate.get(socket) !== id) return void 0;
    mapper.delete(id);
    mapper.forEach(value => {
      value.socket.emit(SERVER_EVENT.LEFT_ROOM, { id });
    });
  });

  socket.on("disconnect", () => {
    const id = authenticate.get(socket);
    if (id) {
      mapper.delete(id);
      mapper.forEach(value => {
        value.socket.emit(SERVER_EVENT.LEFT_ROOM, { id });
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

httpServer.listen(3000, () => {
  console.log("Listening on port http://localhost:3000 ...");
});

// Reference
// https://socket.io/zh-CN/docs/v4/server-socket-instance/
