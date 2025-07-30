/*
 * @Author       : yinming 1090538449@qq.com
 * @Date         : 2025-07-30 18:01
 * @LastEditors  : yinming 1090538449@qq.com
 * @LastEditTime : 2025-07-30 18:34
 * @FilePath     : \socket_server_express_test\src\types\express.d.ts
 * @Description  :  
 */
// src/types/express.d.ts
import "express";
import { AuthUser } from "./AuthUser";

declare module "express" {
  export interface Request {
    user?: AuthUser;
  }
}