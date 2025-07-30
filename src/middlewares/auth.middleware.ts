/*
 * @Author       : yinming 1090538449@qq.com
 * @Date         : 2025-07-30 15:28
 * @LastEditors  : yinming 1090538449@qq.com
 * @LastEditTime : 2025-07-30 18:41
 * @FilePath     : \socket_server_express_test\src\middlewares\auth.middleware.ts
 * @Description  :  
 */
import { Request, Response, NextFunction } from 'express';
import { verifyTokenAndGetUser } from '../utils/verifyToken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const { authorization } = req.headers;
  if (!authorization) {
    return res.status(401).json({ error: "没有token" });
  }
  const token = authorization.split(" ")[1]; // Bear+''+tokenstring
  if (!token) return res.status(401).json({ error: "没有token" });
  try {
    const payload = verifyTokenAndGetUser(token);
    req.user = {
      id: payload.id,
      userName: payload.userName,
      phone: payload.phone
    };
    next();
  } catch (err) {
    return res.status(500).json({ error: "无效token" });
  }
};
