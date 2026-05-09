import { cn } from "@/lib/utils";
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";

export type OrbState = "listening" | "thinking" | "speaking" | "idle";

interface Props {
  state: OrbState;
  transcript?: string;
  reply?: string;
  micMuted?: boolean;
  speakerMuted?: boolean;
  onToggleMic?: () => void;
  onToggleSpeaker?: () => void;
  onEndCall: () => void;
  pulseKey?: number; // increments to retrigger ripple on each TTS word
}

export function VoiceOrb({
  state,
  transcript,
  reply,
  micMuted,
  speakerMuted,
  onToggleMic,
  onToggleSpeaker,
  onEndCall,
  pulseKey = 0,
}: Props) {
  const stateLabel =
    state === "listening" ? "Listening…" :
    state === "thinking" ? "Thinking…" :
    state === "speaking" ? "Speaking…" :
    "Tap to talk";

  return (
    <div className="absolute inset-0 z-10 flex flex-col bg-gradient-to-b from-background via-background to-secondary/30 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* Orb */}
        <div className="relative h-44 w-44 flex items-center justify-center">
          {/* Outer ripple rings - listening/speaking */}
          {(state === "listening" || state === "speaking") && (
            <>
              <span
                key={`r1-${pulseKey}`}
                className="absolute inset-0 rounded-full bg-primary/30 animate-pulse-ring"
              />
              <span
                key={`r2-${pulseKey}`}
                className="absolute inset-0 rounded-full bg-primary/20 animate-pulse-ring"
                style={{ animationDelay: "0.6s" }}
              />
              <span
                key={`r3-${pulseKey}`}
                className="absolute inset-0 rounded-full bg-primary/10 animate-pulse-ring"
                style={{ animationDelay: "1.2s" }}
              />
            </>
          )}

          {/* Thinking spinner ring */}
          {state === "thinking" && (
            <span className="absolute inset-0 rounded-full border-4 border-primary/30 border-t-primary animate-orb-spin" />
          )}

          {/* Core orb */}
          <div
            className={cn(
              "relative h-32 w-32 rounded-full shadow-2xl shadow-primary/40",
              "bg-gradient-to-br from-primary via-primary to-primary/70",
              state !== "idle" && "animate-orb-breathe"
            )}
            style={{
              boxShadow:
                state === "speaking"
                  ? "0 0 60px hsl(var(--primary) / 0.55), 0 0 120px hsl(var(--primary) / 0.3)"
                  : state === "listening"
                  ? "0 0 40px hsl(var(--primary) / 0.4)"
                  : undefined,
            }}
          >
            <div className="absolute inset-3 rounded-full bg-gradient-to-tr from-white/20 via-white/5 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center text-primary-foreground">
              {state === "speaking" ? (
                <Volume2 className="h-8 w-8" />
              ) : micMuted ? (
                <MicOff className="h-8 w-8" />
              ) : (
                <Mic className="h-8 w-8" />
              )}
            </div>
          </div>
        </div>

        {/* State label */}
        <div className="text-center space-y-2 max-w-sm">
          <p className="text-sm font-medium text-muted-foreground tracking-wide uppercase">
            {stateLabel}
          </p>
          {state === "listening" && transcript && (
            <p className="text-base text-foreground italic line-clamp-3">"{transcript}"</p>
          )}
          {(state === "speaking" || state === "thinking") && reply && (
            <p className="text-base text-foreground line-clamp-4">{reply}</p>
          )}
          {state === "idle" && !transcript && !reply && (
            <p className="text-base text-foreground">Linq is on the line.</p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="px-6 pb-8 pt-4 flex items-center justify-center gap-4 safe-area-bottom">
        {onToggleMic && (
          <Button
            type="button"
            size="icon"
            variant={micMuted ? "destructive" : "secondary"}
            onClick={onToggleMic}
            className="h-12 w-12 rounded-full"
            aria-label={micMuted ? "Unmute mic" : "Mute mic"}
          >
            {micMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </Button>
        )}
        <Button
          type="button"
          size="icon"
          variant="destructive"
          onClick={onEndCall}
          className="h-14 w-14 rounded-full shadow-lg"
          aria-label="End voice chat"
        >
          <PhoneOff className="h-6 w-6" />
        </Button>
        {onToggleSpeaker && (
          <Button
            type="button"
            size="icon"
            variant={speakerMuted ? "destructive" : "secondary"}
            onClick={onToggleSpeaker}
            className="h-12 w-12 rounded-full"
            aria-label={speakerMuted ? "Unmute Linq" : "Mute Linq"}
          >
            {speakerMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </Button>
        )}
      </div>
    </div>
  );
}
