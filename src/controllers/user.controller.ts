import {Request, Response} from 'express';
import { getUserId } from "../services/user.service";

export const getUserProfileController = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if(!userId) {
    return res.status(200).json({
      code: 500,
      message: "缺少用户id"
    });
  }
  try{
    const user = await getUserId(userId);
    if(!user) {
      return res.status(200).json({
        code: 200,
        message: "用户不存在"
      })
    }
  } catch(err: any) {
    res.status(500).json({ code: 500, message: "服务器错误" });
  }
}