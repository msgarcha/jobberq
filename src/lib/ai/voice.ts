// Unified speech I/O. Uses the browser's free Web Speech APIs.
// STT: SpeechRecognition. TTS: window.speechSynthesis.

type Listener = (text: string, isFinal: boolean) => void;

interface VoiceController {
  stop: () => void;
}

interface VoiceCaptureOptions {
  /** When set, auto-stop after this many ms of silence following the latest result. Used in voice-chat mode. */
  silenceTimeoutMs?: number;
}

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function startVoiceCapture(
  onResult: Listener,
  onEnd: () => void,
  onError?: (msg: string) => void,
  opts: VoiceCaptureOptions = {}
): VoiceController | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  if (!SR) {
    onError?.("Voice not supported on this browser. Try Chrome or Safari.");
    return null;
  }

  const recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = navigator.language || "en-US";

  let finalText = "";
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let stopped = false;

  const armSilence = () => {
    if (!opts.silenceTimeoutMs) return;
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      try {
        recognition.stop();
      } catch {
        // noop
      }
    }, opts.silenceTimeoutMs);
  };

  recognition.onresult = (event: any) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        finalText += transcript + " ";
      } else {
        interim += transcript;
      }
    }
    onResult((finalText + interim).trim(), false);
    armSilence();
  };

  recognition.onerror = (event: any) => {
    if (event.error === "no-speech" || event.error === "aborted") return;
    onError?.(event.error || "Voice error");
  };

  recognition.onend = () => {
    if (silenceTimer) {
      clearTimeout(silenceTimer);
      silenceTimer = null;
    }
    if (stopped) return;
    stopped = true;
    onResult(finalText.trim(), true);
    onEnd();
  };

  try {
    recognition.start();
    armSilence();
  } catch (e) {
    onError?.("Could not start microphone");
    return null;
  }

  return {
    stop: () => {
      if (silenceTimer) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      try {
        recognition.stop();
      } catch {
        // noop
      }
    },
  };
}

export interface SpeakOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onBoundary?: () => void;
  onEnd?: () => void;
  onError?: (msg: string) => void;
}

let pickedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSynthesisSupported()) return null;
  if (pickedVoice) return pickedVoice;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;
  const lang = (navigator.language || "en-US").toLowerCase();
  const langBase = lang.split("-")[0];
  const PREFERRED = /Samantha|Ava|Serena|Karen|Allison|Moira|Google US English|Google UK English Female|Microsoft Aria|Microsoft Jenny|Microsoft Guy|Natural|Neural|Premium|Enhanced/i;
  pickedVoice =
    voices.find((v) => v.lang?.toLowerCase() === lang && PREFERRED.test(v.name)) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(langBase) && PREFERRED.test(v.name)) ||
    voices.find((v) => v.lang?.toLowerCase() === lang) ||
    voices.find((v) => v.lang?.toLowerCase().startsWith(langBase)) ||
    voices.find((v) => v.default) ||
    voices[0];
  return pickedVoice;
}

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!text || !isSpeechSynthesisSupported()) {
    opts.onEnd?.();
    return;
  }
  const synth = window.speechSynthesis;
  // Cancel anything currently speaking so we never queue up.
  try {
    synth.cancel();
  } catch {
    // noop
  }
  const utter = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) utter.voice = voice;
  utter.rate = opts.rate ?? 1.0;
  utter.pitch = opts.pitch ?? 1.05;
  utter.volume = opts.volume ?? 1;
  utter.onstart = () => opts.onStart?.();
  utter.onboundary = () => opts.onBoundary?.();
  utter.onend = () => opts.onEnd?.();
  utter.onerror = (e: any) => {
    opts.onError?.(e?.error || "speech error");
    opts.onEnd?.();
  };
  // Voices may load async; if missing, kick the loader and try once more.
  if (!voice && typeof synth.onvoiceschanged !== "undefined") {
    synth.onvoiceschanged = () => {
      const v = pickVoice();
      if (v) utter.voice = v;
    };
  }
  synth.speak(utter);
}

export function cancelSpeech(): void {
  if (!isSpeechSynthesisSupported()) return;
  try {
    window.speechSynthesis.cancel();
  } catch {
    // noop
  }
}
