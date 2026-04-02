import logoImg from "@/assets/quicklinq-logo.png";

interface QuickLinqLogoProps {
  size?: number;
  className?: string;
}

export default function QuickLinqLogo({ size = 36, className = "" }: QuickLinqLogoProps) {
  return (
    <img
      src={logoImg}
      alt="QuickLinq"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: "contain" }}
    />
  );
}
