import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3001', {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    });
  }
  return socket;
};

export const connectSocket = (userId: string, token?: string): Socket => {
  const socket = getSocket();

  socket.auth = { userId, token };
  socket.connect();

  return socket;
};

export const disconnectSocket = (): void => {
  if (socket) {
    socket.disconnect();
  }
};

// Event types
export interface RoomState {
  id: string;
  name: string;
  players: Player[];
  currentQuestion: PracticeQuestion | null;
  roundNumber: number;
  totalRounds: number;
  status: 'waiting' | 'in_progress' | 'finished';
  timeLeft: number;
}

export interface Player {
  id: string;
  name: string;
  score: number;
  streak: number;
  lastAnswer?: {
    action: string;
    correct: boolean;
    time: number;
  };
}

export interface PracticeQuestion {
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
  timeLimit: number;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  explanation: string;
  pointsEarned: number;
  newScore: number;
  newStreak: number;
}

// Socket event names
export const SOCKET_EVENTS = {
  // Client -> Server
  JOIN_ROOM: 'join_room',
  LEAVE_ROOM: 'leave_room',
  SUBMIT_ANSWER: 'submit_answer',
  PLAYER_READY: 'player_ready',
  CREATE_ROOM: 'create_room',

  // Server -> Client
  ROOM_STATE: 'room_state',
  PLAYER_JOINED: 'player_joined',
  PLAYER_LEFT: 'player_left',
  QUESTION_START: 'question_start',
  PLAYER_ANSWERED: 'player_answered',
  ROUND_RESULT: 'round_result',
  GAME_FINISHED: 'game_finished',
  ERROR: 'error',
  ROOM_LIST: 'room_list',
} as const;
