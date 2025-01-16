import express from "express";
import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server } from "socket.io";
import httpProxy from "@fastify/http-proxy";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const client = express();
const target = express();

const proxy = Fastify({
  logger: {
    level: "warn",
  },
});

await proxy.register(cors, {
  origin: true,
  credentials: true,
  preflightContinue: true,
  maxAge: 1000,
});

const io = new Server(
  target.listen(3001, () => {
    console.log("target running at http://localhost:3001");
  })
);

client.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

target.get("/", (req, res) => {
  res.send("Hello from target");
});


io.on("connection", (socket) => {
  console.log("a user connected");
});

client.listen(3000, () => {
  console.log("client running at http://localhost:3000");
});

await proxy.register(httpProxy, {
  upstream: "http://localhost:3001",
  undici: true,
  http2: false,
  prefix: "/socket.io",
  rewritePrefix: "/socket.io",
});

await proxy.listen({ port: 3002 });

console.log("proxy running at http://localhost:3002");
