import http from "http";
import express from "express";
import process from "process";
import { Server, Socket } from "socket.io";
import { SOCKET_EVENT_ENUM, SocketHandler, SocketEventParams } from "../src/types/signaling";

const app = express();
app.use(express.static("build/static"));
const httpServer = http.createServer(app);
const io = new Server<SocketHandler, SocketHandler>(httpServer);

const room = new Map<string, { socket: Socket; sdp?: string }>();
io.on("connection", socket => {
  socket.on(SOCKET_EVENT_ENUM.JOIN_ROOM, ({ id }) => {
    if (!id) return void 0;
    const initialization: SocketEventParams["JOINED_MEMBER"]["initialization"] = [];
    room.forEach((value, key) => {
      initialization.push({ id: key, sdp: value.sdp });
      value.socket.emit(SOCKET_EVENT_ENUM.JOINED_ROOM, { id });
    });
    room.set(id, { socket });
    socket.emit(SOCKET_EVENT_ENUM.JOINED_MEMBER, { initialization });
  });

  socket.on(SOCKET_EVENT_ENUM.SEND_OFFER, ({ origin, sdp, target }) => {
    room.set(origin, { socket, sdp });
    const targetSocket = room.get(target)?.socket;
    if (targetSocket) {
      targetSocket.emit(SOCKET_EVENT_ENUM.FORWARD_OFFER, { origin, sdp });
    }
  });

  socket.on(SOCKET_EVENT_ENUM.SEND_ANSWER, ({ origin, sdp, target }) => {
    const targetSocket = room.get(target)?.socket;
    if (targetSocket) {
      targetSocket.emit(SOCKET_EVENT_ENUM.FORWARD_ANSWER, { origin, sdp });
    }
  });

  socket.on(SOCKET_EVENT_ENUM.LEAVE_ROOM, ({ id }) => {
    room.delete(id);
    room.forEach(value => {
      value.socket.emit(SOCKET_EVENT_ENUM.LEFT_ROOM, { id });
    });
  });

  socket.on("disconnect", () => {
    room.delete(socket.id);
    room.forEach(value => {
      value.socket.emit(SOCKET_EVENT_ENUM.LEFT_ROOM, { id: socket.id });
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

httpServer.listen(3000, () => {
  console.log("Listening on port http://localhost:3000 ...");
});
