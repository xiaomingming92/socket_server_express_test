const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET || "mysecret";
// 生成token
export const signToken = (payload: any) => {
  return jwt.sign(payload, secret, { expiresIn: "2h" });
};
// 校验
export const verifyToken = (token: string) => {
  return jwt.verify(token, secret);
};
