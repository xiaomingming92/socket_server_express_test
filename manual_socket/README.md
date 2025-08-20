# 手动开发bsd风格的socketAPI实现

## 模块核心清单

1. Core（BSD API 适配层）

- BsdSocket：统一的“fd-like”对象；方法：bind/listen/accept/connect/send/recv/close/getsockopt/setsockopt

- SocketManager：分配全局递增 sid（代替 fd）、注册/查活跃列表、回收

- Address：{host, port, family, path?} 支持 IPv4/IPv6/Unix Domain

2. Transport（传输层）

- TcpTransport / TlsTransport：封装 Node net.Socket / tls.TLSSocket

负责 backpressure（write()布尔返回 & drain 事件）、Nagle/KeepAlive、半关闭处理

3. Framing（帧编解码）

WsFramer：实现 RFC6455 帧的编码/解码、分片聚合、控制帧（ping/pong/close）规则

FrameAssembler：处理半包/粘包，维护接收侧状态缓存

Masker：按方向应用/去除掩码（Raw-WS 模式可配置：客户端→服务端掩码启用；服务端→客户端不掩码，遵循 RFC 语义）

MessageStream：上层看到的 message 边界（TEXT/BINARY）

4. Buffers（缓冲池与内存）

BufferPool：预分配固定/分级块（如 1KB/4KB/16KB），lease/release，减少 GC 压力

RecvQueue/SendQueue：生产者-消费者队列，支持高水位/低水位阈值

5. Lifecycle（会话与心跳）

Heartbeat：定时 ping、收到 pong 打点、超时记分

Timeouts：connectTimeout, readIdle, writeIdle, overallIdle

Reconnector（客户端可选）：指数退避、抖动、最大次数/无限模式

6. Errors & Logging

自定义错误类型：ENET, EPROTOCOL, EMASK, EOVERFLOW, ETIMEOUT, ECLOSED

可插拔 Logger（级别：error/warn/info/debug/trace）

7. Policy & Options（策略与可调）

highWaterMark、maxFrameSize、maxMessageSize

fragmentationPolicy：聚合到完整 message 再上抛 / 流式上抛

closePolicy：本端优雅关闭（先发 close 帧，等对端应答/或定时强切）

8. Testing & Tools

FrameFuzzer：畸形帧、随机分片、错误掩码、超大扩展长度

LoopbackHarness：端到端自测；pcap 风格日志（可重放）

## 状态机
INIT
 ├─ bind -> BOUND
 ├─ connect -> CONNECTING
BOUND
 └─ listen -> LISTENING
LISTENING
 └─ accept(event) -> HANDSHAKING? -> OPEN
CONNECTING
 ├─ timeout/error -> CLOSED
 └─ success -> HANDSHAKING? -> OPEN
HANDSHAKING (仅 full-ws 或 tTLS auth)
 ├─ success -> OPEN
 └─ fail -> CLOSED
OPEN
 ├─ send/recv
 ├─ ping->PONG 维持
 ├─ close(local) -> CLOSING
 ├─ error/remote FIN -> CLOSING
CLOSING
 ├─ 等待对端 close/pong/缓冲清空 -> CLOSED
 └─ 超时/错误 -> CLOSED
CLOSED
 └─ (client 可选) RECONNECTING -> CONNECTING

## WebSocket 帧关键规则

1. 控制帧：ping(0x9)/pong(0xA)/close(0x8)

不得分片，payload ≤ 125 bytes。

收到 ping 必须尽快 pong（镜像 payload）。

2. 数据帧：text(0x1)/binary(0x2)，允许分片。

FIN=0 表示更多分片，FIN=1 表示消息结束。

3. 两种上抛模式：

按消息（聚合所有分片直到 FIN=1 再上抛）

流式（每分片上抛，调用方自行拼接）

掩码：严格遵循 RFC：客户端→服务端必须掩码；服务端→客户端不掩码（Raw-WS 模式下也建议这样做，避免中间件误判）。

扩展长度：当 len=126 用 16bit 扩展；len=127 用 64bit 扩展。需防 超大报文（配置 maxFrameSize/maxMessageSize）。

关闭握手：close 可携带 2 字节 code + UTF-8 reason；对端回 close 后再真正销毁连接（设超时兜底）。

（可选）permessage-deflate：仅 Full-WS 模式协商；初版可不做。

## 粘包/拆包与半包缓存

1. 接收路径（简要）：

transport.on('data', chunk)：把 chunk append 到 assembler.recvBuf。

循环 parse：

若不足以读出头 2 字节，break；

解析 FIN/RSV/OPCODE/MASK/LEN；若 LEN 指示有扩展长度且当前缓冲不足以读取完整帧（含 maskKey + payload），break；

否则切片出完整帧，若 MASK 置位则按 maskKey 做 XOR；

控制帧优先处理（ping->pong；close->进入CLOSING）；

数据帧追加到当前消息聚合区（按 opcode 校验一致性）；FIN=1 时将完整消息上抛并清空聚合状态。

未消费的尾部残留在 recvBuf 等待下次数据。

2. 发送路径：

编码帧头 + （可选）maskKey + payload；

检查 socket backpressure：write() 返回 false 则排队并等待 drain 事件继续。

## 心跳与超时

心跳：pingInterval、pingTimeout（收不到 pong 算一次失败），连续 N 次失败 -> 触发 ETIMEOUT，进入 CLOSING/RECONNECTING。

应用空闲：readIdle（无入站数据）、writeIdle（无出站数据），触发可选自保 ping 或断线策略。

连接超时：connectTimeout。

优雅关闭超时：发送 close 后等待对端 close，超时则硬切。

## 错误域与恢复

网络错误：ECONNRESET/ETIMEDOUT/EPIPE → 映射为 ENET；进入 CLOSING。

协议错误：不合法 opcode、控制帧分片、超长控制帧、跨消息混用 opcode、非法掩码位等 → EPROTOCOL；发送 close(1002) 并关闭。

资源错误：超出 maxFrameSize/maxMessageSize 或缓冲池耗尽 → EOVERFLOW；close(1009)。

重连（客户端）：指数退避（如 base=500ms，factor=1.6，jitter=±20%），上限 maxDelay，可设 maxAttempts 或无限。

## 性能与工程细节

Buffer 复用：优先 Buffer.allocUnsafe + 明确填充；编码时尽量一次性拼装 header，避免多次拷贝。

零拷贝：slice/subarray 传递视图；避免 JSON 化；字符串发送时明确 utf8→Buffer。

高水位线：合理设置 socket 与内部队列 highWaterMark，基于 drain 做背压。

Nagle & KeepAlive：默认 setNoDelay(true) 降低时延；开启 setKeepAlive 维持链路活性（与心跳策略配合）。

大消息：限制并建议应用侧分块发送（或启用分片）；防止一次性占用过大内存。

多路与隔离：每个 BsdSocket 单独状态机；SocketManager 提供查找/统计与批量回收。

## 安全与 TLS

TlsTransport 支持：ca/cert/key/rejectUnauthorized/SNI；提供回调检查对端证书指纹/公钥 pinning。

可选 双向 TLS（mTLS）。

记录 TLS 握手时间、会话复用命中率。

## 开发顺序

### 核心概念：IPC/TCP/TLS/Raw-WS/Full-WS的差异
| 特性         | IPC    | TCP  | TLS    | Raw-WS    | Full-WS             |
| ---------- | ------ | ---- | ------ | --------- | ------------------- |
| 是否网络可跨机    | 否      | 是    | 是      | 是         | 是                   |
| 是否加密       | 否      | 否    | 是      | 否（可加 TLS） | 可 TLS               |
| 协议层        | L2\~L4 | L4   | L4+TLS | L4+自定义帧   | L4+HTTP Upgrade+WS帧 |
| 浏览器兼容      | 否      | 否    | 否      | 否         | 是                   |
| 分片/消息边界    | 自行实现   | 自行实现 | 自行实现   | 按 WS 帧    | 按 WS 帧              |
| Node.js 模块 | net    | net  | tls    | net/tls   | net/tls + handshake |

### 渐进式实现顺序
目标：先把 IPC + TCP + TLS + Raw-WS 帧 打通，保证 BSD API 封装可用，然后再考虑 Full-WS（浏览器/反代兼容）。
| 步骤     | 实现内容        | 核心点                                                                                                              |
| ------ | ----------- | ---------------------------------------------------------------------------------------------------------------- |
| Step 1 | IPC         | - Unix Domain Socket / Windows Named Pipe<br>- BSD API 封装 (`socket/bind/connect/send/recv/close`)<br>- 测试端到端本机通信 |
| Step 2 | TCP         | - 基于 `net.Socket`<br>- 支持 IPv4/IPv6 + BSD API<br>- 背压、drain、半关闭处理                                                |
| Step 3 | TLS         | - 基于 TCP 的 `tls.TLSSocket`<br>- 完整 handshake + send/recv<br>- 可选 mTLS                                            |
| Step 4 | Raw-WS 帧    | - WS 帧编码/解码（text/binary/ping/pong/close）<br>- 粘包/半包缓存处理<br>- 消息边界与分片处理<br>- 心跳（ping/pong）和超时策略                   |
| Step 5 | Full-WS（可选） | - HTTP Upgrade handshake<br>- 掩码 + permessage-deflate 支持<br>- 浏览器和负载均衡兼容                                         |

### 通过策略模式控制消息聚合模式
| 类型      | 类名              | 说明                              |
| ------- | --------------- | ------------------------------- |
| IPC     | IpcTransport    | Unix Domain Socket / Named Pipe |
| TCP     | TcpTransport    | IPv4/IPv6 TCP Socket            |
| TLS     | TlsTransport    | TCP + TLS handshake             |
| Raw-WS  | RawWsTransport  | TCP/TLS + WS 帧编码/解码             |
| Full-WS | FullWsTransport | TCP/TLS + HTTP Upgrade + WS 帧   |
