import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { IconCheckCircle, IconClose, IconXCircle } from '@/components/icons';

type MessagePopupProps = {
  message: string;
  variant?: 'success' | 'error';
  onClose?: () => void;
  duration?: number;
};

const variantStyles: Record<
  NonNullable<MessagePopupProps['variant']>,
  { container: string; icon: string }
> = {
  success: {
    container:
      'bg-emerald-600/95 border border-emerald-400/30 shadow-2xl shadow-emerald-500/40',
    icon: 'text-white',
  },
  error: {
    container:
      'bg-rose-600/95 border border-rose-400/30 shadow-2xl shadow-rose-500/40',
    icon: 'text-white',
  },
};

export default function MessagePopup({
  message,
  variant = 'success',
  onClose,
  duration = 5000,
}: MessagePopupProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!duration || duration <= 0) {
      return;
    }
    const timer = window.setTimeout(() => {
      onClose?.();
    }, duration);
    return () => window.clearTimeout(timer);
  }, [duration, onClose, message]);

  if (!mounted || !message) {
    return null;
  }

  const styles = variantStyles[variant];

  const content = (
    <div className="fixed top-6 right-6 z-[100] pointer-events-none">
      <div
        className={`pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-sm text-white ${styles.container}`}
        role="alert"
        aria-live="assertive"
      >
        {variant === 'success' ? (
          <IconCheckCircle className={`h-5 w-5 ${styles.icon}`} />
        ) : (
          <IconXCircle className={`h-5 w-5 ${styles.icon}`} />
        )}
        <div className="flex-1">{message}</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="ml-2 rounded-full p-1 text-white/70 hover:text-white transition-colors"
            aria-label="Dismiss message"
          >
            <IconClose className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  if (typeof document === 'undefined') {
    return content;
  }

  return createPortal(content, document.body);
}

