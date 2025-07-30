import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const getUserId = async (id: number) => {
  return await prisma.usr.findUnique({
    where: { id },
    select: {
      id: true,
      userName: true,
      createdAt: true,
      phonenum: true
    }
  });
}
export const getUserByPhone = async(phone: number, password: string) => {
  const user = await prisma.usr.findUnique({
    where: { 
      phonenum: phone, 
      password 
    },
    select: {
      id: true,
      userName: true,
      createdAt: true,
      phonenum: true
    }
  });
  if (!user) {
    throw new Error("没这个用户");
  }
  const isMatchpasswd = await bcrypt.compare(password, user.password);
  if (!isMatchpasswd) {
    throw new Error("密码错误");
  }
  return user;
}