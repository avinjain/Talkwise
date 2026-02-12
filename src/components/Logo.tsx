import Image from 'next/image';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function Logo({
  size = 40,
  showText = false,
  className = '',
}: LogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <Image
        src="/logo.png"
        alt="TalkWise"
        width={size}
        height={size}
        className="mix-blend-multiply"
        priority
      />
      {showText && (
        <span
          className="font-extrabold tracking-tight text-gradient"
          style={{ fontSize: size * 0.55 }}
        >
          TalkWise
        </span>
      )}
    </div>
  );
}
