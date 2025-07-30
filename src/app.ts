import express from "express";
import cors from "cors";
import routes from './routes';
// const errMid = require('./middlewares/error.middleware');

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.static('public'));

// restful api 路由
app.use("/api", routes);
// err handle
// app.use(errMid);

export default app;