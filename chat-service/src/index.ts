import "dotenv/config";
import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import {
  ALLOWED_REACTION_EMOJIS,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "@wasp/shared";
import { authenticateSocket, type AppSocket, type AuthedSocketData } from "./auth";
import {
  channelExists,
  createChannel,
  deleteMessageIfOwner,
  getChannelHistory,
  getDefaultChannel,
  insertMessage,
  listChannels,
  reportMessage,
  toggleReaction,
  validateImagePath,
  validateMessageBody,
  validateSlug,
} from "./channels";
import { clearRateLimit, isChannelCreationRateLimited, isRateLimited } from "./rate-limit";
import { getChannelNicknames, joinChannelPresence, leaveAllChannels } from "./presence";
import { startBot } from "./bot";
import { scheduleCleanup } from "./cleanup";

const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
// Comma-separated so the same LAN-IP + localhost combo can both reach chat
// during local dev testing. In production this only ever needs one origin.
const CLIENT_ORIGINS = (process.env.CLIENT_ORIGIN ?? "http://localhost:3000")
  .split(",")
  .map((origin) => origin.trim());

const app = express();
app.use(cors({ origin: CLIENT_ORIGINS }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const httpServer = createServer(app);

const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  AuthedSocketData
>(httpServer, {
  cors: { origin: CLIENT_ORIGINS },
});

io.use(authenticateSocket);

const bot = startBot(io);

function broadcastGlobalOnlineCount() {
  io.emit("globalOnlineCount", io.sockets.sockets.size);
}

function broadcastChannelPresence(channelId: string) {
  io.to(channelId).emit("channelPresence", {
    channelId,
    nicknames: getChannelNicknames(channelId),
  });
}

function joinChannelWithPresence(socket: AppSocket, channelId: string) {
  socket.join(channelId);
  joinChannelPresence(channelId, socket.id, socket.data.nickname);
  broadcastChannelPresence(channelId);
}

io.on("connection", async (socket) => {
  broadcastGlobalOnlineCount();

  try {
    const channels = await listChannels();
    socket.emit("channelList", channels);

    const lobby = await getDefaultChannel();
    if (lobby) {
      joinChannelWithPresence(socket, lobby.id);
      const history = await getChannelHistory(lobby.id);
      socket.emit("channelHistory", { channelId: lobby.id, messages: history });
    }
  } catch (error) {
    console.error("Failed to initialize connection:", error);
    socket.emit("errorMessage", "Failed to load chat. Please refresh.");
  }

  socket.on("joinChannel", async (channelId) => {
    try {
      if (typeof channelId !== "string" || !(await channelExists(channelId))) {
        socket.emit("errorMessage", "That channel doesn't exist.");
        return;
      }
      joinChannelWithPresence(socket, channelId);
      const history = await getChannelHistory(channelId);
      socket.emit("channelHistory", { channelId, messages: history });
    } catch (error) {
      console.error("joinChannel failed:", error);
      socket.emit("errorMessage", "Couldn't join that channel.");
    }
  });

  socket.on("sendMessage", async ({ channelId, body, imagePath }) => {
    try {
      if (isRateLimited(socket.id)) {
        socket.emit("errorMessage", "You're sending messages too fast. Slow down a little.");
        return;
      }
      if (typeof channelId !== "string") {
        socket.emit("errorMessage", "Message couldn't be sent.");
        return;
      }
      const cleanImagePath = imagePath === undefined ? null : validateImagePath(imagePath);
      if (imagePath !== undefined && cleanImagePath === null) {
        socket.emit("errorMessage", "Message couldn't be sent.");
        return;
      }
      const bodyResult = validateMessageBody(body, cleanImagePath !== null);
      if (!bodyResult.valid) {
        socket.emit(
          "errorMessage",
          bodyResult.error === "inappropriate"
            ? "That message isn't allowed here. Please rephrase."
            : "Message couldn't be sent."
        );
        return;
      }
      if (!(await channelExists(channelId))) {
        socket.emit("errorMessage", "That channel doesn't exist.");
        return;
      }
      const message = await insertMessage(
        channelId,
        socket.data.userProfileId,
        socket.data.nickname,
        bodyResult.value,
        cleanImagePath
      );
      io.to(channelId).emit("newMessage", message);
      await bot.maybeReplyToMention(message);
    } catch (error) {
      console.error("sendMessage failed:", error);
      socket.emit("errorMessage", "Message couldn't be sent.");
    }
  });

  socket.on("deleteOwnMessage", async ({ channelId, messageId }) => {
    try {
      if (typeof messageId !== "string" || typeof channelId !== "string") return;
      const deletedChannelId = await deleteMessageIfOwner(messageId, socket.data.userProfileId);
      if (!deletedChannelId) {
        socket.emit("errorMessage", "Couldn't delete that message.");
        return;
      }
      io.to(deletedChannelId).emit("messageDeleted", { channelId: deletedChannelId, messageId });
    } catch (error) {
      console.error("deleteOwnMessage failed:", error);
      socket.emit("errorMessage", "Couldn't delete that message.");
    }
  });

  socket.on("reportMessage", async ({ messageId }) => {
    try {
      if (typeof messageId !== "string") return;
      await reportMessage(messageId, socket.data.userProfileId);
    } catch (error) {
      console.error("reportMessage failed:", error);
    }
  });

  socket.on("typing", (channelId) => {
    if (typeof channelId !== "string") return;
    // socket.to() excludes the sender -- no point telling someone they're typing.
    socket.to(channelId).emit("userTyping", {
      channelId,
      nickname: socket.data.nickname,
    });
  });

  socket.on("toggleReaction", async ({ channelId, messageId, emoji }) => {
    try {
      if (
        typeof channelId !== "string" ||
        typeof messageId !== "string" ||
        !ALLOWED_REACTION_EMOJIS.includes(emoji)
      ) {
        socket.emit("errorMessage", "Couldn't react to that message.");
        return;
      }
      const reactions = await toggleReaction(messageId, socket.data.userProfileId, emoji);
      io.to(channelId).emit("reactionsUpdated", { channelId, messageId, reactions });
    } catch (error) {
      console.error("toggleReaction failed:", error);
      socket.emit("errorMessage", "Couldn't react to that message.");
    }
  });

  socket.on("createChannel", async ({ slug, name, description }) => {
    try {
      if (isChannelCreationRateLimited(socket.id)) {
        socket.emit(
          "errorMessage",
          "You're creating channels too fast. Please wait a bit before making another."
        );
        return;
      }
      const cleanSlug = validateSlug(slug);
      if (!cleanSlug) {
        socket.emit(
          "errorMessage",
          "Channel names can only use lowercase letters, numbers, and hyphens (2-32 characters)."
        );
        return;
      }
      const channel = await createChannel(
        cleanSlug,
        name,
        description,
        socket.data.userProfileId
      );
      if (!channel) {
        socket.emit("errorMessage", "That channel name is already taken.");
        return;
      }
      io.emit("channelCreated", channel);
      joinChannelWithPresence(socket, channel.id);
      bot.registerPresenceForChannel(channel.id);
      broadcastChannelPresence(channel.id);
      socket.emit("channelHistory", { channelId: channel.id, messages: [] });
    } catch (error) {
      console.error("createChannel failed:", error);
      socket.emit("errorMessage", "Couldn't create that channel.");
    }
  });

  socket.on("disconnect", () => {
    clearRateLimit(socket.id);
    const channels = leaveAllChannels(socket.id);
    for (const channelId of channels) {
      broadcastChannelPresence(channelId);
    }
    broadcastGlobalOnlineCount();
  });
});

httpServer.listen(PORT, () => {
  console.log(`chat-service listening on port ${PORT}`);
  scheduleCleanup();
});
