import React, { useState } from 'react';
import { Lock, Plus, RefreshCw, Users, X } from 'lucide-react';
import { MAP_LIST } from '../game/maps';
import {
  GameModeId,
  MapId,
  PlayerProfile,
  RoomState,
  RoomSummary,
} from '../game/types';

interface MultiplayerModalProps {
  profile: PlayerProfile;
  connected: boolean;
  rooms: RoomSummary[];
  currentRoom: RoomState | null;
  localNetId: string | null;
  errorMsg: string | null;
  onRefreshRooms: () => void;
  onCreateRoom: (opts: {
    roomName: string;
    mapId: MapId;
    mode: GameModeId;
    maxPlayers: number;
    password: string;
  }) => void;
  onJoinRoom: (roomId: string, password: string) => void;
  onLeaveRoom: () => void;
  onToggleReady: () => void;
  onSwitchTeam: () => void;
  onStartMatch: () => void;
  onClose: () => void;
}

export const MultiplayerModal: React.FC<MultiplayerModalProps> = ({
  connected,
  rooms,
  currentRoom,
  localNetId,
  errorMsg,
  onRefreshRooms,
  onCreateRoom,
  onJoinRoom,
  onLeaveRoom,
  onToggleReady,
  onSwitchTeam,
  onStartMatch,
  onClose,
}) => {
  const [tab, setTab] = useState<'browse' | 'host'>('browse');
  const [roomName, setRoomName] = useState('Alpha Operations');
  const [mapId, setMapId] = useState<MapId>('forest');
  const [mode, setMode] = useState<GameModeId>('deathmatch');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [password, setPassword] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const isHost = currentRoom && currentRoom.hostId === localNetId;
  const meInLobby = currentRoom?.players.find((p) => p.id === localNetId);

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/78 p-2.5 sm:p-4">
      <div className="w-full max-w-2xl max-h-[94%] overflow-y-auto bg-[#161B22] border border-slate-700 rounded-lg p-3.5 sm:p-6 space-y-4 sm:space-y-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-3 sm:pb-4">
          <div>
            <h2 className="font-display text-xl sm:text-3xl font-bold text-white tracking-wide">
              Multiplayer Lobby
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {connected
                ? 'Connected to live authoritative WebSocket room server.'
                : 'Connecting to multiplayer room server...'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Multiplayer"
            className="h-9 w-9 flex items-center justify-center rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="bg-red-950/60 border border-red-500/70 rounded-md px-3.5 py-2 text-xs text-red-200">
            {errorMsg}
          </div>
        )}

        {currentRoom ? (
          /* Inside a Room Lobby */
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0E1319] border border-slate-800 rounded-md p-4">
              <div>
                <div className="text-xs text-slate-400">
                  Room Code:{' '}
                  <span className="font-mono-hud text-amber-400 font-bold">
                    {currentRoom.id}
                  </span>
                </div>
                <div className="text-lg font-bold text-white">{currentRoom.name}</div>
                <div className="text-xs text-slate-400">
                  {MAP_LIST.find((m) => m.id === currentRoom.mapId)?.name} ·{' '}
                  {currentRoom.mode.toUpperCase()} · {currentRoom.players.length}/
                  {currentRoom.maxPlayers} Players
                </div>
              </div>

              <div className="flex items-center gap-2">
                {currentRoom.mode === 'tdm' && (
                  <button
                    type="button"
                    onClick={onSwitchTeam}
                    className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-white"
                  >
                    Switch Team
                  </button>
                )}
                <button
                  type="button"
                  onClick={onLeaveRoom}
                  className="px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs font-semibold text-slate-300"
                >
                  Leave Room
                </button>
              </div>
            </div>

            {/* Player Roster */}
            <div className="border border-slate-800 rounded-md divide-y divide-slate-800">
              {currentRoom.players.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-white">{p.name}</span>
                    {p.isHost && (
                      <span className="text-[11px] font-mono-hud text-amber-400">
                        HOST
                      </span>
                    )}
                    {currentRoom.mode === 'tdm' && (
                      <span
                        className={`text-xs font-semibold ${
                          p.team === 'alpha' ? 'text-sky-400' : 'text-red-400'
                        }`}
                      >
                        {p.team === 'alpha' ? 'Alpha' : 'Bravo'}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-xs font-mono-hud ${
                      p.ready ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {p.ready ? 'READY' : 'WAITING'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3">
              {!isHost && (
                <button
                  type="button"
                  onClick={onToggleReady}
                  className={`px-5 py-2.5 rounded-md text-sm font-semibold border transition-colors ${
                    meInLobby?.ready
                      ? 'bg-emerald-700 border-emerald-500 text-white'
                      : 'bg-slate-800 border-slate-600 text-slate-200 hover:bg-slate-700'
                  }`}
                >
                  {meInLobby?.ready ? 'Ready Checked' : 'Mark Ready'}
                </button>
              )}

              {isHost && (
                <button
                  type="button"
                  onClick={onStartMatch}
                  className="px-6 py-2.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
                >
                  Start Match
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Room Browser & Host Form */
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1 p-1 bg-[#0E1319] rounded-md border border-slate-800">
                <button
                  type="button"
                  onClick={() => setTab('browse')}
                  className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors ${
                    tab === 'browse'
                      ? 'bg-slate-700 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Join Room
                </button>
                <button
                  type="button"
                  onClick={() => setTab('host')}
                  className={`px-4 py-1.5 rounded text-xs font-semibold transition-colors ${
                    tab === 'host'
                      ? 'bg-red-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Host Room
                </button>
              </div>

              {tab === 'browse' && (
                <button
                  type="button"
                  onClick={onRefreshRooms}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs text-slate-200"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              )}
            </div>

            {tab === 'browse' ? (
              <div className="space-y-4">
                {/* Direct Room Code Join */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (joinCode.trim()) {
                      onJoinRoom(joinCode.trim().toUpperCase(), joinPassword);
                    }
                  }}
                  className="grid sm:grid-cols-[1fr_1fr_auto] gap-2 bg-[#0E1319] p-3 rounded-md border border-slate-800"
                >
                  <input
                    type="text"
                    placeholder="Room Code (e.g. A7K2B)"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="bg-[#161B22] border border-slate-700 rounded px-3 py-2 text-xs text-white font-mono-hud focus:outline-none focus:border-red-500"
                  />
                  <input
                    type="password"
                    placeholder="Password (if required)"
                    value={joinPassword}
                    onChange={(e) => setJoinPassword(e.target.value)}
                    className="bg-[#161B22] border border-slate-700 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold"
                  >
                    Join Code
                  </button>
                </form>

                {/* Active Rooms List */}
                <div className="border border-slate-800 rounded-md overflow-hidden">
                  {rooms.length === 0 ? (
                    <div className="p-8 text-center space-y-2">
                      <Users className="w-6 h-6 text-slate-500 mx-auto" />
                      <div className="text-sm font-medium text-slate-300">
                        No active rooms right now
                      </div>
                      <p className="text-xs text-slate-500">
                        Switch to Host Room to open a lobby, or share the room code with another tab or device on the same server.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {rooms.map((r) => (
                        <div
                          key={r.id}
                          className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-slate-800/40"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-white">
                                {r.name}
                              </span>
                              {r.hasPassword && (
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                              )}
                              <span className="font-mono-hud text-xs text-amber-400">
                                {r.id}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400">
                              Host: {r.hostName} ·{' '}
                              {MAP_LIST.find((m) => m.id === r.mapId)?.name} ·{' '}
                              {r.mode.toUpperCase()} · {r.playerCount}/{r.maxPlayers}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => onJoinRoom(r.id, joinPassword)}
                            className="px-4 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-semibold"
                          >
                            Join
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Host Room Form */
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  onCreateRoom({
                    roomName: roomName.trim() || 'Combat Room',
                    mapId,
                    mode,
                    maxPlayers,
                    password,
                  });
                }}
                className="space-y-4 bg-[#0E1319] p-4 rounded-md border border-slate-800"
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className="space-y-1 text-xs text-slate-300">
                    <span>Room Name</span>
                    <input
                      type="text"
                      maxLength={28}
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="w-full bg-[#161B22] border border-slate-700 rounded px-3 py-2 text-sm text-white"
                    />
                  </label>

                  <label className="space-y-1 text-xs text-slate-300">
                    <span>Optional Password</span>
                    <input
                      type="password"
                      maxLength={24}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank for open room"
                      className="w-full bg-[#161B22] border border-slate-700 rounded px-3 py-2 text-sm text-white"
                    />
                  </label>

                  <label className="space-y-1 text-xs text-slate-300">
                    <span>Battle Map</span>
                    <select
                      value={mapId}
                      onChange={(e) => setMapId(e.target.value as MapId)}
                      className="w-full bg-[#161B22] border border-slate-700 rounded px-3 py-2 text-sm text-white"
                    >
                      {MAP_LIST.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="space-y-1 text-xs text-slate-300">
                    <span>Game Mode</span>
                    <select
                      value={mode}
                      onChange={(e) => setMode(e.target.value as GameModeId)}
                      className="w-full bg-[#161B22] border border-slate-700 rounded px-3 py-2 text-sm text-white"
                    >
                      <option value="deathmatch">Deathmatch (FFA)</option>
                      <option value="tdm">Team Deathmatch</option>
                      <option value="survival">Co-op Survival</option>
                    </select>
                  </label>
                </div>

                <label className="block space-y-1 text-xs text-slate-300">
                  <span>Max Players: {maxPlayers}</span>
                  <input
                    type="range"
                    min={2}
                    max={12}
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(Number(e.target.value))}
                    className="w-full accent-red-500"
                  />
                </label>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-md bg-red-600 hover:bg-red-500 text-white text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Create &amp; Host Room
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
