import { Socket, Server, ExtendedError } from "socket.io";
import { registerChatHandler } from "./chat.handler";
import {verifyTokenAndGetUser} from "../utils/verifyToken";
import { CustomSocket } from "../types/socket";


export const initSocket = (io: Server) =>  {
  io.use((socket: CustomSocket, next: (err?: ExtendedError) => void) => {
    const { auth } = socket.handshake;
    if (!auth) {
      next(new Error("没有提供auth信息"));
    }
    try {
      const { token } = auth;
      if (!token) {
        throw new Error("没有提供token信息");
      }
      // verifyTokenAndGetUser可能是异步函数，看情况
      const user = verifyTokenAndGetUser(token);
      socket.user = user;
      next();
    } catch (err) {
      next(err as ExtendedError);
    }
  });
  io.on("connection", (socket: Socket) => {
    if(socket.recovered) {
      console.log(`socket restored:${socket.id}`);
    } else {
      console.log("socket connected:", socket.id);
    }
    // 注册命名空间/events
    registerChatHandler(socket as CustomSocket);
  });
};