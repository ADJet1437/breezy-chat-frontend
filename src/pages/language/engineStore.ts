import { SpeechEngine } from './speechEngine';

// The mic engine can't travel through router state (not serializable), and it
// must be initialized inside a user gesture. Pages share one instance: the
// preview's "Start practicing" click inits it, the session page consumes it,
// and leaving the session disposes it (releasing the microphone).
let engine: SpeechEngine | null = null;

export function getEngine(): SpeechEngine {
  if (!engine) engine = new SpeechEngine();
  return engine;
}

export function disposeEngine(): void {
  engine?.dispose();
  engine = null;
}
