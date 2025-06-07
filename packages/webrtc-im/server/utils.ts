import os from "node:os";
import type http from "node:http";
import crypto from "node:crypto";

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

export const getSocketIp = (request: http.IncomingMessage) => {
  let ip = "127.0.0.1";
  if (request.headers["x-real-ip"]) {
    ip = request.headers["x-real-ip"].toString();
  } else if (request.headers["x-forwarded-for"]) {
    const forwarded = request.headers["x-forwarded-for"].toString();
    const [firstIp] = forwarded.split(",");
    ip = firstIp ? firstIp.trim() : ip;
  } else {
    ip = request.socket.remoteAddress || ip;
  }
  const hash = crypto
    .createHash("md5")
    .update(ip + "🧂")
    .digest("hex");
  if (ip.indexOf(".") > -1) {
    ip = ip.split(".").slice(0, -2).join(".") + ".*.*";
  }
  if (ip.indexOf(":") > -1) {
    ip = ip.split(":").slice(0, -2).join(":") + ":*:*";
  }
  return { ip, hash };
};
