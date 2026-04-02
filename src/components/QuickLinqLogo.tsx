import logoWhite from "@/assets/quicklinq-logo-white.png";

interface QuickLinqLogoProps {
  size?: number;
  className?: string;
  variant?: "white" | "green";
}

const GREEN_FILTER =
  "brightness(0) saturate(100%) invert(58%) sepia(32%) saturate(600%) hue-rotate(115deg) brightness(92%) contrast(87%)";

export default function QuickLinqLogo({
  size = 36,
  className = "",
  variant = "white",
}: QuickLinqLogoProps) {
  return (
    <img
      src={logoWhite}
      alt="QuickLinq"
      width={size}
      height={size}
      className={className}
      style={{
        objectFit: "contain",
        ...(variant === "green" ? { filter: GREEN_FILTER } : {}),
      }}
    />
  );
}
