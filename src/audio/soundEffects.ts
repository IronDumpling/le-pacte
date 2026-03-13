import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

const pactStartSource = require('../../assets/sounds/pact-start.wav');
const countdownBeepSource = require('../../assets/sounds/countdown-beep.mp3');
const pactCompleteSource = require('../../assets/sounds/pact-complete.mp3');
const chainLevelUpSource = require('../../assets/sounds/chain-level-up.mp3');
const chainDestructionSource = require('../../assets/sounds/chain-destruction.mp3');

let audioModeConfigured = false;

async function ensureAudioModeConfigured() {
  if (audioModeConfigured) return;
  try {
    await setAudioModeAsync({
      interruptionMode: 'mixWithOthers',
    });
    audioModeConfigured = true;
  } catch {
    // ignore configuration errors; sounds just might not play in silent mode
  }
}

const pactStartPlayer = createAudioPlayer(pactStartSource);
const countdownBeepPlayer = createAudioPlayer(countdownBeepSource);
const pactCompletePlayer = createAudioPlayer(pactCompleteSource);
const chainLevelUpPlayer = createAudioPlayer(chainLevelUpSource);
const chainDestructionPlayer = createAudioPlayer(chainDestructionSource);

async function playFromStart(player: ReturnType<typeof createAudioPlayer>) {
  await ensureAudioModeConfigured();
  try {
    player.seekTo(0);
    await player.play();
  } catch {
    // ignore individual playback errors
  }
}

export function playPactStartSound() {
  void playFromStart(pactStartPlayer);
}

export function playCountdownBeepSound() {
  void playFromStart(countdownBeepPlayer);
}

export function playPactCompleteSound() {
  void playFromStart(pactCompletePlayer);
}

export function playChainLevelUpSound() {
  void playFromStart(chainLevelUpPlayer);
}

export function playChainDestructionSound() {
  void playFromStart(chainDestructionPlayer);
}

