/*
 * @Author       : yinming 1090538449@qq.com
 * @Date         : 2025-07-30 17:00
 * @LastEditors  : yinming 1090538449@qq.com
 * @LastEditTime : 2025-07-30 17:34
 * @FilePath     : \socket_server_express_test\src\services\login.service.ts
 * @Description  :  
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const SECRET = process.env.JWT_SECRET || 'default_secret';

export const loginUser = async (userName: string, passwd: string) => {
  const user = prisma.user.findUnique({
    where: {userName}
  });
  if(!user) {
    throw new Error("没这个用户");
  }
  const isMatchpasswd = await bcrypt.compare(passwd, user.password);
  if(!isMatchpasswd) {
    throw new Error('密码错误');
  }
  const token = jwt.sign({
    id: user.id,
  }, SECRET, {expiresIn: '2h'});
  return {
    token, 
    user: {
      id: user.id,
      userName: user.username
    }
  }
}