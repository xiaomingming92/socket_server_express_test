const express = require("express");
const http = require("http");
const { Server } = require('socket.io');
import jwt from 'jsonwebtoken';


const app = express();
const server = http.createServer(app);
const onlineUsers = new Map();

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if(!token) {
    return next(new Error("没有token"));
  }
  try {
    // 1. 验证 token（签名 + 是否过期）
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // 2. 查询用户是否存在 / 有效（可选）
    const user = await getUserById(payload.id);
    if (!user) {
      return next(new Error("无效用户"));
    }
    socket.user = user;
    next();
  } catch(err) {
    return next(new Error("INVALID_TOKEN"));
  }
})
app.use(express.static('public'));

io.on('connection',(socket) => {
  // console.log("连接成功");
  const userId = socket.user.id;
  onlineUser.set(userId, socket.user.id);

  socket.on('chat message', (msg) => {
    console.log('接受到消息:' + msg);
  })
  socket.on('disconnect', () => {
    console.log('disconnect');
    onlineUsers.delete(userId);
  })
})

server.listen(3000, () => {
  console.log('server start at localhost:3000');
})