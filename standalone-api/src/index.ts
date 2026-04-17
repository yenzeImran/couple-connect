import { config } from "dotenv";
import http from "http";
import { Server as SocketServer } from "socket.io";
import app from "./app";
import { logger } from "./lib/logger";

// Load environment variables
config();

const rawPort = process.env["API_PORT"] || process.env["PORT"];
if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}
const port = Number(rawPort);
if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Create HTTP server from Express app
const server = http.createServer(app);

// Attach Socket.IO with CORS for your frontend (adjust origin as needed)
const io = new SocketServer(server, {
  cors: {
    origin: true, // Allow any origin for development (network access)
    methods: ["GET", "POST"],
  },
});

// --- Socket.IO game logic (multiplayer Truth or Dare) ---
interface Player {
  id: string;
  name: string;
}

interface Invite {
  from: string;
  to: string;
  fromName: string;
  toName: string;
}

interface GameRoom {
  player1: { id: string; name: string };
  player2: { id: string; name: string };
  turn: 'player1' | 'player2';   // whose turn it is
  currentPrompt: any; // or a more specific type
}

const players = new Map<string, Player>();   // socket.id -> Player
const invites = new Map<string, Invite>();   // roomId -> Invite
const rooms = new Map<string, GameRoom>();   // roomId -> GameRoom

io.on("connection", (socket) => {
  logger.info({ socketId: socket.id }, "New WebSocket connection");

  socket.on("register", (name: string) => {
    players.set(socket.id, { id: socket.id, name });
    io.emit("playersList", Array.from(players.values()));
    logger.info({ socketId: socket.id, name }, "Player registered");
  });

  socket.on("invite", ({ to }: { to: string }) => {
    const fromPlayer = players.get(socket.id);
    const toPlayer = players.get(to);
    if (!fromPlayer || !toPlayer) return;
    const roomId = `room_${socket.id}_${to}_${Date.now()}`;
    invites.set(roomId, {
      from: socket.id,
      to,
      fromName: fromPlayer.name,
      toName: toPlayer.name,
    });
    io.to(to).emit("inviteReceived", {
      from: socket.id,
      fromName: fromPlayer.name,
      roomId,
    });
    logger.info({ from: fromPlayer.name, to: toPlayer.name, roomId }, "Invite sent");
  });

  socket.on("acceptInvite", ({ roomId, from }: { roomId: string; from: string }) => {
    const invite = invites.get(roomId);
    if (!invite || invite.from !== from) return;
    const fromPlayer = players.get(from);
    const toPlayer = players.get(socket.id);
    if (!fromPlayer || !toPlayer) return;
    const room: GameRoom = {
      player1: { id: from, name: fromPlayer.name },
      player2: { id: socket.id, name: toPlayer.name },
      turn: 'player1', // inviter goes first
      currentPrompt: null,
    };
    rooms.set(roomId, room);
    io.to(from).emit("inviteAccepted", { roomId, opponentName: toPlayer.name });
    io.to(socket.id).emit("gameStart", {
      roomId,
      opponentName: fromPlayer.name,
      turn: 'player1',
    });
    invites.delete(roomId);
    logger.info({ roomId, player1: from, player2: socket.id }, "Game started");
  });

  socket.on("joinRoom", ({ roomId, name }: { roomId: string; name: string }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit("error", "Room not found");
      return;
    }
    // Check if reconnecting
    if (room.player1.name === name) {
      players.delete(room.player1.id);
      room.player1.id = socket.id;
      players.set(socket.id, { id: socket.id, name });
      socket.join(roomId);
      // Emit current state
      socket.emit("reconnected", {
        roomId,
        opponentName: room.player2.name,
        turn: room.turn,
        currentPrompt: room.currentPrompt,
        myTurn: room.turn === 'player1'
      });
      logger.info({ roomId, player: name }, "Player1 reconnected");
    } else if (room.player2.name === name) {
      players.delete(room.player2.id);
      room.player2.id = socket.id;
      players.set(socket.id, { id: socket.id, name });
      socket.join(roomId);
      socket.emit("reconnected", {
        roomId,
        opponentName: room.player1.name,
        turn: room.turn,
        currentPrompt: room.currentPrompt,
        myTurn: room.turn === 'player2'
      });
      logger.info({ roomId, player: name }, "Player2 reconnected");
    } else {
      socket.emit("error", "Not a player in this room");
    }
  });

  socket.on("declineInvite", ({ roomId }: { roomId: string }) => {
    invites.delete(roomId);
    logger.info({ roomId }, "Invite declined");
  });

  socket.on("sendPrompt", ({ roomId, prompt }: { roomId: string; prompt: any }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const currentPlayer = room[room.turn];
    if (socket.id !== currentPlayer.id) return; // Not your turn
    room.currentPrompt = prompt;
    const other = room.turn === 'player1' ? room.player2 : room.player1;
    io.to(other.id).emit("promptReceived", prompt);
    logger.info({ roomId, promptType: prompt.type }, "Prompt sent");
  });

  socket.on("dareComplete", ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    // Switch turn
    room.turn = room.turn === 'player1' ? 'player2' : 'player1';
    room.currentPrompt = null;
    const nextPlayerName = room[room.turn].name;
    io.to(room.player1.id).emit("turnChanged", { nextPlayerName });
    io.to(room.player2.id).emit("turnChanged", { nextPlayerName });
    logger.info({ roomId, nextTurn: room.turn }, "Turn changed after dare");
  });

  socket.on("answerAccepted", ({ roomId, answer }: { roomId: string; answer: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const fromPlayer = players.get(socket.id);
    if (!fromPlayer) return;
    const other = room.player1.id === socket.id ? room.player2.id : room.player1.id;

    if (answer && answer.trim()) {
      io.to(other).emit("chatMessage", {
        from: fromPlayer.name,
        message: answer.trim(),
        timestamp: Date.now(),
      });
    }

    room.turn = room.turn === 'player1' ? 'player2' : 'player1';
    room.currentPrompt = null;
    const nextPlayerName = room[room.turn].name;
    io.to(room.player1.id).emit("turnChanged", { nextPlayerName });
    io.to(room.player2.id).emit("turnChanged", { nextPlayerName });
    logger.info({ roomId, nextTurn: room.turn }, "Answer accepted; turn changed");
  });

  socket.on("sendChat", ({ roomId, message }: { roomId: string; message: string }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const fromPlayer = players.get(socket.id);
    if (!fromPlayer) return;
    const other = room.player1.id === socket.id ? room.player2.id : room.player1.id;
    io.to(other).emit("chatMessage", {
      from: fromPlayer.name,
      message,
      timestamp: Date.now()
    });
    logger.info({ roomId, from: fromPlayer.name, messageLength: message.length }, "Chat message sent");
  });

  socket.on("leaveGame", ({ roomId }: { roomId: string }) => {
    const room = rooms.get(roomId);
    if (room) {
      io.to(room.player1.id).emit("gameEnded");
      io.to(room.player2.id).emit("gameEnded");
      rooms.delete(roomId);
      logger.info({ roomId }, "Game ended by player");
    }
  });

  socket.on("disconnect", () => {
    logger.info({ socketId: socket.id }, "WebSocket disconnected");
    players.delete(socket.id);
    io.emit("playersList", Array.from(players.values()));

    // Clean up invites and rooms involving this socket
    for (const [roomId, invite] of invites.entries()) {
      if (invite.from === socket.id || invite.to === socket.id) invites.delete(roomId);
    }
    for (const [roomId, room] of rooms.entries()) {
      if (room.player1.id === socket.id || room.player2.id === socket.id) {
        io.to(room.player1.id).emit("gameEnded");
        io.to(room.player2.id).emit("gameEnded");
        rooms.delete(roomId);
      }
    }
  });
});

// Start the server (now with both HTTP and WebSocket)
server.listen(port, '0.0.0.0', (err?: Error) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening (HTTP + WebSocket)");
});
