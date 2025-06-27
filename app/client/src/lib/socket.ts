// lib/socket.ts
import { WS_URL } from "@/config";
import { io } from "socket.io-client";
const socket = io(WS_URL ?? "http://localhost:3000", { transports: ["websocket"], reconnection: true, reconnectionAttempts: Infinity, reconnectionDelay: 1000 });

export { socket };
