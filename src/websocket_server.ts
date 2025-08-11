/*
 * @Author       : yinming 1090538449@qq.com
 * @Date         : 2025-08-11 09:40
 * @LastEditors  : yinming 1090538449@qq.com
 * @LastEditTime : 2025-08-11 10:44
 * @FilePath     : \socket_server_express_test\src\websocket_server.ts
 * @Description  :
 */

// import WebSocket, { CustomWebSocket } from "ws";
import { WebSocket } from "ws";

const wss = new WebSocket.Server({ port: 8080 });
wss.on("connection", (ws: WebSocket) => {
  console.log("client connected");
  ws.sessionId = "";
  ws.on("message", (data: Buffer | string) => {
    const message = data.toString();
    console.log("接收到：", message);
    // 广播消息给所有客户端
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(`Server echo: ${message}`);
      }
    });
  });
  // 发送消息
  ws.send("WebSocket server connected");
  // 监听关闭行为
  ws.on("close", () => {
    console.log("client disconnected");
  });
});
