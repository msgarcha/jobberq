import logoIcon from "@/assets/quicklinq-icon.png";
import logoFull from "@/assets/quicklinq-logo-full.png";

interface QuickLinqLogoProps {
  size?: number;
  className?: string;
  variant?: "dark" | "white";
  type?: "icon" | "full";
}

const WHITE_FILTER = "brightness(0) invert(1)";

export default function QuickLinqLogo({
  size = 36,
  className = "",
  variant = "dark",
  type = "icon",
}: QuickLinqLogoProps) {
  const src = type === "full" ? logoFull : logoIcon;

  return (
    <img
      src={src}
      alt="QuickLinq"
      width={type === "full" ? undefined : size}
      height={size}
      className={className}
      style={{
        objectFit: "contain",
        ...(type === "full" ? { height: size } : {}),
        ...(variant === "white" ? { filter: WHITE_FILTER } : {}),
      }}
    />
  );
}
