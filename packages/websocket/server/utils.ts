import { Member } from "../types/server";
import os from "os";
import http from "http";

export const updateMember = <T extends keyof Member>(
  map: Map<string, Member>,
  id: string,
  key: T,
  value: Member[T]
) => {
  const instance = map.get(id);
  if (instance) {
    map.set(id, { ...instance, [key]: value });
  } else {
    console.warn(`UpdateMember: ${id} Not Found`);
  }
};

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
  if (request.headers["x-forwarded-for"]) {
    ip = request.headers["x-forwarded-for"].toString().split(/\s*,\s*/)[0];
  } else {
    ip = request.socket.remoteAddress || "";
  }
  // 本地部署应用时，`ip`地址可能是`::1`或`::ffff:`
  if (ip === "::1" || ip === "::ffff:127.0.0.1" || !ip) {
    ip = "127.0.0.1";
  }
  // 局域网部署应用时，`ip`地址可能是`192.168.x.x`
  if (ip.startsWith("::ffff:192.168") || ip.startsWith("192.168")) {
    ip = "192.168.0.0";
  }
  return ip;
};
