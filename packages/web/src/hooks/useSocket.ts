'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import {
  getSocket,
  connectSocket,
  disconnectSocket,
  SOCKET_EVENTS,
  RoomState,
  Player,
  PracticeQuestion,
  AnswerResult,
} from '@/lib/socket';
import { useUserStore } from '@/store';

export interface UseSocketReturn {
  isConnected: boolean;
  roomState: RoomState | null;
  availableRooms: RoomInfo[];
  error: string | null;
  joinRoom: (roomId: string) => void;
  leaveRoom: () => void;
  createRoom: (name: string, rounds: number) => void;
  submitAnswer: (answer: string) => void;
  setReady: () => void;
  refreshRooms: () => void;
}

export interface RoomInfo {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  status: string;
}

export function useSocket(): UseSocketReturn {
  const { user } = useUserStore();
  const [isConnected, setIsConnected] = useState(false);
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [availableRooms, setAvailableRooms] = useState<RoomInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const socket = connectSocket(user.id);
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      // Request room list on connect
      socket.emit('get_rooms');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on(SOCKET_EVENTS.ROOM_STATE, (state: RoomState) => {
      setRoomState(state);
    });

    socket.on(SOCKET_EVENTS.PLAYER_JOINED, (player: Player) => {
      setRoomState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: [...prev.players, player],
        };
      });
    });

    socket.on(SOCKET_EVENTS.PLAYER_LEFT, (playerId: string) => {
      setRoomState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.filter(p => p.id !== playerId),
        };
      });
    });

    socket.on(SOCKET_EVENTS.QUESTION_START, (question: PracticeQuestion) => {
      setRoomState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          currentQuestion: question,
          status: 'in_progress',
        };
      });
    });

    socket.on(SOCKET_EVENTS.PLAYER_ANSWERED, ({ playerId, time }: { playerId: string; time: number }) => {
      setRoomState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players: prev.players.map(p =>
            p.id === playerId
              ? { ...p, lastAnswer: { action: 'answered', correct: false, time } }
              : p
          ),
        };
      });
    });

    socket.on(SOCKET_EVENTS.ROUND_RESULT, ({ players, correctAnswer }: { players: Player[]; correctAnswer: string }) => {
      setRoomState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players,
          roundNumber: prev.roundNumber + 1,
        };
      });
    });

    socket.on(SOCKET_EVENTS.GAME_FINISHED, ({ players, winner }: { players: Player[]; winner: Player }) => {
      setRoomState(prev => {
        if (!prev) return null;
        return {
          ...prev,
          players,
          status: 'finished',
        };
      });
    });

    socket.on(SOCKET_EVENTS.ROOM_LIST, (rooms: RoomInfo[]) => {
      setAvailableRooms(rooms);
    });

    socket.on(SOCKET_EVENTS.ERROR, (errorMessage: string) => {
      setError(errorMessage);
    });

    return () => {
      disconnectSocket();
      socketRef.current = null;
    };
  }, [user?.id]);

  const joinRoom = useCallback((roomId: string) => {
    if (socketRef.current && user) {
      socketRef.current.emit(SOCKET_EVENTS.JOIN_ROOM, {
        roomId,
        player: {
          id: user.id,
          name: user.name || 'Anonymous',
        },
      });
    }
  }, [user]);

  const leaveRoom = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.LEAVE_ROOM);
      setRoomState(null);
    }
  }, []);

  const createRoom = useCallback((name: string, rounds: number) => {
    if (socketRef.current && user) {
      socketRef.current.emit(SOCKET_EVENTS.CREATE_ROOM, {
        name,
        rounds,
        creator: {
          id: user.id,
          name: user.name || 'Anonymous',
        },
      });
    }
  }, [user]);

  const submitAnswer = useCallback((answer: string) => {
    if (socketRef.current && roomState) {
      socketRef.current.emit(SOCKET_EVENTS.SUBMIT_ANSWER, {
        questionId: roomState.currentQuestion?.id,
        answer,
        time: Date.now(),
      });
    }
  }, [roomState]);

  const setReady = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit(SOCKET_EVENTS.PLAYER_READY);
    }
  }, []);

  const refreshRooms = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('get_rooms');
    }
  }, []);

  return {
    isConnected,
    roomState,
    availableRooms,
    error,
    joinRoom,
    leaveRoom,
    createRoom,
    submitAnswer,
    setReady,
    refreshRooms,
  };
}
