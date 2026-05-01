// Unified speech-to-text. Uses browser Web Speech API (free).
// On Capacitor native, callers can wire in @capacitor-community/speech-recognition later.

type Listener = (text: string, isFinal: boolean) => void;

interface VoiceController {
  stop: () => void;
}

export function isVoiceSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as any;
  return Boolean(w.SpeechRecognition || w.webkitSpeechRecognition);
}

export function startVoiceCapture(onResult: Listener, onEnd: () => void, onError?: (msg: string) => void): VoiceController | null {
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
  };

  recognition.onerror = (event: any) => {
    onError?.(event.error || "Voice error");
  };

  recognition.onend = () => {
    onResult(finalText.trim(), true);
    onEnd();
  };

  try {
    recognition.start();
  } catch (e) {
    onError?.("Could not start microphone");
    return null;
  }

  return {
    stop: () => {
      try {
        recognition.stop();
      } catch {
        // noop
      }
    },
  };
}
