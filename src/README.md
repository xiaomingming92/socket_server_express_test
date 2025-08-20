# 关于状态累加、转移、极限状态判断的思考

## 手动实现bsdsocket 规范的 socket

### 功能列表
1. BSD 风格 API
- 服务端：
    - socket() 创建套接字

    - bind() 绑定地址和端口

    - listen() 监听连接

    - accept() 接受客户端连接，返回新的 socket fd

    - send()/recv() 和客户端通信

    - close() 关闭连接
- 客户端：
    - socket() 创建套接字

    - connect() 连接到服务器

    - send()/recv() 或 write()/read() 传输数据

    - close() 关闭连接
---
2. Socket 实例管理

- 每个 socket 分配唯一 ID

- 管理 socket 状态（connected / disconnected / reconnecting）

- 活跃 socket 列表，支持查询和回收
---
3. 缓冲池

- 发送/接收缓冲区

- 预分配内存块，减少频繁分配
---
4. 粘包 / 拆包处理
TCP + SSL 基础: 使用 Node.js net 模块（TCP）或者 tls 模块（SSL/TLS）。每个 socket 建立连接后，都可以发送/接收二进制流数据流是连续的，所以需要拆包逻辑

- 定义协议：[length(4 bytes) | payload]-> 采用websocket协议：
WebSocket 帧协议的特点：

|字段|大小|说明|
|---|---|---|
|FIN + RSV + OPCODE|1 byte| 控制位和类型（文本/二进制/关闭/ping/pong）|
|MASK + PAYLOAD LEN |	1 byte|7位长度，126/127表示扩展长度|
|EXTENDED LEN| 2 或 8 bytes|如果 PAYLOAD LEN==126/127，用来表示实际长度|
|MASKING KEY|4 bytes|客户端发往服务器必需，服务器可选|
|PAYLOAD DATA|N bytes|数据部分|

支持多种类型帧：TEXT, BINARY, PING, PONG, CLOSE

帧可分片发送（FIN=0 表示后面还有片）

- TCP 流式数据按包拆分，半包保留

5. 心跳 / ping-pong

- 定时发送 ping

- 响应 pong
---
6. 超时处理

- 重连机制

- 客户端断线自动重连

- 服务端清理长时间无响应 socket

7. 错误处理

- 网络异常
- 缓冲区溢出
- 协议错误等
### 历史沿革

1. 规范的定义
从IEEE 1003.1 到 RFC 6455

## 函数柯里化的思考

## 做一道菜的思考