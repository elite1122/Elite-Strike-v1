import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import {
  createMatchWorld,
  createSoldier,
  emptyInput,
  stepWorld,
} from './src/game/physics';
import { computeBotInputs } from './src/game/ai';
import { MAPS } from './src/game/maps';
import {
  ArmorColorId,
  GameModeId,
  HelmetStyle,
  LobbyPlayer,
  MapId,
  MatchWorld,
  PlayerInputState,
  RoomState,
  RoomSummary,
  TeamId,
  WeaponId,
} from './src/game/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ServerRoom {
  state: RoomState;
  password: string;
  world: MatchWorld | null;
  inputs: Record<string, PlayerInputState>;
  clients: Map<string, WebSocket>;
}

const rooms = new Map<string, ServerRoom>();
let clientCounter = 1;

function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return rooms.has(code) ? generateRoomCode() : code;
}

function getRoomSummaries(): RoomSummary[] {
  const list: RoomSummary[] = [];
  for (const room of rooms.values()) {
    const host = room.state.players.find((p) => p.id === room.state.hostId);
    list.push({
      id: room.state.id,
      name: room.state.name,
      hostName: host?.name ?? 'Unknown',
      mapId: room.state.mapId,
      mode: room.state.mode,
      playerCount: room.state.players.length,
      maxPlayers: room.state.maxPlayers,
      hasPassword: room.password.length > 0,
      status: room.state.status,
    });
  }
  return list;
}

function sendJson(ws: WebSocket | undefined, payload: unknown): void {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function broadcastRoom(room: ServerRoom, payload: unknown): void {
  const msg = JSON.stringify(payload);
  for (const ws of room.clients.values()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function broadcastRoomList(wss: WebSocketServer): void {
  const msg = JSON.stringify({ type: 'room:list', rooms: getRoomSummaries() });
  for (const ws of wss.clients) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function removePlayerFromRoom(
  roomId: string,
  playerId: string,
  wss: WebSocketServer,
): void {
  const room = rooms.get(roomId);
  if (!room) return;

  room.clients.delete(playerId);
  room.state.players = room.state.players.filter((p) => p.id !== playerId);
  delete room.inputs[playerId];

  if (room.world) {
    room.world.soldiers = room.world.soldiers.filter((s) => s.id !== playerId);
  }

  if (room.state.players.length === 0) {
    rooms.delete(roomId);
  } else {
    if (room.state.hostId === playerId) {
      room.state.hostId = room.state.players[0].id;
      room.state.players[0].isHost = true;
    }
    broadcastRoom(room, { type: 'room:update', room: room.state });
  }
  broadcastRoomList(wss);
}

function startRoomMatch(room: ServerRoom): void {
  const map = MAPS[room.state.mapId];
  const host = room.state.players[0];
  if (!host) return;

  const world = createMatchWorld({
    mode: room.state.mode,
    mapId: room.state.mapId,
    playerConfig: {
      id: host.id,
      name: host.name,
      helmet: host.helmet,
      armorColor: host.armorColor,
      primaryWeapon: host.primaryWeapon,
      secondaryWeapon: host.secondaryWeapon,
    },
    botCount: room.state.players.length === 1 ? 2 : 0,
  });

  // Replace host's auto-assigned team with lobby team if TDM
  if (world.soldiers[0]) {
    world.soldiers[0].team =
      room.state.mode === 'tdm'
        ? host.team === 'ffa'
          ? 'alpha'
          : host.team
        : room.state.mode === 'survival'
          ? 'alpha'
          : 'ffa';
  }

  // Add remaining human players
  for (let i = 1; i < room.state.players.length; i++) {
    const lp = room.state.players[i];
    const team: TeamId =
      room.state.mode === 'tdm'
        ? lp.team === 'ffa'
          ? i % 2 === 0
            ? 'alpha'
            : 'bravo'
          : lp.team
        : room.state.mode === 'survival'
          ? 'alpha'
          : 'ffa';
    world.soldiers.push(
      createSoldier({
        id: lp.id,
        name: lp.name,
        team,
        isBot: false,
        helmet: lp.helmet,
        armorColor: lp.armorColor,
        primaryWeapon: lp.primaryWeapon,
        secondaryWeapon: lp.secondaryWeapon,
        map,
        existingSoldiers: world.soldiers,
        livesRemaining: room.state.mode === 'survival' ? 3 : 99,
      }),
    );
  }

  room.world = world;
  room.state.status = 'playing';
  room.inputs = {};

  for (const [pid, ws] of room.clients.entries()) {
    sendJson(ws, {
      type: 'match:start',
      world: room.world,
      yourId: pid,
    });
  }
}

async function main() {
  const app = express();
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true });
  });

  app.get('/api/rooms', (_req, res) => {
    res.json({ rooms: getRoomSummaries() });
  });

  const server = http.createServer(app);
  const wss = new WebSocketServer({ server, path: '/ws' });

  wss.on('connection', (ws) => {
    const playerId = `net-${clientCounter++}`;
    let currentRoomId: string | null = null;

    sendJson(ws, {
      type: 'net:welcome',
      playerId,
      rooms: getRoomSummaries(),
    });

    ws.on('message', (raw) => {
      try {
        const msg = JSON.parse(raw.toString()) as Record<string, unknown>;
        const type = String(msg.type || '');

        if (type === 'room:list') {
          sendJson(ws, { type: 'room:list', rooms: getRoomSummaries() });
          return;
        }

        if (type === 'room:create') {
          if (currentRoomId) {
            removePlayerFromRoom(currentRoomId, playerId, wss);
            currentRoomId = null;
          }
          const id = generateRoomCode();
          const mapId = (MAPS[msg.mapId as MapId] ? msg.mapId : 'forest') as MapId;
          const mode = (['deathmatch', 'tdm', 'survival'].includes(String(msg.mode))
            ? msg.mode
            : 'deathmatch') as GameModeId;
          const maxPlayers = Math.max(2, Math.min(12, Number(msg.maxPlayers) || 6));
          const playerName = String(msg.playerName || 'Commander').slice(0, 18);

          const hostPlayer: LobbyPlayer = {
            id: playerId,
            name: playerName,
            team: mode === 'tdm' ? 'alpha' : 'ffa',
            helmet: (msg.helmet as HelmetStyle) || 'tactical',
            armorColor: (msg.armorColor as ArmorColorId) || 'olive',
            primaryWeapon: (msg.primaryWeapon as WeaponId) || 'rifle',
            secondaryWeapon: (msg.secondaryWeapon as WeaponId) || 'pistol',
            ready: true,
            isHost: true,
          };

          const newRoom: ServerRoom = {
            state: {
              id,
              name: String(msg.roomName || `${playerName}'s Room`).slice(0, 28),
              mapId,
              mode,
              maxPlayers,
              status: 'lobby',
              hostId: playerId,
              players: [hostPlayer],
            },
            password: String(msg.password || '').slice(0, 24),
            world: null,
            inputs: {},
            clients: new Map([[playerId, ws]]),
          };

          rooms.set(id, newRoom);
          currentRoomId = id;
          sendJson(ws, { type: 'room:joined', room: newRoom.state, playerId });
          broadcastRoomList(wss);
          return;
        }

        if (type === 'room:join') {
          const roomId = String(msg.roomId || '').toUpperCase();
          const room = rooms.get(roomId);
          if (!room) {
            sendJson(ws, { type: 'room:error', message: 'Room not found.' });
            return;
          }
          if (room.password && room.password !== String(msg.password || '')) {
            sendJson(ws, { type: 'room:error', message: 'Incorrect room password.' });
            return;
          }
          if (room.state.players.length >= room.state.maxPlayers) {
            sendJson(ws, { type: 'room:error', message: 'Room is full.' });
            return;
          }

          if (currentRoomId && currentRoomId !== roomId) {
            removePlayerFromRoom(currentRoomId, playerId, wss);
          }

          const alphaCount = room.state.players.filter((p) => p.team === 'alpha').length;
          const bravoCount = room.state.players.filter((p) => p.team === 'bravo').length;
          const autoTeam: TeamId =
            room.state.mode === 'tdm'
              ? alphaCount <= bravoCount
                ? 'alpha'
                : 'bravo'
              : 'ffa';

          const joinedPlayer: LobbyPlayer = {
            id: playerId,
            name: String(msg.playerName || 'Striker').slice(0, 18),
            team: autoTeam,
            helmet: (msg.helmet as HelmetStyle) || 'tactical',
            armorColor: (msg.armorColor as ArmorColorId) || 'cobalt',
            primaryWeapon: (msg.primaryWeapon as WeaponId) || 'rifle',
            secondaryWeapon: (msg.secondaryWeapon as WeaponId) || 'pistol',
            ready: false,
            isHost: false,
          };

          room.state.players.push(joinedPlayer);
          room.clients.set(playerId, ws);
          currentRoomId = roomId;

          sendJson(ws, { type: 'room:joined', room: room.state, playerId });
          broadcastRoom(room, { type: 'room:update', room: room.state });

          // If match is already live, spawn mid-match
          if (room.state.status === 'playing' && room.world) {
            const soldier = createSoldier({
              id: joinedPlayer.id,
              name: joinedPlayer.name,
              team: room.state.mode === 'tdm' ? joinedPlayer.team : room.state.mode === 'survival' ? 'alpha' : 'ffa',
              isBot: false,
              helmet: joinedPlayer.helmet,
              armorColor: joinedPlayer.armorColor,
              primaryWeapon: joinedPlayer.primaryWeapon,
              secondaryWeapon: joinedPlayer.secondaryWeapon,
              map: MAPS[room.state.mapId],
              existingSoldiers: room.world.soldiers,
            });
            room.world.soldiers.push(soldier);
            sendJson(ws, {
              type: 'match:start',
              world: room.world,
              yourId: playerId,
            });
          }

          broadcastRoomList(wss);
          return;
        }

        if (type === 'room:leave' && currentRoomId) {
          removePlayerFromRoom(currentRoomId, playerId, wss);
          currentRoomId = null;
          sendJson(ws, { type: 'room:left' });
          return;
        }

        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;

        if (type === 'room:ready') {
          const p = room.state.players.find((pl) => pl.id === playerId);
          if (p) {
            p.ready = !p.ready;
            broadcastRoom(room, { type: 'room:update', room: room.state });
          }
          return;
        }

        if (type === 'room:team') {
          const p = room.state.players.find((pl) => pl.id === playerId);
          if (p && room.state.mode === 'tdm') {
            p.team = p.team === 'alpha' ? 'bravo' : 'alpha';
            broadcastRoom(room, { type: 'room:update', room: room.state });
          }
          return;
        }

        if (type === 'room:start' && room.state.hostId === playerId) {
          startRoomMatch(room);
          broadcastRoomList(wss);
          return;
        }

        if (type === 'player:input' && room.world && room.state.status === 'playing') {
          const incoming = msg.input as Partial<PlayerInputState> | undefined;
          if (!incoming) return;
          const prev = room.inputs[playerId] ?? emptyInput(0);
          room.inputs[playerId] = {
            moveX: Math.max(-1, Math.min(1, Number(incoming.moveX) || 0)),
            jumpHeld: Boolean(incoming.jumpHeld),
            jumpPressed: prev.jumpPressed || Boolean(incoming.jumpPressed),
            jetpackHeld: Boolean(incoming.jetpackHeld),
            crouchHeld: Boolean(incoming.crouchHeld),
            aimAngle: Number(incoming.aimAngle) || 0,
            fireHeld: Boolean(incoming.fireHeld),
            firePressed: prev.firePressed || Boolean(incoming.firePressed),
            reloadPressed: prev.reloadPressed || Boolean(incoming.reloadPressed),
            grenadePressed: prev.grenadePressed || Boolean(incoming.grenadePressed),
            meleePressed: prev.meleePressed || Boolean(incoming.meleePressed),
            switchSlotPressed:
              incoming.switchSlotPressed ?? prev.switchSlotPressed ?? null,
          };
        }
      } catch {
        // Ignore malformed packets safely
      }
    });

    ws.on('close', () => {
      if (currentRoomId) {
        removePlayerFromRoom(currentRoomId, playerId, wss);
        currentRoomId = null;
      }
    });
  });

  // Authoritative 30 Hz room simulation tick
  const TICK_MS = 1000 / 30;
  setInterval(() => {
    const dt = 1 / 30;
    for (const room of rooms.values()) {
      if (room.state.status !== 'playing' || !room.world) continue;

      const botInputs = computeBotInputs(room.world, dt);
      const mergedInputs: Record<string, PlayerInputState> = {
        ...botInputs,
        ...room.inputs,
      };
      stepWorld(room.world, mergedInputs, dt);

      // Clear edge triggers after stepping
      for (const pid of Object.keys(room.inputs)) {
        const inp = room.inputs[pid];
        inp.jumpPressed = false;
        inp.firePressed = false;
        inp.reloadPressed = false;
        inp.grenadePressed = false;
        inp.meleePressed = false;
        inp.switchSlotPressed = null;
      }

      broadcastRoom(room, { type: 'world:state', world: room.world });

      if (room.world.status === 'ended') {
        room.state.status = 'lobby';
        for (const p of room.state.players) {
          if (!p.isHost) p.ready = false;
        }
        broadcastRoom(room, { type: 'room:update', room: room.state });
        broadcastRoomList(wss);
      }
    }
  }, TICK_MS);

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  server.listen(port, '0.0.0.0', () => {
    console.log(`EliteStrike server listening on http://localhost:${port}`);
  });
}

main();
