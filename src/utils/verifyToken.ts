const { verifyToken } = require("./jwt");

export function verifyTokenAndGetUser(token: string) {
  if (!token) throw new Error("没有token");
  try {
    return verifyToken(token);
  } catch (err) {
    throw new Error("无效token");
  }
}
