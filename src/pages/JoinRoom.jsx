import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDebateRoomById, getDebateRoomByIdFromServer } from "../lib/debateRooms";

const serverUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const TEAM_COLORS = {
  A: "#0b6ef3",
  B: "#15a86b",
  C: "#f59e0b",
  D: "#d94848",
  E: "#7c3aed",
};

const TEAM_DESCRIPTIONS = {
  A: "Debate from the supporting side. Defend the motion.",
  B: "Take the opposing position. Challenge every claim.",
  C: "Neutral analysts. Present evidence and data.",
  D: "Wildcards. Disrupt, provoke, and question assumptions.",
  E: "Open format. Bring a fifth perspective into the debate.",
};

export default function RoomJoin() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [room, setRoom] = useState(() => (id ? getDebateRoomById(id) : null));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const loadRoom = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      try {
        const remote = await getDebateRoomByIdFromServer(id);
        if (!cancelled && remote) setRoom(remote);
      } catch {
        if (!cancelled) {
          const local = getDebateRoomById(id);
          if (local) setRoom(local);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadRoom();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const teamOptions = useMemo(() => {
    const fallback = ["A", "B", "C", "D", "E"];
    const count = Math.max(1, Math.min(5, room?.teamsCount || 4));
    const teams = (room?.teamsData || []).slice(0, count);
    const names = (room?.teamNames || []).slice(0, count);

    return fallback.slice(0, count).map((teamCode, index) => {
      const team = teams[index];
      const name = team?.name || names[index] || `Team ${teamCode}`;
      return {
        code: teamCode,
        label: name,
        description: team?.description || `${name} presenters will take timed turns in this room.`,
        thumbnailUrl: team?.thumbnailUrl || null,
        score: team?.score || 0,
      };
    });
  }, [room]);

  const handlePickTeam = (team) => {
    sessionStorage.setItem(`room_${id}_team`, team);
    sessionStorage.removeItem(`room_${id}_spectator`);
    navigate(`/room/${id}`);
  };

  const handleSpectate = () => {
    sessionStorage.setItem(`room_${id}_spectator`, "1");
    sessionStorage.removeItem(`room_${id}_team`);
    navigate(`/room/${id}?mode=spectator`);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "grid",
        placeItems: "center",
        padding: 20,
      }}
    >
      <div style={{ width: "min(620px, 96vw)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ fontSize: 26, fontWeight: 900, color: "#0f172a" }}>Join the Debate</div>
          <div style={{ color: "#64748b", marginTop: 6 }}>
            Room #{id} — {loading ? "Loading teams..." : "Choose your team to continue"}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
          {console.log("teamOptions", teamOptions)}
          
          {teamOptions.map((team) => (

            <button
              key={team.code}
              onClick={() => handlePickTeam(team.code)}
              style={{
                border: `2px solid ${TEAM_COLORS[team.code]}`,
                borderRadius: 14,
                padding: "18px 16px",
                background: "#fff",
                cursor: "pointer",
                textAlign: "left",
                transition: "box-shadow 0.15s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = `0 4px 16px ${TEAM_COLORS[team.code]}55`)}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "none")}
            >
              {team.thumbnailUrl ? (
                <img
                  src={serverUrl + team.thumbnailUrl}
                  alt={`${team.label} thumbnail`}
                  style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, marginBottom: 10 }}
                />
              ) : null}
              <div
                style={{
                  display: "inline-block",
                  background: TEAM_COLORS[team.code],
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: 15,
                  padding: "4px 12px",
                  borderRadius: 8,
                  marginBottom: 8,
                }}
              >
                {team.label}
              </div>
              <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>
                { team.description}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#64748b', fontWeight: 700 }}>
                Score: {team.score}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button
            onClick={handleSpectate}
            style={{
              background: "transparent",
              border: "1px solid #94a3b8",
              borderRadius: 10,
              padding: "10px 24px",
              cursor: "pointer",
              color: "#475569",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Continue as Spectator (watch only)
          </button>
        </div>
      </div>
    </div>
  );
}
