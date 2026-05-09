// Unified speech I/O. Uses Web Speech APIs in browsers and Capacitor plugins on native iOS/Android.

import { isNative } from "@/lib/native/platform";
import { SpeechRecognition as NativeSR } from "@capacitor-community/speech-recognition";
import { TextToSpeech as NativeTTS } from "@capacitor-community/text-to-speech";

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
  if (isNative()) return true; // Capacitor plugin handles it
  const w = window as any;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function isSpeechSynthesisSupported(): boolean {
  if (isNative()) return true;
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
      try { recognition.stop(); } catch {}
    }, opts.silenceTimeoutMs);
  };

  recognition.onresult = (event: any) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript;
      if (event.results[i].isFinal) finalText += transcript + " ";
      else interim += transcript;
    }
    onResult((finalText + interim).trim(), false);
    armSilence();
  };

  recognition.onerror = (event: any) => {
    if (event.error === "no-speech" || event.error === "aborted") return;
    onError?.(event.error || "Voice error");
  };

  recognition.onend = () => {
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    if (stopped) return;
    stopped = true;
    onResult(finalText.trim(), true);
    onEnd();
  };

  try {
    recognition.start();
    armSilence();
  } catch {
    onError?.("Could not start microphone");
    return null;
  }

  return {
    stop: () => {
      if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
      try { recognition.stop(); } catch {}
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
  let stopped = false;
  let lastText = "";
  let partialListener: any = null;

  const cleanup = async () => {
    if (silenceTimer) { clearTimeout(silenceTimer); silenceTimer = null; }
    try { partialListener?.remove?.(); } catch {}
    try { await NativeSR.stop(); } catch {}
  };

  const armSilence = () => {
    if (!opts.silenceTimeoutMs) return;
    if (silenceTimer) clearTimeout(silenceTimer);
    silenceTimer = setTimeout(async () => {
      if (stopped) return;
      stopped = true;
      await cleanup();
      onResult(lastText.trim(), true);
      onEnd();
    }, opts.silenceTimeoutMs);
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
      await NativeSR.start({
        language: navigator.language || "en-US",
        partialResults: true,
        popup: false,
      } as any);
      armSilence();
    } catch (e: any) {
      onError?.(e?.message || "Could not start microphone");
    }
  })();

  return {
    stop: () => {
      (async () => {
        if (stopped) return;
        stopped = true;
        await cleanup();
        onResult(lastText.trim(), true);
        onEnd();
      })();
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
  try { synth.cancel(); } catch {}
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
    NativeTTS.stop().catch(() => {});
    return;
  }
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try { window.speechSynthesis.cancel(); } catch {}
}
