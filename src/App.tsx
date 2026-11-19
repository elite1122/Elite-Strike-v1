import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ArmoryModal } from './components/ArmoryModal';
import { GameHud, TouchInputBridge } from './components/GameHud';
import { PauseModal, ResultsModal } from './components/MatchModals';
import { MultiplayerModal } from './components/MultiplayerModal';
import { TitleOverlay } from './components/TitleOverlay';
import { computeBotInputs } from './game/ai';
import { soundEngine } from './game/audio';
import {
  applyProfileToSoldier,
  createMatchWorld,
  emptyInput,
  findClickedWeaponPickup,
  findNearbyWeaponPickup,
  stepWorld,
} from './game/physics';
import {
  calculateMatchXp,
  loadProfile,
  loadSettings,
  saveProfile,
  saveSettings,
} from './game/progression';
import {
  getMinimapSummary,
  MinimapSnapshotData,
  renderMinimapCanvas,
} from './game/minimap';
import { ArenaRenderer } from './game/renderer';
import { cycleWeaponScopeZoom, WEAPONS } from './game/weapons';
import {
  ControlSettings,
  GameModeId,
  KillFeedEntry,
  MapId,
  MapMechanicSnapshot,
  MatchWorld,
  PlayerInputState,
  PlayerProfile,
  RoomState,
  RoomSummary,
  SoldierEntity,
  WeaponId,
  WorldEvent,
} from './game/types';

type AppState = 'title' | 'playing' | 'paused' | 'gameover';

interface HudSnapshot {
  mapId: MapId;
  mode: GameModeId;
  elapsed: number;
  timeLimit: number;
  targetKills: number;
  wave: number;
  alphaKills: number;
  bravoKills: number;
  topKills: number;
  killFeed: KillFeedEntry[];
  minimap: MinimapSnapshotData;
  nearbyWeaponPickup: { id: number; weaponId: WeaponId } | null;
  player: SoldierEntity | null;
  mapMechanic?: MapMechanicSnapshot | null;
}

export default function App() {
  const [appState, setAppState] = useState<AppState>('title');
  const [profile, setProfile] = useState<PlayerProfile>(() => loadProfile());
  const [settings, setSettings] = useState<ControlSettings>(() => loadSettings());
  const [selectedMode, setSelectedMode] = useState<GameModeId>('training');
  const [selectedMap, setSelectedMap] = useState<MapId>('forest');

  const [showArmory, setShowArmory] = useState(false);
  const [showTitleSettings, setShowTitleSettings] = useState(false);
  const [titleSettingsTab, setTitleSettingsTab] = useState<'character' | 'controls'>('character');
  const [isEditingControls, setIsEditingControls] = useState(false);
  const [showMultiplayer, setShowMultiplayer] = useState(false);

  // Multiplayer WebSocket state
  const [wsConnected, setWsConnected] = useState(false);
  const [netRooms, setNetRooms] = useState<RoomSummary[]>([]);
  const [currentRoom, setCurrentRoom] = useState<RoomState | null>(null);
  const [localNetId, setLocalNetId] = useState<string | null>(null);
  const [netError, setNetError] = useState<string | null>(null);
  const [isNetMatch, setIsNetMatch] = useState(false);

  const [hudSnapshot, setHudSnapshot] = useState<HudSnapshot>({
    mapId: 'forest',
    mode: 'training',
    elapsed: 0,
    timeLimit: 180,
    targetKills: 12,
    wave: 1,
    alphaKills: 0,
    bravoKills: 0,
    topKills: 0,
    killFeed: [],
    minimap: {
      mapName: 'Forest Outpost',
      mapWidth: 2600,
      mapHeight: 1120,
      hostileCount: 0,
      allyCount: 0,
      playerCoords: null,
    },
    nearbyWeaponPickup: null,
    player: null,
  });
  const [minimapZoomed, setMinimapZoomed] = useState(false);
  const [scopeZoomLevel, setScopeZoomLevel] = useState<number>(
    () => WEAPONS[loadProfile().primaryWeapon]?.scopeZoom ?? 3,
  );
  const [endWorld, setEndWorld] = useState<MatchWorld | null>(null);
  const [xpEarned, setXpEarned] = useState(0);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const minimapZoomedRef = useRef<boolean>(false);
  const scopeZoomLevelRef = useRef<number>(scopeZoomLevel);
  const lastEquippedWeaponRef = useRef<string>('');
  const rendererRef = useRef<ArenaRenderer>(new ArenaRenderer());
  const worldRef = useRef<MatchWorld | null>(null);
  const localPlayerIdRef = useRef<string>('local-player');
  const appStateRef = useRef<AppState>('title');
  const isNetMatchRef = useRef<boolean>(false);
  const profileRef = useRef<PlayerProfile>(profile);
  const settingsRef = useRef<ControlSettings>(settings);
  const selectedModeRef = useRef<GameModeId>(selectedMode);
  const selectedMapRef = useRef<MapId>(selectedMap);
  const modalOpenRef = useRef<boolean>(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Input state refs
  const keysRef = useRef<Set<string>>(new Set());
  const mouseScreenRef = useRef<{ x: number; y: number }>({ x: 720, y: 420 });
  const mouseDownRef = useRef<boolean>(false);
  const lastCamRef = useRef<{
    camX: number;
    camY: number;
    viewW: number;
    viewH: number;
    scale: number;
  }>({
    camX: 0,
    camY: 0,
    viewW: 1440,
    viewH: 900,
    scale: 1,
  });
  const pendingEdgesRef = useRef<{
    jumpPressed: boolean;
    firePressed: boolean;
    reloadPressed: boolean;
    grenadePressed: boolean;
    meleePressed: boolean;
    switchSlotPressed: 0 | 1 | 'toggle' | null;
    pickupPressed: boolean;
    pickupTargetId: number | null;
  }>({
    jumpPressed: false,
    firePressed: false,
    reloadPressed: false,
    grenadePressed: false,
    meleePressed: false,
    switchSlotPressed: null,
    pickupPressed: false,
    pickupTargetId: null,
  });

  const touchBridgeRef = useRef<TouchInputBridge>({
    moveX: 0,
    jumpHeld: false,
    jetpackHeld: false,
    crouchHeld: false,
    aimAngle: null,
    fireHeld: false,
    triggerJump: () => {
      pendingEdgesRef.current.jumpPressed = true;
    },
    triggerGrenade: () => {
      pendingEdgesRef.current.grenadePressed = true;
    },
    triggerMelee: () => {
      pendingEdgesRef.current.meleePressed = true;
    },
    triggerReload: () => {
      pendingEdgesRef.current.reloadPressed = true;
    },
    triggerSwitchSlot: (slot) => {
      pendingEdgesRef.current.switchSlotPressed = slot;
    },
    triggerPickup: (pickupId) => {
      if (typeof pickupId === 'number') {
        pendingEdgesRef.current.pickupTargetId = pickupId;
      } else {
        pendingEdgesRef.current.pickupPressed = true;
      }
    },
  });

  // Sync refs with React state
  useEffect(() => {
    appStateRef.current = appState;
    document.body.dataset.state = appState;
    if (appState !== 'playing') {
      soundEngine.setJetpackActive(false);
    }
  }, [appState]);

  useEffect(() => {
    profileRef.current = profile;
  }, [profile]);

  useEffect(() => {
    settingsRef.current = settings;
    soundEngine.setConfig(settings.sfxVolume, settings.muted);
  }, [settings]);

  useEffect(() => {
    selectedModeRef.current = selectedMode;
  }, [selectedMode]);

  useEffect(() => {
    selectedMapRef.current = selectedMap;
    if (appStateRef.current === 'title') {
      worldRef.current = createMatchWorld({
        mode: 'deathmatch',
        mapId: selectedMap,
        playerConfig: {
          id: 'tour-observer',
          name: profileRef.current.callsign,
          helmet: profileRef.current.helmet,
          eyewear: profileRef.current.eyewear,
          skinTone: profileRef.current.skinTone,
          jetpackStyle: profileRef.current.jetpackStyle,
          armorColor: profileRef.current.armorColor,
          primaryWeapon: profileRef.current.primaryWeapon,
          secondaryWeapon: profileRef.current.secondaryWeapon,
        },
        botCount: 5,
      });
    }
  }, [selectedMap]);

  useEffect(() => {
    modalOpenRef.current = showArmory || showTitleSettings || showMultiplayer;
  }, [showArmory, showTitleSettings, showMultiplayer]);

  useEffect(() => {
    isNetMatchRef.current = isNetMatch;
  }, [isNetMatch]);

  useEffect(() => {
    minimapZoomedRef.current = minimapZoomed;
  }, [minimapZoomed]);

  useEffect(() => {
    scopeZoomLevelRef.current = scopeZoomLevel;
  }, [scopeZoomLevel]);

  const handleCycleScopeZoom = useCallback(() => {
    const w = worldRef.current;
    const me = w?.soldiers.find((s) => s.id === localPlayerIdRef.current);
    const activeWepId = me ? me.slots[me.activeSlot].weaponId : profileRef.current.primaryWeapon;
    const maxZoom = WEAPONS[activeWepId]?.scopeZoom ?? 2;
    setScopeZoomLevel((prev) => {
      const next = cycleWeaponScopeZoom(prev, maxZoom);
      scopeZoomLevelRef.current = next;
      return next;
    });
  }, []);

  const [viewportSize, setViewportSize] = useState<{ w: number; h: number }>(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));

  const tryLockLandscape = useCallback(() => {
    try {
      const scr = window.screen as Screen & {
        orientation?: { lock?: (mode: string) => Promise<void> };
      };
      if (scr?.orientation?.lock) {
        scr.orientation.lock('landscape').catch(() => {});
      }
    } catch {
      // Ignore orientation lock restrictions in desktop browsers
    }
  }, []);

  useEffect(() => {
    setIsTouchDevice(
      typeof window !== 'undefined' &&
        ('ontouchstart' in window || navigator.maxTouchPoints > 0),
    );
    const handleViewportChange = () => {
      setViewportSize({
        w: window.innerWidth,
        h: window.innerHeight,
      });
    };
    tryLockLandscape();
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('orientationchange', handleViewportChange);
    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('orientationchange', handleViewportChange);
    };
  }, [tryLockLandscape]);

  const syncHudFromWorld = useCallback((w: MatchWorld) => {
    const me = w.soldiers.find((s) => s.id === localPlayerIdRef.current) ?? null;
    if (me) {
      const equipKey = `${me.activeSlot}:${me.slots[me.activeSlot].weaponId}`;
      if (lastEquippedWeaponRef.current !== equipKey) {
        lastEquippedWeaponRef.current = equipKey;
        const autoZoom = WEAPONS[me.slots[me.activeSlot].weaponId]?.scopeZoom ?? 1;
        scopeZoomLevelRef.current = autoZoom;
        setScopeZoomLevel(autoZoom);
      }
    }
    const alphaKills = w.soldiers
      .filter((s) => s.team === 'alpha')
      .reduce((acc, s) => acc + s.kills, 0);
    const bravoKills = w.soldiers
      .filter((s) => s.team === 'bravo')
      .reduce((acc, s) => acc + s.kills, 0);
    const topKills = w.soldiers.reduce((m, s) => Math.max(m, s.kills), 0);
    const nearPickup = findNearbyWeaponPickup(w, me, 95);

    setHudSnapshot({
      mapId: w.mapId,
      mode: w.mode,
      elapsed: w.elapsed,
      timeLimit: w.timeLimit,
      targetKills: w.targetKills,
      wave: w.wave,
      alphaKills,
      bravoKills,
      topKills,
      killFeed: [...w.killFeed],
      minimap: getMinimapSummary(w, localPlayerIdRef.current),
      nearbyWeaponPickup: nearPickup
        ? {
            id: nearPickup.id,
            weaponId: nearPickup.kind.replace('weapon_', '') as WeaponId,
          }
        : null,
      player: me ? { ...me, slots: [{ ...me.slots[0] }, { ...me.slots[1] }] } : null,
      mapMechanic: w.mapMechanic ? { ...w.mapMechanic } : null,
    });
  }, []);

  const updateProfile = useCallback(
    (patch: Partial<PlayerProfile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...patch };
        saveProfile(next);
        profileRef.current = next;
        if (worldRef.current) {
          const targetId =
            appStateRef.current === 'title'
              ? 'tour-observer'
              : localPlayerIdRef.current;
          const me = worldRef.current.soldiers.find((s) => s.id === targetId);
          if (me) {
            applyProfileToSoldier(me, next);
            if (appStateRef.current !== 'title') {
              syncHudFromWorld(worldRef.current);
            }
          }
        }
        return next;
      });
    },
    [syncHudFromWorld],
  );

  const updateSettings = useCallback((patch: Partial<ControlSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      saveSettings(next);
      return next;
    });
  }, []);

  const finalizeMatch = useCallback(
    (w: MatchWorld) => {
      const me = w.soldiers.find((s) => s.id === localPlayerIdRef.current);
      const sorted = [...w.soldiers].sort((a, b) => b.kills - a.kills);
      const won =
        w.mode === 'tdm' || w.mode === 'survival'
          ? w.winnerTeam === me?.team
          : sorted[0]?.id === localPlayerIdRef.current;

      const earned = calculateMatchXp({
        kills: me?.kills ?? 0,
        won,
        mode: w.mode,
      });
      setXpEarned(earned);
      setEndWorld(structuredClone(w));

      updateProfile({
        xp: profileRef.current.xp + earned,
        kills: profileRef.current.kills + (me?.kills ?? 0),
        deaths: profileRef.current.deaths + (me?.deaths ?? 0),
        wins: profileRef.current.wins + (won ? 1 : 0),
        matches: profileRef.current.matches + 1,
      });

      soundEngine.setJetpackActive(false);
      setAppState('gameover');
    },
    [updateProfile],
  );

  const startSoloMatch = useCallback(() => {
    soundEngine.unlock();
    keysRef.current.clear();
    mouseDownRef.current = false;
    setShowArmory(false);
    setShowTitleSettings(false);
    setShowMultiplayer(false);
    setIsNetMatch(false);
    isNetMatchRef.current = false;

    const p = profileRef.current;
    const pid = 'local-player';
    localPlayerIdRef.current = pid;

    const world = createMatchWorld({
      mode: selectedModeRef.current,
      mapId: selectedMapRef.current,
      playerConfig: {
        id: pid,
        name: p.callsign || 'Striker-01',
        helmet: p.helmet,
        eyewear: p.eyewear,
        skinTone: p.skinTone,
        jetpackStyle: p.jetpackStyle,
        armorColor: p.armorColor,
        primaryWeapon: p.primaryWeapon,
        secondaryWeapon: p.secondaryWeapon,
      },
    });
    worldRef.current = world;
    rendererRef.current.clearEffects();
    const spawnSoldier = world.soldiers[0];
    if (spawnSoldier) {
      rendererRef.current.camX = spawnSoldier.x;
      rendererRef.current.camY = spawnSoldier.y;
    }

    setEndWorld(null);
    syncHudFromWorld(world);
    document.body.dataset.state = 'playing';
    setAppState('playing');
    canvasRef.current?.focus();
  }, [syncHudFromWorld]);

  const exitToTitle = useCallback(() => {
    soundEngine.setJetpackActive(false);
    setIsNetMatch(false);
    isNetMatchRef.current = false;
    setEndWorld(null);
    worldRef.current = createMatchWorld({
      mode: 'deathmatch',
      mapId: selectedMapRef.current,
      playerConfig: {
        id: 'tour-observer',
        name: profileRef.current.callsign,
        helmet: profileRef.current.helmet,
        eyewear: profileRef.current.eyewear,
        skinTone: profileRef.current.skinTone,
        jetpackStyle: profileRef.current.jetpackStyle,
        armorColor: profileRef.current.armorColor,
        primaryWeapon: profileRef.current.primaryWeapon,
        secondaryWeapon: profileRef.current.secondaryWeapon,
      },
      botCount: 5,
    });
    document.body.dataset.state = 'title';
    setAppState('title');
  }, []);

  // Process sound + particle events from simulation
  const processAudioEvents = useCallback((events: WorldEvent[], listenerX: number, listenerY: number) => {
    for (const ev of events) {
      const dist = Math.hypot(ev.x - listenerX, ev.y - listenerY);
      const scale = Math.max(0.1, 1 - dist / 1400);
      if (ev.type === 'shot' && ev.weaponId) {
        soundEngine.playShot(ev.weaponId, scale);
      } else if (ev.type === 'explosion') {
        soundEngine.playExplosion(Math.max(0.25, scale));
      } else if (ev.type === 'hit' && ev.ownerId === localPlayerIdRef.current && (ev.damage ?? 0) > 0) {
        soundEngine.playHitmarker(false);
      } else if (ev.type === 'ko' && ev.ownerId === localPlayerIdRef.current) {
        soundEngine.playHitmarker(true);
      } else if (ev.type === 'reload' && dist < 300) {
        soundEngine.playReload();
      } else if (ev.type === 'jump' && dist < 240) {
        soundEngine.playJump();
      } else if (ev.type === 'pickup' && ev.ownerId === localPlayerIdRef.current) {
        soundEngine.playPickup();
      } else if (ev.type === 'melee' && dist < 320) {
        soundEngine.playMelee();
      }
    }
  }, []);

  // WebSocket Multiplayer Client Connection (on demand or persistent)
  const ensureSocket = useCallback(() => {
    if (
      wsRef.current &&
      (wsRef.current.readyState === WebSocket.OPEN ||
        wsRef.current.readyState === WebSocket.CONNECTING)
    ) {
      return wsRef.current;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setNetError(null);
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data as string);
        if (msg.type === 'net:welcome') {
          setLocalNetId(msg.playerId);
          setNetRooms(msg.rooms || []);
        } else if (msg.type === 'room:list') {
          setNetRooms(msg.rooms || []);
        } else if (msg.type === 'room:joined') {
          setCurrentRoom(msg.room);
          setLocalNetId(msg.playerId);
          setNetError(null);
        } else if (msg.type === 'room:update') {
          setCurrentRoom(msg.room);
        } else if (msg.type === 'room:left') {
          setCurrentRoom(null);
        } else if (msg.type === 'room:error') {
          setNetError(msg.message || 'Multiplayer action failed.');
        } else if (msg.type === 'match:start') {
          soundEngine.unlock();
          const w = msg.world as MatchWorld;
          localPlayerIdRef.current = msg.yourId;
          worldRef.current = w;
          rendererRef.current.clearEffects();
          const me = w.soldiers.find((s) => s.id === msg.yourId);
          if (me) {
            rendererRef.current.camX = me.x;
            rendererRef.current.camY = me.y;
          }
          setIsNetMatch(true);
          isNetMatchRef.current = true;
          setShowMultiplayer(false);
          setEndWorld(null);
          syncHudFromWorld(w);
          document.body.dataset.state = 'playing';
          setAppState('playing');
        } else if (msg.type === 'world:state' && isNetMatchRef.current) {
          const w = msg.world as MatchWorld;
          worldRef.current = w;
          if (w.events?.length) {
            rendererRef.current.ingestEvents(w.events);
            const me = w.soldiers.find((s) => s.id === localPlayerIdRef.current);
            processAudioEvents(w.events, me?.x ?? 1000, me?.y ?? 600);
          }
          const me = w.soldiers.find((s) => s.id === localPlayerIdRef.current);
          soundEngine.setJetpackActive(Boolean(me?.alive && me?.jetpackActive));
          syncHudFromWorld(w);
          if (w.status === 'ended' && appStateRef.current === 'playing') {
            finalizeMatch(w);
          }
        }
      } catch {
        // Ignore invalid JSON frames
      }
    };

    return ws;
  }, [finalizeMatch, processAudioEvents, syncHudFromWorld]);

  useEffect(() => {
    if (showMultiplayer) {
      const ws = ensureSocket();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'room:list' }));
      }
    }
  }, [showMultiplayer, ensureSocket]);

  // Autostart support (?autostart=1&map=desert)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mapParam = params.get('map') as MapId | null;
    if (
      mapParam &&
      ['forest', 'desert', 'urban', 'hangar', 'island'].includes(mapParam)
    ) {
      selectedMapRef.current = mapParam;
      setSelectedMap(mapParam);
    }
    if (params.get('autostart') === '1') {
      startSoloMatch();
    } else {
      // Seed initial Title Camera Tour world
      worldRef.current = createMatchWorld({
        mode: 'deathmatch',
        mapId: selectedMapRef.current,
        playerConfig: {
          id: 'tour-observer',
          name: profileRef.current.callsign,
          helmet: profileRef.current.helmet,
          eyewear: profileRef.current.eyewear,
          skinTone: profileRef.current.skinTone,
          jetpackStyle: profileRef.current.jetpackStyle,
          armorColor: profileRef.current.armorColor,
          primaryWeapon: profileRef.current.primaryWeapon,
          secondaryWeapon: profileRef.current.secondaryWeapon,
        },
        botCount: 5,
      });
    }
  }, [startSoloMatch]);

  // Unified Keyboard & Pointer Listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      const code = e.code;

      if (appStateRef.current === 'title' && !modalOpenRef.current) {
        if (code === 'Enter' || code === 'Space') {
          e.preventDefault();
          startSoloMatch();
          return;
        }
      }

      if (code === 'Escape' || code === 'KeyP') {
        if (appStateRef.current === 'playing') {
          e.preventDefault();
          setAppState('paused');
          return;
        }
        if (appStateRef.current === 'paused') {
          e.preventDefault();
          setAppState('playing');
          return;
        }
      }

      if (code === 'KeyM') {
        updateSettings({ muted: !settingsRef.current.muted });
        return;
      }

      if (code === 'KeyT' && appStateRef.current === 'playing') {
        const nextMode = settingsRef.current.touchControls === 'always' ? 'off' : 'always';
        updateSettings({ touchControls: nextMode });
        return;
      }

      if (code === 'KeyN' && appStateRef.current === 'playing') {
        setMinimapZoomed((prev) => !prev);
        return;
      }

      if (code === 'KeyZ' && appStateRef.current === 'playing') {
        handleCycleScopeZoom();
        return;
      }

      if (appStateRef.current !== 'playing') return;

      if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(code)) {
        e.preventDefault();
      }

      if (!keysRef.current.has(code)) {
        if (code === 'Space' || code === 'KeyW' || code === 'ArrowUp') {
          pendingEdgesRef.current.jumpPressed = true;
        } else if (code === 'KeyR') {
          pendingEdgesRef.current.reloadPressed = true;
        } else if (code === 'KeyG') {
          pendingEdgesRef.current.grenadePressed = true;
        } else if (code === 'KeyE' || code === 'KeyF') {
          pendingEdgesRef.current.meleePressed = true;
        } else if (code === 'Digit1') {
          pendingEdgesRef.current.switchSlotPressed = 0;
        } else if (code === 'Digit2') {
          pendingEdgesRef.current.switchSlotPressed = 1;
        } else if (code === 'KeyQ') {
          pendingEdgesRef.current.switchSlotPressed = 'toggle';
        }
      }

      keysRef.current.add(code);
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.code);
    };

    const clearInputs = () => {
      keysRef.current.clear();
      mouseDownRef.current = false;
      touchBridgeRef.current.moveX = 0;
      touchBridgeRef.current.fireHeld = false;
      touchBridgeRef.current.jetpackHeld = false;
      touchBridgeRef.current.crouchHeld = false;
    };

    const handleVisibility = () => {
      if (document.hidden) clearInputs();
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', clearInputs);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', clearInputs);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [startSoloMatch, updateSettings]);

  // Main 60 FPS Canvas Simulation + Render Loop (Mounted Once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const isAutomation = typeof navigator !== 'undefined' && navigator.webdriver;
    const getDpr = () =>
      isAutomation ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    const toLogicalCanvasCoords = (clientX: number, clientY: number) => {
      if (window.innerHeight > window.innerWidth) {
        return {
          x: clientY,
          y: window.innerWidth - clientX,
        };
      }
      const rect = canvas.getBoundingClientRect();
      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    };

    const resizeCanvas = () => {
      const dpr = getDpr();
      const rect = canvas.getBoundingClientRect();
      const rawW = canvas.offsetWidth || rect.width;
      const rawH = canvas.offsetHeight || rect.height;
      const w = Math.max(320, Math.floor(rawW));
      const h = Math.max(240, Math.floor(rawH));
      if (canvas.width !== Math.floor(w * dpr) || canvas.height !== Math.floor(h * dpr)) {
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
      }
    };

    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);
    window.addEventListener('resize', resizeCanvas);

    let rafId = 0;
    let yieldTimer: number | null = null;
    let disposed = false;
    let lastTime = performance.now();
    let hudSyncAccum = 0;
    let netSendAccum = 0;

    const buildLocalInput = (soldier: SoldierEntity | undefined): PlayerInputState => {
      const keys = keysRef.current;
      const tb = touchBridgeRef.current;
      const edges = pendingEdgesRef.current;

      let moveX = tb.moveX;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) moveX -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) moveX += 1;
      moveX = Math.max(-1, Math.min(1, moveX));

      const jumpHeld =
        tb.jumpHeld || keys.has('Space') || keys.has('KeyW') || keys.has('ArrowUp');
      const jetpackHeld = tb.jetpackHeld || keys.has('ShiftLeft') || keys.has('ShiftRight');
      const crouchHeld = tb.crouchHeld || keys.has('KeyS') || keys.has('ArrowDown');

      // Compute screenToWorld aimAngle from live canvas bounds
      let aimAngle = soldier?.aimAngle ?? 0;
      if (tb.aimAngle !== null && tb.fireHeld) {
        aimAngle = tb.aimAngle;
      } else if (soldier) {
        const { x: localX, y: localY } = toLogicalCanvasCoords(
          mouseScreenRef.current.x,
          mouseScreenRef.current.y,
        );
        const scale = lastCamRef.current.scale || 1;
        const worldMouseX = lastCamRef.current.camX + localX / scale;
        const worldMouseY = lastCamRef.current.camY + localY / scale;
        const sx = soldier.x + soldier.w / 2;
        const sy = soldier.y + soldier.h * 0.36;
        aimAngle = Math.atan2(worldMouseY - sy, worldMouseX - sx);
      }

      const input: PlayerInputState = {
        moveX,
        jumpHeld,
        jumpPressed: edges.jumpPressed,
        jetpackHeld,
        crouchHeld,
        aimAngle,
        fireHeld: mouseDownRef.current || tb.fireHeld,
        firePressed: edges.firePressed,
        reloadPressed: edges.reloadPressed,
        grenadePressed: edges.grenadePressed,
        meleePressed: edges.meleePressed,
        switchSlotPressed: edges.switchSlotPressed,
        pickupPressed: edges.pickupPressed,
        pickupTargetId: edges.pickupTargetId,
      };

      // Consume one-shot edges
      edges.jumpPressed = false;
      edges.firePressed = false;
      edges.reloadPressed = false;
      edges.grenadePressed = false;
      edges.meleePressed = false;
      edges.switchSlotPressed = null;
      edges.pickupPressed = false;
      edges.pickupTargetId = null;

      return input;
    };

    const frame = (now: number) => {
      if (disposed) return;
      const rawDt = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(Math.max(rawDt, 0.001), 0.05);

      const world = worldRef.current;
      const state = appStateRef.current;

      if (world && !modalOpenRef.current) {
        if (state === 'title') {
          // Live Title World Camera Tour with autonomous bots
          const botInputs = computeBotInputs(world, dt);
          stepWorld(world, botInputs, dt);
          rendererRef.current.ingestEvents(world.events);
          rendererRef.current.stepEffects(world, dt);
        } else if (state === 'playing') {
          const me = world.soldiers.find((s) => s.id === localPlayerIdRef.current);
          const localInput = buildLocalInput(me);

          if (isNetMatchRef.current) {
            // Send local input to authoritative server at ~30 Hz or immediately on edge
            netSendAccum += dt;
            const hasEdge =
              localInput.jumpPressed ||
              localInput.firePressed ||
              localInput.reloadPressed ||
              localInput.grenadePressed ||
              localInput.meleePressed ||
              localInput.switchSlotPressed !== null;
            if (hasEdge || netSendAccum >= 1 / 30) {
              netSendAccum = 0;
              if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({ type: 'player:input', input: localInput }),
                );
              }
            }
            rendererRef.current.stepEffects(world, dt);
          } else {
            // Local solo/bot simulation
            const botInputs = computeBotInputs(world, dt);
            stepWorld(
              world,
              { [localPlayerIdRef.current]: localInput, ...botInputs },
              dt,
            );
            rendererRef.current.ingestEvents(world.events);
            rendererRef.current.stepEffects(world, dt);
            processAudioEvents(world.events, me?.x ?? 1000, me?.y ?? 600);
            soundEngine.setJetpackActive(Boolean(me?.alive && me?.jetpackActive));

            hudSyncAccum += dt;
            if (hudSyncAccum >= 0.08 || world.events.length > 0 || world.status === 'ended') {
              hudSyncAccum = 0;
              syncHudFromWorld(world);
            }

            if (world.status === 'ended') {
              finalizeMatch(world);
            }
          }
        }

        // Render Canvas
        const dpr = getDpr();
        const viewW = canvas.width / dpr;
        const viewH = canvas.height / dpr;
        ctx.save();
        ctx.scale(dpr, dpr);

        const focusId = state === 'title' ? null : localPlayerIdRef.current;
        lastCamRef.current = rendererRef.current.render(
          ctx,
          world,
          focusId,
          viewW,
          viewH,
          dt,
          state === 'title',
          scopeZoomLevelRef.current,
        );

        // Tactical Aim Crosshair when playing
        if (state === 'playing') {
          const { x: mx, y: my } = toLogicalCanvasCoords(
            mouseScreenRef.current.x,
            mouseScreenRef.current.y,
          );
          ctx.strokeStyle = 'rgba(248, 250, 252, 0.9)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(mx, my, 9, 0, Math.PI * 2);
          ctx.moveTo(mx - 14, my);
          ctx.lineTo(mx - 5, my);
          ctx.moveTo(mx + 5, my);
          ctx.lineTo(mx + 14, my);
          ctx.moveTo(mx, my - 14);
          ctx.lineTo(mx, my - 5);
          ctx.moveTo(mx, my + 5);
          ctx.lineTo(mx, my + 14);
          ctx.stroke();

          ctx.fillStyle = '#EF4444';
          ctx.beginPath();
          ctx.arc(mx, my, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        // Render Top-Right HUD Tactical Minimap Canvas in real time
        if (state === 'playing' && minimapCanvasRef.current) {
          const miniCtx = minimapCanvasRef.current.getContext('2d');
          if (miniCtx) {
            renderMinimapCanvas(
              miniCtx,
              world,
              localPlayerIdRef.current,
              {
                x: lastCamRef.current.camX,
                y: lastCamRef.current.camY,
                w: lastCamRef.current.viewW,
                h: lastCamRef.current.viewH,
              },
              minimapCanvasRef.current.width,
              minimapCanvasRef.current.height,
              minimapZoomedRef.current,
            );
          }
        }
      }

      const workMs = performance.now() - now;
      if (isAutomation || workMs > 24) {
        yieldTimer = window.setTimeout(() => {
          if (!disposed) rafId = requestAnimationFrame(frame);
        }, isAutomation ? 45 : 16);
      } else {
        rafId = requestAnimationFrame(frame);
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      disposed = true;
      cancelAnimationFrame(rafId);
      if (yieldTimer !== null) clearTimeout(yieldTimer);
      ro.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [finalizeMatch, processAudioEvents, syncHudFromWorld]);

  const showTouchControls =
    settings.touchControls === 'always' ||
    (settings.touchControls === 'auto' && isTouchDevice);

  // If the phone is physically held in portrait and the OS hasn't rotated the WebView yet,
  // automatically rotate the entire app container 90deg into horizontal landscape mode
  const isPortraitRotated = viewportSize.h > viewportSize.w;

  return (
    <main
      data-landscape-rotated={isPortraitRotated ? 'true' : 'false'}
      onPointerDown={() => {
        tryLockLandscape();
      }}
      style={
        isPortraitRotated
          ? {
              position: 'fixed',
              top: 0,
              left: `${viewportSize.w}px`,
              width: `${viewportSize.h}px`,
              height: `${viewportSize.w}px`,
              transformOrigin: '0 0',
              transform: 'rotate(90deg)',
            }
          : undefined
      }
      className={
        isPortraitRotated
          ? 'overflow-hidden bg-[#12151A]'
          : 'relative w-screen h-screen overflow-hidden bg-[#12151A]'
      }
    >
      {/* Full-Bleed Game Viewport Canvas */}
      <canvas
        ref={canvasRef}
        data-testid="game-canvas"
        tabIndex={0}
        onMouseMove={(e) => {
          mouseScreenRef.current = { x: e.clientX, y: e.clientY };
        }}
        onMouseDown={(e) => {
          if (appStateRef.current !== 'playing') return;
          soundEngine.unlock();
          mouseScreenRef.current = { x: e.clientX, y: e.clientY };
          if (e.button === 0) {
            // Check if the player clicked directly on a weapon pickup on the battlefield
            const rect = e.currentTarget.getBoundingClientRect();
            const localX =
              window.innerHeight > window.innerWidth
                ? e.clientY
                : e.clientX - rect.left;
            const localY =
              window.innerHeight > window.innerWidth
                ? window.innerWidth - e.clientX
                : e.clientY - rect.top;
            const scale = lastCamRef.current.scale || 1;
            const worldX = lastCamRef.current.camX + localX / scale;
            const worldY = lastCamRef.current.camY + localY / scale;
            const clickedGun = worldRef.current
              ? findClickedWeaponPickup(worldRef.current, worldX, worldY, 54)
              : null;
            if (clickedGun) {
              pendingEdgesRef.current.pickupTargetId = clickedGun.id;
              return;
            }
            mouseDownRef.current = true;
            pendingEdgesRef.current.firePressed = true;
          } else if (e.button === 2) {
            pendingEdgesRef.current.grenadePressed = true;
          }
        }}
        onWheel={(e) => {
          if (appStateRef.current !== 'playing') return;
          if (Math.abs(e.deltaY) > 4) {
            handleCycleScopeZoom();
          }
        }}
        onMouseUp={(e) => {
          if (e.button === 0) mouseDownRef.current = false;
        }}
        onContextMenu={(e) => e.preventDefault()}
        className={`block w-full h-full outline-none ${
          appState === 'playing' ? 'cursor-crosshair' : 'cursor-default'
        }`}
      />

      {/* Title Screen */}
      {appState === 'title' && (
        <TitleOverlay
          profile={profile}
          settings={settings}
          selectedMode={selectedMode}
          selectedMap={selectedMap}
          onSelectMode={setSelectedMode}
          onSelectMap={setSelectedMap}
          onUpdateProfile={updateProfile}
          onStart={startSoloMatch}
          onOpenArmory={() => setShowArmory(true)}
          onOpenSettings={() => {
            setTitleSettingsTab('character');
            setShowTitleSettings(true);
          }}
          onOpenControlsCustomizer={() => {
            setTitleSettingsTab('controls');
            setShowTitleSettings(true);
          }}
          onOpenMultiplayer={() => setShowMultiplayer(true)}
          onToggleMute={() => updateSettings({ muted: !settings.muted })}
        />
      )}

      {/* Title Screen Settings & Character Customizer Modal */}
      {appState === 'title' && showTitleSettings && (
        <PauseModal
          profile={profile}
          settings={settings}
          onUpdateProfile={updateProfile}
          onUpdateSettings={updateSettings}
          onResume={() => setShowTitleSettings(false)}
          isTitleSettings
          initialTab={titleSettingsTab}
        />
      )}

      {/* Playing HUD */}
      {appState === 'playing' && (
        <GameHud
          worldSnapshot={hudSnapshot}
          player={hudSnapshot.player}
          settings={settings}
          onUpdateSettings={updateSettings}
          showTouchControls={showTouchControls}
          isEditingControls={isEditingControls}
          onToggleEditControls={() => setIsEditingControls((prev) => !prev)}
          touchBridge={touchBridgeRef}
          minimapCanvasRef={minimapCanvasRef}
          minimapZoomed={minimapZoomed}
          onToggleMinimapZoom={() => setMinimapZoomed((prev) => !prev)}
          scopeZoomLevel={scopeZoomLevel}
          onCycleScopeZoom={handleCycleScopeZoom}
          onPause={() => {
            setIsEditingControls(false);
            setAppState('paused');
          }}
          onToggleMute={() => updateSettings({ muted: !settings.muted })}
          onToggleTouch={() =>
            updateSettings({
              touchControls: showTouchControls ? 'off' : 'always',
            })
          }
          isPortraitRotated={isPortraitRotated}
        />
      )}

      {/* In-Game Pause & Settings + Character Customizer Modal */}
      {appState === 'paused' && (
        <PauseModal
          profile={profile}
          settings={settings}
          onUpdateProfile={updateProfile}
          onUpdateSettings={updateSettings}
          onResume={() => setAppState('playing')}
          onStartHudControlEdit={() => {
            setIsEditingControls(true);
            setAppState('playing');
          }}
          onRestart={() => {
            setIsEditingControls(false);
            if (isNetMatch) {
              setAppState('playing');
            } else {
              startSoloMatch();
            }
          }}
          onExitToTitle={() => {
            setIsEditingControls(false);
            exitToTitle();
          }}
        />
      )}

      {/* Victory / Results Modal */}
      {appState === 'gameover' && endWorld && (
        <ResultsModal
          world={endWorld}
          localPlayerId={localPlayerIdRef.current}
          xpEarned={xpEarned}
          profile={profile}
          onPlayAgain={() => {
            if (isNetMatch) {
              setAppState('title');
              setShowMultiplayer(true);
            } else {
              startSoloMatch();
            }
          }}
          onExitToTitle={exitToTitle}
        />
      )}

      {/* Armory & Profile Customization Modal */}
      {showArmory && (
        <ArmoryModal
          profile={profile}
          onUpdateProfile={updateProfile}
          onClose={() => setShowArmory(false)}
        />
      )}

      {/* Real WebSocket Multiplayer Lobby Modal */}
      {showMultiplayer && (
        <MultiplayerModal
          profile={profile}
          connected={wsConnected}
          rooms={netRooms}
          currentRoom={currentRoom}
          localNetId={localNetId}
          errorMsg={netError}
          onRefreshRooms={() => {
            const ws = ensureSocket();
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'room:list' }));
            }
          }}
          onCreateRoom={(opts) => {
            const ws = ensureSocket();
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'room:create',
                  ...opts,
                  playerName: profile.callsign,
                  helmet: profile.helmet,
                  armorColor: profile.armorColor,
                  primaryWeapon: profile.primaryWeapon,
                  secondaryWeapon: profile.secondaryWeapon,
                }),
              );
            }
          }}
          onJoinRoom={(roomId, password) => {
            const ws = ensureSocket();
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(
                JSON.stringify({
                  type: 'room:join',
                  roomId,
                  password,
                  playerName: profile.callsign,
                  helmet: profile.helmet,
                  armorColor: profile.armorColor,
                  primaryWeapon: profile.primaryWeapon,
                  secondaryWeapon: profile.secondaryWeapon,
                }),
              );
            }
          }}
          onLeaveRoom={() => {
            wsRef.current?.send(JSON.stringify({ type: 'room:leave' }));
          }}
          onToggleReady={() => {
            wsRef.current?.send(JSON.stringify({ type: 'room:ready' }));
          }}
          onSwitchTeam={() => {
            wsRef.current?.send(JSON.stringify({ type: 'room:team' }));
          }}
          onStartMatch={() => {
            wsRef.current?.send(JSON.stringify({ type: 'room:start' }));
          }}
          onClose={() => setShowMultiplayer(false)}
        />
      )}
    </main>
  );
}
