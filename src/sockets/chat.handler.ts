import { CustomSocket } from "../types/socket";

export const registerChatHandler = (socket: CustomSocket) => {
  socket.on("chat message", (msg: string) => {
    console.log("新消息", msg);
    socket.broadcast.emit("chat message", msg);
  });
  socket.on("disconnect", (reason: string) => {
    console.log(`socket disconnect:${socket.id}, 原因：${reason}`);
  });
};