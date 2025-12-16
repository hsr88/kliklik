import React, { useState, useEffect, useRef } from 'react';
import { Circle, Square, Star, Heart, Zap, Target, Clock, Trophy, Menu, X, Settings, Volume2, VolumeX, Vibrate, Moon, Sun, BarChart3, Play, ChevronRight, ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Smartphone, Award, Edit2, Check, Info, Home, LogIn, Copy, Github, Music, Music2, Users, Loader2 } from 'lucide-react';
// Zmiana na import z CDN, aby rozwiązać problem "Could not resolve"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// --- KONFIGURACJA SUPABASE (Zintegrowana) ---
// Usunięto import.meta.env dla zgodności ze środowiskiem
const supabaseUrl = 'https://rdntaonrivdfqtgeesgi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkbnRhb25yaXZkZnF0Z2Vlc2dpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2ODM4NTksImV4cCI6MjA4MTI1OTg1OX0.mr5vlcsHFILivJ476BrbVFjSLxkqUbaq1u7rJJTaffs';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const KlikklikGame = () => {
  const [gameState, setGameState] = useState('menu'); // menu, profile, modeSelect, playing, gameOver, settings, leaderboard, achievements, about, multiplayerMenu, createRoom, joinRoom, lobby, multiplayerEnd
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

  const generateRoomCode = () => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const syncProfileToBackend = async () => {
    try {
      await supabase.from('profiles').upsert({ code: profileCode, name: playerName, avatar: playerAvatar });
      const stats = getPlayerStats();
      await supabase.from('stats').upsert({ code: profileCode, total_clicks: stats.totalClicks || 0 });
      return true;
    } catch (error) {
      console.error('Błąd synchronizacji:', error);
      return false;
    }
  };

  const loginWithCode = async (code) => {
      localStorage.setItem('klikklikProfile', JSON.stringify({ name: 'Odzyskany', avatar: '😎', code }));
      setPlayerName('Odzyskany');
      setPlayerAvatar('😎');
      setProfileCode(code);
      return true;
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
      
      const newRoomCode = generateRoomCode();
      console.log('🎲 Generated room code:', newRoomCode);

      const { data: room, error } = await supabase
        .from('game_rooms')
        .insert({
          room_code: newRoomCode,
          host_code: profileCode,
          host_name: playerName,
          host_avatar: playerAvatar,
          game_mode: mode,
          starting_level: level,
          status: 'waiting',
          host_lives: 3,
          guest_lives: 3
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Failed to create room:', error);
        throw error;
      }

      setGameRoom(room);
      setRoomCode(newRoomCode);
      setIsHost(true);
      setMultiplayerMode(true);
      setGameState('lobby'); // PRZEJŚCIE DO LOBBY PO UTWORZENIU
      
      subscribeToRoom(newRoomCode);
      
      sounds.success();
      return newRoomCode;
    } catch (error) {
      console.error('❌ Error creating room:', error);
      alert("Błąd tworzenia pokoju. Upewnij się, że tabela 'game_rooms' istnieje w Supabase i uruchomiłeś skrypt SQL.");
      return null;
    }
  };

  const joinMultiplayerRoom = async (code) => {
    try {
      console.log('🚪 Attempting to join room:', code);
      
      const { data: room, error: fetchError } = await supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', code)
        .single();

      if (fetchError || !room) {
        alert('Pokój nie istnieje!');
        return false;
      }

      if (room.status !== 'waiting') {
        alert('Gra już się rozpoczęła!');
        return false;
      }

      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({
          guest_code: profileCode,
          guest_name: playerName,
          guest_avatar: playerAvatar,
          status: 'ready'
        })
        .eq('room_code', code);

      if (updateError) throw updateError;

      setGameRoom({ ...room, guest_code: profileCode, guest_name: playerName, guest_avatar: playerAvatar, status: 'ready' });
      setRoomCode(code);
      setIsHost(false);
      setMultiplayerMode(true);
      setGameState('lobby');
      
      subscribeToRoom(code);
      
      sounds.success();
      return true;
    } catch (error) {
      console.error('❌ Error joining room:', error);
      return false;
    }
  };

  const subscribeToRoom = (code) => {
    console.log('🔌 Subscribing to room:', code);
    
    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
    }

    const channel = supabase
      .channel(`room_updates:${code}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_rooms',
          filter: `room_code=eq.${code}`
        },
        (payload) => {
          console.log('🔔 Realtime update:', payload.eventType, payload.new);
          if (payload.new) {
            setGameRoom(payload.new);
            
            if (payload.new.status === 'finished') {
              if (gameState !== 'multiplayerEnd') {
                 setGameState('multiplayerEnd');
              }
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    realtimeChannel.current = channel;
  };

  const updateMultiplayerScore = async (newScore, newLevel, newLives) => {
    if (!roomCode || !multiplayerMode) return;

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

  const startMultiplayerGame = async () => {
    if (!isHost || !gameRoom) return;

    try {
      await supabase
        .from('game_rooms')
        .update({
          status: 'countdown',
          started_at: new Date().toISOString()
        })
        .eq('room_code', roomCode);

      startCountdown(gameRoom.game_mode);
    } catch (error) {
      console.error('❌ Error starting game:', error);
    }
  };

  const startCountdown = (mode) => {
    setCountdown(3);
    sounds.menuClick();
    
    setTimeout(() => {
      setCountdown(2);
      sounds.menuClick();
      
      setTimeout(() => {
        setCountdown(1);
        sounds.menuClick();
        
        setTimeout(() => {
          setCountdown(null);
          setGameState('playing');
          startGame(mode);
          
          if (isHost) {
            supabase
              .from('game_rooms')
              .update({ status: 'playing' })
              .eq('room_code', roomCode);
          }
        }, 1000);
      }, 1000);
    }, 1000);
  };

  const leaveMultiplayerRoom = async () => {
    if (!roomCode) return;

    try {
      if (isHost) {
        await supabase.from('game_rooms').delete().eq('room_code', roomCode);
      } else {
        await supabase
          .from('game_rooms')
          .update({ guest_code: null, guest_name: null, status: 'waiting' })
          .eq('room_code', roomCode);
      }
    } catch (err) {
      console.error(err);
    }

    if (realtimeChannel.current) {
      supabase.removeChannel(realtimeChannel.current);
    }
    
    setMultiplayerMode(false);
    setGameRoom(null);
    setRoomCode('');
    setIsHost(false);
    setOpponent(null);
    setGameState('menu');
  };

  const handleMultiplayerGameOver = async () => {
    if (!roomCode) return;
    
    // LOGIC TO DETERMINE WINNER AND SAVE TO DB
    const myScore = score;
    const opponentScore = isHost ? (gameRoom?.guest_score || 0) : (gameRoom?.host_score || 0);
    const opponentCode = isHost ? gameRoom?.guest_code : gameRoom?.host_code;
    
    let winner = 'draw';
    if (myScore > opponentScore) {
        winner = profileCode;
    } else if (opponentScore > myScore) {
        winner = opponentCode;
    }

    try {
        await supabase
            .from('game_rooms')
            .update({ 
                status: 'finished', 
                finished_at: new Date().toISOString(),
                winner: winner,
                // Ensure my final score is written too
                [isHost ? 'host_score' : 'guest_score']: myScore
            })
            .eq('room_code', roomCode);
    } catch (error) {
        console.error(error);
    }
  };

  // ========== USE EFFECTS FOR MULTIPLAYER ==========

  useEffect(() => {
    if (gameRoom && gameRoom.status === 'countdown' && gameState === 'lobby' && !isHost) {
        if (countdown === null) {
            console.log('⏰ Guest detecting countdown!');
            startCountdown(gameRoom.game_mode);
        }
    }
    
    if (gameRoom && gameRoom.status === 'playing' && gameState === 'lobby' && !isHost) {
        console.log('⏰ Guest late join - jumping to playing!');
        setGameState('playing');
        startGame(gameRoom.game_mode);
    }
  }, [gameRoom, gameState, isHost, countdown]);

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
      
      const now = ctx.currentTime;
      const attackTime = 0.02; 
      const releaseTime = duration / 1000 * 0.3;
      
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.15, now + attackTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration / 1000);
      
      oscillator.start(now);
      oscillator.stop(now + duration / 1000);
    } catch (err) {
      console.log('Audio not supported');
    }
  };

  const sounds = {
    click: () => playSound(pentatonicNotes.E4, 80, 'sine'),
    success: () => {
      playSound(pentatonicNotes.E5, 150, 'sine');
      setTimeout(() => playSound(pentatonicNotes.G5, 120, 'sine'), 50);
    },
    fail: () => playSound(pentatonicNotes.C4, 200, 'sine'),
    levelup: () => {
      playSound(pentatonicNotes.C5, 100, 'sine');
      setTimeout(() => playSound(pentatonicNotes.E5, 100, 'sine'), 80);
      setTimeout(() => playSound(pentatonicNotes.G5, 100, 'sine'), 160);
      setTimeout(() => playSound(1046.50, 150, 'sine'), 240);
    },
    achievement: () => {
      playSound(pentatonicNotes.G4, 120, 'sine');
      setTimeout(() => playSound(pentatonicNotes.A4, 120, 'sine'), 100);
      setTimeout(() => playSound(pentatonicNotes.C5, 120, 'sine'), 200);
      setTimeout(() => playSound(pentatonicNotes.E5, 200, 'sine'), 300);
    },
    memory: (index) => {
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
        case 'light': navigator.vibrate(10); break;
        case 'medium': navigator.vibrate(30); break;
        case 'heavy': navigator.vibrate(50); break;
        case 'success': navigator.vibrate([30, 10, 30]); break;
        case 'error': navigator.vibrate([50, 30, 50, 30, 50]); break;
        default: navigator.vibrate(20);
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
    { id: 'classic', name: 'Classic', description: 'Standardowa gra z rosnącą trudnością', icon: Play, color: 'from-sky-400 to-blue-400', lives: 3, speedMultiplier: 1 },
    { id: 'speed', name: 'Speed', description: 'Szybsza rozgrywka dla zaawansowanych', icon: Zap, color: 'from-yellow-300 to-amber-400', lives: 3, speedMultiplier: 1.5 },
    { id: 'precision', name: 'Precision', description: 'Jedno życie, podwójne punkty', icon: Target, color: 'from-violet-400 to-purple-400', lives: 1, speedMultiplier: 1, pointsMultiplier: 2 },
    { id: 'endless', name: 'Endless', description: 'Nieskończona rozgrywka na czas', icon: Clock, color: 'from-green-400 to-emerald-400', lives: Infinity, speedMultiplier: 1, timeLimit: 120 },
    { id: 'zen', name: 'Zen', description: 'Relaksująca gra bez presji czasu', icon: Heart, color: 'from-rose-400 to-pink-400', lives: 3, noTimeLimit: true }
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
      case 'clickCircle': return { type: 'clickCircle', x: Math.random() * 70 + 10, y: Math.random() * 60 + 10, instruction: 'Kliknij kółko!' };
      case 'selectColor': {
        const targetColor = colors[Math.floor(Math.random() * colors.length)];
        const otherColors = colors.filter(c => c.name !== targetColor.name);
        const shuffled = [targetColor, ...otherColors.slice(0, 3)].sort(() => Math.random() - 0.5);
        return { type: 'selectColor', target: targetColor, options: shuffled, instruction: `Kliknij: ${targetColor.text}`, category: 'color' };
      }
      case 'clickIcon': {
        const targetIcon = icons[Math.floor(Math.random() * icons.length)];
        const otherIcons = icons.filter(i => i.name !== targetIcon.name);
        const shuffledIcons = [targetIcon, ...otherIcons.slice(0, 5)].sort(() => Math.random() - 0.5);
        return { type: 'clickIcon', target: targetIcon, options: shuffledIcons, instruction: `Kliknij: ${targetIcon.label}` };
      }
      case 'fastClick': {
        const delay = Math.random() * 2000 + 1000;
        return { type: 'fastClick', delay: delay, instruction: 'Czekaj...', readyInstruction: 'KLIKNIJ TERAZ!', isReady: false };
      }
      case 'memoryColor': {
        const memoryColor = colors[Math.floor(Math.random() * colors.length)];
        const otherMemoryColors = colors.filter(c => c.name !== memoryColor.name);
        const memoryOptions = [memoryColor, ...otherMemoryColors.slice(0, 3)].sort(() => Math.random() - 0.5);
        const showTime = 1000;
        return { type: 'memoryColor', target: memoryColor, options: memoryOptions, instruction: 'Zapamiętaj kolor...', secondInstruction: 'Który kolor był pokazany?', showTime: showTime, showing: true, category: 'memory' };
      }
      case 'mathQuiz': {
        const num1 = Math.floor(Math.random() * 20) + 1;
        const num2 = Math.floor(Math.random() * 20) + 1;
        const operations = ['+', '-'];
        const operation = operations[Math.floor(Math.random() * operations.length)];
        const answer = operation === '+' ? num1 + num2 : num1 - num2;
        const wrongAnswers = [answer + 1, answer - 1, answer + 2].slice(0, 2);
        const allAnswers = [answer, ...wrongAnswers].sort(() => Math.random() - 0.5);
        return { type: 'mathQuiz', question: `${num1} ${operation} ${num2}`, answer: answer, options: allAnswers, instruction: 'Policz szybko!', category: 'math' };
      }
      case 'directionArrow': {
        const targetDirection = directions[Math.floor(Math.random() * directions.length)];
        const shuffledDirections = [...directions].sort(() => Math.random() - 0.5);
        return { type: 'directionArrow', target: targetDirection, options: shuffledDirections, instruction: `Kliknij strzałkę: ${targetDirection.label}` };
      }
      case 'sequenceMemory': {
        const sequenceLength = Math.min(3 + Math.floor(level / 5), 6);
        const sequence = Array.from({ length: sequenceLength }, () => Math.floor(Math.random() * 9));
        return { type: 'sequenceMemory', sequence: sequence, userSequence: [], currentIndex: 0, instruction: 'Zapamiętaj sekwencję...', secondInstruction: 'Powtórz sekwencję', showing: true, showTime: 2000, category: 'memory' };
      }
      case 'colorWord': {
        const wordColors = colors.slice(0, 4);
        const wordColor = wordColors[Math.floor(Math.random() * wordColors.length)];
        const textColor = wordColors[Math.floor(Math.random() * wordColors.length)];
        return { type: 'colorWord', word: wordColor.text, color: textColor, options: wordColors, instruction: 'Kliknij KOLOR tekstu, nie słowo!', category: 'color' };
      }
      case 'multiClick': {
        const targetCount = Math.floor(Math.random() * 3) + 2;
        return { type: 'multiClick', targetCount: targetCount, clickCount: 0, instruction: `Kliknij ${targetCount} razy!` };
      }
      default: return null;
    }
  };

  const startGame = (mode) => {
    const modeConfig = gameModes.find(m => m.id === mode);
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
    updatePlayerStats({ gamesPlayed: stats.gamesPlayed + 1, modesPlayed: playedModes.length, playedModes: playedModes, playedDarkMode: darkMode || stats.playedDarkMode });
    startNewChallenge();
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
    
    let updates = { totalClicks: stats.totalClicks + 1, fastestTime: newFastest, maxStreak: newMaxStreak };
    if (currentChallenge?.category === 'math') updates.mathCompleted = (stats.mathCompleted || 0) + 1;
    if (currentChallenge?.category === 'memory') updates.memoryCompleted = (stats.memoryCompleted || 0) + 1;
    if (currentChallenge?.category === 'color') updates.colorCompleted = (stats.colorCompleted || 0) + 1;

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
      updatePlayerStats({ maxLevel: Math.max(stats.maxLevel, newLevel) });
    }

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

    if (multiplayerMode) {
      updateMultiplayerScore(score, level, newLives);
    }

    if (newLives <= 0) {
      if (multiplayerMode) {
        handleMultiplayerGameOver();
      } else {
        saveScore();
      }
      setTimeout(() => {
        if (multiplayerMode) setGameState('multiplayerEnd');
        else setGameState('gameOver');
      }, 800);
    } else {
      setTimeout(() => {
        startNewChallenge();
      }, 800);
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

    const updatedLeaderboard = [...leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 50);
    setLeaderboard(updatedLeaderboard);
    localStorage.setItem('klikklikLeaderboard', JSON.stringify(updatedLeaderboard));

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
    } catch (error) {
      console.error('❌ Błąd zapisu do leaderboard:', error);
    }

    const stats = getPlayerStats();
    updatePlayerStats({
      highestScore: Math.max(stats.highestScore, score),
      perfectRounds: perfectRound ? (stats.perfectRounds || 0) + 1 : stats.perfectRounds,
      avgReactionTime: avgTime
    });

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
        setCurrentChallenge(prev => ({ ...prev, userSequence: newSequence, currentIndex: currentIdx + 1 }));
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

  const getTimerColor = () => {
    if (timeRemaining > 60) return 'bg-green-400';
    if (timeRemaining > 30) return 'bg-yellow-300';
    return 'bg-rose-400';
  };

  const HamburgerMenu = () => (
    <div ref={menuRef} className={`fixed top-0 right-0 z-50 ${menuOpen ? 'w-80' : 'w-0'} h-full ${darkMode ? 'bg-gray-800' : 'bg-white'} shadow-2xl transition-all duration-300 overflow-hidden`}>
      <div className="p-6 h-full overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Menu</h2>
          <button onClick={() => setMenuOpen(false)} className={`p-2 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-lg transition`}>
            <X className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
          </button>
        </div>
        <div className="space-y-3">
          {gameState === 'playing' && (
            <button onClick={() => { setGameState('menu'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 ${darkMode ? 'hover:bg-gray-700 bg-red-900/30' : 'hover:bg-red-50 bg-red-50'} rounded-xl transition`}>
              <Home className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-rose-500'}`} />
              <span className={`font-semibold ${darkMode ? 'text-red-400' : 'text-rose-500'}`}>Powrót do menu</span>
            </button>
          )}
          <button onClick={() => { setGameState('about'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-xl transition`}>
            <Info className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-400'}`} />
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>O grze</span>
          </button>
          <button onClick={() => { setGameState('achievements'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-xl transition`}>
            <Award className={`w-6 h-6 ${darkMode ? 'text-yellow-400' : 'text-yellow-400'}`} />
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Osiągnięcia</span>
          </button>
          <button onClick={() => { setGameState('leaderboard'); setMenuOpen(false); }} className={`w-full flex items-center gap-3 p-4 ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} rounded-xl transition`}>
            <BarChart3 className={`w-6 h-6 ${darkMode ? 'text-blue-400' : 'text-blue-400'}`} />
            <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tablica wyników</span>
          </button>
          <div className={`border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'} pt-4 mt-4`}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
              <Settings className="w-5 h-5" /> Ustawienia
            </h3>
            <div className="space-y-3">
              <div className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-violet-50'} rounded-lg`}>
                <div className="flex items-center gap-2">
                  {musicEnabled ? <Music className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} /> : <Music2 className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />}
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>Muzyka</span>
                </div>
                <button onClick={toggleMusic} className={`w-12 h-6 rounded-full transition ${musicEnabled ? 'bg-purple-400' : 'bg-gray-300'} relative`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${musicEnabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-violet-50'} rounded-lg`}>
                <div className="flex items-center gap-2">
                  {soundEnabled ? <Volume2 className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} /> : <VolumeX className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />}
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>Dźwięk</span>
                </div>
                <button onClick={() => setSoundEnabled(!soundEnabled)} className={`w-12 h-6 rounded-full transition ${soundEnabled ? 'bg-green-400' : 'bg-gray-300'} relative`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${soundEnabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-violet-50'} rounded-lg`}>
                <div className="flex items-center gap-2">
                  <Vibrate className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>Wibracje</span>
                </div>
                <button onClick={() => setHapticEnabled(!hapticEnabled)} className={`w-12 h-6 rounded-full transition ${hapticEnabled ? 'bg-green-400' : 'bg-gray-300'} relative`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${hapticEnabled ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
              <div className={`flex items-center justify-between p-3 ${darkMode ? 'bg-gray-700' : 'bg-violet-50'} rounded-lg`}>
                <div className="flex items-center gap-2">
                  {darkMode ? <Moon className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} /> : <Sun className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />}
                  <span className={darkMode ? 'text-white' : 'text-gray-800'}>Ciemny motyw</span>
                </div>
                <button onClick={() => setDarkMode(!darkMode)} className={`w-12 h-6 rounded-full transition ${darkMode ? 'bg-violet-400' : 'bg-gray-300'} relative`}>
                  <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition ${darkMode ? 'right-0.5' : 'left-0.5'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMultiplayerMenu = () => (
    <div className={`min-h-screen ${darkMode ? 'bg-gradient-to-br from-violet-950 to-purple-950' : 'bg-gradient-to-br from-violet-50 to-purple-50'} p-4 flex items-center justify-center`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 max-w-md w-full`}>
            <h1 className={`text-3xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Multiplayer</h1>
            <div className="grid gap-4">
                <button onClick={() => setGameState('createRoom')} className={`p-6 rounded-2xl shadow-md hover:scale-105 transition flex flex-col items-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-purple-50 hover:bg-purple-100'}`}>
                    <div className="text-4xl mb-2">🏠</div>
                    <div className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>Utwórz pokój</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Zostań hostem i zaproś znajomego</div>
                </button>
                <button onClick={() => setGameState('joinRoom')} className={`p-6 rounded-2xl shadow-md hover:scale-105 transition flex flex-col items-center ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-purple-50 hover:bg-purple-100'}`}>
                    <div className="text-4xl mb-2">🚪</div>
                    <div className={`font-bold text-xl ${darkMode ? 'text-white' : 'text-gray-800'}`}>Dołącz do gry</div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Wpisz kod i graj</div>
                </button>
            </div>
            <button onClick={() => setGameState('menu')} className={`w-full mt-8 font-semibold py-3 px-6 rounded-xl transition ${darkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}>Powrót</button>
        </div>
    </div>
  );

  if (gameState === 'multiplayerMenu') return renderMultiplayerMenu();

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
                <p className={`${darkMode ? 'text-gray-300' : 'text-gray-700'} leading-relaxed`}>Klikklik to gra sprawdzająca Twoją szybkość reakcji! Wykonuj różnorodne wyzwania jak najszybciej, zdobywaj punkty i unikaj błędów.</p>
              </section>
              <section>
                <h2 className={`text-2xl font-bold mb-3 ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tryby gry</h2>
                <div className="space-y-3">
                  {gameModes.map((mode) => {
                    const IconComponent = mode.icon;
                    return (
                      <div key={mode.id} className={`p-4 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-violet-50'}`}>
                        <div className="flex items-start gap-3">
                          <div className={`p-2 bg-gradient-to-br ${mode.color} rounded-lg`}><IconComponent className="w-5 h-5 text-white" /></div>
                          <div><h3 className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{mode.name}</h3><p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{mode.description}</p></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
            <button onClick={() => setGameState('menu')} className="w-full mt-8 bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition">Powrót do menu</button>
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
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Nazwa gracza</label>
            <input type="text" value={editingProfile ? tempName : playerName} onChange={(e) => { if (!editingProfile) { setEditingProfile(true); setTempName(e.target.value); } else { setTempName(e.target.value); } }} maxLength={20} className={`w-full px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} focus:border-violet-400 outline-none transition`} placeholder="Wpisz swoje imię" />
          </div>
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Wybierz awatar</label>
            <div className="grid grid-cols-5 gap-2 sm:gap-3">
              {availableAvatars.map((avatar) => (
                <button key={avatar} onClick={() => setPlayerAvatar(avatar)} className={`text-3xl sm:text-4xl p-2 sm:p-3 rounded-xl transition transform hover:scale-110 flex items-center justify-center ${playerAvatar === avatar ? 'bg-violet-400 ring-4 ring-purple-300' : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>{avatar}</button>
              ))}
            </div>
          </div>
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Kod profilu</label>
            <div className="flex gap-2">
              <input type="text" value={profileCode} readOnly className={`flex-1 px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-100 border-gray-200 text-gray-800'} font-mono text-sm`} />
              <button onClick={copyProfileCode} className={`px-4 py-3 rounded-xl ${copiedCode ? 'bg-green-400' : 'bg-purple-400'} text-white transition flex items-center gap-2`}>{copiedCode ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}</button>
            </div>
          </div>
          {!showLoginForm ? (
            <button onClick={() => setShowLoginForm(true)} className={`w-full mb-4 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2`}><LogIn className="w-5 h-5" /> Zaloguj się kodem</button>
          ) : (
            <div className="mb-4">
              <input type="text" value={loginCode} onChange={(e) => setLoginCode(e.target.value.toUpperCase())} placeholder="XXX-XXX" maxLength={7} className={`w-full px-4 py-3 rounded-xl border-2 ${darkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-800'} font-mono mb-2`} />
              <div className="flex gap-2">
                <button onClick={() => { if (loginWithCode(loginCode)) alert('Zalogowano!'); else alert('Błąd!'); }} className="flex-1 bg-emerald-400 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-xl transition">Zaloguj</button>
                <button onClick={() => { setShowLoginForm(false); setLoginCode(''); }} className={`flex-1 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-2 px-4 rounded-xl transition`}>Anuluj</button>
              </div>
            </div>
          )}
          <div className="space-y-3">
            <button onClick={() => { if (editingProfile && tempName.trim()) setPlayerName(tempName.trim()); setEditingProfile(false); setShowLoginForm(false); syncProfileToBackend(); setGameState('menu'); }} className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-2"><Check className="w-5 h-5" /> Zapisz</button>
            <button onClick={() => { setEditingProfile(false); setShowLoginForm(false); setGameState('menu'); }} className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition`}>Anuluj</button>
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
            <p className={`text-center mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Odblokowano: {achievements.length} / {allAchievements.length}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {allAchievements.filter(achievement => !achievement.hidden || achievements.includes(achievement.id)).map((achievement) => {
                const isUnlocked = achievements.includes(achievement.id);
                return (
                  <div key={achievement.id} className={`p-4 rounded-xl border-2 transition ${isUnlocked ? darkMode ? 'bg-gray-700 border-yellow-300/50' : 'bg-yellow-50 border-yellow-300/50' : darkMode ? 'bg-gray-700/50 border-gray-600 opacity-50' : 'bg-violet-50 border-gray-200 opacity-50'}`}>
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{achievement.name}</h3>
                        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{achievement.description}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setGameState('menu')} className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition">Powrót do menu</button>
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
                <button key={mode.id} onClick={() => startGame(mode.id)} className={`p-6 rounded-2xl border-2 ${darkMode ? 'border-gray-700 hover:border-violet-400 bg-gray-700/50 hover:bg-gray-700' : 'border-gray-200 hover:border-violet-400 hover:bg-purple-50'} transition text-left group shadow-md hover:shadow-lg`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 bg-gradient-to-br ${mode.color} rounded-xl group-hover:scale-110 transition shadow-md`}><IconComponent className="w-6 h-6 text-white" /></div>
                    <div className="flex-1">
                      <h3 className={`font-bold text-lg mb-1 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{mode.name}</h3>
                      <p className={`text-sm mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{mode.description}</p>
                    </div>
                    <ChevronRight className={`w-5 h-5 opacity-50 group-hover:opacity-100 transition ${darkMode ? 'text-white' : 'text-gray-800'}`} />
                  </div>
                </button>
              );
            })}
          </div>
          <button onClick={() => setGameState('menu')} className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition shadow-md`}>Powrót</button>
        </div>
      </div>
    );
  }

  if (gameState === 'leaderboard') {
    const currentLeaderboard = getLeaderboardByMode(leaderboardTab);
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} flex items-center justify-center p-4`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-8 max-w-2xl w-full`}>
          <div className="flex items-center justify-center gap-3 mb-6">
            <Trophy className="w-10 h-10 text-yellow-300" />
            <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>Tablica wyników</h1>
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            <button onClick={() => setLeaderboardTab('all')} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${leaderboardTab === 'all' ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white' : 'bg-gray-100'}`}>Wszystkie</button>
            {gameModes.map(m => <button key={m.id} onClick={() => setLeaderboardTab(m.id)} className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition ${leaderboardTab === m.id ? 'bg-gradient-to-r from-purple-400 to-blue-400 text-white' : 'bg-gray-100'}`}>{m.name}</button>)}
          </div>
          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {currentLeaderboard.map((entry, index) => (
              <div key={index} className={`p-4 rounded-xl flex items-center gap-4 ${index < 3 ? 'bg-yellow-50 border-2 border-yellow-300/50' : 'bg-violet-50'}`}>
                <div className="text-2xl font-bold">#{index + 1}</div>
                <div className="text-3xl">{entry.playerAvatar}</div>
                <div className="flex-1">
                  <div className="flex justify-between font-bold"><span>{entry.playerName}</span><span>{entry.score}</span></div>
                  <div className="text-sm text-gray-500">{entry.modeName} • Lvl {entry.level} • {entry.avgTime}ms</div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setGameState('menu')} className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-3 px-6 rounded-xl">Powrót</button>
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
            </div>
          </div>
          <div className="space-y-3">
            <button onClick={() => startGame(selectedMode.id)} className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition">Zagraj ponownie</button>
            <button onClick={() => setGameState('menu')} className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition shadow-md`}>Menu główne</button>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'multiplayerEnd') {
    const myScore = score;
    const opponentScore = isHost ? (gameRoom?.guest_score || 0) : (gameRoom?.host_score || 0);
    
    let resultTitle = 'Porażka';
    let resultIcon = '😢';
    let titleColor = 'from-gray-400 to-gray-600';

    // Determine result based on DB or local fallback
    let iWon = false;
    if (gameRoom?.winner && gameRoom.winner !== 'draw') {
        iWon = gameRoom.winner === profileCode;
    } else if (gameRoom?.winner === 'draw') {
        resultTitle = 'Remis!';
        resultIcon = '🤝';
        titleColor = 'from-blue-400 to-cyan-500';
    } else if (!gameRoom?.winner) {
        // Fallback local calculation
        if (myScore > opponentScore) iWon = true;
        else if (myScore === opponentScore) {
             resultTitle = 'Remis!';
             resultIcon = '🤝';
             titleColor = 'from-blue-400 to-cyan-500';
        }
    }

    if (iWon) {
        resultTitle = 'Zwycięstwo!';
        resultIcon = '🏆';
        titleColor = 'from-yellow-400 to-orange-500';
    }
    
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} p-4 flex items-center justify-center`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} max-w-2xl mx-auto text-center p-8 rounded-3xl shadow-xl`}>
          <div className="text-8xl mb-6 animate-bounce">{resultIcon}</div>
          <h1 className={`text-4xl font-bold mb-4 bg-gradient-to-r ${titleColor} bg-clip-text text-transparent`}>{resultTitle}</h1>
          
          <div className="grid grid-cols-2 gap-6 mb-8 mt-8">
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-2 ${iWon ? 'border-yellow-400' : 'border-transparent'}`}>
              <div className="text-4xl mb-2">{playerAvatar}</div>
              <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{playerName} (Ty)</p>
              <p className="text-3xl font-bold text-purple-400 my-2">{myScore}</p>
            </div>
            <div className={`p-4 rounded-2xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'} border-2 ${!iWon && resultTitle !== 'Remis!' ? 'border-yellow-400' : 'border-transparent'}`}>
              <div className="text-4xl mb-2">{opponent?.avatar}</div>
              <p className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{opponent?.name}</p>
              <p className="text-3xl font-bold text-blue-400 my-2">{opponentScore}</p>
            </div>
          </div>
          <button onClick={() => { leaveMultiplayerRoom(); setGameState('menu'); }} className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition">Powrót do menu</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-violet-50'} p-4`}>
        <HamburgerMenu />
        <button onClick={() => setMenuOpen(true)} className={`fixed top-4 right-4 z-40 p-3 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg hover:shadow-xl transition`}>
            <Menu className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
        </button>

        {/* --- LOBBY (Poprawiony wygląd kodu pokoju) --- */}
        {gameState === 'lobby' && (
            <div className="max-w-md mx-auto mt-20 text-center">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} p-8 rounded-3xl shadow-2xl`}>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'} uppercase tracking-widest mb-2`}>Kod Pokoju</div>
                    
                    <div className="flex items-center justify-center gap-4 mb-8">
                        <div className={`text-6xl font-black tracking-widest ${darkMode ? 'text-white' : 'text-purple-600'}`}>
                            {roomCode}
                        </div>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(roomCode);
                                setCopiedCode(true);
                                setTimeout(() => setCopiedCode(false), 2000);
                            }}
                            className={`p-3 rounded-xl transition ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                        >
                            {copiedCode ? <Check className="w-6 h-6 text-green-500" /> : <Copy className={`w-6 h-6 ${darkMode ? 'text-white' : 'text-gray-700'}`} />}
                        </button>
                    </div>
                    
                    <div className="space-y-4 mb-8">
                        <div className={`flex items-center gap-4 p-3 rounded-xl ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <span className="text-3xl">{gameRoom?.host_avatar}</span>
                            <div className="text-left flex-1">
                                <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{gameRoom?.host_name}</div>
                                <div className="text-xs text-purple-500 font-bold">HOST</div>
                            </div>
                        </div>
                        <div className={`flex items-center gap-4 p-3 rounded-xl transition-all ${gameRoom?.guest_code ? (darkMode ? 'bg-green-900/30 border-2 border-green-700' : 'bg-green-50 border-2 border-green-200') : (darkMode ? 'bg-gray-700 opacity-60' : 'bg-gray-50 opacity-60')}`}>
                            <span className="text-3xl">{gameRoom?.guest_avatar || '👤'}</span>
                            <div className="text-left flex-1">
                                <div className={`font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{gameRoom?.guest_name || 'Oczekiwanie...'}</div>
                                <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>GOŚĆ</div>
                            </div>
                        </div>
                    </div>
                    {isHost ? (
                        <button onClick={startMultiplayerGame} disabled={!gameRoom?.guest_code} className="w-full py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold rounded-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition">{gameRoom?.guest_code ? 'Rozpocznij Grę 🎮' : 'Czekam na gracza...'}</button>
                    ) : (
                        <div className="text-gray-500 animate-pulse font-medium">Czekam na rozpoczęcie przez hosta...</div>
                    )}
                    <button onClick={leaveMultiplayerRoom} className="mt-4 text-red-400 hover:text-red-600 text-sm font-semibold">Opuść pokój</button>
                </div>
            </div>
        )}

        {gameState === 'createRoom' && (
             <div className="max-w-md mx-auto mt-20">
                 <h2 className={`text-2xl font-bold mb-4 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Wybierz tryb</h2>
                 <div className="space-y-3">
                     {gameModes.slice(0,3).map(mode => {
                         const Icon = mode.icon;
                         return (
                             <button key={mode.id} onClick={() => createMultiplayerRoom(mode.id, 1)} className={`w-full p-4 rounded-xl shadow flex items-center gap-3 transition ${darkMode ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-purple-50 text-gray-800'}`}>
                                 <Icon className="w-6 h-6 text-purple-500"/>
                                 <span className="font-bold">{mode.name}</span>
                             </button>
                         );
                     })}
                     <button onClick={() => setGameState('multiplayerMenu')} className="w-full p-4 text-gray-500">Anuluj</button>
                 </div>
             </div>
        )}

        {gameState === 'joinRoom' && (
            <div className={`max-w-md mx-auto mt-20 p-8 rounded-3xl shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-2xl font-bold mb-6 text-center ${darkMode ? 'text-white' : 'text-gray-800'}`}>Wpisz kod pokoju</h2>
                <input value={roomCode} onChange={e => setRoomCode(e.target.value)} className={`w-full text-center text-4xl font-mono border-b-4 focus:border-purple-500 outline-none p-4 mb-8 bg-transparent ${darkMode ? 'text-white border-gray-600' : 'text-gray-800 border-purple-200'}`} placeholder="0000" maxLength={4} />
                <button onClick={() => joinMultiplayerRoom(roomCode)} className="w-full py-4 bg-purple-500 text-white font-bold rounded-xl shadow-lg hover:bg-purple-600 transition">Dołącz</button>
                <button onClick={() => setGameState('multiplayerMenu')} className="w-full mt-4 text-gray-500">Anuluj</button>
            </div>
        )}

        {gameState === 'playing' && countdown !== null && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="text-9xl font-black text-white animate-bounce filter drop-shadow-lg">{countdown}</div>
            </div>
        )}
        
        {gameState === 'playing' && countdown === null && (
            <>
               <div className="max-w-4xl mx-auto mb-4">
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-4 shadow-lg`}>
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
                    </div>
                    {/* ROOM CODE DISPLAY IN GAME */}
                    {multiplayerMode && (
                        <div className={`hidden sm:block px-3 py-1 rounded-lg border ${darkMode ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-purple-50 border-purple-200 text-purple-600'} text-xs font-mono font-bold`}>
                            KOD: {roomCode}
                        </div>
                    )}
                    {selectedMode?.lives !== Infinity && (
                        <div className="flex gap-1 sm:gap-2 justify-end ml-auto">
                        {[...Array(Math.max(lives, 0))].map((_, i) => (
                            <Heart key={i} className="w-6 h-6 sm:w-8 sm:h-8 text-rose-400 fill-rose-400" />
                        ))}
                        </div>
                    )}
                  </div>
                  {!selectedMode?.noTimeLimit && currentChallenge && !currentChallenge.showing && currentChallenge.type !== 'fastClick' && !hideTimer && (
                    <div className={`mt-2 ${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-2 shadow-lg`}>
                        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full ${getTimerColor()} transition-all duration-100 ease-linear`} style={{ width: `${timeRemaining}%` }} />
                        </div>
                    </div>
                    )}
                </div>
               </div>

               {multiplayerMode && opponent && (
                   <div className={`mb-4 p-2 rounded-xl flex justify-between items-center shadow-sm max-w-4xl mx-auto ${darkMode ? 'bg-gray-800 text-white' : 'bg-white/90 text-gray-800'}`}>
                       <div className="flex items-center gap-2">
                           <span className="text-2xl">{opponent.avatar}</span>
                           <span className="font-bold text-sm">{opponent.name}</span>
                       </div>
                       <div className="flex gap-4 text-sm font-mono font-bold">
                           <span>LVL {opponent.level}</span>
                           <span>PKT {opponent.score}</span>
                           <span className="text-red-500">{'❤'.repeat(Math.max(0, opponent.lives))}</span>
                       </div>
                   </div>
               )}
               
               <div className={`max-w-4xl mx-auto rounded-3xl shadow-xl p-8 min-h-[400px] relative overflow-hidden ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
                   {currentChallenge && (
                       <div className="text-center mt-10">
                           <h2 className={`text-2xl font-bold mb-8 ${darkMode ? 'text-white' : 'text-gray-800'}`}>{currentChallenge.instruction}</h2>
                           {currentChallenge.type === 'clickCircle' && (
                                <button onClick={() => handleClick(true)} className="w-20 h-20 rounded-full bg-purple-500 absolute animate-pulse shadow-lg hover:scale-110 transition" style={{ left: `${currentChallenge.x}%`, top: `${currentChallenge.y}%` }} />
                           )}
                           {currentChallenge.type === 'selectColor' && (
                               <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                                   {currentChallenge.options.map((opt, i) => (
                                       <button key={i} onClick={() => handleClick(opt.name === currentChallenge.target.name)} className={`h-32 rounded-2xl shadow-lg transition hover:scale-105 ${opt.bg}`} />
                                   ))}
                               </div>
                           )}
                           {currentChallenge.type === 'fastClick' && currentChallenge.isReady && (
                               <button onClick={() => handleClick(true)} className="w-64 h-64 bg-green-500 rounded-full mx-auto flex items-center justify-center animate-pulse"><Zap className="w-32 h-32 text-white" /></button>
                           )}
                           {/* Add other challenge types here similarly to original code */}
                           {['clickIcon', 'memoryColor', 'mathQuiz', 'directionArrow', 'sequenceMemory', 'colorWord', 'multiClick'].includes(currentChallenge.type) && currentChallenge.type !== 'fastClick' && (
                               <div className="grid grid-cols-2 gap-4">
                                   {currentChallenge.options?.map((opt, i) => (
                                       <button key={i} onClick={() => handleClick(opt === currentChallenge.target || opt.name === currentChallenge.target?.name || opt === currentChallenge.answer)} className={`p-8 rounded-xl shadow-md font-bold text-white transition hover:scale-105 ${opt.bg || 'bg-blue-400'}`}>
                                           {opt.text || opt.label || (opt.Icon && <opt.Icon className="w-8 h-8 mx-auto"/>) || opt}
                                       </button>
                                   ))}
                                    {currentChallenge.type === 'multiClick' && (
                                        <button onClick={() => handleClick(true)} className="col-span-2 w-48 h-48 bg-yellow-400 rounded-full mx-auto flex items-center justify-center shadow-xl"><Smartphone className="w-24 h-24 text-white" /></button>
                                    )}
                               </div>
                           )}
                           {currentChallenge.type === 'sequenceMemory' && !currentChallenge.showing && (
                               <div className="grid grid-cols-3 gap-4">
                                   {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                                       <button key={num} onClick={() => handleClick(null, num)} className="h-20 bg-blue-400 rounded-xl text-white font-bold text-2xl">{num}</button>
                                   ))}
                               </div>
                           )}
                       </div>
                   )}
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
            </>
        )}
        
        {gameState === 'menu' && (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                {/* Przywrócona Karta Profilu */}
                <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-3xl shadow-xl p-6 mb-6 max-w-md w-full`}>
                    <div className="flex items-center gap-4">
                        <div className="text-6xl">{playerAvatar}</div>
                        <div className="flex-1">
                            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-800'}`}>{playerName}</h2>
                            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Osiągnięć: {achievements.length}/{allAchievements.filter(a => !a.hidden || achievements.includes(a.id)).length}
                            </p>
                        </div>
                        <button onClick={() => setGameState('profile')} className={`p-2 ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} rounded-lg transition`}>
                            <Edit2 className={`w-5 h-5 ${darkMode ? 'text-white' : 'text-gray-800'}`} />
                        </button>
                    </div>
                </div>

                {/* Przywrócona Karta Menu Głównego */}
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
                                setTimeout(() => setLogoClicked(false), 500);
                                const newCount = logoClickCount + 1;
                                setLogoClickCount(newCount);
                                if (logoClickTimer.current) clearTimeout(logoClickTimer.current);
                                logoClickTimer.current = setTimeout(() => setLogoClickCount(0), 3000);
                                if (newCount >= 10 && !achievements.includes('logo_clicker')) {
                                    const newAchievements = [...achievements, 'logo_clicker'];
                                    setAchievements(newAchievements);
                                    localStorage.setItem('klikklikAchievements', JSON.stringify(newAchievements));
                                    setNewAchievement(allAchievements.find(a => a.id === 'logo_clicker'));
                                    sounds.achievement();
                                }
                            }}
                        />
                        <h1 className="text-4xl font-bold mb-2">
                            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient">
                                Klikklik
                            </span>
                        </h1>
                        <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sprawdź swoją szybkość reakcji!</p>
                    </div>

                    <div className="space-y-3">
                        <button onClick={() => setGameState('modeSelect')} className="w-full bg-gradient-to-r from-purple-400 to-blue-400 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                            Rozpocznij grę
                        </button>

                        <button onClick={() => setGameState('multiplayerMenu')} className="w-full bg-gradient-to-r from-pink-400 to-rose-400 text-white font-bold py-4 px-8 rounded-xl text-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all flex items-center justify-center gap-3">
                            <Users className="w-6 h-6" />
                            Multiplayer
                        </button>

                        <button onClick={() => setGameState('leaderboard')} className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-md`}>
                            <BarChart3 className="w-5 h-5" />
                            Tablica wyników
                        </button>

                        <button onClick={() => setGameState('achievements')} className={`w-full ${darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} ${darkMode ? 'text-white' : 'text-gray-800'} font-semibold py-3 px-6 rounded-xl transition flex items-center justify-center gap-2 shadow-md`}>
                            <Award className="w-5 h-5" />
                            Osiągnięcia
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default KlikklikGame;