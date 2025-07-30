import { Socket } from "socket.io";
import { AuthUser } from "./AuthUser";
interface CustomSocket extends Socket {
  user?: AuthUser;
}
