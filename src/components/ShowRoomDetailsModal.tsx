import { X, Users, Eye, Link2 } from 'lucide-react';
import type { DebateRoom } from '../lib/debateRooms';

interface Props {
  room: DebateRoom | null;
  now: number;
  onClose: () => void;
  onJoin: (roomId: string) => void;
  onSpectate: (roomId: string) => void;
  onCopyLink: (roomId: string) => void;
}

const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

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

export default function ShowRoomDetailsModal({ room, now, onClose, onJoin, onSpectate, onCopyLink }: Props) {
  if (!room) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Room details"
    >
      <div
        className="w-full max-w-2xl rounded-2xl border border-surface-3 bg-surface-2 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="truncate text-xl font-bold text-text">{room.topic}</h3>
            <p className="mt-1 text-xs text-text-muted">Room ID: {room.id}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg border border-surface-3 p-2 text-text-muted hover:text-text"
            aria-label="Close room details"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-[180px_1fr]">
          <div className="overflow-hidden rounded-xl border border-surface-3 bg-surface">
            {serverUrl + room.roomThumbnail ? (
              <img src={serverUrl + room.roomThumbnail} alt="Room thumbnail" className="h-40 w-full object-cover" />
            ) : (
              <div className="grid h-40 w-full place-items-center text-xs text-text-muted">No thumbnail</div>
            )}
          </div>

          <div className="space-y-2 text-sm text-text-muted">
            <div>Host: <span className="font-semibold text-text">{room.createdByName || 'Host'}</span></div>
            <div>Teams: <span className="font-semibold text-text">{room.teamsCount}</span></div>
            <div>Turn time: <span className="font-semibold text-text">{room.turnSeconds}s</span></div>
            <div>Join credits: <span className="font-semibold text-text">{room.joinCredits}</span></div>
            <div className={room.expired ? 'text-red-500 font-semibold' : 'text-text'}>
              {room.expired ? 'Expired' : `Time left: ${formatTimeLeft(room.expiresAt, now)}`}
            </div>
            <div className="pt-1">
              <div className="mb-1 text-xs uppercase tracking-wide text-text-muted">Tags</div>
              <div className="flex flex-wrap gap-1">
                {room.tags.length ? room.tags.map((tag) => (
                  <span key={tag} className="rounded-full border border-surface-3 bg-surface px-2 py-0.5 text-xs text-text-muted">#{tag}</span>
                )) : <span className="text-xs text-text-muted">No tags</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-xs uppercase tracking-wide text-text-muted">Teams & scores</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {room.teamsData.map((team) => (
              <div key={team.code} className="flex items-center justify-between rounded-lg border border-surface-3 bg-surface px-3 py-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-text">{team.name}</div>
                  <div className="truncate text-xs text-text-muted">{team.description || 'No description'}</div>
                </div>
                <div className="ml-2 text-sm font-bold text-text">{team.score}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button onClick={() => onCopyLink(room.id)} className="inline-flex items-center gap-1 rounded-lg border border-surface-3 px-3 py-2 text-xs font-semibold text-text-muted">
            <Link2 className="h-3.5 w-3.5" /> Copy Link
          </button>
          <button onClick={() => onSpectate(room.id)} className="inline-flex items-center gap-1 rounded-lg border border-surface-3 px-3 py-2 text-xs font-semibold text-text">
            <Eye className="h-3.5 w-3.5" /> Spectate
          </button>
          <button onClick={() => onJoin(room.id)} className="inline-flex items-center gap-1 rounded-lg bg-brand px-3 py-2 text-xs font-semibold text-white">
            <Users className="h-3.5 w-3.5" /> Join
          </button>
        </div>
      </div>
    </div>
  );
}
