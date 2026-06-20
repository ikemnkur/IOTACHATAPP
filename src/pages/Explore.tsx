import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, PlusCircle, Eye, Link2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ShowRoomDetailsModal from '../components/ShowRoomDetailsModal';
import {
  createDebateRoom,
  createDebateRoomOnServer,
  filterDebateRooms,
  syncDebateRoomsFromServer,
} from '../lib/debateRooms';
import type { DebateRoom } from '../lib/debateRooms';

const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TEAM_CODES = ['A', 'B', 'C', 'D', 'E'] as const;

function formatTimeLeft(expiresAt?: number | null, now = Date.now()) {
  if (!expiresAt) return 'No expiry set';
  const remaining = Math.max(0, expiresAt - now);
  const totalSeconds = Math.floor(remaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (remaining <= 0) return 'Expired';
  if (hours > 0) return `${hours}h ${minutes}m left`;
  if (minutes > 0) return `${minutes}m ${seconds}s left`;
  return `${seconds}s left`;
}

function getTeamLabel(index: number) {
  return TEAM_CODES[index] || 'A';
}

export default function Explore() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [minTeams, setMinTeams] = useState(0);
  const [maxJoinCredits, setMaxJoinCredits] = useState<number | ''>('');
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<DebateRoom | null>(null);
  const [roomVersion, setRoomVersion] = useState(0);
  const [now, setNow] = useState(Date.now());
  const [roomThumbnailFile, setRoomThumbnailFile] = useState<File | null>(null);
  const [teamThumbnailFiles, setTeamThumbnailFiles] = useState<Record<string, File | null>>({
    A: null,
    B: null,
    C: null,
    D: null,
    E: null,
  });

  const [roomForm, setRoomForm] = useState({
    topic: '',
    tags: '',
    passcode: '',
    expiresInMinutes: 60,
    teamsCount: 4,
    teamSizeLimit: 4,
    turnSeconds: 60,
    joinCredits: 0,
    teamAScore: 0,
    teamBScore: 0,
    teamCScore: 0,
    teamDScore: 0,
    teamEScore: 0,
    teamA: 'Team A',
    teamB: 'Team B',
    teamC: 'Team C',
    teamD: 'Team D',
    teamE: 'Team E',
    teamADescription: '',
    teamBDescription: '',
    teamCDescription: '',
    teamDDescription: '',
    teamEDescription: '',
  });

  useEffect(() => {
    let cancelled = false;

    const loadRooms = async () => {
      try {
        await syncDebateRoomsFromServer();
      } catch {
        // Local cache remains available when API is temporarily unavailable.
      } finally {
        if (!cancelled) setRoomVersion((v) => v + 1);
      }
    };

    loadRooms();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const availableRooms = useMemo(
    () =>
      filterDebateRooms({
        text: query,
        minTeams: minTeams || undefined,
        maxJoinCredits: maxJoinCredits === '' ? undefined : Number(maxJoinCredits),
      }),
    [query, minTeams, maxJoinCredits, roomVersion],
  );

  const roomCount = availableRooms.length;

  async function handleCreateDebateRoom(e: React.FormEvent) {
    e.preventDefault();
    if (!isAuthenticated || !user) {
      navigate('/login');
      return;
    }

    const roomId = window.crypto?.randomUUID?.() || `room-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const teamNames = [roomForm.teamA, roomForm.teamB, roomForm.teamC, roomForm.teamD, roomForm.teamE].slice(0, roomForm.teamsCount);
    const teamDescriptions = [
      roomForm.teamADescription,
      roomForm.teamBDescription,
      roomForm.teamCDescription,
      roomForm.teamDDescription,
      roomForm.teamEDescription,
    ].slice(0, roomForm.teamsCount);
    const teamScores = [
      roomForm.teamAScore,
      roomForm.teamBScore,
      roomForm.teamCScore,
      roomForm.teamDScore,
      roomForm.teamEScore,
    ].slice(0, roomForm.teamsCount);
    let created;
    const teamsData = teamNames.map((name, index) => {
      const teamCode = getTeamLabel(index);
      return {
        code: teamCode,
        name: name.trim(),
        description: teamDescriptions[index]?.trim() || '',
        // thumbnailUrl: teamThumbnailFiles[teamCode] ? URL.createObjectURL(teamThumbnailFiles[teamCode] as File) : null,
        thumbnailUrl: serverUrl + (teamThumbnailFiles[teamCode] ),
        score: Number(teamScores[index] || 0),
        order: index,
      };
    });
    try {
      created = await createDebateRoomOnServer({
        roomId,
        topic: roomForm.topic.trim(),
        passcode: roomForm.passcode.trim(),
        teamsCount: Number(roomForm.teamsCount),
        teamNames,
        teamSizeLimit: Number(roomForm.teamSizeLimit),
        turnSeconds: Number(roomForm.turnSeconds),
        joinCredits: Number(roomForm.joinCredits),
        durationMinutes: Number(roomForm.expiresInMinutes),
        expiresAt: new Date(Date.now() + Number(roomForm.expiresInMinutes) * 60 * 1000).toISOString(),
        tags: roomForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        roomThumbnail: roomThumbnailFile,
        teamThumbnails: teamThumbnailFiles,
        teamsData,
        createdBy: user.id,
        createdByName: user.username,
      });
    } catch {
      created = createDebateRoom({
        roomId,
        topic: roomForm.topic.trim(),
        passcode: roomForm.passcode.trim(),
        teamsCount: Number(roomForm.teamsCount),
        teamNames,
        teamSizeLimit: Number(roomForm.teamSizeLimit),
        turnSeconds: Number(roomForm.turnSeconds),
        joinCredits: Number(roomForm.joinCredits),
        durationMinutes: Number(roomForm.expiresInMinutes),
        expiresAt: new Date(Date.now() + Number(roomForm.expiresInMinutes) * 60 * 1000).toISOString(),
        tags: roomForm.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        roomThumbnail: roomThumbnailFile ? URL.createObjectURL(roomThumbnailFile) : null,
        teamsData,
        createdBy: user.id,
        createdByName: user.username,
      });
    }

    setShowCreateRoom(false);
    setRoomVersion((v) => v + 1);
    sessionStorage.setItem(`room_${created.id}_spectator`, '1');
    navigate(`/room/setup/${created.id}`);
  }

  function handleJoinRoom(roomId: string) {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    sessionStorage.removeItem(`room_${roomId}_spectator`);
    navigate(`/room/setup/${roomId}`);
  }

  function handleSpectateRoom(roomId: string) {
    navigate(`/room/spectate/${roomId}`);
  }

  function updateTeamThumbnail(code: string, file: File | null) {
    setTeamThumbnailFiles((prev) => ({ ...prev, [code]: file }));
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-brand/10 via-surface to-surface rounded-2xl p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-text mb-1">Explore Rooms</h1>
        <p className="text-sm text-text-muted mb-5">
          Create or join turn-based live debate rooms.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by room topic or room id"
              className="w-full bg-surface-2 border border-surface-3 rounded-xl pl-9 pr-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-brand"
            />
          </div>
          <select
            value={minTeams}
            onChange={(e) => setMinTeams(Number(e.target.value))}
            className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2.5 text-sm text-text"
          >
            <option value={0}>Any teams</option>
            <option value={2}>2 teams</option>
            <option value={3}>3 teams</option>
            <option value={4}>4 teams</option>
            <option value={5}>5 teams</option>
          </select>
          <input
            type="number"
            min={0}
            value={maxJoinCredits}
            onChange={(e) => setMaxJoinCredits(e.target.value === '' ? '' : Number(e.target.value))}
            placeholder="Max join credits"
            className="bg-surface-2 border border-surface-3 rounded-xl px-3 py-2.5 text-sm text-text placeholder:text-text-muted"
          />
        </div>

        <div className="mt-4">
          <button
            onClick={() => setShowCreateRoom((v) => !v)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold"
          >
            <PlusCircle className="w-4 h-4" />
            {showCreateRoom ? 'Close Create Room' : 'Create Room'}
          </button>
        </div>
      </div>

      {showCreateRoom && (
        <div className="bg-surface-2 rounded-2xl border border-surface-3 p-4">
          <form onSubmit={handleCreateDebateRoom} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="backdrop-blur-sm bg-white/30 rounded-2xl border border-surface-3 p-4 md:col-span-2 space-y-3">
            <div className="md:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Debate Topic</label>
              <input
                required
                value={roomForm.topic}
                onChange={(e) => setRoomForm((p) => ({ ...p, topic: e.target.value }))}
                placeholder="Should AI regulation be globally enforced?"
                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Room Thumbnail</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setRoomThumbnailFile(e.target.files?.[0] || null)}
                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Expires In (minutes)</label>
              <input
                type="number"
                min={5}
                required
                value={roomForm.expiresInMinutes}
                onChange={(e) => setRoomForm((p) => ({ ...p, expiresInMinutes: Number(e.target.value) }))}
                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Room passcode</label>
              <input
                required
                value={roomForm.passcode}
                onChange={(e) => setRoomForm((p) => ({ ...p, passcode: e.target.value }))}
                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Join credits</label>
              <input
                type="number"
                min={0}
                required
                value={roomForm.joinCredits}
                onChange={(e) => setRoomForm((p) => ({ ...p, joinCredits: Number(e.target.value) }))}
                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Duration</label>
              <select
                value={roomForm.turnSeconds}
                onChange={(e) => setRoomForm((p) => ({ ...p, turnSeconds: Number(e.target.value) }))}
                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text"
              >
                <option value={30}>30 minutes</option>
                <option value={60}>1 hour</option>
                <option value={120}>2 hours</option>
                <option value={240}>4 hours</option>
              </select>
            </div>
             <div>
              <label className="text-xs text-text-muted block mb-1">Seconds per turn</label>
              <input
                type="number"
                min={15}
                required
                value={roomForm.turnSeconds}
                onChange={(e) => setRoomForm((p) => ({ ...p, turnSeconds: Number(e.target.value) }))}
                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Teams</label>
              <select
                value={roomForm.teamsCount}
                onChange={(e) => setRoomForm((p) => ({ ...p, teamsCount: Number(e.target.value) }))}
                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text"
              >
                <option value={2}>2 teams</option>
                <option value={3}>3 teams</option>
                <option value={4}>4 teams</option>
                <option value={5}>5 teams</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-text-muted block mb-1">Team size limit</label>
              <input
                type="number"
                min={1}
                required
                value={roomForm.teamSizeLimit}
                onChange={(e) => setRoomForm((p) => ({ ...p, teamSizeLimit: Number(e.target.value) }))}
                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text"
              />
            </div>
            </div>
           
            <div className="bg-surface-2 rounded-2xl border border-surface-3 p-3  space-y-3">
              <label className="text-xs text-text-muted block mb-1">Team A name</label>
              <input value={roomForm.teamA} onChange={(e) => setRoomForm((p) => ({ ...p, teamA: e.target.value }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
              <label className="text-xs text-text-muted block mb-1">Description</label>
              <input value={roomForm.teamADescription} onChange={(e) => setRoomForm((p) => ({ ...p, teamADescription: e.target.value }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
              {/* <label className="text-xs text-text-muted block mb-1">Score</label>
              <input type="number" min={0} value={roomForm.teamAScore} onChange={(e) => setRoomForm((p) => ({ ...p, teamAScore: Number(e.target.value) }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" /> */}
              <label className="text-xs text-text-muted block mb-1">Thumbnail Image</label>
              <input type="file" accept="image/*" onChange={(e) => updateTeamThumbnail('A', e.target.files?.[0] || null)} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
            </div>
            <div className="bg-surface-2 rounded-2xl border border-surface-3 p-3  space-y-3">
              <label className="text-xs text-text-muted block mb-1">Team B name</label>
              <input value={roomForm.teamB} onChange={(e) => setRoomForm((p) => ({ ...p, teamB: e.target.value }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
              <label className="text-xs text-text-muted block mb-1">Description</label>
              <input value={roomForm.teamBDescription} onChange={(e) => setRoomForm((p) => ({ ...p, teamBDescription: e.target.value }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
              {/* <label className="text-xs text-text-muted block mb-1">Score</label>
              <input type="number" min={0} value={roomForm.teamBScore} onChange={(e) => setRoomForm((p) => ({ ...p, teamBScore: Number(e.target.value) }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" /> */}
              <label className="text-xs text-text-muted block mb-1">Thumbnail Image</label>
              <input type="file" accept="image/*" onChange={(e) => updateTeamThumbnail('B', e.target.files?.[0] || null)} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
            </div>
            {roomForm.teamsCount >= 3 && (
              <div className="bg-surface-2 rounded-2xl border border-surface-3 p-3  space-y-3">
                <label className="text-xs text-text-muted block mb-1">Team C name</label>
                <input value={roomForm.teamC} onChange={(e) => setRoomForm((p) => ({ ...p, teamC: e.target.value }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
                <label className="text-xs text-text-muted block mb-1">Description</label>
                <input value={roomForm.teamCDescription} onChange={(e) => setRoomForm((p) => ({ ...p, teamCDescription: e.target.value }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
                {/* <label className="text-xs text-text-muted block mb-1">Score</label>
                <input type="number" min={0} value={roomForm.teamCScore} onChange={(e) => setRoomForm((p) => ({ ...p, teamCScore: Number(e.target.value) }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" /> */}
                <label className="text-xs text-text-muted block mb-1">Thumbnail Image</label>
                <input type="file" accept="image/*" onChange={(e) => updateTeamThumbnail('C', e.target.files?.[0] || null)} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
              </div>
            )}
            {roomForm.teamsCount >= 4 && (
              <div className="bg-surface-2 rounded-2xl border border-surface-3 p-3  space-y-3">
                <label className="text-xs text-text-muted block mb-1">Team D name</label>
                <input value={roomForm.teamD} onChange={(e) => setRoomForm((p) => ({ ...p, teamD: e.target.value }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
                <label className="text-xs text-text-muted block mb-1">Description</label>
                <input value={roomForm.teamDDescription} onChange={(e) => setRoomForm((p) => ({ ...p, teamDDescription: e.target.value }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
                {/* <label className="text-xs text-text-muted block mb-1">Score</label>
                <input type="number" min={0} value={roomForm.teamDScore} onChange={(e) => setRoomForm((p) => ({ ...p, teamDScore: Number(e.target.value) }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" /> */}
                <label className="text-xs text-text-muted block mb-1">Thumbnail Image</label>
                <input type="file" accept="image/*" onChange={(e) => updateTeamThumbnail('D', e.target.files?.[0] || null)} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
              </div>
            )}
            {roomForm.teamsCount >= 5 && (
              <div className="bg-surface-2 rounded-2xl border border-surface-3 p-3  space-y-3">
                <label className="text-xs text-text-muted block mb-1">Team E name</label>
                <input value={roomForm.teamE} onChange={(e) => setRoomForm((p) => ({ ...p, teamE: e.target.value }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
                <label className="text-xs text-text-muted block mb-1">Description</label>
                <input value={roomForm.teamEDescription} onChange={(e) => setRoomForm((p) => ({ ...p, teamEDescription: e.target.value }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
                {/* <label className="text-xs text-text-muted block mb-1">Score</label>
                <input type="number" min={0} value={roomForm.teamEScore} onChange={(e) => setRoomForm((p) => ({ ...p, teamEScore: Number(e.target.value) }))} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" /> */}
                <label className="text-xs text-text-muted block mb-1">Thumbnail Image</label>
                <input type="file" accept="image/*" onChange={(e) => updateTeamThumbnail('E', e.target.files?.[0] || null)} className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text" />
              </div>
            )}
             <div className="md:col-span-2">
              <label className="text-xs text-text-muted block mb-1">Search Tags (#)</label> 
              <input
                required
                value={roomForm.tags}
                onChange={(e) => setRoomForm((p) => ({ ...p, tags: e.target.value }))}
                placeholder="Enter search term tags... (separate by comma)"
                className="w-full bg-surface border border-surface-3 rounded-xl px-3 py-2 text-sm text-text"
              />
            </div>
            <div className="md:col-span-2 flex justify-end">
              <button type="submit" className="h-10 px-4 rounded-xl bg-brand text-white text-sm font-semibold">
                Create + Join as Host
              </button>
            </div>
          </form>
        </div>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Users className="w-5 h-5 text-brand" />
            Available Rooms ({roomCount})
          </h2>
        </div>

        {availableRooms.length === 0 ? (
          <div className="bg-surface-2 rounded-2xl p-5 text-sm text-text-muted border border-surface-3">
            No rooms available yet. Create the first room and share its link.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {availableRooms.map((room) => (
              <div
                key={room.id}
                className="bg-surface-2 rounded-2xl border border-surface-3 p-4 cursor-pointer hover:border-brand/50 transition-colors"
                onClick={() => setSelectedRoom(room)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setSelectedRoom(room);
                  }
                }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface border border-surface-3 flex-shrink-0">
                      {room.roomThumbnail ? (
                        <img src={serverUrl + room.roomThumbnail } alt="Room thumbnail" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-text-muted text-[11px]">Room</div>
                      )}
                    </div>
                    <div>
                      <div className="text-text font-semibold text-sm">{room.topic}</div>
                      <div className="text-[11px] text-text-muted mt-1">Host: {room.createdByName}</div>
                    </div>
                    <div className="text-[11px] text-text-muted mt-1 flex flex-wrap gap-1">
                      {room.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-surface border border-surface-3">#{tag}</span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-text-muted">
                    <div>{room.teamsCount} teams</div>
                    <div>{room.turnSeconds}s turns</div>
                    <div>{room.joinCredits} credits</div>
                    <div className={room.expired ? 'text-red-500 font-semibold' : 'text-text'}>
                      {room.expired ? 'Expired' : `Time left: ${formatTimeLeft(room.expiresAt, now)}`}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleJoinRoom(room.id);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Users className="w-3.5 h-3.5" /> Join
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSpectateRoom(room.id);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-surface-3 text-text text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" /> Spectate
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigator.clipboard.writeText(`${window.location.origin}/room/${room.id}`);
                    }}
                    className="px-3 py-1.5 rounded-lg border border-surface-3 text-text-muted text-xs font-semibold inline-flex items-center gap-1"
                  >
                    <Link2 className="w-3.5 h-3.5" /> Copy Link
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <ShowRoomDetailsModal
        room={selectedRoom}
        now={now}
        onClose={() => setSelectedRoom(null)}
        onJoin={(roomId) => {
          setSelectedRoom(null);
          handleJoinRoom(roomId);
        }}
        onSpectate={(roomId) => {
          setSelectedRoom(null);
          handleSpectateRoom(roomId);
        }}
        onCopyLink={(roomId) => navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)}
      />
    </div>


    
  );
}
