import process from "process";
import { Server, Socket } from "socket.io";
import { SOCKET_EVENT_ENUM, SocketHandler } from "../src/types/event";

const io = new Server<SocketHandler, SocketHandler>(3000);

const room = new Map<string, Socket>();
io.on("connection", socket => {
  socket.on(SOCKET_EVENT_ENUM.JOIN_ROOM, ({ id }) => {
    room.set(id, socket);
    socket.emit(SOCKET_EVENT_ENUM.JOINED_ROOM, { id });
  });

  socket.on(SOCKET_EVENT_ENUM.SEND_OFFER, ({ id, sdp }) => {
    room.forEach((socket, key) => {
      if (key !== id) {
        socket.emit(SOCKET_EVENT_ENUM.HAND_OUT_OFFER, { id, sdp });
      }
    });
  });

  socket.on(SOCKET_EVENT_ENUM.LEAVE_ROOM, ({ id }) => {
    room.delete(id);
  });

  socket.on("disconnect", () => {
    room.delete(socket.id);
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

io.listen(3000);
