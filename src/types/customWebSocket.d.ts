/*
 * @Author       : yinming 1090538449@qq.com
 * @Date         : 2025-08-11 09:52
 * @LastEditors  : yinming 1090538449@qq.com
 * @LastEditTime : 2025-08-11 10:33
 * @FilePath     : \socket_server_express_test\src\types\customWebSocket.d.ts
 * @Description  :  
 */
import "ws";

// declare module 'ws' {
//   export interface CustomWebSocket extends WebSocket {
//     sessionId: string;
//   }
// }

declare module "ws" {
  interface WebSocket {
    sessionId: string;
  }
}