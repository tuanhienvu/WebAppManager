import Image from 'next/image';

type LogoSize = 'sm' | 'md' | 'lg';

interface LogoProps {
  className?: string;
  size?: LogoSize;
}

export default function Logo({ className = '', size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  const sizeValues: Record<LogoSize, string> = {
    sm: '24px',
    md: '32px',
    lg: '48px',
  };

  return (
    <div className={`${sizeClasses[size]} ${className} relative flex-shrink-0 rounded-full overflow-hidden`}>
      <Image
        src="/Logo.jpg"
        alt="WebApp Manager Logo"
        fill
        sizes={sizeValues[size]}
        className="object-cover"
        priority
      />
    </div>
  );
}
