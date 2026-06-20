import { api } from './api';

export type TeamCode = 'A' | 'B' | 'C' | 'D' | 'E';

export interface TeamData {
  code: TeamCode;
  name: string;
  description: string;
  thumbnailUrl: string | null;
  score: number;
  order?: number;
}

export interface DebateParticipant {
  userId: string;
  username: string;
  team: TeamCode | 'SPEC';
  isHost: boolean;
  isSpectator: boolean;
  isGuest: boolean;
  joinedAt: number;
}

export interface DebateRoom {
  id: string;
  topic: string;
  passcode: string;
  teamsCount: number;
  teamNames: string[];
  teamSizeLimit: number;
  turnSeconds: number;
  joinCredits: number;
  createdAt: number;
  createdBy: string;
  createdByName: string;
  expiresAt: number;
  timeLeftMs?: number | null;
  roomThumbnail: string | null;
  expired: boolean;
  tags: string[];
  durationMinutes: number;
  teamsData: TeamData[];
  participants: DebateParticipant[];
}

interface RoomApiPayload {
  id?: string;
  name?: string;
  topic?: string;
  passcode?: string;
  join_fee?: number;
  joinCredits?: number;
  team_limit?: number;
  teamSizeLimit?: number;
  user_stream_time_in_mins?: string;
  turnSeconds?: number;
  created_at?: string;
  createdAt?: number;
  expired?: boolean;
  expires_at?: string;
  expiresAt?: string | number;
  roomThumbnail?: string | null;
  tags?: string[] | string | null;
  duration_in_mins?: string | number;
  created_by?: string;
  createdBy?: string;
  created_by_name?: string;
  createdByName?: string;
  teamsCount?: number;
  teamNames?: string[];
  teamsData?: Array<{
    code?: string;
    teamCode?: string;
    name?: string;
    teamName?: string;
    description?: string;
    teamDescription?: string;
    team_description?: string;
    thumbnailUrl?: string | null;
    thumbnail?: string | null;
    score?: number;
    order?: number;
  }>;
  teams?: Array<{
    code?: string;
    team_code?: string;
    teamCode?: string;
    teamName?: string;
    name?: string;
    description?: string;
    team_description?: string;
    teamDescription?: string;
    thumbnailUrl?: string | null;
    thumbnail?: string | null;
    score?: number;
    order?: number;
  }>;
}

function getTeamCode(index: number): TeamCode {
  return ['A', 'B', 'C', 'D', 'E'][index] as TeamCode;
}

function parseTags(tags?: string[] | string | null): string[] {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag || '').trim()).filter(Boolean);
  }

  if (typeof tags === 'string') {
    return tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

function parseTeams(payload: RoomApiPayload, fallbackCount: number): TeamData[] {
  const rawTeams = Array.isArray(payload.teamsData) && payload.teamsData.length > 0 ? payload.teamsData : payload.teams || [];

  const normalized = rawTeams.map((team, index) => {
    const safeTeam = team as {
      code?: string;
      teamCode?: string;
      name?: string;
      teamName?: string;
      description?: string;
      teamDescription?: string;
      team_description?: string;
      thumbnailUrl?: string | null;
      thumbnail?: string | null;
      score?: number;
      points?: number;
      order?: number;
    };

    const code = String(safeTeam.code || safeTeam.teamCode || getTeamCode(index) || 'A').toUpperCase() as TeamCode;

    return {
      code,
      name: String(safeTeam.name || safeTeam.teamName || `Team ${getTeamCode(index) || 'A'}`),
      description: String(safeTeam.description || safeTeam.teamDescription || safeTeam.team_description || ''),
      thumbnailUrl: safeTeam.thumbnailUrl || safeTeam.thumbnail || null,
      score: Number(safeTeam.score ?? safeTeam.points ?? 0),
      order: Number.isFinite(Number(safeTeam.order)) ? Number(safeTeam.order) : index,
    };
  });

  if (normalized.length > 0) {
    return normalized.slice(0, 5);
  }

  return Array.from({ length: Math.max(1, Math.min(5, fallbackCount)) }, (_, index) => ({
    code: getTeamCode(index),
    name: `Team ${getTeamCode(index)}`,
    description: '',
    thumbnailUrl: null,
    score: 0,
    order: index,
  }));
}

const STORAGE_KEY = 'iota_debate_rooms_v1';

function readRooms(): DebateRoom[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRooms(rooms: DebateRoom[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

function slug(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function toTimestamp(value: string | number | undefined): number {
  if (typeof value === 'number') return value;
  if (!value) return Date.now();
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function normalizeRoom(payload: RoomApiPayload): DebateRoom {
  const teamsData = parseTeams(payload, payload.teamsCount || 4);
  const teamNames = teamsData.map((team) => team.name);
  const teamsCount = Math.max(1, Math.min(5, payload.teamsCount || teamsData.length || 4));
  const createdAt = toTimestamp(payload.createdAt || payload.created_at);
  const expiresAt = toTimestamp(payload.expiresAt || payload.expires_at || createdAt + 60 * 60 * 1000);

  return {
    id: String(payload.id || ''),
    topic: String(payload.topic || payload.name || 'Untitled Debate Room'),
    passcode: String(payload.passcode || ''),
    teamsCount,
    teamNames: teamNames.length ? teamNames : ['Team A', 'Team B', 'Team C', 'Team D', 'Team E'].slice(0, teamsCount),
    teamSizeLimit: Math.max(1, Number(payload.teamSizeLimit || payload.team_limit || 8)),
    turnSeconds: Math.max(15, Number(payload.turnSeconds || payload.user_stream_time_in_mins || 60)),
    joinCredits: Math.max(0, Number(payload.joinCredits || payload.join_fee || 0)),
    createdAt,
    createdBy: String(payload.createdBy || payload.created_by || ''),
    createdByName: String(payload.createdByName || payload.created_by_name || 'Host'),
    expiresAt,
    timeLeftMs: Math.max(0, expiresAt - Date.now()),
    expired: expiresAt <= Date.now(),
    roomThumbnail: payload.roomThumbnail || null,
    tags: parseTags(payload.tags),
    durationMinutes: Math.max(1, Number(payload.duration_in_mins || Math.round((expiresAt - createdAt) / 60000) || 60)),
    teamsData: teamsData.slice(0, 5),
    participants: [],
  };
}

function mergeRooms(existing: DebateRoom[], incoming: DebateRoom[]): DebateRoom[] {
  const map = new Map(existing.map((room) => [room.id, room]));
  incoming.forEach((room) => {
    const current = map.get(room.id);
    map.set(room.id, {
      ...room,
      participants: current?.participants || room.participants || [],
    });
  });
  return Array.from(map.values()).sort((a, b) => b.createdAt - a.createdAt);
}

export function listDebateRooms(): DebateRoom[] {
  return readRooms().sort((a, b) => b.createdAt - a.createdAt);
}

export async function syncDebateRoomsFromServer(): Promise<DebateRoom[]> {
  const response = await api.get<{ rooms: RoomApiPayload[] }>('/api/rooms');
  const incoming = (response.rooms || []).map(normalizeRoom).filter((room) => room.id);
  const merged = mergeRooms(readRooms(), incoming);
  writeRooms(merged);

  console.log('Rooms: ', merged);
  return merged;
}

export function getDebateRoomById(id: string): DebateRoom | null {
  const room = readRooms().find((r) => r.id === id);
  return room || null;
}

export async function getDebateRoomByIdFromServer(id: string): Promise<DebateRoom | null> {
  const response = await api.get<{ room: RoomApiPayload }>(`/api/rooms/${id}`);
  if (!response.room) return null;
  const normalized = normalizeRoom(response.room);
  upsertDebateRoom(normalized);
  return normalized;
}

export async function createDebateRoomOnServer(input: {
  topic: string;
  passcode: string;
  teamsCount: number;
  teamNames: string[];
  teamSizeLimit: number;
  turnSeconds: number;
  joinCredits: number;
  durationMinutes: number;
  expiresAt?: string;
  roomId?: string;
  tags?: string[];
  roomThumbnail?: File | null;
  teamThumbnails?: Partial<Record<TeamCode, File | null>>;
  teamsData?: TeamData[];
  createdBy: string;
  createdByName: string;
}): Promise<DebateRoom> {
  const teamsData = (input.teamsData?.length ? input.teamsData : input.teamNames.slice(0, 5).map((name, index) => ({
    code: getTeamCode(index),
    name,
    description: '',
    thumbnailUrl: null,
    score: 0,
    order: index,
  }))).slice(0, 5);
  const tags = input.tags || [];

  const hasFiles = Boolean(input.roomThumbnail || Object.values(input.teamThumbnails || {}).some(Boolean));

  const payload = {
    roomId: input.roomId,
    topic: input.topic,
    passcode: input.passcode,
    teamsCount: input.teamsCount,
    teamNames: input.teamNames,
    teamSizeLimit: input.teamSizeLimit,
    turnSeconds: input.turnSeconds,
    joinCredits: input.joinCredits,
    durationMinutes: input.durationMinutes,
    expiresAt: input.expiresAt,
    tags: tags.join(', '),
    teamsData,
  };

  const response = hasFiles
    ? await (async () => {
        const formData = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          if (value == null) return;
          if (Array.isArray(value) || typeof value === 'object') {
            formData.append(key, JSON.stringify(value));
            return;
          }
          formData.append(key, String(value));
        });

        if (input.roomThumbnail) {
          formData.append('roomThumbnail', input.roomThumbnail);
        }

        Object.entries(input.teamThumbnails || {}).forEach(([code, file]) => {
          if (file) {
            formData.append(`teamThumbnail_${code}`, file);
          }
        });

        return api.upload<{ room: RoomApiPayload }>('/api/rooms', formData);
      })()
    : await api.post<{ room: RoomApiPayload }>('/api/rooms', payload);

  const normalized = normalizeRoom(response.room || {});
  if (!normalized.id) {
    throw new Error('Server did not return a valid room id');
  }

  const room: DebateRoom = {
    ...normalized,
    createdBy: normalized.createdBy || input.createdBy,
    createdByName: normalized.createdByName || input.createdByName,
  };

  upsertDebateRoom(room);
  return room;
}

export function createDebateRoom(input: {
  topic: string;
  passcode: string;
  teamsCount: number;
  teamNames: string[];
  teamSizeLimit: number;
  turnSeconds: number;
  joinCredits: number;
  durationMinutes: number;
  expiresAt?: string;
  roomId?: string;
  tags?: string[];
  roomThumbnail?: string | null;
  teamsData?: TeamData[];
  createdBy: string;
  createdByName: string;
}): DebateRoom {
  const rooms = readRooms();
  const now = Date.now();
  const id = input.roomId || `${slug(input.topic).slice(0, 28) || 'debate'}-${now.toString(36).slice(-6)}`;
  const expiresAt = input.expiresAt ? toTimestamp(input.expiresAt) : now + Math.max(1, input.durationMinutes) * 60 * 1000;
  const teamsData = (input.teamsData?.length ? input.teamsData : input.teamNames.slice(0, 5).map((name, index) => ({
    code: getTeamCode(index),
    name,
    description: '',
    thumbnailUrl: null,
    score: 0,
    order: index,
  }))).slice(0, 5);

  const room: DebateRoom = {
    id,
    topic: input.topic,
    passcode: input.passcode,
    teamsCount: Math.max(1, Math.min(5, input.teamsCount)),
    teamNames: input.teamNames.slice(0, 5),
    teamSizeLimit: Math.max(1, input.teamSizeLimit),
    turnSeconds: Math.max(15, input.turnSeconds),
    joinCredits: Math.max(0, input.joinCredits),
    createdAt: now,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    expiresAt,
    roomThumbnail: input.roomThumbnail || null,
    tags: input.tags || [],
    durationMinutes: Math.max(1, input.durationMinutes),
    expired: expiresAt <= Date.now(),
    teamsData,
    participants: [
      {
        userId: input.createdBy,
        username: input.createdByName,
        team: 'SPEC',
        isHost: true,
        isSpectator: true,
        isGuest: false,
        joinedAt: now,
      },
    ],
  };

  writeRooms([room, ...rooms]);
  return room;
}

export function upsertDebateRoom(room: DebateRoom): DebateRoom {
  const rooms = readRooms();
  const idx = rooms.findIndex((r) => r.id === room.id);
  if (idx < 0) {
    writeRooms([room, ...rooms]);
    return room;
  }

  const existing = rooms[idx];
  rooms[idx] = {
    ...room,
    participants: existing?.participants || room.participants || [],
  };
  writeRooms(rooms);
  return rooms[idx];
}

export function upsertRoomParticipant(roomId: string, participant: DebateParticipant): DebateRoom | null {
  const rooms = readRooms();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx < 0) return null;

  const room = rooms[idx];
  const nextParticipants = room.participants.filter((p) => p.userId !== participant.userId);
  nextParticipants.push(participant);

  const updated: DebateRoom = { ...room, participants: nextParticipants };
  rooms[idx] = updated;
  writeRooms(rooms);
  return updated;
}

export function removeRoomParticipant(roomId: string, userId: string): DebateRoom | null {
  const rooms = readRooms();
  const idx = rooms.findIndex((r) => r.id === roomId);
  if (idx < 0) return null;

  const room = rooms[idx];
  const updated: DebateRoom = {
    ...room,
    participants: room.participants.filter((p) => p.userId !== userId),
  };
  rooms[idx] = updated;
  writeRooms(rooms);
  return updated;
}

export function filterDebateRooms(params: {
  text?: string;
  minTeams?: number;
  maxJoinCredits?: number;
}): DebateRoom[] {
  const text = (params.text || '').trim().toLowerCase();
  return listDebateRooms().filter((room) => {
    const textOk = !text || room.topic.toLowerCase().includes(text) || room.id.toLowerCase().includes(text) || room.tags.some((tag) => tag.toLowerCase().includes(text));
    const minTeamsOk = !params.minTeams || room.teamsCount >= params.minTeams;
    const joinCreditsOk = params.maxJoinCredits == null || room.joinCredits <= params.maxJoinCredits;
    return textOk && minTeamsOk && joinCreditsOk;
  });
}
