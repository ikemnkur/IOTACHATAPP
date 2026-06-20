import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
    getDebateRoomById,
    getDebateRoomByIdFromServer,
    removeRoomParticipant,
    upsertRoomParticipant,
} from '../lib/debateRooms';
import { publishDebateEvent, subscribeDebateEvents } from '../lib/debateRealtime';

const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TEAM_COLORS = {
    A: '#1d4ed8',
    B: '#059669',
    C: '#d97706',
    D: '#b91c1c',
    E: '#6b21a8',
};

const TEAM_CODES = ['A', 'B', 'C', 'D', 'E'];

const baseButton = {
    padding: '10px 14px',
    borderRadius: 10,
    border: '1px solid #d0d7de',
    background: '#fff',
    cursor: 'pointer',
    fontWeight: 600,
};

const btnSm = {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid #d0d7de',
    background: '#f8fafc',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
};

function randomNextIndex(length, currentIndex) {
    if (length <= 1) return 0;
    let next = currentIndex;
    while (next === currentIndex) {
        next = Math.floor(Math.random() * length);
    }
    return next;
}

function getVisitorId() {
    const existing = localStorage.getItem('iota_guest_id');
    if (existing) return existing;
    const generated = `guest_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('iota_guest_id', generated);
    return generated;
}

function buildChatKey(roomId) {
    return `iota_debate_chat_${roomId}`;
}

function loadChat(roomId) {
    try {
        const raw = localStorage.getItem(buildChatKey(roomId));
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function saveChat(roomId, messages) {
    localStorage.setItem(buildChatKey(roomId), JSON.stringify(messages));
}

function applyQualityCap(stream) {
    stream.getVideoTracks().forEach((track) => {
        track
            .applyConstraints({ width: { max: 640 }, height: { max: 360 } })
            .catch(() => { });
    });
}

function formatTimeLeft(expiresAt) {
    if (!expiresAt) return 'No expiry set';
    const remaining = Math.max(0, expiresAt - Date.now());
    if (remaining <= 0) return 'Expired';

    const totalSeconds = Math.floor(remaining / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
}

function VideoTile({
    stream,
    username,
    team,
    teamLabel,
    thumbnailUrl,
    score,
    turnCountdown,
    isMuted,
    isHidden,
    isHost,
    onMute,
    onHide,
    onKick,
    onBan,
}) {
    const videoRef = useRef(null);

    const [showActions, setShowActions] = useState(false);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    return (
        <div style={{ background: '#fff', border: '1px solid #dbe3ef', borderRadius: 12, overflow: 'hidden' }}>
            <div
                style={{
                    background: TEAM_COLORS[team],
                    color: '#ffffffcc',
                    padding: '8px 10px',
                    fontWeight: 700,
                    letterSpacing: 0.2,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span>{teamLabel}</span>
                    <span>Score {score}</span>
                </div>
            </div>

            <div style={{ position: 'relative', background: '#0f172a', minHeight: 220 }}>
                {thumbnailUrl ? (
                    <img
                        src={thumbnailUrl}
                        alt={`${teamLabel} thumbnail`}
                        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: isHidden || stream ? 0.18 : 0.3 }}
                    />
                ) : null}
                {!isHidden && stream ? (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted={isMuted}
                        style={{ width: '100%', height: 220, objectFit: 'cover', display: 'block' }}
                    />
                ) : (
                    <div
                        style={{
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: 220,
                            fontSize: 14,
                        }}
                    >
                        {isHidden ? 'Stream hidden by moderator' : username ? `@${username} is active (audio only/mock)` : 'No presenter yet'}
                    </div>
                )}

                <div
                    style={{
                        position: 'absolute',
                        top: 8,
                        left: 8,
                        fontSize: 12,
                        background: 'rgba(15,23,42,0.75)',
                        color: '#fff',
                        padding: '3px 8px',
                        borderRadius: 6,
                    }}
                >
                    @{username || 'waiting'}
                </div>
                <div
                    style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        fontSize: 12,
                        background: 'rgba(15,23,42,0.75)',
                        color: '#fff',
                        padding: '3px 8px',
                        borderRadius: 6,
                    }}
                >
                    {turnCountdown}s
                </div>
            </div>

         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 10px', fontSize: 13, color: '#475569', position: 'relative' }}>
  <span>{isMuted ? 'Muted' : 'Live'}</span> 
  
  {isHost && (
    <div style={{ position: 'relative' }}>
      {/* Single Toggle Button */}
      <button 
        style={{ ...btnSm, background: showActions ? '#e2e8f0' : '#f8fafc' }} 
        onClick={() => setShowActions(!showActions)}
      >
        {showActions ? '✕ Close' : 'Actions'}
      </button>

      {/* Collapsible Popup Menu Container */}
      {showActions && (
        <div style={{
          position: 'absolute',
          bottom: '125%', // Pops up directly above the toggle button
          right: 0,
          background: '#fff',
          border: '1px solid #cbd5e1',
          borderRadius: 8,
          padding: 6,
          display: 'flex',
          flexDirection: 'column', // Stacks buttons vertically like a classic dropdown
          gap: 6,
          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
          zIndex: 10
        }}>
          <button style={{ ...btnSm, width: '100%' }} onClick={() => { onMute(); setShowActions(false); }}>
            {isMuted ? 'Unmute' : 'Mute'}
          </button>
          <button style={{ ...btnSm, width: '100%' }} onClick={() => { onHide(); setShowActions(false); }}>
            {isHidden ? 'Show' : 'Hide'}
          </button>
          <button style={{ ...btnSm, width: '100%' }} onClick={() => { onKick(); setShowActions(false); }}>
            Kick
          </button>
          <button 
            style={{ ...btnSm, width: '100%', background: '#fef2f2', color: '#dc2626' }} 
            onClick={() => { onBan(); setShowActions(false); }}
          >
            Ban
          </button>
        </div>
      )}
    </div>
  )}
</div>
        </div>
    );
}



export default function ChatRoom() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { user, isAuthenticated } = useAuth();

    const selectedTeam = id ? sessionStorage.getItem(`room_${id}_team`) || '' : '';
    const sessionSpectator = id ? sessionStorage.getItem(`room_${id}_spectator`) === '1' : false;
    const modeSpectator = searchParams.get('mode') === 'spectator';
    const isGuest = !isAuthenticated;
    const isSpectator = modeSpectator || sessionSpectator || isGuest;

    const currentUserId = user?.id || getVisitorId();
    const currentUsername = user?.username || 'Guest Spectator';

    const [roomVersion, setRoomVersion] = useState(0);
    const [roomLoading, setRoomLoading] = useState(true);
    const [now, setNow] = useState(Date.now());
    const [myStream, setMyStream] = useState(null);
    const [activePresenters, setActivePresenters] = useState({});
    const [presenterIndexes, setPresenterIndexes] = useState({ A: 0, B: 0, C: 0, D: 0, E: 0 });
    const [turnCountdown, setTurnCountdown] = useState(60);
    const [mutedTeams, setMutedTeams] = useState({ A: false, B: false, C: false, D: false, E: false });
    const [hiddenTeams, setHiddenTeams] = useState({ A: false, B: false, C: false, D: false, E: false });
    const [bannedUsers, setBannedUsers] = useState([]);

    const [chatInput, setChatInput] = useState('');
    const [chatMessages, setChatMessages] = useState(() => (id ? loadChat(id) : []));

    const [activeMenuTeam, setActiveMenuTeam] = useState(null);

    const activeRoom = useMemo(() => {
        if (!id) return null;
        return getDebateRoomById(id);
    }, [id, roomVersion]);


    function fetchRoomData(roomId) {
        return new Promise((resolve) => {

            const response = api.get(`/rooms/${roomId}`).then((response) => {
                resolve(response.data);
            }).catch(() => {
                setTimeout(() => {
                    resolve({
                        id: roomId,
                        topic: `Debate Topic for Room ${roomId}`,
                        teamsCount: 5,
                        teamNames: ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'],
                        participants: [],
                        turnSeconds: 60,
                    });
                }, 500);
            })

            setRoomData(response);

        });
    }

    useEffect(() => {
        let cancelled = false;

        const hydrateRoom = async () => {
            if (!id) {
                setRoomLoading(false);
                return;
            }

            const localRoom = getDebateRoomById(id);
            if (localRoom) {
                if (!cancelled) setRoomLoading(false);
                return;
            }

            try {
                await getDebateRoomByIdFromServer(id);
                if (!cancelled) setRoomVersion((v) => v + 1);
            } catch {
                // Keep the not-found state if backend cannot return this room.
            } finally {
                if (!cancelled) setRoomLoading(false);
            }
        };

        hydrateRoom();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const isHost = Boolean(activeRoom?.createdBy && activeRoom.createdBy.toString() === currentUserId.toString());
    const roomExpiresAt = activeRoom?.expiresAt || null;
    const roomExpired = Boolean(roomExpiresAt && roomExpiresAt <= now);
    const roomTimeLeft = formatTimeLeft(roomExpiresAt);

    const activeRoomId = activeRoom?.id || null;
    const availableTeamCodes = useMemo(
        () => TEAM_CODES.slice(0, activeRoom?.teamsCount || 4),
        [activeRoom?.teamsCount],
    );

    const activeParticipants = useMemo(() => {
        if (!activeRoom) return [];
        return activeRoom.participants || [];
    }, [activeRoom]);

    const participantsByTeam = useMemo(() => {
        const grouped = { A: [], B: [], C: [], D: [], E: [] };
        activeParticipants.forEach((p) => {
            if (!p.isSpectator && p.team !== 'SPEC' && grouped[p.team]) {
                grouped[p.team].push(p);
            }
        });
        return grouped;
    }, [activeParticipants]);

    useEffect(() => {
        if (!id || !activeRoomId) return;

        const participant = {
            userId: currentUserId,
            username: currentUsername,
            team: isSpectator ? 'SPEC' : selectedTeam,
            isHost,
            isSpectator,
            isGuest,
            joinedAt: Date.now(),
        };

        if (!participant.team) {
            if (!isSpectator) {
                navigate(`/room/join/${id}`, { replace: true });
            }
            return;
        }

        upsertRoomParticipant(id, participant);
        publishDebateEvent({ type: 'room:updated', roomId: id, payload: { timestamp: Date.now() } });

        return () => {
            removeRoomParticipant(id, participant.userId);
            publishDebateEvent({ type: 'room:updated', roomId: id, payload: { timestamp: Date.now() } });
        };
    }, [id, activeRoomId, currentUserId, currentUsername, isHost, isSpectator, isGuest, selectedTeam, navigate]);

    useEffect(() => {
        if (!id) return;
        setChatMessages(loadChat(id));

        const unsubscribe = subscribeDebateEvents((event) => {
            if (event.roomId !== id) return;

            if (event.type === 'chat:message') {
                setChatMessages((prev) => {
                    const exists = prev.some((m) => m.id === event.payload.id);
                    if (exists) return prev;
                    const next = [...prev, event.payload];
                    saveChat(id, next);
                    return next;
                });
            }

            if (event.type === 'chat:reaction') {
                setChatMessages((prev) => {
                    const next = prev.map((msg) =>
                        msg.id === event.payload.messageId
                            ? { ...msg, [event.payload.key]: (msg[event.payload.key] || 0) + 1 }
                            : msg,
                    );
                    saveChat(id, next);
                    return next;
                });
            }

            if (event.type === 'room:updated') {
                setRoomVersion((v) => v + 1);
            }
        });

        return unsubscribe;
    }, [id]);

    useEffect(() => {
        const timer = setInterval(() => setNow(Date.now()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        if (!activeRoom || isSpectator) return;

        let stream = null;
        let mounted = true;

        const startMedia = async () => {
            try {
                const saved = JSON.parse(localStorage.getItem('preferredDevices') || '{}');
                const media = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { max: 640 },
                        height: { max: 360 },
                        ...(saved.video ? { deviceId: { exact: saved.video } } : {}),
                    },
                    audio: saved.audioInput ? { deviceId: { exact: saved.audioInput } } : true,
                });
                applyQualityCap(media);
                stream = media;
                if (mounted) {
                    setMyStream(media);
                }
            } catch {
                // Camera/mic may be blocked for some users; room still remains viewable.
            }
        };

        startMedia();

        return () => {
            mounted = false;
            if (stream) {
                stream.getTracks().forEach((t) => t.stop());
            }
            setMyStream(null);
        };
    }, [activeRoom, isSpectator]);

    useEffect(() => {
        if (!activeRoom) return;

        const initialPresenters = {};
        const initialIndexes = { A: 0, B: 0, C: 0, D: 0, E: 0 };

        availableTeamCodes.forEach((team) => {
            const members = participantsByTeam[team].filter((p) => !bannedUsers.includes(p.userId));
            if (members.length > 0) {
                initialPresenters[team] = members[0].userId;
            }
        });

        setActivePresenters(initialPresenters);
        setPresenterIndexes(initialIndexes);
        setTurnCountdown(activeRoom.turnSeconds || 60);
    }, [activeRoom, availableTeamCodes, participantsByTeam, bannedUsers]);

    useEffect(() => {
        if (!activeRoom) return;

        const seconds = activeRoom.turnSeconds || 60;

        const countdownTimer = setInterval(() => {
            setTurnCountdown((prev) => (prev > 1 ? prev - 1 : seconds));
        }, 1000);

        const rotateTimer = setInterval(() => {
            setActivePresenters((prev) => {
                const next = { ...prev };

                setPresenterIndexes((prevIndexes) => {
                    const nextIndexes = { ...prevIndexes };

                    availableTeamCodes.forEach((team) => {
                        const members = participantsByTeam[team].filter((p) => !bannedUsers.includes(p.userId));
                        if (members.length <= 1) {
                            if (members.length === 1) {
                                next[team] = members[0].userId;
                            }
                            return;
                        }

                        const currentIndex = nextIndexes[team] || 0;
                        const rotateIndex = randomNextIndex(members.length, currentIndex);
                        nextIndexes[team] = rotateIndex;
                        next[team] = members[rotateIndex].userId;
                    });

                    return nextIndexes;
                });

                return next;
            });

            setTurnCountdown(seconds);
        }, seconds * 1000);

        return () => {
            clearInterval(countdownTimer);
            clearInterval(rotateTimer);
        };
    }, [activeRoom, availableTeamCodes, participantsByTeam, bannedUsers]);

    const reactToMessage = useCallback(
        (msgId, key) => {
            if (!id) return;
            setChatMessages((prev) => {
                const next = prev.map((m) => (m.id === msgId ? { ...m, [key]: (m[key] || 0) + 1 } : m));
                saveChat(id, next);
                return next;
            });
            publishDebateEvent({
                type: 'chat:reaction',
                roomId: id,
                payload: { messageId: msgId, key },
            });
        },
        [id],
    );

    const sendChat = useCallback(() => {
        if (!id || isGuest) return;
        const text = chatInput.trim();
        if (!text) return;

        const message = {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            userId: currentUserId,
            user: currentUsername,
            team: isHost ? 'MOD' : selectedTeam || 'SPEC',
            text,
            likes: 0,
            dislikes: 0,
            createdAt: Date.now(),
        };

        setChatMessages((prev) => {
            const next = [...prev, message];
            saveChat(id, next);
            return next;
        });

        publishDebateEvent({ type: 'chat:message', roomId: id, payload: message });
        setChatInput('');
    }, [id, isGuest, chatInput, currentUserId, currentUsername, isHost, selectedTeam]);

    const modMute = (team) => setMutedTeams((prev) => ({ ...prev, [team]: !prev[team] }));
    const modHide = (team) => setHiddenTeams((prev) => ({ ...prev, [team]: !prev[team] }));
    const modKick = (userId) => {
        if (!id || !userId) return;
        removeRoomParticipant(id, userId);
        publishDebateEvent({ type: 'room:updated', roomId: id, payload: { timestamp: Date.now() } });
        setRoomVersion((v) => v + 1);
    };
    const modBan = (userId) => {
        if (!userId) return;
        setBannedUsers((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
    };

    const teamSlots = useMemo(() => {
        if (!activeRoom) return [];
        const roomTeams = activeRoom.teamsData || [];

        return availableTeamCodes.map((team, index) => {
            const activeUserId = activePresenters[team] || null;
            const activeUser = activeParticipants.find((p) => p.userId === activeUserId) || null;
            const isMe = activeUserId && activeUserId.toString() === currentUserId.toString();

            const roomTeam = roomTeams[index] || null;
            const roomTeamName = roomTeam?.name || activeRoom.teamNames[index] || `Team ${team}`;
            const teamLabel = `${roomTeamName} (${team})`;

            return {
                team,
                teamLabel,
                activeUserId,
                username: activeUser?.username || null,
                stream: isMe ? myStream : null,
                thumbnailUrl: serverUrl + (roomTeam?.thumbnailUrl || ''),
                score: roomTeam?.score || 0,
            };
        });
    }, [activeRoom, availableTeamCodes, activePresenters, activeParticipants, currentUserId, myStream]);

    const leaveRoom = () => {
        if (id) {
            removeRoomParticipant(id, currentUserId);
            publishDebateEvent({ type: 'room:updated', roomId: id, payload: { timestamp: Date.now() } });
            sessionStorage.removeItem(`room_${id}_team`);
            sessionStorage.removeItem(`room_${id}_spectator`);
        }
        myStream?.getTracks()?.forEach((t) => t.stop());
        navigate('/explore');
    };

    if (roomLoading) {
        return (
            <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7fb' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Loading room...</div>
                </div>
            </div>
        );
    }

    if (!id || !activeRoom) {
        return (
            <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#f5f7fb' }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Room not found</div>
                    <button style={baseButton} onClick={() => navigate('/explore')}>Back to Explore</button>
                </div>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#f5f7fb', color: '#0f172a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: '1px solid #e5e7eb', background: '#fff', position: 'sticky', top: 0, zIndex: 10, gap: 8, flexWrap: 'wrap' }}>
                <div>
                    <div style={{ fontWeight: 800, fontSize: 16 }}>{activeRoom.topic}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>
                        Room #{id} • {isSpectator ? 'Spectator' : `Team ${selectedTeam}`}
                        {isHost ? ' • Moderator' : ''}
                        {isGuest ? ' • Guest' : ''}
                    </div>
                    <div style={{ fontSize: 12, color: roomExpired ? '#dc2626' : '#64748b', marginTop: 4, fontWeight: roomExpired ? 700 : 400 }}>
                        {roomExpired ? 'Room expired' : `Time left: ${roomTimeLeft}`}
                    </div>
                </div>

                <div>
                    <div style={{ fontWeight: 700, fontSize: 16, color: roomExpired ? '#dc2626' : '#0f172a' }}>{roomTimeLeft}</div>
                    <div style={{ fontSize: 12, color: '#64748b' }}>{roomExpired ? 'Expired' : 'Time Left'}</div>
                </div>


                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {!isSpectator && myStream && (
                        <div style={{ fontSize: 12, padding: '6px 10px', borderRadius: 8, background: '#e0f2fe', color: '#075985', fontWeight: 700 }}>
                            Camera Live (360p cap)
                        </div>
                    )}
                    <button style={baseButton} onClick={leaveRoom}>Leave Room</button>
                </div>
            </div>

            {roomExpired && (
                <div style={{ margin: '12px 14px 0', padding: '10px 14px', borderRadius: 12, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', fontWeight: 700 }}>
                    This room has expired. You can still review the chat and team setup, but new activity should be considered read-only.
                </div>
            )}

            <div style={{ padding: 14, maxWidth: 1500, margin: '0 auto' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
                    {teamSlots.map(({ team, teamLabel, stream, username, activeUserId }) => (
                        <VideoTile
                            key={team}
                            stream={stream}
                            username={username}
                            team={team}
                            teamLabel={teamLabel}
                            thumbnailUrl={(teamSlots.find((slot) => slot.team === team)?.thumbnailUrl || '')}
                            score={teamSlots.find((slot) => slot.team === team)?.score || 0}
                            turnCountdown={turnCountdown}
                            isMuted={mutedTeams[team]}
                            isHidden={hiddenTeams[team]}
                            isHost={isHost}
                            onMute={() => modMute(team)}
                            onHide={() => modHide(team)}
                            onKick={() => modKick(activeUserId)}
                            onBan={() => modBan(activeUserId)}
                        />
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isHost ? '2fr 1fr' : '1fr', gap: 12, marginTop: 12 }}>
                    <div style={{ background: '#fff', border: '1px solid #dbe3ef', borderRadius: 12, padding: 12 }}>
                        <div style={{ fontWeight: 700, marginBottom: 8 }}>Live Chat</div>
                        <div style={{ height: 300, overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: 10, padding: 8, background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {chatMessages.length === 0 && <div style={{ color: '#94a3b8', fontSize: 13 }}>No messages yet</div>}
                            {chatMessages.map((msg) => (
                                <div key={msg.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
                                    <div style={{ fontSize: 11, color: '#64748b', marginBottom: 3 }}>{msg.user} • {msg.team}</div>
                                    <div style={{ marginBottom: 4 }}>{msg.text}</div>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <button style={btnSm} onClick={() => reactToMessage(msg.id, 'likes')}>👍 {msg.likes || 0}</button>
                                        <button style={btnSm} onClick={() => reactToMessage(msg.id, 'dislikes')}>👎 {msg.dislikes || 0}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                            <input
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && sendChat()}
                                placeholder={isGuest ? 'Guest spectators are view-only' : isSpectator ? 'Spectator comment...' : 'Your message...'}
                                disabled={isGuest}
                                style={{ flex: 1, border: '1px solid #cbd5e1', borderRadius: 10, padding: '10px 12px', outline: 'none', opacity: isGuest ? 0.7 : 1 }}
                            />
                            <button style={baseButton} onClick={sendChat} disabled={isGuest}>Send</button>
                        </div>
                    </div>

                    
                    {isHost && (
                        <div style={{ background: '#fff', border: '1px solid #dbe3ef', borderRadius: 12, padding: 12 }}>
                            <div style={{ fontWeight: 700, marginBottom: 10 }}>Moderator Controls</div>
                            <div style={{ display: 'grid', gap: 8 }}>
                                {teamSlots.map(({ team, username, activeUserId, teamLabel }) => {
                                    // Check if this specific team's menu is open
                                    const isMenuOpen = activeMenuTeam === team;

                                    return (
                                        <div key={`${team}-mod`} style={{ border: '1px solid #e2e8f0', borderRadius: 8, padding: 8 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                                <div style={{ fontWeight: 700, fontSize: 13 }}>{teamLabel} — @{username || 'empty'}</div>

                                                {/* Single Toggle Button */}
                                                <button
                                                    style={{ ...btnSm, background: isMenuOpen ? '#e2e8f0' : '#f8fafc' }}
                                                    onClick={() => setActiveMenuTeam(isMenuOpen ? null : team)}
                                                >
                                                    {isMenuOpen ? '✕ Close' : '⋮ Actions'}
                                                </button>
                                            </div>

                                            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 6 }}>
                                                Score: {teamSlots.find((slot) => slot.team === team)?.score || 0}
                                            </div>

                                            {/* Collapsible Popup Menu Container */}
                                            <div style={{ position: 'relative' }}>
                                                {isMenuOpen && (
                                                    <div
                                                        id="actionButtons"
                                                        style={{
                                                            position: 'absolute',
                                                            top: 0,
                                                            right: 0,
                                                            background: '#fff',
                                                            border: '1px solid #cbd5e1',
                                                            borderRadius: 8,
                                                            padding: 8,
                                                            display: 'flex',
                                                            gap: 6,
                                                            zIndex: 10,
                                                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                                                        }}
                                                    >
                                                        <button style={btnSm} onClick={() => { modMute(team); setActiveMenuTeam(null); }}>
                                                            {mutedTeams[team] ? 'Unmute' : 'Mute'}
                                                        </button>
                                                        <button style={btnSm} onClick={() => { modHide(team); setActiveMenuTeam(null); }}>
                                                            {hiddenTeams[team] ? 'Show' : 'Hide'}
                                                        </button>
                                                        <button
                                                            style={btnSm}
                                                            onClick={() => { modKick(activeUserId); setActiveMenuTeam(null); }}
                                                            disabled={!activeUserId}
                                                        >
                                                            Kick
                                                        </button>
                                                        <button
                                                            style={{ ...btnSm, background: '#fef2f2', color: '#dc2626' }}
                                                            onClick={() => { modBan(activeUserId); setActiveMenuTeam(null); }}
                                                            disabled={!activeUserId}
                                                        >
                                                            Ban
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
