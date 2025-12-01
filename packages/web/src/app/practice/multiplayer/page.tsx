'use client';

import { useState, useEffect } from 'react';
import { Card, Button, PokerCard, PositionBadge, Input, Modal } from '@gto/ui';
import { parseCard } from '@gto/core';
import type { Card as CardType, Position } from '@gto/core';
import { useSocket, RoomInfo } from '@/hooks/useSocket';
import { useUserStore } from '@/store';

export default function MultiplayerPracticePage() {
  const { isAuthenticated } = useUserStore();
  const {
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
  } = useSocket();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomRounds, setNewRoomRounds] = useState(10);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);

  // Timer for questions
  useEffect(() => {
    if (roomState?.currentQuestion && roomState.status === 'in_progress') {
      setTimeLeft(roomState.currentQuestion.timeLimit);
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 0) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [roomState?.currentQuestion?.id]);

  // Reset selected answer on new question
  useEffect(() => {
    setSelectedAnswer(null);
  }, [roomState?.currentQuestion?.id]);

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '24px', textAlign: 'center' }}>
        <Card variant="default" padding="lg">
          <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>Login Required</h2>
          <p style={{ color: '#a0a0b0', marginBottom: '24px' }}>
            Please log in to access multiplayer practice
          </p>
          <Button variant="primary" onClick={() => window.location.href = '/auth/login'}>
            Login
          </Button>
        </Card>
      </div>
    );
  }

  const parseHand = (handStr: string): [CardType, CardType] | null => {
    try {
      if (handStr.length >= 4) {
        return [
          parseCard(handStr.slice(0, 2)),
          parseCard(handStr.slice(2, 4)),
        ];
      }
    } catch {
      return null;
    }
    return null;
  };

  const parseBoard = (boardStr: string): CardType[] => {
    const cards: CardType[] = [];
    try {
      for (let i = 0; i < boardStr.length; i += 2) {
        if (i + 1 < boardStr.length) {
          cards.push(parseCard(boardStr.slice(i, i + 2)));
        }
      }
    } catch {
      return [];
    }
    return cards;
  };

  const handleCreateRoom = () => {
    if (newRoomName.trim()) {
      createRoom(newRoomName.trim(), newRoomRounds);
      setShowCreateModal(false);
      setNewRoomName('');
    }
  };

  const handleAnswer = (answer: string) => {
    setSelectedAnswer(answer);
    submitAnswer(answer);
  };

  // In a room - show game view
  if (roomState) {
    return (
      <div style={{ padding: '24px' }}>
        {/* Room Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
              {roomState.name}
            </h1>
            <p style={{ color: '#a0a0b0', fontSize: '14px', margin: '4px 0 0 0' }}>
              Round {roomState.roundNumber}/{roomState.totalRounds}
            </p>
          </div>
          <Button variant="ghost" onClick={leaveRoom}>
            Leave Room
          </Button>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 300px',
          gap: '24px',
        }}>
          {/* Main Game Area */}
          <div>
            {roomState.status === 'waiting' ? (
              <Card variant="default" padding="lg" style={{ textAlign: 'center' }}>
                <h2 style={{ color: '#ffffff', marginBottom: '16px' }}>
                  Waiting for Players...
                </h2>
                <p style={{ color: '#a0a0b0', marginBottom: '24px' }}>
                  {roomState.players.length} player(s) in room
                </p>
                {roomState.players.length >= 2 && (
                  <Button variant="primary" onClick={setReady}>
                    Ready to Start
                  </Button>
                )}
              </Card>
            ) : roomState.status === 'finished' ? (
              <Card variant="outlined" padding="lg" style={{ textAlign: 'center' }}>
                <h2 style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#00f5d4',
                  marginBottom: '24px',
                }}>
                  Game Finished!
                </h2>
                <div style={{ marginBottom: '24px' }}>
                  {roomState.players
                    .sort((a, b) => b.score - a.score)
                    .map((player, index) => (
                      <div
                        key={player.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '12px',
                          background: index === 0 ? 'rgba(0, 245, 212, 0.1)' : '#1a1a24',
                          borderRadius: '8px',
                          marginBottom: '8px',
                        }}
                      >
                        <span style={{
                          color: index === 0 ? '#00f5d4' : '#ffffff',
                          fontWeight: index === 0 ? 600 : 400,
                        }}>
                          {index + 1}. {player.name}
                        </span>
                        <span style={{ color: '#00f5d4', fontWeight: 600 }}>
                          {player.score} pts
                        </span>
                      </div>
                    ))}
                </div>
                <Button variant="primary" onClick={leaveRoom}>
                  Back to Lobby
                </Button>
              </Card>
            ) : roomState.currentQuestion ? (
              <Card variant="default" padding="lg">
                {/* Timer */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '16px',
                }}>
                  <span style={{ color: '#a0a0b0', fontSize: '14px' }}>
                    {roomState.currentQuestion.situation}
                  </span>
                  <div style={{
                    padding: '4px 12px',
                    background: timeLeft <= 5 ? '#ff6b6b' : '#00f5d4',
                    color: '#0a0a0f',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}>
                    {timeLeft}s
                  </div>
                </div>

                {/* Hand Display */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '16px',
                }}>
                  {parseHand(roomState.currentQuestion.heroHand)?.map((card, i) => (
                    <PokerCard key={i} card={card} size="lg" />
                  ))}
                </div>

                {/* Board */}
                {roomState.currentQuestion.board && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '8px',
                    marginBottom: '16px',
                  }}>
                    {parseBoard(roomState.currentQuestion.board).map((card, i) => (
                      <PokerCard key={i} card={card} size="md" />
                    ))}
                  </div>
                )}

                {/* Position Info */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  marginBottom: '24px',
                }}>
                  <PositionBadge
                    position={roomState.currentQuestion.heroPosition as Position}
                    size="md"
                  />
                  <span style={{ color: '#6b6b7b' }}>vs</span>
                  <PositionBadge
                    position={roomState.currentQuestion.villainPosition as Position}
                    size="md"
                  />
                </div>

                {/* Pot/Stack Info */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '24px',
                  marginBottom: '24px',
                  color: '#a0a0b0',
                  fontSize: '14px',
                }}>
                  <span>Pot: {roomState.currentQuestion.potSize} BB</span>
                  <span>Stack: {roomState.currentQuestion.stackSize} BB</span>
                </div>

                {/* Answer Options */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}>
                  {roomState.currentQuestion.options.map(option => (
                    <Button
                      key={option}
                      variant={selectedAnswer === option ? 'primary' : 'ghost'}
                      onClick={() => !selectedAnswer && handleAnswer(option)}
                      disabled={!!selectedAnswer}
                      fullWidth
                    >
                      {option}
                    </Button>
                  ))}
                </div>
              </Card>
            ) : null}
          </div>

          {/* Players Sidebar */}
          <Card variant="outlined" padding="md">
            <h3 style={{
              fontSize: '16px',
              fontWeight: 600,
              color: '#00f5d4',
              marginBottom: '16px',
            }}>
              Players
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {roomState.players
                .sort((a, b) => b.score - a.score)
                .map((player, index) => (
                  <div
                    key={player.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 12px',
                      background: '#1a1a24',
                      borderRadius: '8px',
                    }}
                  >
                    <div>
                      <div style={{ color: '#ffffff', fontSize: '14px' }}>
                        {player.name}
                      </div>
                      {player.streak > 0 && (
                        <div style={{ color: '#f15bb5', fontSize: '12px' }}>
                          {player.streak} streak
                        </div>
                      )}
                    </div>
                    <div style={{
                      color: '#00f5d4',
                      fontWeight: 600,
                      fontSize: '16px',
                    }}>
                      {player.score}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // Lobby view
  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
      }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 700, color: '#ffffff', margin: 0 }}>
            Multiplayer Practice
          </h1>
          <p style={{ color: '#a0a0b0', fontSize: '14px', margin: '4px 0 0 0' }}>
            Compete with other players in real-time
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: isConnected ? 'rgba(0, 245, 212, 0.1)' : 'rgba(255, 107, 107, 0.1)',
            borderRadius: '8px',
            fontSize: '12px',
            color: isConnected ? '#00f5d4' : '#ff6b6b',
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: isConnected ? '#00f5d4' : '#ff6b6b',
            }} />
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
          <Button variant="primary" onClick={() => setShowCreateModal(true)}>
            Create Room
          </Button>
        </div>
      </div>

      {error && (
        <div style={{
          padding: '16px',
          background: 'rgba(255, 107, 107, 0.1)',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          color: '#ff6b6b',
          marginBottom: '24px',
        }}>
          {error}
        </div>
      )}

      {/* Room List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {availableRooms.length === 0 ? (
          <Card variant="default" padding="lg" style={{ textAlign: 'center' }}>
            <p style={{ color: '#a0a0b0', marginBottom: '16px' }}>
              No rooms available
            </p>
            <Button variant="ghost" onClick={refreshRooms}>
              Refresh
            </Button>
          </Card>
        ) : (
          availableRooms.map(room => (
            <Card
              key={room.id}
              variant="default"
              padding="md"
              onClick={() => room.status === 'waiting' && joinRoom(room.id)}
              style={{
                cursor: room.status === 'waiting' ? 'pointer' : 'default',
                opacity: room.status !== 'waiting' ? 0.6 : 1,
              }}
            >
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}>
                <div>
                  <h3 style={{
                    fontSize: '16px',
                    fontWeight: 600,
                    color: '#ffffff',
                    margin: '0 0 4px 0',
                  }}>
                    {room.name}
                  </h3>
                  <p style={{
                    fontSize: '12px',
                    color: '#a0a0b0',
                    margin: 0,
                  }}>
                    {room.playerCount}/{room.maxPlayers} players
                  </p>
                </div>
                <div style={{
                  padding: '4px 8px',
                  background: room.status === 'waiting'
                    ? 'rgba(0, 245, 212, 0.1)'
                    : 'rgba(155, 93, 229, 0.1)',
                  borderRadius: '4px',
                  fontSize: '12px',
                  color: room.status === 'waiting' ? '#00f5d4' : '#9b5de5',
                }}>
                  {room.status === 'waiting' ? 'Join' : 'In Progress'}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Room"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              color: '#a0a0b0',
              marginBottom: '8px',
            }}>
              Room Name
            </label>
            <Input
              value={newRoomName}
              onChange={(e) => setNewRoomName(e.target.value)}
              placeholder="My Practice Room"
            />
          </div>
          <div>
            <label style={{
              display: 'block',
              fontSize: '14px',
              color: '#a0a0b0',
              marginBottom: '8px',
            }}>
              Number of Rounds
            </label>
            <Input
              type="number"
              value={newRoomRounds}
              onChange={(e) => setNewRoomRounds(parseInt(e.target.value) || 10)}
              min={5}
              max={50}
            />
          </div>
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'flex-end',
            marginTop: '8px',
          }}>
            <Button variant="ghost" onClick={() => setShowCreateModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateRoom}>
              Create
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
