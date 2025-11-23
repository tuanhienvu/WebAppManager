import { useMemo, useCallback } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/translations';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const languages = useMemo(() => [
    { code: 'en-US' as Language, label: 'English', flagImage: 'https://flagcdn.com/w40/us.png' },
    { code: 'vi' as Language, label: 'Tiếng Việt', flagImage: 'https://flagcdn.com/w40/vn.png' },
  ], []);

  const currentLanguage = useMemo(() => 
    languages.find(lang => lang.code === language) || languages[0],
    [languages, language]
  );

  const nextLanguage = useMemo(() => 
    languages.find(lang => lang.code !== language) || languages[1],
    [languages, language]
  );

  const toggleLanguage = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setLanguage(nextLanguage.code);
  }, [nextLanguage.code, setLanguage]);

  return (
    <a
      href="#"
      onClick={toggleLanguage}
      className="p-2 rounded-lg transition-colors flex items-center justify-center hover:opacity-80"
      title={`${currentLanguage.label} - Click to switch to ${nextLanguage.label}`}
    >
      <img
        src={currentLanguage.flagImage}
        alt={currentLanguage.label}
        className="w-6 h-4 object-cover rounded"
      />
    </a>
  );
}

