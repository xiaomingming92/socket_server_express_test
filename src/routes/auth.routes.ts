import express, { Request, Response } from "express";
import { getUserByPhone } from "../services/user.service";
const { signToken } = require("../utils/jwt");

const router = express.Router();

// 登录API
router.post("/login", async (req: Request, res: Response) => {
  const { phone, password } = req.body;
  const user = await getUserByPhone(phone, password);
  if (!user) return res.status(401).json({ error: "用户名或密码错误" });
  const token = signToken({
    id: user.id,
    username: user.userame
  });
  res.json({
    token
  });
});

export default router;