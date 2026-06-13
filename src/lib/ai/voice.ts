// Unified speech I/O. Uses Web Speech APIs in browsers and Capacitor plugins on native iOS/Android.
// Auto-restarts on iOS where the engine times out after ~1s of silence.

import { Capacitor } from "@capacitor/core";
import { isNative } from "@/lib/native/platform";
import { SpeechRecognition as NativeSR } from "@capacitor-community/speech-recognition";
import { TextToSpeech as NativeTTS } from "@capacitor-community/text-to-speech";

type Listener = (text: string, isFinal: boolean) => void;

interface VoiceController {
  stop: () => void;
}

interface VoiceCaptureOptions {
  /** Auto-stop after this many ms of silence following the latest result. */
  silenceTimeoutMs?: number;
  /**
   * Keep listening across engine timeouts. iOS Safari + iOS native both auto-stop
   * after ~1s of silence; with autoRestart we restart silently until silenceTimeoutMs
   * elapses with no new speech, or the user stops.
   */
  autoRestart?: boolean;
}

const MAX_RESTARTS = 40;
const RESTART_BACKOFF_MS = 250;

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (isNative()) {
    // Speech-to-text relies on the native SpeechRecognition plugin. It is only
    // usable when it is actually compiled into the native build; if not, report
    // unsupported so the UI hides voice instead of throwing "not implemented".
    return Capacitor.isPluginAvailable("SpeechRecognition");
  }
  const w = window as any;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (isNative()) return Capacitor.isPluginAvailable("TextToSpeech");
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// ---------- STT ----------

export function startVoiceCapture(
  onResult: Listener,
  onEnd: () => void,
  onError?: (msg: string) => void,
  opts: VoiceCaptureOptions = {}
): VoiceController | null {
  if (isNative()) return startNativeCapture(onResult, onEnd, onError, opts);
  return startWebCapture(onResult, onEnd, onError, opts);
}

function startWebCapture(
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

  let recognition: any = null;
  let finalText = "";
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let userStopped = false;
  let ended = false;
  let restarts = 0;
  let lastSpeechAt = Date.now();

  const finish = () => {
    if (ended) return;
    ended = true;
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    onResult(finalText.trim(), true);
    onEnd();
  };

  const armSilence = () => {
    if (!opts.silenceTimeoutMs) return;
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      // Real silence: user truly stopped talking.
      userStopped = true;
      try { recognition?.stop(); } catch { /* ignore */ }
      finish();
    }, opts.silenceTimeoutMs);
  };

  const buildRecognition = () => {
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = navigator.language || "en-US";

    rec.onresult = (event: any) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalText += transcript + " ";
        else interim += transcript;
      }
      lastSpeechAt = Date.now();
      onResult((finalText + interim).trim(), false);
      armSilence();
    };

    rec.onspeechstart = () => {
      lastSpeechAt = Date.now();
      armSilence();
    };

    rec.onerror = (event: any) => {
      const err = event.error || "";
      if (err === "no-speech" || err === "aborted") return; // benign on iOS
      if (err === "not-allowed" || err === "service-not-allowed") {
        userStopped = true;
        onError?.("Microphone permission denied. Enable it in Settings.");
        finish();
      }
    };

    rec.onend = () => {
      if (userStopped || ended) { finish(); return; }
      // iOS Safari fires onend after ~1s of silence even with continuous=true.
      // If autoRestart is on and we haven't hit our real silence timeout, restart.
      if (opts.autoRestart && restarts < MAX_RESTARTS) {
        restarts++;
        setTimeout(() => {
          if (userStopped || ended) return;
          try {
            recognition = buildRecognition();
            recognition.start();
          } catch {
            finish();
          }
        }, RESTART_BACKOFF_MS);
        return;
      }
      finish();
    };

    return rec;
  };

  try {
    recognition = buildRecognition();
    recognition.start();
    armSilence();
  } catch {
    onError?.("Could not start microphone");
    return null;
  }

  return {
    stop: () => {
      userStopped = true;
      try { recognition?.stop(); } catch { /* ignore */ }
      finish();
    },
  };
}

function startNativeCapture(
  onResult: Listener,
  onEnd: () => void,
  onError?: (msg: string) => void,
  opts: VoiceCaptureOptions = {}
): VoiceController {
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let restartTimer: ReturnType<typeof setTimeout> | null = null;
  let userStopped = false;
  let ended = false;
  let lastText = "";
  let restarts = 0;
  let partialListener: any = null;
  let stateListener: any = null;
  let starting = false;

  const finish = async () => {
    if (ended) return;
    ended = true;
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
    try { partialListener?.remove?.(); } catch { /* ignore */ }
    try { stateListener?.remove?.(); } catch { /* ignore */ }
    try { await NativeSR.stop(); } catch { /* ignore */ }
    onResult(lastText.trim(), true);
    onEnd();
  };

  const armSilence = () => {
    if (!opts.silenceTimeoutMs) return;
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(() => {
      userStopped = true;
      finish();
    }, opts.silenceTimeoutMs);
  };

  const startEngine = async () => {
    if (starting || userStopped || ended) return;
    starting = true;
    try {
      await NativeSR.start({
        language: navigator.language || "en-US",
        partialResults: true,
        popup: false,
      } as any);
    } catch (e: any) {
      // iOS sometimes throws if already running; safe to ignore.
      const msg = (e?.message || "").toLowerCase();
      if (!msg.includes("already")) {
        onError?.(e?.message || "Could not start microphone");
      }
    } finally {
      starting = false;
    }
  };

  (async () => {
    try {
      const perm = await NativeSR.checkPermissions();
      if (perm.speechRecognition !== "granted") {
        const req = await NativeSR.requestPermissions();
        if (req.speechRecognition !== "granted") {
          onError?.("Microphone permission denied. Enable it in Settings to use voice.");
          return;
        }
      }

      partialListener = await NativeSR.addListener("partialResults", (data: any) => {
        const text = (data?.matches?.[0] || "").trim();
        if (text) {
          lastText = text;
          onResult(text, false);
          armSilence();
        }
      });

      // listeningState fires { status: 'started' | 'stopped' } on plugin v6+.
      try {
        stateListener = await (NativeSR as any).addListener("listeningState", (data: any) => {
          const status = (data?.status || data?.state || "").toString().toLowerCase();
          if (status === "stopped" && !userStopped && !ended && opts.autoRestart && restarts < MAX_RESTARTS) {
            restarts++;
            if (restartTimer) clearTimeout(restartTimer);
            restartTimer = setTimeout(() => { void startEngine(); }, RESTART_BACKOFF_MS);
          }
        });
      } catch { /* listeningState not available on this plugin version */ }

      await startEngine();
      // Arm silence immediately so we still time out even if no partials ever come.
      armSilence();
    } catch (e: any) {
      onError?.(e?.message || "Could not start microphone");
    }
  })();

  return {
    stop: () => {
      userStopped = true;
      void finish();
    },
  };
}

// ---------- TTS ----------

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
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
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

let nativeBoundaryTimer: ReturnType<typeof setInterval> | null = null;

export function speak(text: string, opts: SpeakOptions = {}): void {
  if (!text) { opts.onEnd?.(); return; }

  if (isNative()) {
    cancelSpeech();
    opts.onStart?.();
    if (opts.onBoundary) {
      nativeBoundaryTimer = setInterval(() => opts.onBoundary?.(), 220);
    }
    NativeTTS.speak({
      text,
      lang: navigator.language || "en-US",
      rate: opts.rate ?? 1.0,
      pitch: opts.pitch ?? 1.05,
      volume: opts.volume ?? 1,
      category: "ambient",
    } as any)
      .then(() => {
        if (nativeBoundaryTimer) { clearInterval(nativeBoundaryTimer); nativeBoundaryTimer = null; }
        opts.onEnd?.();
      })
      .catch((e: any) => {
        if (nativeBoundaryTimer) { clearInterval(nativeBoundaryTimer); nativeBoundaryTimer = null; }
        opts.onError?.(e?.message || "tts error");
        opts.onEnd?.();
      });
    return;
  }

  if (!isSpeechSynthesisSupported()) { opts.onEnd?.(); return; }
  const synth = window.speechSynthesis;
  try { synth.cancel(); } catch { /* ignore */ }
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
  if (!voice && typeof synth.onvoiceschanged !== "undefined") {
    synth.onvoiceschanged = () => {
      const v = pickVoice();
      if (v) utter.voice = v;
    };
  }
  synth.speak(utter);
}

export function cancelSpeech(): void {
  if (nativeBoundaryTimer) { clearInterval(nativeBoundaryTimer); nativeBoundaryTimer = null; }
  if (isNative()) {
    NativeTTS.stop().catch(() => { /* ignore */ });
    return;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
}
