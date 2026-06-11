// NOTE: Legacy Socket.IO handler. The canonical setup is in lib/socket.ts (initSocketIO).
// This pages/ route is still called by SocketProvider.tsx for backward compatibility
// and can be removed once the client switches to the app/ directory setup.
import { Server as NetServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { NextApiRequest } from "next";
import { NextApiResponseServerIO } from "@/lib/socket";

const DEBUG_SOCKET = process.env.DEBUG_SOCKET_LOGS === "true";

export const config = {
  api: {
    bodyParser: false,
  },
};

const SocketHandler = (req: NextApiRequest, res: NextApiResponseServerIO) => {
  if (!res.socket.server.io) {
    if (DEBUG_SOCKET) {
      console.log("Initializing Socket.IO...");
    }

    const httpServer: NetServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket/io",
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    io.on("connection", (socket) => {
      if (DEBUG_SOCKET) {
        console.log("Client connected:", socket.id);
      }

      // Join user-specific room
      socket.on("join", (userId: string) => {
        if (userId) {
          socket.join(`user:${userId}`);
          if (DEBUG_SOCKET) {
            console.log(`User ${userId} joined their notification room`);
          }
        }
      });

      // Leave user-specific room
      socket.on("leave", (userId: string) => {
        if (userId) {
          socket.leave(`user:${userId}`);
          if (DEBUG_SOCKET) {
            console.log(`User ${userId} left their notification room`);
          }
        }
      });

      socket.on("disconnect", () => {
        if (DEBUG_SOCKET) {
          console.log("Client disconnected:", socket.id);
        }
      });

      socket.on("error", (error) => {
        if (DEBUG_SOCKET) {
          console.error("Socket error:", error);
        }
      });
    });

    res.socket.server.io = io;
    if (DEBUG_SOCKET) {
      console.log("Socket.IO initialized successfully");
    }
  } else if (DEBUG_SOCKET) {
    console.log("Socket.IO already running");
  }

  res.end();
};

export default SocketHandler;
