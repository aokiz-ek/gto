import { Server } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';

// Types
interface Player {
  id: string;
  socketId: string;
  name: string;
  score: number;
  streak: number;
  ready: boolean;
  lastAnswer?: {
    action: string;
    correct: boolean;
    time: number;
  };
}

interface Room {
  id: string;
  name: string;
  players: Map<string, Player>;
  maxPlayers: number;
  currentQuestion: Question | null;
  roundNumber: number;
  totalRounds: number;
  status: 'waiting' | 'in_progress' | 'finished';
  questionTimeout: NodeJS.Timeout | null;
  createdAt: Date;
}

interface Question {
  id: string;
  heroHand: string;
  board: string;
  heroPosition: string;
  villainPosition: string;
  potSize: number;
  stackSize: number;
  street: string;
  situation: string;
  options: string[];
  correctAnswer: string;
  timeLimit: number;
  answeredPlayers: Set<string>;
}

// Sample questions (in production, these would come from a database)
const SAMPLE_QUESTIONS: Omit<Question, 'id' | 'answeredPlayers'>[] = [
  {
    heroHand: 'AsKs',
    board: 'Qh7c2d',
    heroPosition: 'BTN',
    villainPosition: 'BB',
    potSize: 7,
    stackSize: 100,
    street: 'Flop',
    situation: 'BTN opens, BB calls. You cbet 50%.',
    options: ['Bet', 'Check'],
    correctAnswer: 'Bet',
    timeLimit: 15,
  },
  {
    heroHand: 'JhTh',
    board: 'Kh9h4c',
    heroPosition: 'CO',
    villainPosition: 'BTN',
    potSize: 12,
    stackSize: 85,
    street: 'Flop',
    situation: 'CO opens, BTN calls. Facing a 3/4 pot bet.',
    options: ['Fold', 'Call', 'Raise'],
    correctAnswer: 'Call',
    timeLimit: 15,
  },
  {
    heroHand: 'QcQd',
    board: 'Ah8s3c',
    heroPosition: 'UTG',
    villainPosition: 'BTN',
    potSize: 20,
    stackSize: 75,
    street: 'Flop',
    situation: 'UTG opens, BTN 3bets, UTG calls. You check.',
    options: ['Fold', 'Call', 'Raise'],
    correctAnswer: 'Call',
    timeLimit: 15,
  },
  {
    heroHand: '7s6s',
    board: 'Ks5d4h',
    heroPosition: 'BB',
    villainPosition: 'SB',
    potSize: 4,
    stackSize: 100,
    street: 'Flop',
    situation: 'SB completes, BB checks. SB bets 50%.',
    options: ['Fold', 'Call', 'Raise'],
    correctAnswer: 'Raise',
    timeLimit: 15,
  },
  {
    heroHand: 'AhQh',
    board: '',
    heroPosition: 'HJ',
    villainPosition: 'CO',
    potSize: 1.5,
    stackSize: 100,
    street: 'Preflop',
    situation: 'Facing a 3bet from CO.',
    options: ['Fold', 'Call', '4bet'],
    correctAnswer: '4bet',
    timeLimit: 15,
  },
  {
    heroHand: 'TsTc',
    board: 'JcTd2h7s',
    heroPosition: 'BTN',
    villainPosition: 'BB',
    potSize: 25,
    stackSize: 60,
    street: 'Turn',
    situation: 'BTN opens, BB calls. Flop check-check. Turn BB leads.',
    options: ['Fold', 'Call', 'Raise'],
    correctAnswer: 'Raise',
    timeLimit: 15,
  },
  {
    heroHand: '9h8h',
    board: 'Ac7c3d',
    heroPosition: 'SB',
    villainPosition: 'BB',
    potSize: 6,
    stackSize: 97,
    street: 'Flop',
    situation: 'SB raises, BB calls. SB cbets 1/3.',
    options: ['Bet', 'Check'],
    correctAnswer: 'Bet',
    timeLimit: 15,
  },
  {
    heroHand: 'KsJs',
    board: 'QhTc4d',
    heroPosition: 'CO',
    villainPosition: 'BTN',
    potSize: 15,
    stackSize: 80,
    street: 'Flop',
    situation: 'CO opens, BTN calls. CO cbets, BTN raises.',
    options: ['Fold', 'Call', 'Raise'],
    correctAnswer: 'Call',
    timeLimit: 15,
  },
];

// State
const rooms = new Map<string, Room>();
const playerToRoom = new Map<string, string>();

// Create HTTP server and Socket.IO instance
const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
});

// Helper functions
function getRoomInfo(room: Room) {
  return {
    id: room.id,
    name: room.name,
    playerCount: room.players.size,
    maxPlayers: room.maxPlayers,
    status: room.status,
  };
}

function getRoomState(room: Room) {
  return {
    id: room.id,
    name: room.name,
    players: Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      streak: p.streak,
      lastAnswer: p.lastAnswer,
    })),
    currentQuestion: room.currentQuestion ? {
      id: room.currentQuestion.id,
      heroHand: room.currentQuestion.heroHand,
      board: room.currentQuestion.board,
      heroPosition: room.currentQuestion.heroPosition,
      villainPosition: room.currentQuestion.villainPosition,
      potSize: room.currentQuestion.potSize,
      stackSize: room.currentQuestion.stackSize,
      street: room.currentQuestion.street,
      situation: room.currentQuestion.situation,
      options: room.currentQuestion.options,
      timeLimit: room.currentQuestion.timeLimit,
    } : null,
    roundNumber: room.roundNumber,
    totalRounds: room.totalRounds,
    status: room.status,
    timeLeft: 0,
  };
}

function generateQuestion(): Question {
  const template = SAMPLE_QUESTIONS[Math.floor(Math.random() * SAMPLE_QUESTIONS.length)];
  return {
    ...template,
    id: uuidv4(),
    answeredPlayers: new Set(),
  };
}

function startRound(room: Room) {
  room.currentQuestion = generateQuestion();
  room.roundNumber++;

  // Send question to all players
  const roomState = getRoomState(room);
  io.to(room.id).emit('question_start', roomState.currentQuestion);
  io.to(room.id).emit('room_state', roomState);

  // Set timeout for question
  room.questionTimeout = setTimeout(() => {
    endRound(room);
  }, room.currentQuestion.timeLimit * 1000);
}

function endRound(room: Room) {
  if (room.questionTimeout) {
    clearTimeout(room.questionTimeout);
    room.questionTimeout = null;
  }

  const correctAnswer = room.currentQuestion?.correctAnswer;

  // Calculate results
  const players = Array.from(room.players.values()).map(p => ({
    id: p.id,
    name: p.name,
    score: p.score,
    streak: p.streak,
    lastAnswer: p.lastAnswer,
  }));

  io.to(room.id).emit('round_result', { players, correctAnswer });

  // Check if game is finished
  if (room.roundNumber >= room.totalRounds) {
    room.status = 'finished';
    const winner = Array.from(room.players.values())
      .sort((a, b) => b.score - a.score)[0];

    io.to(room.id).emit('game_finished', {
      players,
      winner: winner ? {
        id: winner.id,
        name: winner.name,
        score: winner.score,
        streak: winner.streak,
      } : null,
    });
  } else {
    // Start next round after delay
    setTimeout(() => {
      if (room.status === 'in_progress') {
        startRound(room);
      }
    }, 3000);
  }

  room.currentQuestion = null;
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  const userId = socket.handshake.auth.userId as string;

  // Get available rooms
  socket.on('get_rooms', () => {
    const roomList = Array.from(rooms.values())
      .filter(r => r.status !== 'finished')
      .map(getRoomInfo);
    socket.emit('room_list', roomList);
  });

  // Create room
  socket.on('create_room', ({ name, rounds, creator }) => {
    const roomId = uuidv4();
    const room: Room = {
      id: roomId,
      name,
      players: new Map(),
      maxPlayers: 8,
      currentQuestion: null,
      roundNumber: 0,
      totalRounds: rounds,
      status: 'waiting',
      questionTimeout: null,
      createdAt: new Date(),
    };

    // Add creator as first player
    const player: Player = {
      id: creator.id,
      socketId: socket.id,
      name: creator.name,
      score: 0,
      streak: 0,
      ready: false,
    };

    room.players.set(creator.id, player);
    rooms.set(roomId, room);
    playerToRoom.set(creator.id, roomId);

    socket.join(roomId);
    socket.emit('room_state', getRoomState(room));

    // Broadcast updated room list
    io.emit('room_list', Array.from(rooms.values())
      .filter(r => r.status !== 'finished')
      .map(getRoomInfo));
  });

  // Join room
  socket.on('join_room', ({ roomId, player: playerData }) => {
    const room = rooms.get(roomId);
    if (!room) {
      socket.emit('error', 'Room not found');
      return;
    }

    if (room.status !== 'waiting') {
      socket.emit('error', 'Game already in progress');
      return;
    }

    if (room.players.size >= room.maxPlayers) {
      socket.emit('error', 'Room is full');
      return;
    }

    const player: Player = {
      id: playerData.id,
      socketId: socket.id,
      name: playerData.name,
      score: 0,
      streak: 0,
      ready: false,
    };

    room.players.set(playerData.id, player);
    playerToRoom.set(playerData.id, roomId);

    socket.join(roomId);

    // Notify other players
    socket.to(roomId).emit('player_joined', {
      id: player.id,
      name: player.name,
      score: 0,
      streak: 0,
    });

    // Send room state to joining player
    socket.emit('room_state', getRoomState(room));

    // Update room list
    io.emit('room_list', Array.from(rooms.values())
      .filter(r => r.status !== 'finished')
      .map(getRoomInfo));
  });

  // Leave room
  socket.on('leave_room', () => {
    const roomId = playerToRoom.get(userId);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room) return;

    room.players.delete(userId);
    playerToRoom.delete(userId);
    socket.leave(roomId);

    // Notify other players
    io.to(roomId).emit('player_left', userId);

    // Delete room if empty
    if (room.players.size === 0) {
      if (room.questionTimeout) {
        clearTimeout(room.questionTimeout);
      }
      rooms.delete(roomId);
    }

    // Update room list
    io.emit('room_list', Array.from(rooms.values())
      .filter(r => r.status !== 'finished')
      .map(getRoomInfo));
  });

  // Player ready
  socket.on('player_ready', () => {
    const roomId = playerToRoom.get(userId);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || room.status !== 'waiting') return;

    const player = room.players.get(userId);
    if (player) {
      player.ready = true;
    }

    // Check if all players are ready
    const allReady = Array.from(room.players.values()).every(p => p.ready);
    if (allReady && room.players.size >= 2) {
      room.status = 'in_progress';
      startRound(room);
    }
  });

  // Submit answer
  socket.on('submit_answer', ({ questionId, answer, time }) => {
    const roomId = playerToRoom.get(userId);
    if (!roomId) return;

    const room = rooms.get(roomId);
    if (!room || !room.currentQuestion) return;

    if (room.currentQuestion.id !== questionId) return;
    if (room.currentQuestion.answeredPlayers.has(userId)) return;

    room.currentQuestion.answeredPlayers.add(userId);

    const player = room.players.get(userId);
    if (!player) return;

    const correct = answer === room.currentQuestion.correctAnswer;
    const timeBonus = Math.max(0, room.currentQuestion.timeLimit - Math.floor((Date.now() - time) / 1000));
    const points = correct ? 100 + timeBonus * 5 : 0;

    if (correct) {
      player.score += points;
      player.streak++;
      if (player.streak >= 3) {
        player.score += 50; // Streak bonus
      }
    } else {
      player.streak = 0;
    }

    player.lastAnswer = {
      action: answer,
      correct,
      time: timeBonus,
    };

    // Notify all players that someone answered
    io.to(roomId).emit('player_answered', { playerId: userId, time: timeBonus });

    // Check if all players have answered
    if (room.currentQuestion.answeredPlayers.size === room.players.size) {
      endRound(room);
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const roomId = playerToRoom.get(userId);
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        room.players.delete(userId);
        playerToRoom.delete(userId);
        io.to(roomId).emit('player_left', userId);

        if (room.players.size === 0) {
          if (room.questionTimeout) {
            clearTimeout(room.questionTimeout);
          }
          rooms.delete(roomId);
        }
      }
    }
  });
});

// Clean up old rooms periodically
setInterval(() => {
  const now = new Date();
  rooms.forEach((room, id) => {
    const age = now.getTime() - room.createdAt.getTime();
    if (room.status === 'finished' || (room.players.size === 0 && age > 60000)) {
      rooms.delete(id);
    }
  });
}, 60000);

// Start server
const PORT = process.env.WS_PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});

export { io, httpServer };
