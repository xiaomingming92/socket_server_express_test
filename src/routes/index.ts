/*
 * @Author       : yinming 1090538449@qq.com
 * @Date         : 2025-07-30 15:28
 * @LastEditors  : yinming 1090538449@qq.com
 * @LastEditTime : 2025-07-30 18:27
 * @FilePath     : \socket_server_express_test\src\routes\index.ts
 * @Description  :  路由汇总
 */
import express from 'express';
import userRoutes from "./user.routes";
import authRoutes from "./auth.routes";

const router = express.Router();

router.use('/user', userRoutes);
router.use("/auth", authRoutes);

export default router;