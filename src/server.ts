import http from 'http';
import app from './app';

const server = http.createServer(app);

server.listen(1992, () => {
  console.log("serve run at http://localhost:1992")
})