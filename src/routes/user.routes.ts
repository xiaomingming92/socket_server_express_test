import express, { Request, Response } from "express";
import { authMiddleware } from "../middlewares/auth.middleware";

const router = express.Router();

router.get("/profile", authMiddleware, (req: Request, res: Response) => {
  res.json({
    user: req.user
  });
});

export default router;