import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

export default function SpectateRoomEntry() {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (!id) return;
    sessionStorage.setItem(`room_${id}_spectator`, '1');
    sessionStorage.removeItem(`room_${id}_team`);
    navigate(`/room/${id}?mode=spectator`, { replace: true });
  }, [id, navigate]);

  return null;
}
