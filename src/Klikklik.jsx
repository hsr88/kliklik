import React, { useState, useEffect, useRef } from 'react';
import { Circle, Square, Star, Heart, Zap, Target, Clock, Trophy, Menu, X, Settings, Volume2, VolumeX, Vibrate, Moon, Sun, BarChart3, Play, ChevronRight, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Smartphone, Award, Edit2, Check, Info, Home, LogIn, Copy, Github, Music, Music2, Users } from 'lucide-react';
import { supabase } from './supabase';

const KlikklikGame = () => {
  const [gameState, setGameState] = useState('menu'); // menu, profile, modeSelect, playing, gameOver, settings, leaderboard, achievements, about
  const [selectedMode, setSelectedMode] = useState(null);
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [startTime, setStartTime] = useState(null);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [showResult, setShowResult] = useState(null);
  const [timeLimit, setTimeLimit] = useState(3000);
  const [menuOpen, setMenuOpen] = useState(false);
  const [streak, setStreak] = useState(0);
  const [perfectRound, setPerfectRound] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState(100);
  const [leaderboardTab, setLeaderboardTab] = useState('all');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [hideTimer, setHideTimer] = useState(false);
  
  // Settings
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(() => {
    const saved = localStorage.getItem('klikklikMusic');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [currentTrack, setCurrentTrack] = useState(0);
  const audioRef = useRef(null);
  const [hapticEnabled, setHapticEnabled] = useState(true);

  // Multiplayer state
  const [multiplayerMode, setMultiplayerMode] = useState(false);
  const [gameRoom, setGameRoom] = useState(null);
  const [roomCode, setRoomCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [opponent, setOpponent] = useState(null);
  const [countdown, setCountdown] = useState(null); // 3, 2, 1, null
  const [startingLevel, setStartingLevel] = useState(1);
  const realtimeChannel = useRef(null);

  const [darkMode, setDarkMode] = useState(false);
  
  // Profile & Auth
  const [playerName, setPlayerName] = useState('Gracz');
  const [playerAvatar, setPlayerAvatar] = useState('😊');
  const [editingProfile, setEditingProfile] = useState(false);
  const [tempName, setTempName] = useState('');
  const [profileCode, setProfileCode] = useState('');
  const [loginCode, setLoginCode] = useState('');
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [logoClicked, setLogoClicked] = useState(false);
  const [logoClickCount, setLogoClickCount] = useState(0);
  const logoClickTimer = useRef(null);
  
  // Leaderboard & Achievements
  const [leaderboard, setLeaderboard] = useState([]);
  const [highScore, setHighScore] = useState(0);
  const [achievements, setAchievements] = useState([]);
  const [newAchievement, setNewAchievement] = useState(null);

  const audioContext = useRef(null);
  const timerInterval = useRef(null);
  const menuRef = useRef(null);

  const availableAvatars = [
    '😊', '😎', '🤓', '😺', '🦊', '🐼', '🐨', '🦁', 
    '🚀', '⚡', '🎮', '🎯', '🎨', '🎪', '🎭', '🌟',
    '🔥', '💎', '👑', '🏆'
  ];

  const allAchievements = [
    { id: 'first_click', name: 'Pierwszy krok', description: 'Ukończ pierwsze wyzwanie', icon: '🎯', condition: (stats) => stats.totalClicks >= 1 },
    { id: 'speed_demon', name: 'Demon szybkości', description: 'Reakcja poniżej 150ms', icon: '⚡', condition: (stats) => stats.fastestTime < 150 },
    { id: 'lightning_fast', name: 'Błyskawiczny', description: 'Reakcja poniżej 100ms', icon: '🔥', condition: (stats) => stats.fastestTime < 100 },
    { id: 'perfect_timing', name: 'Perfekcyjne wyczucie', description: 'Reakcja poniżej 75ms', icon: '💎', condition: (stats) => stats.fastestTime < 75 },
    { id: 'speed_god', name: 'Speed God', description: 'Reakcja poniżej 50ms', icon: '⚡💎', condition: (stats) => stats.fastestTime < 50 },
    { id: 'streak_5', name: 'Seria 5', description: 'Zrób serię 5 poprawnych odpowiedzi', icon: '🎪', condition: (stats) => stats.maxStreak >= 5 },
    { id: 'streak_10', name: 'Seria 10', description: 'Zrób serię 10 poprawnych odpowiedzi', icon: '🌟', condition: (stats) => stats.maxStreak >= 10 },
    { id: 'streak_25', name: 'Niepokonany', description: 'Zrób serię 25 poprawnych odpowiedzi', icon: '👑', condition: (stats) => stats.maxStreak >= 25 },
    { id: 'level_5', name: 'W drodze', description: 'Osiągnij poziom 5', icon: '🚀', condition: (stats) => stats.maxLevel >= 5 },
    { id: 'level_10', name: 'Ekspert', description: 'Osiągnij poziom 10', icon: '🏅', condition: (stats) => stats.maxLevel >= 10 },
    { id: 'level_20', name: 'Mistrz', description: 'Osiągnij poziom 20', icon: '🏆', condition: (stats) => stats.maxLevel >= 20 },
    { id: 'score_1000', name: 'Tysiąc', description: 'Zdobądź 1000 punktów w jednej grze', icon: '💯', condition: (stats) => stats.highestScore >= 1000 },
    { id: 'score_5000', name: 'Legenda', description: 'Zdobądź 5000 punktów w jednej grze', icon: '🌠', condition: (stats) => stats.highestScore >= 5000 },
    { id: 'perfect_round', name: 'Perfekcjonista', description: 'Ukończ rundę bez błędów', icon: '✨', condition: (stats) => stats.perfectRounds >= 1 },
    { id: 'all_modes', name: 'Wszechstronny', description: 'Zagraj we wszystkie tryby gry', icon: '🎮', condition: (stats) => stats.modesPlayed >= 5 },
    { id: 'math_master', name: 'Mistrz matematyki', description: 'Ukończ 20 wyzwań matematycznych', icon: '🔢', condition: (stats) => stats.mathCompleted >= 20 },
    { id: 'memory_king', name: 'Król pamięci', description: 'Ukończ 15 wyzwań pamięciowych', icon: '🧠', condition: (stats) => stats.memoryCompleted >= 15 },
    { id: 'color_expert', name: 'Ekspert kolorów', description: 'Ukończ 30 wyzwań kolorystycznych', icon: '🎨', condition: (stats) => stats.colorCompleted >= 30 },
    { id: 'night_owl', name: 'Nocny marek', description: 'Zagraj w ciemnym motywie', icon: '🌙', condition: (stats) => stats.playedDarkMode },
    { id: 'consistent', name: 'Konsekwentny', description: 'Średni czas reakcji poniżej 200ms', icon: '📊', condition: (stats) => stats.avgReactionTime < 200 && stats.avgReactionTime > 0 },
    { id: 'century', name: 'Setka', description: 'Zagraj 100 razy', icon: '💪', condition: (stats) => stats.gamesPlayed >= 100 },
    { id: 'logo_clicker', name: 'Ukryta pasja', description: '10 szybkich kliknięć w logo', icon: '🎭', hidden: true, condition: (stats) => achievements.includes('logo_clicker') },
  ];

  const generateProfileCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      if (i === 3) code += '-';
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code; // Format: XXX-XXX
  };

  const syncProfileToBackend = async () => {
    try {
      // Zapisz profil
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({ 
          code: profileCode, 
          name: playerName, 
          avatar: playerAvatar 
        });
      
      if (profileError) throw profileError;

      // Zapisz ustawienia
      await supabase
        .from('settings')
        .upsert({ 
          code: profileCode, 
          sound: soundEnabled, 
          haptic: hapticEnabled, 
          dark_mode: darkMode 
        });

      // Zapisz statystyki
      const stats = getPlayerStats();
      await supabase
        .from('stats')
        .upsert({ 
          code: profileCode,
          total_clicks: stats.totalClicks || 0,
          fastest_time: stats.fastestTime || 999999,
          max_streak: stats.maxStreak || 0,
          max_level: stats.maxLevel || 0,
          highest_score: stats.highestScore || 0,
          perfect_rounds: stats.perfectRounds || 0,
          modes_played: stats.modesPlayed || 0,
          math_completed: stats.mathCompleted || 0,
          memory_completed: stats.memoryCompleted || 0,
          color_completed: stats.colorCompleted || 0,
          played_dark_mode: stats.playedDarkMode || false,
          avg_reaction_time: stats.avgReactionTime || 0,
          games_played: stats.gamesPlayed || 0,
          played_modes: stats.playedModes || []
        });

      // Zapisz osiągnięcia
      for (const achId of achievements) {
        await supabase
          .from('achievements')
          .upsert({ 
            code: profileCode, 
            achievement_id: achId 
          }, { 
            onConflict: 'code,achievement_id' 
          });
      }

      console.log('✅ Profil zsynchronizowany z Supabase!');
      return true;
    } catch (error) {
      console.error('❌ Błąd synchronizacji Supabase:', error);
      return false;
    }
  };

  const loginWithCode = async (code) => {
    try {
      // Najpierw sprawdź localStorage (fallback)
      const savedProfile = localStorage.getItem('klikklikProfile');
      if (savedProfile) {
        const profile = JSON.parse(savedProfile);
        if (profile.code === code) {
          setPlayerName(profile.name);
          setPlayerAvatar(profile.avatar);
          setProfileCode(code);
          setShowLoginForm(false);
          setLoginCode('');
          return true;
        }
      }

      // Pobierz z Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          settings (*),
          stats (*),
          achievements (achievement_id)
        `)
        .eq('code', code)
        .single();

      if (error || !data) {
        alert('❌ Nieprawidłowy kod!');
        return false;
      }

      // Załaduj profil
      setPlayerName(data.name);
      setPlayerAvatar(data.avatar);
      setProfileCode(code);

      // Załaduj ustawienia
      if (data.settings) {
        setSoundEnabled(data.settings.sound);
        setHapticEnabled(data.settings.haptic);
        setDarkMode(data.settings.dark_mode);
      }

      // Załaduj osiągnięcia
      if (data.achievements) {
        const achIds = data.achievements.map(a => a.achievement_id);
        setAchievements(achIds);
        localStorage.setItem('klikklikAchievements', JSON.stringify(achIds));
      }

      // Zapisz statystyki do localStorage
      if (data.stats) {
        localStorage.setItem('klikklikStats', JSON.stringify({
          totalClicks: data.stats.total_clicks || 0,
          fastestTime: data.stats.fastest_time || Infinity,
          maxStreak: data.stats.max_streak || 0,
          maxLevel: data.stats.max_level || 0,
          highestScore: data.stats.highest_score || 0,
          perfectRounds: data.stats.perfect_rounds || 0,
          modesPlayed: data.stats.modes_played || 0,
          mathCompleted: data.stats.math_completed || 0,
          memoryCompleted: data.stats.memory_completed || 0,
          colorCompleted: data.stats.color_completed || 0,
          playedDarkMode: data.stats.played_dark_mode || false,
          avgReactionTime: data.stats.avg_reaction_time || 0,
          gamesPlayed: data.stats.games_played || 0,
          playedModes: data.stats.played_modes || []
        }));
      }

      // Zapisz profil do localStorage
      localStorage.setItem('klikklikProfile', JSON.stringify({
        name: data.name,
        avatar: data.avatar,
        code: code
      }));

      setShowLoginForm(false);
      setLoginCode('');
      alert('✅ Zalogowano pomyślnie!');
      return true;

    } catch (error) {
      console.error('❌ Błąd logowania:', error);
      alert('❌ Błąd połączenia z serwerem');
      return false;
    }
  };

  const copyProfileCode = () => {
    navigator.clipboard.writeText(profileCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);
  
  // ========== MULTIPLAYER FUNCTIONS ==========
  
  const createMultiplayerRoom = async (mode, level) => {
  try {
    console.log('🏠 Creating room...', { mode, level });
    
    // Generuj kod pokoju
    const { data: codeData } = await supabase.rpc('generate_room_code');
    const newRoomCode = codeData;
    console.log('🎲 Generated room code:', newRoomCode);

    // Stwórz pokój
    const { data: room, error } = await supabase
      .from('game_rooms')
      .insert({
        room_code: newRoomCode,
        host_code: profileCode,
        host_name: playerName,
        host_avatar: playerAvatar,
        game_mode: mode,
        starting_level: level,
        status: 'waiting'
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Failed to create room:', error);
      throw error;
    }

    console.log('✅ Room created:', {
      code: room.room_code,
      host: room.host_name,
      status: room.status
    });

    setGameRoom(room);
    setRoomCode(newRoomCode);
    setIsHost(true);
    setMultiplayerMode(true);
    
    console.log('🔌 Starting subscription for host...');
    // Subskrybuj realtime updates
    subscribeToRoom(newRoomCode);
    
    sounds.success();
    console.log('🎉 Room creation complete!');
    return newRoomCode;
  } catch (error) {
    console.error('❌ Error creating room:', error);
    return null;
  }
};

// ========================================
// FUNKCJA: Dołączenie do pokoju (Guest)
// ========================================

const joinMultiplayerRoom = async (code) => {
  try {
    console.log('🚪 Attempting to join room:', code);
    
    // Sprawdź czy pokój istnieje
    const { data: room, error: fetchError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('room_code', code)
      .eq('status', 'waiting')
      .single();

    if (fetchError || !room) {
      console.error('❌ Room not found or already started:', fetchError);
      alert('Pokój nie istnieje lub już się rozpoczął!');
      return false;
    }

    console.log('✅ Room found:', {
      code: room.room_code,
      host: room.host_name,
      status: room.status
    });

    // Dołącz do pokoju
    console.log('📝 Updating room with guest info...');
    const { error: updateError } = await supabase
      .from('game_rooms')
      .update({
        guest_code: profileCode,
        guest_name: playerName,
        guest_avatar: playerAvatar,
        status: 'ready'
      })
      .eq('room_code', code);

    if (updateError) {
      console.error('❌ Update failed:', updateError);
      throw updateError;
    }

    console.log('✅ Successfully joined room! Setting local state...');
    setGameRoom({ ...room, guest_code: profileCode, guest_name: playerName, guest_avatar: playerAvatar, status: 'ready' });
    setRoomCode(code);
    setIsHost(false);
    setMultiplayerMode(true);
    setGameState('lobby'); // CRITICAL: Set gameState to lobby for guest!
    
    console.log('✅ Guest state set:', {
      roomCode: code,
      isHost: false,
      multiplayerMode: true,
      gameState: 'lobby',
      gameMode: room.game_mode
    });
    
    console.log('🔌 Starting subscription...');
    // Subskrybuj realtime updates
    subscribeToRoom(code);
    
    sounds.success();
    console.log('🎉 Join complete!');
    return true;
  } catch (error) {
    console.error('❌ Error joining room:', error);
    return false;
  }
};

// ========================================
// FUNKCJA: Subskrypcja Realtime
// ========================================

const subscribeToRoom = (code) => {
  console.log('🔌 Subscribing to room:', code);
  
  // Unsubscribe previous channel
  if (realtimeChannel.current) {
    supabase.removeChannel(realtimeChannel.current);
  }

  // Polling jako backup (sprawdza co 2 sekundy)
  const pollInterval = setInterval(async () => {
    try {
      const { data, error } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', code)
        .single();
      
      if (data && !error) {
        console.log('📊 Polling update:', {
          code: data.room_code,
          host: data.host_name,
          guest: data.guest_name || 'waiting...',
          guest_code: data.guest_code,
          status: data.status,
          mode: data.game_mode
        });
        
        // ZAWSZE aktualizuj gameRoom!
        setGameRoom(data);
        
        // Zatrzymaj polling TYLKO gdy gra się zakończy
        if (data.status === 'finished') {
          console.log('⏹️ Stopping polling - game finished');
          clearInterval(pollInterval);
        }
      }
    } catch (err) {
      console.error('❌ Polling error:', err);
    }
  }, 2000); // Co 2 sekundy

  // Subscribe to room updates via Realtime
  const channel = supabase
    .channel(`room:${code}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'game_rooms',
        filter: `room_code=eq.${code}`
      },
      (payload) => {
        console.log('🔔 Realtime update:', payload.eventType, {
          guest_joined: !!payload.new?.guest_code,
          guest_name: payload.new?.guest_name,
          status: payload.new?.status
        });
        
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const updatedRoom = payload.new;
          
          // ZAWSZE aktualizuj gameRoom!
          setGameRoom(updatedRoom);
          
          // Sprawdź status gry
          if (updatedRoom.status === 'finished') {
            handleMultiplayerGameEnd(updatedRoom);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('📡 Subscription status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ Successfully subscribed to room updates');
      } else if (status === 'CHANNEL_ERROR') {
        console.warn('⚠️ Realtime error - using polling as backup');
      }
    });

  realtimeChannel.current = channel;
  
  // Cleanup polling on unmount
  return () => {
    console.log('🧹 Cleaning up subscription');
    clearInterval(pollInterval);
  };
};

// ========================================
// FUNKCJA: Aktualizacja wyniku
// ========================================

const updateMultiplayerScore = async (newScore, newLevel, newLives) => {
  if (!gameRoom || !multiplayerMode) return;

  try {
    const updateData = isHost
      ? { host_score: newScore, host_level: newLevel, host_lives: newLives }
      : { guest_score: newScore, guest_level: newLevel, guest_lives: newLives };

    await supabase
      .from('game_rooms')
      .update(updateData)
      .eq('room_code', roomCode);
  } catch (error) {
    console.error('Error updating score:', error);
  }
};

// ========================================
// FUNKCJA: Rozpoczęcie gry (Host)
// ========================================

const startMultiplayerGame = async () => {
  if (!isHost || !gameRoom) {
    console.log('⚠️ Cannot start game:', { isHost, hasRoom: !!gameRoom });
    return;
  }

  try {
    console.log('🎮 HOST: Starting multiplayer game...', {
      code: roomCode,
      mode: gameRoom.game_mode
    });
    
    // Ustaw status na 'countdown'
    await supabase
      .from('game_rooms')
      .update({
        status: 'countdown',
        started_at: new Date().toISOString()
      })
      .eq('room_code', roomCode);

    console.log('✅ Database updated to status=countdown');
    
    // Rozpocznij countdown lokalnie dla hosta
    console.log('⏰ Starting countdown 3-2-1...');
    startCountdown(gameRoom.game_mode);
    
    console.log('✅ Countdown started!');
  } catch (error) {
    console.error('❌ Error starting game:', error);
  }
};

// Funkcja countdown
const startCountdown = (mode) => {
  console.log('⏰⏰⏰ startCountdown CALLED!', {
    mode: mode,
    isHost: isHost,
    gameState: gameState,
    countdown: countdown
  });
  
  setCountdown(3);
  console.log('✅ Countdown set to 3');
  sounds.menuClick();
  
  setTimeout(() => {
    console.log('⏰ Countdown: 2');
    setCountdown(2);
    sounds.menuClick();
    
    setTimeout(() => {
      console.log('⏰ Countdown: 1');
      setCountdown(1);
      sounds.menuClick();
      
      setTimeout(() => {
        console.log('⏰ Countdown: NULL - Starting game!');
        setCountdown(null);
        console.log('🎮 Countdown finished! Starting game with mode:', mode);
        
        // Teraz dopiero startuj grę
        setGameState('playing');
        console.log('✅ gameState set to playing');
        
        startGame(mode);
        console.log('✅ startGame called with mode:', mode);
        
        // Aktualizuj status w bazie na 'playing'
        if (isHost) {
          console.log('📝 HOST: Updating database to playing...');
          supabase
            .from('game_rooms')
            .update({ status: 'playing' })
            .eq('room_code', roomCode);
        }
      }, 1000);
    }, 1000);
  }, 1000);
};

// ========================================
// FUNKCJA: Zakończenie gry
// ========================================

const handleMultiplayerGameEnd = (room) => {
  // Sprawdź kto wygrał
  const hostScore = room.host_score;
  const guestScore = room.guest_score;
  const hostLives = room.host_lives;
  const guestLives = room.guest_lives;

  let winner = null;
  
  // Logika wygranej
  if (hostLives <= 0 && guestLives > 0) {
    winner = room.guest_code;
  } else if (guestLives <= 0 && hostLives > 0) {
    winner = room.host_code;
  } else if (hostLives <= 0 && guestLives <= 0) {
    // Obu game over - wygrywa ten z większym score
    winner = hostScore > guestScore ? room.host_code : room.guest_code;
  } else {
    // Gra zakończona normalnie - wygrywa ten z większym score
    winner = hostScore > guestScore ? room.host_code : room.guest_code;
  }

  // Aktualizuj zwycięzcę
  if (isHost) {
    supabase
      .from('game_rooms')
      .update({ winner, finished_at: new Date().toISOString() })
      .eq('room_code', roomCode);
  }

  // Pokaż ekran końcowy
  setGameState('multiplayerEnd');
};

// ========================================
// FUNKCJA: Opuszczenie pokoju
// ========================================

const leaveMultiplayerRoom = async () => {
  if (!gameRoom) return;

  try {
    if (isHost) {
      // Host usuwa pokój
      await supabase
        .from('game_rooms')
        .delete()
        .eq('room_code', roomCode);
    } else {
      // Guest ustawia status na waiting
      await supabase
        .from('game_rooms')
        .update({
          guest_code: null,
          guest_name: null,
          guest_avatar: null,
          status: 'waiting'
        })
        .eq('room_code', roomCode);
    }

    // Cleanup
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
      realtimeChannel.current = null;
    }

    setMultiplayerMode(false);
    setGameRoom(null);
    setRoomCode('');
    setIsHost(false);
    setOpponent(null);
    setGameState('menu');
  } catch (error) {
    console.error('Error leaving room:', error);
  }
};

// ========================================
  useEffect(() => {
    // Load all data from localStorage
    const savedSettings = localStorage.getItem('klikklikSettings');
    if (savedSettings) {
      const settings = JSON.parse(savedSettings);
      setSoundEnabled(settings.sound ?? true);
      setHapticEnabled(settings.haptic ?? true);
      setDarkMode(settings.darkMode ?? false);
    }

    const savedProfile = localStorage.getItem('klikklikProfile');
    if (savedProfile) {
      const profile = JSON.parse(savedProfile);
      setPlayerName(profile.name || 'Gracz');
      setPlayerAvatar(profile.avatar || '😊');
      setProfileCode(profile.code || generateProfileCode());
    } else {
      const newCode = generateProfileCode();
      setProfileCode(newCode);
      localStorage.setItem('klikklikProfile', JSON.stringify({
        name: 'Gracz',
        avatar: '😊',
        code: newCode
      }));
    }

    const savedLeaderboard = localStorage.getItem('klikklikLeaderboard');
    if (savedLeaderboard) {
      setLeaderboard(JSON.parse(savedLeaderboard));
    }

    const savedHighScore = localStorage.getItem('klikklikHighScore');
    if (savedHighScore) {
      setHighScore(parseInt(savedHighScore));
    }

    const savedAchievements = localStorage.getItem('klikklikAchievements');
    if (savedAchievements) {
      setAchievements(JSON.parse(savedAchievements));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('klikklikSettings', JSON.stringify({
      sound: soundEnabled,
      haptic: hapticEnabled,
      darkMode: darkMode
    }));
  }, [soundEnabled, hapticEnabled, darkMode]);

  // Music system
  const musicTracks = [
    '/music/lavender-dreams.mp3',
    '/music/pixel-sunset.mp3',
    '/music/morning-coffee.mp3',
    '/music/focus.mp3'
  ];

  // Debug: Log gameRoom changes in lobby
  useEffect(() => {
    if (gameState === 'lobby' && gameRoom) {
      console.log('🏠 LOBBY STATE:', {
        code: gameRoom.room_code,
        host: gameRoom.host_name,
        guest: gameRoom.guest_name || '❌ WAITING',
        guest_code: gameRoom.guest_code || '❌ NULL',
        status: gameRoom.status,
        isHost: isHost
      });
    }
  }, [gameRoom, gameState, isHost]);

  // CRITICAL: Start countdown/game for guest when host starts
  useEffect(() => {
    console.log('🔍 useEffect GUEST check:', {
      hasGameRoom: !!gameRoom,
      gameRoomStatus: gameRoom?.status,
      gameState: gameState,
      isHost: isHost,
      countdown: countdown
    });
    
    // Countdown rozpoczęty
    if (gameRoom && gameRoom.status === 'countdown' && gameState === 'lobby' && !isHost) {
      console.log('⏰ GUEST: Countdown started by host! Mode:', gameRoom.game_mode);
      console.log('📋 Full gameRoom:', gameRoom);
      startCountdown(gameRoom.game_mode);
    } else {
      console.log('❌ Countdown condition NOT MET:', {
        hasGameRoom: !!gameRoom,
        statusIsCountdown: gameRoom?.status === 'countdown',
        stateIsLobby: gameState === 'lobby',
        isNotHost: !isHost
      });
    }
    
    // Note: startGame is now called inside startCountdown after countdown finishes
  }, [gameRoom, gameState, isHost, countdown]);

  // Update opponent data in real-time during game
  useEffect(() => {
    if (multiplayerMode && gameRoom && gameState === 'playing') {
      if (isHost && gameRoom.guest_code) {
        setOpponent({
          name: gameRoom.guest_name,
          avatar: gameRoom.guest_avatar,
          score: gameRoom.guest_score,
          level: gameRoom.guest_level,
          lives: gameRoom.guest_lives
        });
      } else if (!isHost) {
        setOpponent({
          name: gameRoom.host_name,
          avatar: gameRoom.host_avatar,
          score: gameRoom.host_score,
          level: gameRoom.host_level,
          lives: gameRoom.host_lives
        });
      }
    }
  }, [gameRoom, multiplayerMode, gameState, isHost]);

  useEffect(() => {
    localStorage.setItem('klikklikMusic', JSON.stringify(musicEnabled));
  }, [musicEnabled]);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = 0.3; // 30% volume - subtle background
      audioRef.current.loop = false; // We handle looping manually for track switching
    }

    const audio = audioRef.current;

    const playNextTrack = () => {
      if (!musicEnabled) return;
      
      const nextTrack = Math.floor(Math.random() * musicTracks.length);
      setCurrentTrack(nextTrack);
      audio.src = musicTracks[nextTrack];
      audio.play().catch(err => console.log('Music autoplay prevented:', err));
    };

    const handleEnded = () => {
      playNextTrack();
    };

    if (musicEnabled) {
      if (!audio.src || audio.paused) {
        playNextTrack();
      }
      audio.addEventListener('ended', handleEnded);
    } else {
      audio.pause();
    }

    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [musicEnabled]);

  const toggleMusic = () => {
    setMusicEnabled(!musicEnabled);
    if (!musicEnabled && audioRef.current) {
      // When enabling music, start playing
      const randomTrack = Math.floor(Math.random() * musicTracks.length);
      setCurrentTrack(randomTrack);
      audioRef.current.src = musicTracks[randomTrack];
      audioRef.current.play().catch(err => console.log('Music play error:', err));
    } else if (audioRef.current) {
      // When disabling, pause
      audioRef.current.pause();
    }
  };

  useEffect(() => {
    localStorage.setItem('klikklikProfile', JSON.stringify({
      name: playerName,
      avatar: playerAvatar,
      code: profileCode
    }));
  }, [playerName, playerAvatar, profileCode]);

  // Timer countdown effect
  useEffect(() => {
    if (gameState === 'playing' && currentChallenge && 
        !selectedMode?.noTimeLimit && 
        !currentChallenge.showing &&
        currentChallenge.type !== 'fastClick' &&
        !hideTimer) {
      
      const startTimer = Date.now();
      
      timerInterval.current = setInterval(() => {
        const elapsed = Date.now() - startTimer;
        const remaining = Math.max(0, 100 - (elapsed / timeLimit) * 100);
        setTimeRemaining(remaining);
      }, 50);

      return () => {
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
        }
      };
    } else {
      setTimeRemaining(100);
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    }
  }, [currentChallenge, gameState, timeLimit, selectedMode, hideTimer]);

  const getPlayerStats = () => {
    const stats = JSON.parse(localStorage.getItem('klikklikStats') || '{}');
    return {
      totalClicks: stats.totalClicks || 0,
      fastestTime: stats.fastestTime || Infinity,
      maxStreak: stats.maxStreak || 0,
      maxLevel: stats.maxLevel || 0,
      highestScore: stats.highestScore || 0,
      perfectRounds: stats.perfectRounds || 0,
      modesPlayed: stats.modesPlayed || 0,
      mathCompleted: stats.mathCompleted || 0,
      memoryCompleted: stats.memoryCompleted || 0,
      colorCompleted: stats.colorCompleted || 0,
      playedDarkMode: stats.playedDarkMode || false,
      avgReactionTime: stats.avgReactionTime || 0,
      gamesPlayed: stats.gamesPlayed || 0,
      playedModes: stats.playedModes || []
    };
  };

  const updatePlayerStats = (updates) => {
    const currentStats = getPlayerStats();
    const newStats = { ...currentStats, ...updates };
    localStorage.setItem('klikklikStats', JSON.stringify(newStats));
    checkAchievements(newStats);
  };

  const checkAchievements = (stats) => {
    const currentAchievements = [...achievements];
    let newUnlocked = [];

    allAchievements.forEach(achievement => {
      if (!currentAchievements.includes(achievement.id) && achievement.condition(stats)) {
        currentAchievements.push(achievement.id);
        newUnlocked.push(achievement);
      }
    });

    if (newUnlocked.length > 0) {
      setAchievements(currentAchievements);
      localStorage.setItem('klikklikAchievements', JSON.stringify(currentAchievements));
      
      setNewAchievement(newUnlocked[0]);
      sounds.achievement();
      triggerHaptic('success');
      
      setTimeout(() => setNewAchievement(null), 3000);
    }
  };

  // Pentatonic scale (C major pentatonic) - przyjemne, pastelowe nuty
  const pentatonicNotes = {
    C4: 261.63,
    D4: 293.66,
    E4: 329.63,
    G4: 392.00,
    A4: 440.00,
    C5: 523.25,
    D5: 587.33,
    E5: 659.25,
    G5: 783.99,
    A5: 880.00
  };

  // Przyjemniejsza funkcja dźwięku z ADSR envelope
  const playSound = (frequency, duration = 100, type = 'sine') => {
    if (!soundEnabled) return;
    
    try {
      if (!audioContext.current) {
        audioContext.current = new (window.AudioContext || window.webkitAudioContext)();
      }
      
      const ctx = audioContext.current;
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      // ADSR Envelope - miękkie wejście i wyjście
      const now = ctx.currentTime;
      const attackTime = 0.02; // 20ms attack
      const releaseTime = duration / 1000 * 0.3; // 30% czasu na release
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + attackTime); // Cichsze (0.15 zamiast 0.3)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
      
      oscillator.start(now);
      oscillator.stop(now + duration / 1000);
    } catch (err) {
      console.log('Audio not supported');
    }
  };

  // Preset sounds - łatwe w użyciu, przyjemne dźwięki
  const sounds = {
    click: () => playSound(pentatonicNotes.E4, 80, 'sine'),
    success: () => {
      // Delikatny chord (E5 + G5)
      playSound(pentatonicNotes.E5, 150, 'sine');
      setTimeout(() => playSound(pentatonicNotes.G5, 120, 'sine'), 50);
    },
    fail: () => playSound(pentatonicNotes.C4, 200, 'sine'), // Niski, spokojny ton
    levelup: () => {
      // Wznoszący się arpeggio C5 -> E5 -> G5 -> C6
      playSound(pentatonicNotes.C5, 100, 'sine');
      setTimeout(() => playSound(pentatonicNotes.E5, 100, 'sine'), 80);
      setTimeout(() => playSound(pentatonicNotes.G5, 100, 'sine'), 160);
      setTimeout(() => playSound(1046.50, 150, 'sine'), 240); // C6
    },
    achievement: () => {
      // Przyjemna melodia G4 -> A4 -> C5 -> E5
      playSound(pentatonicNotes.G4, 120, 'sine');
      setTimeout(() => playSound(pentatonicNotes.A4, 120, 'sine'), 100);
      setTimeout(() => playSound(pentatonicNotes.C5, 120, 'sine'), 200);
      setTimeout(() => playSound(pentatonicNotes.E5, 200, 'sine'), 300);
    },
    memory: (index) => {
      // Pentatoniczne nuty dla sekwencji
      const notes = [
        pentatonicNotes.C5,
        pentatonicNotes.D5,
        pentatonicNotes.E5,
        pentatonicNotes.G5,
        pentatonicNotes.A5
      ];
      playSound(notes[index % notes.length], 100, 'sine');
    },
    menuClick: () => playSound(pentatonicNotes.G4, 60, 'sine'),
    toggle: () => playSound(pentatonicNotes.A4, 80, 'sine')
  };


  const triggerHaptic = (type = 'medium') => {
    if (!hapticEnabled) return;
    
    if (navigator.vibrate) {
      switch(type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(30);
          break;
        case 'heavy':
          navigator.vibrate(50);
          break;
        case 'success':
          navigator.vibrate([30, 10, 30]);
          break;
        case 'error':
          navigator.vibrate([50, 30, 50, 30, 50]);
          break;
        default:
          navigator.vibrate(20);
      }
    }
  };

  const icons = [
    { Icon: Circle, name: 'circle', label: 'kółko' },
    { Icon: Square, name: 'square', label: 'kwadrat' },
    { Icon: Star, name: 'star', label: 'gwiazdka' },
    { Icon: Heart, name: 'heart', label: 'serce' },
    { Icon: Zap, name: 'zap', label: 'błyskawica' },
    { Icon: Target, name: 'target', label: 'cel' }
  ];

  const colors = [
    { name: 'czerwony', bg: 'bg-red-500', text: 'Czerwony' },
    { name: 'niebieski', bg: 'bg-sky-400', text: 'Niebieski' },
    { name: 'zielony', bg: 'bg-green-400', text: 'Zielony' },
    { name: 'żółty', bg: 'bg-yellow-300', text: 'Żółty' },
    { name: 'fioletowy', bg: 'bg-violet-400', text: 'Fioletowy' },
    { name: 'różowy', bg: 'bg-pink-300', text: 'Różowy' },
    { name: 'pomarańczowy', bg: 'bg-orange-300', text: 'Pomarańczowy' },
    { name: 'limonkowy', bg: 'bg-lime-400', text: 'Limonkowy' }
  ];

  const directions = [
    { Icon: ArrowUp, name: 'up', label: 'Góra' },
    { Icon: ArrowDown, name: 'down', label: 'Dół' },
    { Icon: ArrowLeft, name: 'left', label: 'Lewo' },
    { Icon: ArrowRight, name: 'right', label: 'Prawo' }
  ];

  const gameModes = [
    {
      id: 'classic',
      name: 'Classic',
      description: 'Standardowa gra z rosnącą trudnością',
      icon: Play,
      color: 'from-sky-400 to-blue-400',
      lives: 3,
      speedMultiplier: 1
    },
    {
      id: 'speed',
      name: 'Speed',
      description: 'Szybsza rozgrywka dla zaawansowanych',
      icon: Zap,
      color: 'from-yellow-300 to-amber-400',
      lives: 3,
      speedMultiplier: 1.5
    },
    {
      id: 'precision',
      name: 'Precision',
      description: 'Jedno życie, podwójne punkty',
      icon: Target,
      color: 'from-violet-400 to-purple-400',
      lives: 1,
      speedMultiplier: 1,
      pointsMultiplier: 2
    },
    {
      id: 'endless',
      name: 'Endless',
      description: 'Nieskończona rozgrywka na czas',
      icon: Clock,
      color: 'from-green-400 to-emerald-400',
      lives: Infinity,
      speedMultiplier: 1,
      timeLimit: 120
    },
    {
      id: 'zen',
      name: 'Zen',
      description: 'Relaksująca gra bez presji czasu',
      icon: Heart,
      color: 'from-rose-400 to-pink-400',
      lives: 3,
      noTimeLimit: true
    }
  ];

  const getAvailableChallengeTypes = (level) => {
    const types = ['clickCircle', 'selectColor', 'clickIcon', 'fastClick'];
    
    if (level >= 3) types.push('memoryColor');
    if (level >= 5) types.push('mathQuiz');
    if (level >= 7) types.push('directionArrow');
    if (level >= 10) types.push('sequenceMemory');
    if (level >= 12) types.push('colorWord');
    if (level >= 15) types.push('multiClick');
    
    return types;
  };

  const generateChallenge = () => {
    const types = getAvailableChallengeTypes(level);
    const type = types[Math.floor(Math.random() * types.length)];
    
    switch(type) {
      case 'clickCircle':
        return {
          type: 'clickCircle',
          x: Math.random() * 70 + 10,
          y: Math.random() * 60 + 10,
          instruction: 'Kliknij kółko!'
        };
      
      case 'selectColor':
        const targetColor = colors[Math.floor(Math.random() * colors.length)];
        const otherColors = colors.filter(c => c.name !== targetColor.name);
        const shuffled = [targetColor, ...otherColors.slice(0, 3)].sort(() => Math.random() - 0.5);
        return {
          type: 'selectColor',
          target: targetColor,
          options: shuffled,
          instruction: `Kliknij: ${targetColor.text}`,
          category: 'color'
        };
      
      case 'clickIcon':
        const targetIcon = icons[Math.floor(Math.random() * icons.length)];
        const otherIcons = icons.filter(i => i.name !== targetIcon.name);
        const shuffledIcons = [targetIcon, ...otherIcons.slice(0, 5)].sort(() => Math.random() - 0.5);
        return {
          type: 'clickIcon',
          target: targetIcon,
          options: shuffledIcons,
          instruction: `Kliknij: ${targetIcon.label}`
        };
      
      case 'fastClick':
        const delay = Math.random() * 2000 + 1000;
        return {
          type: 'fastClick',
          delay: delay,
          instruction: 'Czekaj...',
          readyInstruction: 'KLIKNIJ TERAZ!',
          isReady: false
        };

      case 'memoryColor':
        const memoryColor = colors[Math.floor(Math.random() * colors.length)];
        const otherMemoryColors = colors.filter(c => c.name !== memoryColor.name);
        // POPRAWKA: Upewnij się, że target color jest w opcjach
        const memoryOptions = [memoryColor, ...otherMemoryColors.slice(0, 3)].sort(() => Math.random() - 0.5);
        const showTime = 1000;
        return {
          type: 'memoryColor',
          target: memoryColor,
          options: memoryOptions,
          instruction: 'Zapamiętaj kolor...',
          secondInstruction: 'Który kolor był pokazany?',
          showTime: showTime,
          showing: true,
          category: 'memory'
        };

      case 'mathQuiz':
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operations = ['+', '-'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const answer = operation === '+' ? num1 + num2 : num1 - num2;
        const wrongAnswers = [answer + 1, answer - 1, answer + 2].slice(0, 2);
        const allAnswers = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        return {
          type: 'mathQuiz',
          question: `${num1} ${operation} ${num2}`,
          answer: answer,
          options: allAnswers,
          instruction: 'Policz szybko!',
          category: 'math'
        };

      case 'directionArrow':
        const targetDirection = directions[Math.floor(Math.random() * directions.length)];
        const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
        return {
          type: 'directionArrow',
          target: targetDirection,
          options: shuffledDirections,
          instruction: `Kliknij strzałkę: ${targetDirection.label}`
        };

      case 'sequenceMemory':
        const sequenceLength = Math.min(3 + Math.floor(level / 5), 6);
        const sequence = Array.from({ length: sequenceLength }, () => 
          Math.floor(Math.random() * 9)
        );
        return {
          type: 'sequenceMemory',
          sequence: sequence,
          userSequence: [],
          currentIndex: 0,
          instruction: 'Zapamiętaj sekwencję...',
          secondInstruction: 'Powtórz sekwencję',
          showing: true,
          showTime: 2000,
          category: 'memory'
        };

      case 'colorWord':
        const wordColors = colors.slice(0, 4);
        const wordColor = wordColors[Math.floor(Math.random() * wordColors.length)];
        const textColor = wordColors[Math.floor(Math.random() * wordColors.length)];
        return {
          type: 'colorWord',
          word: wordColor.text,
          color: textColor,
          options: wordColors,
          instruction: 'Kliknij KOLOR tekstu, nie słowo!',
          category: 'color'
        };

      case 'multiClick':
        const targetCount = Math.floor(Math.random() * 3) + 2;
        return {
          type: 'multiClick',
          targetCount: targetCount,
          clickCount: 0,
          instruction: `Kliknij ${targetCount} razy!`
        };
      
      default:
        return null;
    }
  };

  const startGame = (mode) => {
    console.log('🎮 startGame() called:', {
      mode,
      isHost,
      multiplayerMode
    });
    
    const modeConfig = gameModes.find(m => m.id === mode);
    console.log('📋 Mode config:', modeConfig);
    
    setSelectedMode(modeConfig);
    setGameState('playing');
    setScore(0);
    setLives(modeConfig.lives);
    setLevel(1);
    setReactionTimes([]);
    setTimeLimit(modeConfig.noTimeLimit ? Infinity : 3000);
    setStreak(0);
    setPerfectRound(true);
    setHideTimer(false);
    sounds.click();
    
    const stats = getPlayerStats();
    const playedModes = stats.playedModes || [];
    if (!playedModes.includes(mode)) {
      playedModes.push(mode);
    }
    updatePlayerStats({
      gamesPlayed: stats.gamesPlayed + 1,
      modesPlayed: playedModes.length,
      playedModes: playedModes,
      playedDarkMode: darkMode || stats.playedDarkMode
    });
    
    console.log('🎯 Starting new challenge...');
    startNewChallenge();
    console.log('✅ startGame() complete!');
  };

  const startNewChallenge = () => {
    const challenge = generateChallenge();
    setCurrentChallenge(challenge);
    setStartTime(Date.now());
    setShowResult(null);
    setTimeRemaining(100);
    setHideTimer(false);
    sounds.menuClick();

    if (challenge.type === 'fastClick') {
      setTimeout(() => {
        setCurrentChallenge(prev => ({ ...prev, isReady: true }));
        setStartTime(Date.now());
        sounds.click();
        triggerHaptic('medium');
      }, challenge.delay);
    }

    if (challenge.type === 'memoryColor') {
      setTimeout(() => {
        setCurrentChallenge(prev => ({ ...prev, showing: false }));
        setStartTime(Date.now());
      }, challenge.showTime);
    }

    if (challenge.type === 'sequenceMemory') {
      setTimeout(() => {
        setCurrentChallenge(prev => ({ ...prev, showing: false }));
        setStartTime(Date.now());
      }, challenge.showTime);
    }
  };

  const handleSuccess = (reactionTime) => {
    setHideTimer(true);
    
    const basePoints = Math.max(100 - Math.floor(reactionTime / 10), 10);
    const multiplier = selectedMode?.pointsMultiplier || 1;
    const points = Math.floor(basePoints * multiplier);
    
    const newScore = score + points;
    setScore(newScore);
    setReactionTimes(prev => [...prev, reactionTime]);
    setShowResult({ type: 'success', time: reactionTime, points });
    setStreak(prev => prev + 1);
    
    sounds.success();
    triggerHaptic('success');

    const stats = getPlayerStats();
    const newMaxStreak = Math.max(stats.maxStreak, streak + 1);
    const newFastest = Math.min(stats.fastestTime, reactionTime);
    
    let updates = {
      totalClicks: stats.totalClicks + 1,
      fastestTime: newFastest,
      maxStreak: newMaxStreak
    };

    if (currentChallenge?.category === 'math') {
      updates.mathCompleted = (stats.mathCompleted || 0) + 1;
    }
    if (currentChallenge?.category === 'memory') {
      updates.memoryCompleted = (stats.memoryCompleted || 0) + 1;
    }
    if (currentChallenge?.category === 'color') {
      updates.colorCompleted = (stats.colorCompleted || 0) + 1;
    }

    updatePlayerStats(updates);

    let newLevel = level;
    if (newScore >= level * 500) {
      newLevel = level + 1;
      setLevel(newLevel);
      const speedMult = selectedMode?.speedMultiplier || 1;
      if (!selectedMode?.noTimeLimit) {
        setTimeLimit(prev => Math.max(prev - (200 * speedMult), 1000));
      }
      
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 2000);
      
      sounds.levelup();
      triggerHaptic('heavy');
      
      updatePlayerStats({
        maxLevel: Math.max(stats.maxLevel, newLevel)
      });
    }

    // MULTIPLAYER: Sync score to database
    if (multiplayerMode) {
      updateMultiplayerScore(newScore, newLevel, lives);
    }

    setTimeout(() => {
      startNewChallenge();
    }, 800);
  };

  const handleFailure = () => {
    setHideTimer(true);
    
    const newLives = lives - 1;
    setLives(newLives);
    setShowResult({ type: 'failure' });
    setStreak(0);
    setPerfectRound(false);
    
    sounds.fail();
    triggerHaptic('error');

    // MULTIPLAYER: Sync lives to database
    if (multiplayerMode) {
      updateMultiplayerScore(score, level, newLives);
    }

    if (newLives <= 0) {
      // MULTIPLAYER: Game over - zakończ grę multiplayer
      if (multiplayerMode) {
        handleMultiplayerGameOver();
      } else {
        saveScore();
      }
      
      setTimeout(() => {
        if (multiplayerMode) {
          setGameState('multiplayerEnd');
        } else {
          setGameState('gameOver');
        }
      }, 800);
    } else {
      setTimeout(() => {
        startNewChallenge();
      }, 800);
    }
  };

  const handleMultiplayerGameOver = async () => {
    if (!gameRoom) return;
    
    console.log('🏁 Multiplayer game over!', {
      myScore: score,
      myLives: 0,
      opponentScore: opponent?.score,
      opponentLives: opponent?.lives
    });
    
    try {
      // Ustaw status na finished
      await supabase
        .from('game_rooms')
        .update({ status: 'finished', finished_at: new Date().toISOString() })
        .eq('room_code', roomCode);
      
      console.log('✅ Game status updated to finished');
    } catch (error) {
      console.error('❌ Error finishing game:', error);
    }
  };

  const saveScore = async () => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('klikklikHighScore', score.toString());
    }

    const avgTime = reactionTimes.length > 0 
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) 
      : 0;

    const newEntry = {
      score: score,
      level: level,
      mode: selectedMode.id,
      modeName: selectedMode.name,
      avgTime: avgTime,
      date: new Date().toISOString(),
      playerName: playerName,
      playerAvatar: playerAvatar
    };

    // Zapisz lokalnie
    const updatedLeaderboard = [...leaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);

    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('klikklikLeaderboard', JSON.stringify(updatedLeaderboard));

    // Zapisz do Supabase
    try {
      await supabase
        .from('leaderboard')
        .insert({
          code: profileCode,
          player_name: playerName,
          player_avatar: playerAvatar,
          score: score,
          level: level,
          mode: selectedMode.id,
          mode_name: selectedMode.name,
          avg_time: avgTime
        });
      console.log('✅ Wynik zapisany do leaderboard!');
    } catch (error) {
      console.error('❌ Błąd zapisu do leaderboard:', error);
    }

    // Zaktualizuj statystyki
    const stats = getPlayerStats();
    updatePlayerStats({
      highestScore: Math.max(stats.highestScore, score),
      perfectRounds: perfectRound ? (stats.perfectRounds || 0) + 1 : stats.perfectRounds,
      avgReactionTime: avgTime
    });

    // Synchronizuj profil z backendem
    await syncProfileToBackend();
  };

  const handleClick = (isCorrect, itemId = null) => {
    if (!currentChallenge || showResult) return;

    triggerHaptic('light');
    const reactionTime = Date.now() - startTime;

    if (currentChallenge.type === 'fastClick' && !currentChallenge.isReady) {
      handleFailure();
      return;
    }

    if (currentChallenge.type === 'multiClick') {
      const newCount = currentChallenge.clickCount + 1;
      if (newCount >= currentChallenge.targetCount) {
        handleSuccess(reactionTime);
      } else {
        setCurrentChallenge(prev => ({ ...prev, clickCount: newCount }));
        sounds.menuClick();
      }
      return;
    }

    if (currentChallenge.type === 'sequenceMemory' && !currentChallenge.showing) {
      const newSequence = [...currentChallenge.userSequence, itemId];
      const currentIdx = currentChallenge.currentIndex;
      
      if (itemId !== currentChallenge.sequence[currentIdx]) {
        handleFailure();
        return;
      }
      
      if (newSequence.length === currentChallenge.sequence.length) {
        handleSuccess(reactionTime);
      } else {
        setCurrentChallenge(prev => ({
          ...prev,
          userSequence: newSequence,
          currentIndex: currentIdx + 1
        }));
        sounds.memory(currentIdx);
      }
      return;
    }

    if (isCorrect) {
      handleSuccess(reactionTime);
    } else {
      handleFailure();
    }
  };

  useEffect(() => {
    if (gameState === 'playing' && currentChallenge && 
        currentChallenge.type !== 'fastClick' && 
        !selectedMode?.noTimeLimit &&
        !currentChallenge.showing) {
      const timer = setTimeout(() => {
        if (!showResult) {
          handleFailure();
        }
      }, timeLimit);

      return () => clearTimeout(timer);
    }
  }, [currentChallenge, gameState, showResult, timeLimit]);

  // Cleanup multiplayer realtime channel
  useEffect(() => {
    return () => {
      if (realtimeChannel.current) {
        supabase.removeChannel(realtimeChannel.current);
      }
    };
  }, []);

  const avgReactionTime = reactionTimes.length > 0 
    ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
    : 0;

  const getLeaderboardByMode = (modeId) => {
    if (modeId === 'all') {
      return leaderboard.slice(0, 10);
    }
    return leaderboard.filter(entry => entry.mode === modeId).slice(0, 10);
  };

  const HamburgerMenu = () => (
    <div ref={menuRef} className={`fixed top-0 right-0 z-50 ${menuOpen ? 'w-80' : 'w-0'} h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl transition-all duration-300 overflow-hidden`}>
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Menu</h2>
          <button 
            onClick={() => setMenuOpen(false)} 
            className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition`}
          >
            <X className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
          </button>
        </div>

        <div className="space-y-3">
          {gameState === 'playing' && (
            <button
              onClick={() => {
                setGameState('menu');
                setMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 p-4 ${darkMode ? 'hover:bg-gray-700 bg-red-900/30' : 'hover:bg-red-50 bg-red-50'} rounded-xl transition`}
            >
              <Home className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-rose-500'}`} />
              <span className={`font-semibold ${darkMode ? 'text-red-400' : 'text-rose-500'}`}>Powrót do menu</span>
            </button>
          )}

          <button
            onClick={() => {
              setGameState('about');
              setMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-xl transition`}
          >
            <Info className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-400'}`} />
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>O grze</span>
          </button>

          <button
            onClick={() => {
              setGameState('achievements');
              setMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-xl transition`}
          >
            <Award className={`w-6 h-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-400'}`} />
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Osiągnięcia</span>
            <span className={`ml-auto text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {achievements.length}/{allAchievements.filter(a => !a.hidden || achievements.includes(a.id)).length}
            </span>
          </button>

          <button
            onClick={() => {
              setGameState('leaderboard');
              setMenuOpen(false);
            }}
            className={`w-full flex items-center gap-3 p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-xl transition`}
          >
            <BarChart3 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-400'}`} />
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tablica wyników</span>
          </button>

          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4 mt-4`}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Settings className="w-5 h-5" />
              Ustawienia
            </h3>

            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-violet-50'} rounded-lg`}>
                <div className="flex items-center gap-2">
                  {musicEnabled ? 
                    <Music className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} /> : 
                    <Music2 className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
                  }
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>Muzyka</span>
                </div>
                <button
                  onClick={toggleMusic}
                  className={`w-12 h-6 rounded-full transition ${musicEnabled ? 'bg-purple-400' : 'bg-gray-300'} relative`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${musicEnabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-violet-50'} rounded-lg`}>
                <div className="flex items-center gap-2">
                  {soundEnabled ? 
                    <Volume2 className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} /> : 
                    <VolumeX className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
                  }
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>Dźwięk</span>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`w-12 h-6 rounded-full transition ${soundEnabled ? 'bg-green-400' : 'bg-gray-300'} relative`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${soundEnabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-violet-50'} rounded-lg`}>
                <div className="flex items-center gap-2">
                  <Vibrate className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>Wibracje</span>
                </div>
                <button
                  onClick={() => setHapticEnabled(!hapticEnabled)}
                  className={`w-12 h-6 rounded-full transition ${hapticEnabled ? 'bg-green-400' : 'bg-gray-300'} relative`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${hapticEnabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>

              <div className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-violet-50'} rounded-lg`}>
                <div className="flex items-center gap-2">
                  {darkMode ? 
                    <Moon className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} /> : 
                    <Sun className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
                  }
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>Ciemny motyw</span>
                </div>
                <button
                  onClick={() => setDarkMode(!darkMode)}
                  className={`w-12 h-6 rounded-full transition ${darkMode ? 'bg-violet-400' : 'bg-gray-300'} relative`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${darkMode ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer w menu */}
        <div className={`mt-8 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col gap-2 text-xs">
            <div className={`flex items-center gap-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <span>Made by</span>
              <a href="https://github.com/hsr88" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-purple-400 dark:text-purple-400 hover:underline font-semibold">
                <Github className="w-3 h-3" />
                hsr
              </a>
            </div>
            <div className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              <a href="https://klikklik.click" className="hover:text-purple-400">klikklik.click</a>
              <span className="mx-2">•</span>
              <span className="text-xs">v1.0.1</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (gameState === 'about') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} p-4`}>
        <div className="max-w-4xl mx-auto py-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8`}>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Info className="w-10 h-10 text-sky-400" />
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>O grze</h1>
            </div>

            <div className="space-y-6">
              <section>
                <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Jak grać?</h2>
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>
                  Klikklik to gra sprawdzająca Twoją szybkość reakcji! Wykonuj różnorodne wyzwania jak najszybciej, 
                  zdobywaj punkty i unikaj błędów. Im szybciej zareagujesz, tym więcej punktów otrzymasz. Uważaj - masz 
                  ograniczoną liczbę żyć!
                </p>
              </section>

              <section>
                <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tryby gry</h2>
                <div className="space-y-3">
                  {gameModes.map((mode) => {
                    const IconComponent = mode.icon;
                    return (
                      <div key={mode.id} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-violet-50'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 bg-gradient-to-br ${mode.color} rounded-lg`}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{mode.name}</h3>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{mode.description}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Typy wyzwań (odblokowane na wyższych poziomach)
                </h2>
                <div className="space-y-3">
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-violet-50'}`}>
                    <h3 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Kliknij kółko
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Kliknij w pojawiające się kółko jak najszybciej
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-violet-50'}`}>
                    <h3 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Wybierz kolor
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Kliknij odpowiedni kolor spośród dostępnych opcji
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-violet-50'}`}>
                    <h3 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Kliknij ikonę
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Znajdź i kliknij właściwą ikonę
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-violet-50'}`}>
                    <h3 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      Szybkie kliknięcie
                    </h3>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Zaczekaj aż pojawi się sygnał, potem kliknij natychmiast
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border-2 border-yellow-300/30 ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold px-2 py-0.5 bg-yellow-300 text-white rounded">Poziom 3+</span>
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Memory Color
                      </h3>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Zapamiętaj pokazany kolor i wybierz go z listy
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border-2 border-yellow-300/30 ${darkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold px-2 py-0.5 bg-yellow-300 text-white rounded">Poziom 5+</span>
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Math Quiz
                      </h3>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Szybkie obliczenia matematyczne (dodawanie i odejmowanie)
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border-2 border-orange-300/30 ${darkMode ? 'bg-gray-700' : 'bg-orange-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold px-2 py-0.5 bg-orange-300 text-white rounded">Poziom 7+</span>
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Direction Arrow
                      </h3>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Wybierz strzałkę wskazującą właściwy kierunek
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border-2 border-rose-400/30 ${darkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold px-2 py-0.5 bg-rose-400 text-white rounded">Poziom 10+</span>
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Sequence Memory
                      </h3>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Zapamiętaj sekwencję liczb i powtórz ją w odpowiedniej kolejności
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border-2 border-violet-400/30 ${darkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold px-2 py-0.5 bg-violet-400 text-white rounded">Poziom 12+</span>
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Color Word (Test Stroopa)
                      </h3>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Kliknij KOLOR tekstu, nie to co tekst mówi! To trudniejsze niż myślisz
                    </p>
                  </div>

                  <div className={`p-4 rounded-xl border-2 border-rose-400/30 ${darkMode ? 'bg-gray-700' : 'bg-pink-50'}`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold px-2 py-0.5 bg-rose-400 text-white rounded">Poziom 15+</span>
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        Multi Click
                      </h3>
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Kliknij przycisk określoną liczbę razy tak szybko jak potrafisz
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  System punktacji
                </h2>
                <ul className={`list-disc list-inside space-y-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li>Szybsza reakcja = więcej punktów (maks. 100 pkt)</li>
                  <li>Co 500 punktów przechodzisz na wyższy poziom</li>
                  <li>Wyższy poziom = krótszy czas na reakcję</li>
                  <li>Wyższy poziom = więcej typów wyzwań</li>
                  <li>Tryb Precision daje podwójne punkty</li>
                </ul>
              </section>
            </div>

            <button
              onClick={() => setGameState('menu')}
              className="w-full mt-8 bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition"
            >
              Powrót do menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'menu') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} transition-colors`}>
        <HamburgerMenu />
        
        <button
          onClick={() => setMenuOpen(true)}
          className={`fixed top-4 right-4 z-40 p-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg hover:shadow-xl transition`}
        >
          <Menu className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
        </button>

        <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-6 mb-6 max-w-md w-full`}>
            <div className="flex items-center gap-4">
              <div className="text-6xl">{playerAvatar}</div>
              <div className="flex-1">
                <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{playerName}</h2>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Osiągnięć: {achievements.length}/{allAchievements.filter(a => !a.hidden || achievements.includes(a.id)).length}
                </p>
              </div>
              <button
                onClick={() => setGameState('profile')}
                className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg transition`}
              >
                <Edit2 className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
              </button>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 max-w-md w-full`}>
            <div className="text-center mb-6">
              <img 
                src="/logo.png" 
                alt="Klikklik Logo" 
                className={`w-32 h-32 mx-auto mb-4 cursor-pointer transition-all duration-300 
                  hover:scale-110 hover:drop-shadow-2xl hover:brightness-110
                  active:scale-95
                  ${logoClicked ? 'bounce-click' : 'logo-glow'}
                `}
                onClick={() => {
                  setLogoClicked(true);
                  sounds.click();
                  triggerHaptic('light');
                  setTimeout(() => setLogoClicked(false), 500);
                  
                  // Ukryte osiągnięcie: 10 szybkich kliknięć w logo
                  const newCount = logoClickCount + 1;
                  setLogoClickCount(newCount);
                  
                  // Reset timer
                  if (logoClickTimer.current) {
                    clearTimeout(logoClickTimer.current);
                  }
                  
                  // Ustaw timer do resetu (3 sekundy)
                  logoClickTimer.current = setTimeout(() => {
                    setLogoClickCount(0);
                  }, 3000);
                  
                  // Sprawdź czy 10 kliknięć
                  if (newCount >= 10 && !achievements.includes('logo_clicker')) {
                    const newAchievements = [...achievements, 'logo_clicker'];
                    setAchievements(newAchievements);
                    localStorage.setItem('klikklikAchievements', JSON.stringify(newAchievements));
                    setNewAchievement(allAchievements.find(a => a.id === 'logo_clicker'));
                    sounds.achievement();
                    triggerHaptic('success');
                    setLogoClickCount(0);
                    // Ukryj popup po 3 sekundach
                    setTimeout(() => setNewAchievement(null), 3000);
                  }
                }}
              />
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                  Klik
                </span>
                <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-gradient">
                  klik
                </span>
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sprawdź swoją szybkość reakcji!</p>
            </div>
            
            {highScore > 0 && (
              <div className="mb-6 p-4 bg-gradient-to-r from-yellow-300/20 to-orange-300/20 rounded-xl border-2 border-yellow-300/30">
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Najlepszy wynik</p>
                <p className="text-3xl font-bold bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">{highScore}</p>
              </div>
            )}

            <div className="space-y-3">
              <button
                onClick={() => setGameState('modeSelect')}
                className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
              >
                Rozpocznij grę
              </button>

              <button
                onClick={() => setGameState('multiplayerMenu')}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3"
              >
                <Users className="w-6 h-6" />
                Multiplayer
              </button>

              <button
                onClick={() => setGameState('leaderboard')}
                className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-md`}
              >
                <BarChart3 className="w-5 h-5" />
                Tablica wyników
              </button>

              <button
                onClick={() => setGameState('achievements')}
                className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-md`}
              >
                <Award className="w-5 h-5" />
                Osiągnięcia
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'profile') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} flex items-center justify-center p-4`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 max-w-md w-full`}>
          <h1 className={`text-3xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Edytuj profil</h1>
          
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Nazwa gracza
            </label>
            <input
              type="text"
              value={editingProfile ? tempName : playerName}
              onChange={(e) => {
                if (!editingProfile) {
                  setEditingProfile(true);
                  setTempName(e.target.value);
                } else {
                  setTempName(e.target.value);
                }
              }}
              maxLength={20}
              className={`w-full px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:border-violet-400 outline-none transition`}
              placeholder="Wpisz swoje imię"
            />
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Wybierz awatar
            </label>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {availableAvatars.map((avatar) => (
                <button
                  key={avatar}
                  onClick={() => setPlayerAvatar(avatar)}
                  className={`text-3xl sm:text-4xl p-2 sm:p-3 rounded-xl transition transform hover:scale-110 flex items-center justify-center ${
                    playerAvatar === avatar 
                      ? 'bg-violet-400 ring-4 ring-purple-300' 
                      : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Kod profilu (synchronizacja urządzeń)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={profileCode}
                readOnly
                className={`flex-1 px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-800'} font-mono text-sm`}
              />
              <button
                onClick={copyProfileCode}
                className={`px-4 py-3 rounded-xl ${copiedCode ? 'bg-green-400' : 'bg-purple-400'} text-white transition flex items-center gap-2`}
              >
                {copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            <p className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Zapisz ten kod, aby zalogować się na innym urządzeniu
            </p>
          </div>

          {!showLoginForm ? (
            <button
              onClick={() => setShowLoginForm(true)}
              className={`w-full mb-4 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2`}
            >
              <LogIn className="w-5 h-5" />
              Zaloguj się kodem
            </button>
          ) : (
            <div className="mb-4">
              <input
                type="text"
                value={loginCode}
                onChange={(e) => setLoginCode(e.target.value.toUpperCase())}
                placeholder="XXX-XXX"
                maxLength={7}
                className={`w-full px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} font-mono mb-2`}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (loginWithCode(loginCode)) {
                      alert('Zalogowano pomyślnie!');
                    } else {
                      alert('Nieprawidłowy kod!');
                    }
                  }}
                  className="flex-1 bg-emerald-400 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl transition"
                >
                  Zaloguj
                </button>
                <button
                  onClick={() => {
                    setShowLoginForm(false);
                    setLoginCode('');
                  }}
                  className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-2 px-4 rounded-xl transition`}
                >
                  Anuluj
                </button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <button
              onClick={() => {
                if (editingProfile && tempName.trim()) {
                  setPlayerName(tempName.trim());
                }
                setEditingProfile(false);
                setShowLoginForm(false);
                syncProfileToBackend();
                setGameState('menu');
              }}
              className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"
            >
              <Check className="w-5 h-5" />
              Zapisz
            </button>
            <button
              onClick={() => {
                setEditingProfile(false);
                setShowLoginForm(false);
                setGameState('menu');
              }}
              className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition`}
            >
              Anuluj
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'achievements') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} p-4`}>
        <div className="max-w-4xl mx-auto py-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8`}>
            <div className="flex items-center justify-center gap-3 mb-6">
              <Award className="w-10 h-10 text-yellow-300" />
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Osiągnięcia</h1>
            </div>
            
            <p className={`text-center mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Odblokowano: {achievements.length} / {allAchievements.length}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {allAchievements
                .filter(achievement => !achievement.hidden || achievements.includes(achievement.id))
                .map((achievement) => {
                const isUnlocked = achievements.includes(achievement.id);
                return (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl border-2 transition ${
                      isUnlocked 
                        ? darkMode 
                          ? 'bg-gray-700 border-yellow-300/50' 
                          : 'bg-yellow-50 border-yellow-300/50'
                        : darkMode
                          ? 'bg-gray-700/50 border-gray-600 opacity-50'
                          : 'bg-violet-50 border-gray-200 opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {achievement.name}
                          {achievement.hidden && isUnlocked && (
                            <span className="ml-2 text-xs bg-purple-400/20 text-purple-400 px-2 py-1 rounded">
                              Ukryte
                            </span>
                          )}
                        </h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {achievement.description}
                        </p>
                        {isUnlocked && (
                          <div className="mt-2">
                            <span className="text-xs font-semibold text-yellow-400 dark:text-yellow-400">
                              ✓ Odblokowane
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setGameState('menu')}
              className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition"
            >
              Powrót do menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'modeSelect') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} flex items-center justify-center p-4`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 max-w-2xl w-full`}>
          <h1 className={`text-3xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Wybierz tryb gry</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {gameModes.map((mode) => {
              const IconComponent = mode.icon;
              return (
                <button
                  key={mode.id}
                  onClick={() => startGame(mode.id)}
                  className={`p-6 rounded-2xl border-2 ${darkMode ? 'border-gray-700 hover:border-violet-400 bg-gray-700/50 hover:bg-gray-700' : 'border-gray-200 hover:border-violet-400 hover:bg-purple-50'} transition text-left group shadow-md hover:shadow-lg`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-gradient-to-br ${mode.color} rounded-xl group-hover:scale-110 transition shadow-md`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{mode.name}</h3>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{mode.description}</p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {mode.lives !== Infinity && (
                          <span className={`px-2 py-1 rounded ${darkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-rose-500'}`}>
                            {mode.lives} {mode.lives === 1 ? 'życie' : 'życia'}
                          </span>
                        )}
                        {mode.speedMultiplier > 1 && (
                          <span className={`px-2 py-1 rounded ${darkMode ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 text-blue-400'}`}>
                            {mode.speedMultiplier}x szybciej
                          </span>
                        )}
                        {mode.pointsMultiplier && (
                          <span className={`px-2 py-1 rounded ${darkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-emerald-400'}`}>
                            {mode.pointsMultiplier}x punkty
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 opacity-50 group-hover:opacity-100 transition ${darkMode ? 'text-white' : 'text-gray-800'}`} />
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setGameState('menu')}
            className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition shadow-md`}
          >
            Powrót
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'leaderboard') {
    const tabs = [
      { id: 'all', name: 'Wszystkie', icon: Trophy },
      ...gameModes.map(mode => ({ id: mode.id, name: mode.name, icon: mode.icon }))
    ];

    const currentLeaderboard = getLeaderboardByMode(leaderboardTab);

    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} flex items-center justify-center p-4`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 max-w-2xl w-full`}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="w-10 h-10 text-yellow-300" />
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tablica wyników</h1>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setLeaderboardTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold whitespace-nowrap transition ${
                    leaderboardTab === tab.id
                      ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white shadow-lg'
                      : darkMode
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {tab.name}
                </button>
              );
            })}
          </div>

          {currentLeaderboard.length === 0 ? (
            <div className="text-center py-12">
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                Brak wyników dla tego trybu
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Zagraj, aby zobaczyć swoje wyniki!
              </p>
            </div>
          ) : (
            <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
              {currentLeaderboard.map((entry, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-xl flex items-center gap-4 ${
                    index < 3 
                      ? darkMode
                        ? 'bg-gray-700 border-2 border-yellow-300/50'
                        : 'bg-yellow-50 border-2 border-yellow-300/50'
                      : darkMode
                        ? 'bg-gray-700'
                        : 'bg-violet-50'
                  } shadow-md`}
                >
                  <div className={`text-2xl font-bold min-w-[40px] ${
                    index === 0 ? 'text-yellow-300' : 
                    index === 1 ? 'text-gray-400' : 
                    index === 2 ? 'text-amber-400' : 
                    darkMode ? 'text-gray-500' : 'text-gray-400'
                  }`}>
                    #{index + 1}
                  </div>
                  <div className="text-3xl">{entry.playerAvatar}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {entry.playerName}
                      </span>
                      <span className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {entry.score}
                      </span>
                    </div>
                    <div className={`flex gap-3 text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      <span className={`px-2 py-0.5 rounded ${darkMode ? 'bg-purple-900/30 text-purple-400' : 'bg-purple-100 text-purple-400'}`}>
                        {entry.modeName}
                      </span>
                      <span>Poziom {entry.level}</span>
                      <span>•</span>
                      <span>Śr. {entry.avgTime}ms</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setGameState('menu')}
            className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition"
          >
            Powrót do menu
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'gameOver') {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} flex items-center justify-center p-4`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 max-w-md w-full text-center`}>
          <Trophy className="w-20 h-20 mx-auto text-yellow-300 mb-4" />
          <h1 className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Koniec gry!</h1>
          <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{selectedMode?.name} Mode</p>
          
          <div className="space-y-4 my-8">
            <div className="bg-gradient-to-r from-violet-400/20 to-rose-400/20 rounded-xl p-4 border-2 border-violet-400/30">
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Wynik</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">{score}</p>
              {score === highScore && score > 0 && (
                <p className="text-sm text-yellow-400 dark:text-yellow-400 font-semibold mt-1">🎉 Nowy rekord!</p>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'} rounded-xl p-4 shadow-md`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Poziom</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-400'}`}>{level}</p>
              </div>
              <div className={`${darkMode ? 'bg-green-900/30' : 'bg-green-50'} rounded-xl p-4 shadow-md`}>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Średni czas</p>
                <p className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-emerald-400'}`}>{avgReactionTime}ms</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => startGame(selectedMode.id)}
              className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition"
            >
              Zagraj ponownie
            </button>
            <button
              onClick={() => setGameState('menu')}
              className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition shadow-md`}
            >
              Menu główne
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Get timer color based on remaining time
  const getTimerColor = () => {
    if (timeRemaining > 60) return 'bg-green-400';
    if (timeRemaining > 30) return 'bg-yellow-300';
    return 'bg-rose-400';
  };

  // MULTIPLAYER END SCREEN
  if (gameState === 'multiplayerEnd') {
    const myScore = score;
    const myLives = lives;
    
    // FIXED: Properly get opponent score based on who I am
    const opponentScore = isHost ? (gameRoom?.guest_score || 0) : (gameRoom?.host_score || 0);
    const opponentLives = isHost ? (gameRoom?.guest_lives || 0) : (gameRoom?.host_lives || 0);
    
    const iWon = myScore > opponentScore || (myScore === opponentScore && myLives > opponentLives);
    
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} p-4`}>
        <div className="max-w-2xl mx-auto py-8">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8`}>
            
            {/* Tytuł */}
            <div className="text-center mb-8">
              <div className="text-8xl mb-4">{iWon ? '🏆' : '😢'}</div>
              <h1 className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {iWon ? 'Wygrałeś!' : 'Przegrałeś!'}
              </h1>
              <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Koniec gry multiplayer
              </p>
            </div>

            {/* Porównanie wyników */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              {/* Ty */}
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-violet-100'} rounded-2xl p-6 ${iWon ? 'ring-4 ring-green-400' : ''}`}>
                <div className="text-center">
                  <div className="text-5xl mb-3">{playerAvatar}</div>
                  <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {playerName}
                  </p>
                  <p className="text-sm text-green-400 mb-4">Ty</p>
                  
                  <div className="space-y-2">
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Wynik</p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{myScore}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Poziom</p>
                      <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{level}</p>
                    </div>
                    {reactionTimes.length > 0 && (
                      <div>
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Śr. czas reakcji</p>
                        <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                          {Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)}ms
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Przeciwnik */}
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-rose-100'} rounded-2xl p-6 ${!iWon ? 'ring-4 ring-green-400' : ''}`}>
                <div className="text-center">
                  <div className="text-5xl mb-3">{opponent?.avatar || '👤'}</div>
                  <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {opponent?.name || 'Przeciwnik'}
                  </p>
                  <p className="text-sm text-rose-400 mb-4">Przeciwnik</p>
                  
                  <div className="space-y-2">
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Wynik</p>
                      <p className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{opponentScore || 0}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Poziom</p>
                      <p className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{gameRoom?.guest_level || gameRoom?.host_level || 1}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Przyciski */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  setGameState('menu');
                  setMultiplayerMode(false);
                  setOpponent(null);
                  leaveMultiplayerRoom();
                }}
                className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition"
              >
                Powrót do menu
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} p-4`}>
      <HamburgerMenu />
      
      <button
        onClick={() => setMenuOpen(true)}
        className={`fixed top-4 right-4 z-40 p-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg hover:shadow-xl transition`}
      >
        <Menu className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
      </button>

      {/* Achievement Notification */}
      {newAchievement && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-4 border-2 border-yellow-300 max-w-sm`}>
            <div className="flex items-center gap-3">
              <div className="text-4xl">{newAchievement.icon}</div>
              <div>
                <p className="text-sm text-yellow-400 dark:text-yellow-400 font-semibold">Nowe osiągnięcie!</p>
                <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{newAchievement.name}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Level Up Notification */}
      {showLevelUp && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-2xl p-4 border-2 border-violet-400`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">⬆️</div>
              <div>
                <p className="text-sm text-purple-400 dark:text-purple-400 font-semibold">Nowy poziom!</p>
                <p className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-gray-800'}`}>Poziom {level}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Opponent Panel - Multiplayer */}
      {multiplayerMode && opponent && countdown === null && gameState === 'playing' && (
        <div className="max-w-4xl mx-auto mb-4">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-3 shadow-lg flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{opponent.avatar}</div>
              <div>
                <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {opponent.name}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Przeciwnik
                </p>
              </div>
            </div>
            
            <div className="flex gap-4 items-center">
              <div className={darkMode ? 'text-white' : 'text-gray-800'}>
                <p className="text-xs">Wynik</p>
                <p className="text-xl font-bold">{opponent.score}</p>
              </div>
              <div className={darkMode ? 'text-white' : 'text-gray-800'}>
                <p className="text-xs">Poziom</p>
                <p className="text-xl font-bold">{opponent.level}</p>
              </div>
              <div className="flex gap-1">
                {[...Array(Math.max(opponent.lives, 0))].map((_, i) => (
                  <Heart key={i} className="w-5 h-5 text-rose-400 fill-rose-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Interface - Show only when playing */}
      {gameState === 'playing' && (
      <>
      {/* Countdown Overlay - Multiplayer */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center">
            <div className="text-9xl font-bold text-white mb-4 animate-bounce">
              {countdown}
            </div>
            <p className="text-2xl text-white">Przygotuj się!</p>
          </div>
        </div>
      )}

            {/* Header */}
      {countdown === null && (
      <>
      <div className="max-w-4xl mx-auto mb-4">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-lg`}>
          {/* Top row: Stats */}
          <div className="flex justify-between items-start gap-2 mb-3">
            <div className="flex gap-2 sm:gap-4 flex-wrap">
              <div className={darkMode ? 'text-white' : 'text-gray-800'}>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Wynik</p>
                <p className="text-xl sm:text-2xl font-bold">{score}</p>
              </div>
              <div className={darkMode ? 'text-white' : 'text-gray-800'}>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Poziom</p>
                <p className="text-xl sm:text-2xl font-bold">{level}</p>
              </div>
              <div className={darkMode ? 'text-white' : 'text-gray-800'}>
                <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Tryb</p>
                <p className="text-base sm:text-lg font-bold">{selectedMode?.name}</p>
              </div>
              {streak > 0 && (
                <div className={darkMode ? 'text-white' : 'text-gray-800'}>
                  <p className={`text-xs sm:text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Seria</p>
                  <p className="text-xl sm:text-2xl font-bold text-orange-300">🔥 {streak}</p>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom row: Lives (only if not infinity) */}
          {selectedMode?.lives !== Infinity && (
            <div className="flex gap-1 sm:gap-2 justify-end">
              {[...Array(Math.max(lives, 0))].map((_, i) => (
                <Heart
                  key={i}
                  className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400 fill-rose-400"
                />
              ))}
            </div>
          )}
        </div>

        {/* Timer Bar */}
        {!selectedMode?.noTimeLimit && currentChallenge && !currentChallenge.showing && currentChallenge.type !== 'fastClick' && !hideTimer && (
          <div className={`mt-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-2 shadow-lg`}>
            <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getTimerColor()} transition-all duration-100 ease-linear`}
                style={{ width: `${timeRemaining}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Game Area */}
      <div className="max-w-4xl mx-auto">
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 min-h-[500px] relative overflow-hidden`}>
          <div className="text-center mb-8">
            <h2 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              {currentChallenge?.type === 'fastClick' && !currentChallenge?.isReady 
                ? currentChallenge?.instruction 
                : currentChallenge?.type === 'fastClick' && currentChallenge?.isReady
                ? currentChallenge?.readyInstruction
                : currentChallenge?.showing
                ? currentChallenge?.instruction
                : currentChallenge?.secondInstruction || currentChallenge?.instruction}
            </h2>
          </div>

          {/* Challenge renderers remain the same */}
          {currentChallenge?.type === 'clickCircle' && (
            <div className="relative h-96">
              <button
                onClick={() => handleClick(true)}
                className="absolute w-24 h-24 bg-gradient-to-br from-sky-400 to-violet-400 rounded-full hover:scale-110 transition-transform shadow-lg animate-pulse"
                style={{
                  left: `${currentChallenge.x}%`,
                  top: `${currentChallenge.y}%`,
                  transform: 'translate(-50%, -50%)'
                }}
              />
            </div>
          )}

          {currentChallenge?.type === 'selectColor' && (
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {currentChallenge.options.map((color, idx) => (
                <button
                  key={idx}
                  onClick={() => handleClick(color.name === currentChallenge.target.name)}
                  className={`${color.bg} h-32 rounded-2xl hover:scale-105 transition-transform shadow-lg`}
                />
              ))}
            </div>
          )}

          {currentChallenge?.type === 'clickIcon' && (
            <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
              {currentChallenge.options.map((icon, idx) => {
                const IconComponent = icon.Icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleClick(icon.name === currentChallenge.target.name)}
                    className="bg-gradient-to-br from-violet-400 to-rose-400 h-24 rounded-2xl hover:scale-105 transition-transform shadow-lg flex items-center justify-center"
                  >
                    <IconComponent className="w-12 h-12 text-white" />
                  </button>
                );
              })}
            </div>
          )}

          {currentChallenge?.type === 'fastClick' && (
            <div className="flex items-center justify-center h-96">
              {currentChallenge.isReady && (
                <button
                  onClick={() => handleClick(true)}
                  className="w-64 h-64 bg-gradient-to-br from-green-400 to-emerald-400 rounded-full hover:scale-105 transition-transform shadow-2xl animate-pulse"
                >
                  <Zap className="w-32 h-32 mx-auto text-white" />
                </button>
              )}
            </div>
          )}

          {currentChallenge?.type === 'memoryColor' && (
            <div className="max-w-md mx-auto">
              {currentChallenge.showing ? (
                <div className={`${currentChallenge.target.bg} h-64 rounded-2xl shadow-lg`} />
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {currentChallenge.options.map((color, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleClick(color.name === currentChallenge.target.name)}
                      className={`${color.bg} h-32 rounded-2xl hover:scale-105 transition-transform shadow-lg`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {currentChallenge?.type === 'mathQuiz' && (
            <div className="max-w-md mx-auto">
              <div className={`text-6xl font-bold text-center mb-8 p-8 ${darkMode ? 'bg-blue-900/30' : 'bg-gradient-to-r from-blue-100 to-purple-100'} rounded-2xl shadow-inner`}>
                <span className={darkMode ? 'text-white' : 'text-gray-800'}>{currentChallenge.question}</span>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {currentChallenge.options.map((answer, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleClick(answer === currentChallenge.answer)}
                    className="bg-gradient-to-br from-green-400 to-teal-300 h-24 rounded-2xl hover:scale-105 transition-transform shadow-lg flex items-center justify-center text-white text-3xl font-bold"
                  >
                    {answer}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentChallenge?.type === 'directionArrow' && (
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              {currentChallenge.options.map((dir, idx) => {
                const IconComponent = dir.Icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleClick(dir.name === currentChallenge.target.name)}
                    className="bg-gradient-to-br from-orange-300 to-rose-400 h-32 rounded-2xl hover:scale-105 transition-transform shadow-lg flex items-center justify-center"
                  >
                    <IconComponent className="w-16 h-16 text-white" />
                  </button>
                );
              })}
            </div>
          )}

          {currentChallenge?.type === 'sequenceMemory' && (
            <div className="max-w-lg mx-auto">
              {currentChallenge.showing ? (
                <div className="grid grid-cols-3 gap-4">
                  {currentChallenge.sequence.map((num, idx) => (
                    <div
                      key={idx}
                      className="bg-gradient-to-br from-violet-400 to-rose-400 h-24 rounded-2xl flex items-center justify-center text-white text-4xl font-bold shadow-lg animate-pulse"
                    >
                      {num}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                    <button
                      key={num}
                      onClick={() => handleClick(null, num)}
                      className={`${currentChallenge.userSequence.includes(num) ? 'bg-green-400' : 'bg-gradient-to-br from-sky-400 to-violet-400'} h-20 rounded-2xl hover:scale-105 transition-transform shadow-lg flex items-center justify-center text-white text-3xl font-bold`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentChallenge?.type === 'colorWord' && (
            <div className="max-w-md mx-auto">
              <div className={`text-6xl font-bold text-center mb-8 p-8 rounded-2xl ${currentChallenge.color.bg} text-white shadow-lg`}>
                {currentChallenge.word}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {currentChallenge.options.map((color, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleClick(color.name === currentChallenge.color.name)}
                    className={`${color.bg} h-32 rounded-2xl hover:scale-105 transition-transform shadow-lg flex items-center justify-center text-white font-bold text-xl`}
                  >
                    {color.text}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentChallenge?.type === 'multiClick' && (
            <div className="flex flex-col items-center justify-center h-96 gap-8">
              <div className={`text-6xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                {currentChallenge.clickCount} / {currentChallenge.targetCount}
              </div>
              <button
                onClick={() => handleClick(true)}
                className="w-48 h-48 bg-gradient-to-br from-yellow-400 to-amber-400 rounded-full hover:scale-105 transition-transform shadow-2xl flex items-center justify-center"
              >
                <Smartphone className="w-24 h-24 text-white" />
              </button>
            </div>
          )}

          {/* Result Popup */}
          {showResult && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className={`${showResult.type === 'success' ? 'bg-green-400' : 'bg-rose-400'} text-white rounded-3xl p-8 text-center transform scale-110 shadow-2xl`}>
                {showResult.type === 'success' ? (
                  <>
                    <p className="text-6xl mb-2">✓</p>
                    <p className="text-2xl font-bold">{showResult.time}ms</p>
                    <p className="text-xl">+{showResult.points} punktów</p>
                  </>
                ) : (
                  <>
                    <p className="text-6xl mb-2">✗</p>
                    <p className="text-2xl font-bold">Spróbuj ponownie!</p>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}
      </>
      )}

      {/* ======================================== */}
      {/* 2. MENU MULTIPLAYER (wybór: host vs join) */}
      {/* ======================================== */}

      {gameState === 'multiplayerMenu' && (
        <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-violet-950 to-purple-950' : 'bg-gradient-to-br from-violet-50 to-purple-50'} p-4`}>
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-pink-400 via-purple-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                  Multiplayer
                </span>
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Zagraj z przyjacielem w czasie rzeczywistym!
              </p>
            </div>

            {/* Opcje */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Utwórz pokój (Host) */}
              <button
                onClick={() => setGameState('createRoom')}
                className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition shadow-lg`}
              >
                <div className="text-6xl mb-4">🏠</div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Utwórz pokój
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Zostań hostem i wybierz tryb gry
                </p>
              </button>

              {/* Dołącz do pokoju (Guest) */}
              <button
                onClick={() => setGameState('joinRoom')}
                className={`p-6 rounded-2xl ${darkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} transition shadow-lg`}
              >
                <div className="text-6xl mb-4">🚪</div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  Dołącz do pokoju
                </h3>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Wpisz 4-cyfrowy kod pokoju
                </p>
              </button>
            </div>

            {/* Powrót */}
            <button
              onClick={() => setGameState('menu')}
              className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-3 px-6 rounded-xl"
            >
              Powrót do menu
            </button>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* 3. EKRAN TWORZENIA POKOJU (Host) */}
      {/* ======================================== */}

      {gameState === 'createRoom' && (
        <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-violet-950 to-purple-950' : 'bg-gradient-to-br from-violet-50 to-purple-50'} p-4`}>
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-6">
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Utwórz pokój
              </span>
            </h1>

            {/* Wybór trybu */}
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Wybierz tryb gry
              </label>
              <div className="grid grid-cols-1 gap-3">
                {gameModes.filter(m => ['classic', 'speed', 'precision'].includes(m.id)).map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode)}
                    className={`p-4 rounded-xl transition ${
                      selectedMode?.id === mode.id
                        ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white ring-4 ring-purple-300'
                        : darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{mode.emoji}</span>
                      <div className="text-left">
                        <h3 className="font-bold">{mode.name}</h3>
                        <p className="text-sm opacity-80">{mode.description}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Wybór poziomu startowego */}
            <div className="mb-6">
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Poziom startowy: {startingLevel}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={startingLevel}
                onChange={(e) => setStartingLevel(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Przyciski */}
            <div className="space-y-3">
              <button
                onClick={async () => {
                  const code = await createMultiplayerRoom(selectedMode.id, startingLevel);
                  if (code) setGameState('lobby');
                }}
                disabled={!selectedMode}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Utwórz pokój
              </button>

              <button
                onClick={() => setGameState('multiplayerMenu')}
                className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-3 px-6 rounded-xl"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* 4. EKRAN DOŁĄCZANIA DO POKOJU (Guest) */}
      {/* ======================================== */}

      {gameState === 'joinRoom' && (
        <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-violet-950 to-purple-950' : 'bg-gradient-to-br from-violet-50 to-purple-50'} p-4`}>
          <div className="max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-center mb-6">
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Dołącz do pokoju
              </span>
            </h1>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg mb-6`}>
              <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                Kod pokoju (4 cyfry)
              </label>
              <input
                type="text"
                maxLength="4"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.replace(/\D/g, ''))}
                placeholder="0000"
                className={`w-full px-6 py-4 text-center text-3xl font-mono rounded-xl border-2 ${
                  darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-800'
                }`}
              />
            </div>

            <div className="space-y-3">
              <button
                onClick={async () => {
                  const success = await joinMultiplayerRoom(roomCode);
                  if (success) setGameState('lobby');
                }}
                disabled={roomCode.length !== 4}
                className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Dołącz
              </button>

              <button
                onClick={() => setGameState('multiplayerMenu')}
                className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-3 px-6 rounded-xl"
              >
                Anuluj
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* 5. LOBBY - Oczekiwanie na graczy */}
      {/* ======================================== */}

      {gameState === 'lobby' && (
        <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-violet-950 to-purple-950' : 'bg-gradient-to-br from-violet-50 to-purple-50'} p-4`}>
          {console.log('🏠 LOBBY RENDERING:', {
            gameState,
            isHost,
            roomCode,
            hasGameRoom: !!gameRoom,
            gameRoomStatus: gameRoom?.status
          })}
          <div className="max-w-2xl mx-auto">
            {/* Kod pokoju */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg mb-6 text-center`}>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-2`}>
                Kod pokoju
              </p>
              <div className="text-6xl font-mono font-bold bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
                {roomCode}
              </div>
              <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                Podaj ten kod znajomemu
              </p>
            </div>

            {/* Gracze */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Host */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg`}>
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-5xl">{gameRoom?.host_avatar}</div>
                  <div>
                    <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                      {gameRoom?.host_name}
                    </p>
                    <p className="text-sm text-pink-400">👑 Host</p>
                  </div>
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Tryb: {gameRoom?.game_mode}<br />
                  Poziom: {gameRoom?.starting_level}
                </div>
              </div>

              {/* Guest */}
              <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg ${!gameRoom?.guest_code && 'opacity-50'}`}>
                {gameRoom?.guest_code ? (
                  <div className="flex items-center gap-4">
                    <div className="text-5xl">{gameRoom?.guest_avatar}</div>
                    <div>
                      <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                        {gameRoom?.guest_name}
                      </p>
                      <p className="text-sm text-blue-400">✓ Gotowy</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="text-5xl mb-2">⏳</div>
                    <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Oczekiwanie na gracza...
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Przyciski */}
            <div className="space-y-3">
              {isHost && gameRoom?.status === 'ready' && (
                <button
                  onClick={startMultiplayerGame}
                  className="w-full bg-gradient-to-r from-green-400 to-emerald-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition"
                >
                  Rozpocznij grę! 🎮
                </button>
              )}

              <button
                onClick={leaveMultiplayerRoom}
                className="w-full bg-gradient-to-r from-red-400 to-rose-400 text-white font-bold py-3 px-6 rounded-xl"
              >
                Opuść pokój
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* 6. GRA MULTIPLAYER - Panel przeciwnika */}
      {/* ======================================== */}

      {gameState === 'playing' && multiplayerMode && opponent && (
        <div className="max-w-4xl mx-auto mb-4">
          {/* Panel przeciwnika */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-3 shadow-lg flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className="text-3xl">{opponent.avatar}</div>
              <div>
                <p className={`font-bold text-sm ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                  {opponent.name}
                </p>
                <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Przeciwnik
                </p>
              </div>
            </div>
      
            <div className="flex gap-4 items-center">
              <div className={darkMode ? 'text-white' : 'text-gray-800'}>
                <p className="text-xs">Wynik</p>
                <p className="text-xl font-bold">{opponent.score}</p>
              </div>
              <div className={darkMode ? 'text-white' : 'text-gray-800'}>
                <p className="text-xs">Poziom</p>
                <p className="text-xl font-bold">{opponent.level}</p>
              </div>
              <div className="flex gap-1">
                {[...Array(Math.max(opponent.lives, 0))].map((_, i) => (
                  <Heart key={i} className="w-5 h-5 text-rose-400 fill-rose-400" />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================== */}
      {/* 7. EKRAN KOŃCA GRY MULTIPLAYER */}
      {/* ======================================== */}

      {gameState === 'multiplayerEnd' && (
        <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-violet-950 to-purple-950' : 'bg-gradient-to-br from-violet-50 to-purple-50'} p-4 flex items-center justify-center`}>
          <div className="max-w-2xl mx-auto text-center">
            {/* Wynik */}
            <div className="text-8xl mb-6">
              {gameRoom?.winner === profileCode ? '🏆' : '😢'}
            </div>
      
            <h1 className="text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                {gameRoom?.winner === profileCode ? 'Zwycięstwo!' : 'Porażka'}
              </span>
            </h1>

            {/* Wyniki */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-lg mb-6`}>
              <div className="grid grid-cols-2 gap-6">
                {/* Ty */}
                <div className="text-center">
                  <div className="text-4xl mb-2">{playerAvatar}</div>
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {playerName}
                  </p>
                  <p className="text-3xl font-bold text-purple-400 my-2">
                    {isHost ? gameRoom?.host_score : gameRoom?.guest_score}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Poziom {isHost ? gameRoom?.host_level : gameRoom?.guest_level}
                  </p>
                </div>

                {/* Przeciwnik */}
                <div className="text-center">
                  <div className="text-4xl mb-2">{opponent?.avatar}</div>
                  <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>
                    {opponent?.name}
                  </p>
                  <p className="text-3xl font-bold text-blue-400 my-2">
                    {isHost ? gameRoom?.guest_score : gameRoom?.host_score}
                  </p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Poziom {isHost ? gameRoom?.guest_level : gameRoom?.host_level}
                  </p>
                </div>
              </div>
            </div>

            {/* Przyciski */}
            <div className="space-y-3">
              <button
                onClick={() => {
                  leaveMultiplayerRoom();
                  setGameState('menu');
                }}
                className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition"
              >
                Powrót do menu
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
     
  );
};

export default KlikklikGame;