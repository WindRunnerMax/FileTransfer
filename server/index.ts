import process from "process";
import { Server, Socket } from "socket.io";
import { SOCKET_EVENT_ENUM, SocketHandler, SocketEventParams } from "../src/types/signaling-event";

const io = new Server<SocketHandler, SocketHandler>(3000);

const room = new Map<string, { socket: Socket; sdp?: string }>();
io.on("connection", socket => {
  socket.on(SOCKET_EVENT_ENUM.JOIN_ROOM, ({ id }) => {
    if (!id) return void 0;
    room.set(id, { socket });
    const initialization: SocketEventParams["JOINED_ROOM"]["initialization"] = [];
    room.forEach((value, key) => {
      id !== key && initialization.push({ id: key, sdp: value.sdp });
      value.socket.emit(SOCKET_EVENT_ENUM.JOINED_ROOM, { id, initialization });
    });
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
    if (!room.has(socket.id)) return void 0;
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

console.log("Listening on port 3000...");
