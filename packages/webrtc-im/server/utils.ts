import os from "node:os";
import type http from "node:http";

export const getLocalIp = () => {
  const result: string[] = [];
  const interfaces = os.networkInterfaces();
  for (const key in interfaces) {
    const networkInterface = interfaces[key];
    if (!networkInterface) continue;
    for (const inf of networkInterface) {
      if (inf.family === "IPv4" && !inf.internal) {
        result.push(inf.address);
      }
    }
  }
  return result;
};

export const getIpByRequest = (request: http.IncomingMessage) => {
  let ip = "";
  if (request.headers["x-real-ip"]) {
    ip = request.headers["x-real-ip"].toString();
  } else if (request.headers["x-forwarded-for"]) {
    const forwarded = request.headers["x-forwarded-for"].toString();
    const [firstIp] = forwarded.split(",");
    ip = firstIp ? firstIp.trim() : "";
  } else {
    ip = request.socket.remoteAddress || "";
  }
  return ip;
};
