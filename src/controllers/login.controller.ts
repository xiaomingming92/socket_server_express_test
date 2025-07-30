/*
 * @Author       : yinming 1090538449@qq.com
 * @Date         : 2025-07-30 17:35
 * @LastEditors  : yinming 1090538449@qq.com
 * @LastEditTime : 2025-07-30 17:50
 * @FilePath     : \socket_server_express_test\src\controllers\login.controller.ts
 * @Description  :  登录的服务
 */
import { Request, Response } from "express";
import { loginUser } from "../services/login.service";

export const loginUserController = async (req: Request, res: Response) => {
  const { userName, password } = req.body;
  try {
    const data = await loginUser(userName, password);
    res.json({
      code: 200,
      message: "登录成功",
      data
    });
  } catch (err: any) {
    res.status(401).json({
      code: 500,
      message: err.message
    });
  }
};
