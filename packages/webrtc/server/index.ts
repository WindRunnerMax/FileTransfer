import http from "http";
import express from "express";
import process from "process";
import { Server, Socket } from "socket.io";
import { SOCKET_EVENT_ENUM, SocketHandler, SocketEventParams } from "../src/types/signaling";

const app = express();
app.use(express.static("build/static"));
const httpServer = http.createServer(app);
const io = new Server<SocketHandler, SocketHandler>(httpServer);

const authenticate = new WeakMap<Socket, string>();
const rooms = new Map<string, { socket: Socket }>();

io.on("connection", socket => {
  socket.on(SOCKET_EVENT_ENUM.JOIN_ROOM, ({ id }) => {
    if (!id) return void 0;
    authenticate.set(socket, id);
    const initialization: SocketEventParams["JOINED_MEMBER"]["initialization"] = [];
    rooms.forEach((value, key) => {
      initialization.push({ id: key });
      value.socket.emit(SOCKET_EVENT_ENUM.JOINED_ROOM, { id });
    });
    rooms.set(id, { socket });
    socket.emit(SOCKET_EVENT_ENUM.JOINED_MEMBER, { initialization });
  });

  socket.on(SOCKET_EVENT_ENUM.SEND_OFFER, ({ origin, sdp, target }) => {
    if (authenticate.get(socket) !== origin) return void 0;
    rooms.set(origin, { socket });
    const targetSocket = rooms.get(target)?.socket;
    if (targetSocket) {
      targetSocket.emit(SOCKET_EVENT_ENUM.FORWARD_OFFER, { origin, sdp });
    }
  });

  socket.on(SOCKET_EVENT_ENUM.SEND_ANSWER, ({ origin, sdp, target }) => {
    if (authenticate.get(socket) !== origin) return void 0;
    const targetSocket = rooms.get(target)?.socket;
    if (targetSocket) {
      targetSocket.emit(SOCKET_EVENT_ENUM.FORWARD_ANSWER, { origin, sdp });
    }
  });

  socket.on(SOCKET_EVENT_ENUM.LEAVE_ROOM, ({ id }) => {
    if (authenticate.get(socket) !== id) return void 0;
    rooms.delete(id);
    rooms.forEach(value => {
      value.socket.emit(SOCKET_EVENT_ENUM.LEFT_ROOM, { id });
    });
  });

  socket.on("disconnect", () => {
    const id = authenticate.get(socket);
    if (id) {
      rooms.delete(id);
      rooms.forEach(value => {
        value.socket.emit(SOCKET_EVENT_ENUM.LEFT_ROOM, { id });
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
