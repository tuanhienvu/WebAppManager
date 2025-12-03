import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  IconComputer,
  IconCode,
  IconKey,
  IconDocument,
  IconClose,
  IconSettings,
  IconMail,
  IconPhone,
  IconLink,
  IconUser,
  IconMapPin,
  IconFacebook,
  IconTwitter,
  IconLinkedIn,
  IconGithub,
  IconGlobe,
  IconShield,
} from './icons';
import Logo from './Logo';
import { CompanySettings } from '../types/company';
import { useLanguage } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import { apiFetch, getUploadUrl } from '../lib/api-client';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { FEATURES, FEATURE_DEFINITIONS, type FeatureKey } from '../lib/authorization';

interface LayoutProps {
  children: React.ReactNode;
}

interface SocialLink {
  platform: string;
  url: string;
  icon?: string;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const { user, loading: userLoading, hasPermission } = useCurrentUser();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings>({});
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [featureEnabled, setFeatureEnabled] = useState<Record<FeatureKey, boolean>>(() => {
    const enabled: Record<FeatureKey, boolean> = {} as Record<FeatureKey, boolean>;
    FEATURE_DEFINITIONS.forEach(f => {
      enabled[f.key] = true; // Default: all features enabled
    });
    return enabled;
  });

  const renderSocialIcon = useCallback((link: SocialLink) => {
    const iconKey = (link.icon || link.platform || '').toLowerCase();
    switch (iconKey) {
      case 'facebook':
      case 'facebook-f':
        return <IconFacebook className="h-4 w-4" />;
      case 'twitter':
      case 'x':
      case 'x-twitter':
        return <IconTwitter className="h-4 w-4" />;
      case 'linkedin':
      case 'linkedin-in':
        return <IconLinkedIn className="h-4 w-4" />;
      case 'github':
        return <IconGithub className="h-4 w-4" />;
      case 'website':
      case 'globe':
      case 'web':
      case 'site':
        return <IconGlobe className="h-4 w-4" />;
      default:
        return <IconLink className="h-4 w-4" />;
    }
  }, []);

  const navigation = useMemo(
    () => [
      { 
        name: t('navigation.software'), 
        href: '/', 
        icon: IconComputer,
        feature: FEATURES.SOFTWARE,
      },
      { 
        name: t('navigation.versions'), 
        href: '/versions', 
        icon: IconCode,
        feature: FEATURES.VERSIONS,
      },
      { 
        name: t('navigation.tokens'), 
        href: '/tokens', 
        icon: IconKey,
        feature: FEATURES.TOKENS,
      },
      { 
        name: t('navigation.auditLogs'), 
        href: '/audit-logs', 
        icon: IconDocument,
        feature: FEATURES.AUDIT_LOGS,
      },
      { 
        name: t('navigation.settings'), 
        href: '/settings', 
        icon: IconSettings,
        feature: FEATURES.SETTINGS,
      },
    ],
    [t],
  );

  const filteredNavigation = useMemo(
    () =>
      navigation.filter((item) => {
        // Check adminOnly flag (for API Docs)
        if ('adminOnly' in item && item.adminOnly && user?.role !== 'ADMIN') {
          return false;
        }
        // Check permission matrix for feature-based navigation items
        // Map feature key (e.g., 'software') to FEATURES constant (e.g., 'SOFTWARE')
        if (item.feature) {
          const featureKey = Object.keys(FEATURES).find(
            key => FEATURES[key as keyof typeof FEATURES] === item.feature
          ) as keyof typeof FEATURES | undefined;
          if (featureKey) {
            // Check if feature is enabled AND user has permission
            const featureKeyValue = item.feature as FeatureKey;
            if (!featureEnabled[featureKeyValue]) {
              return false; // Feature is disabled
            }
            return hasPermission('READ', featureKey);
          }
        }
        return true;
      }),
    [navigation, user?.role, hasPermission, featureEnabled],
  );

  const isActive = useCallback((path: string) => {
    if (path === '/') {
      return router.pathname === '/';
    }
    return router.pathname.startsWith(path);
  }, [router.pathname]);

  // Fetch company settings on mount
  useEffect(() => {
    const fetchAllSettings = async () => {
      try {
        const response = await apiFetch('/api/settings');
        if (response.ok) {
          const data = await response.json();
          
          // Set company settings
          setCompanySettings({
            companyName: data.companyName || 'VULE ITS',
            slogan: data.slogan || 'Bring Your Success',
            logo: data.logo || '/uploads/Logo.jpg',
            address: data.address || 'Thôn Bắc Hội, xã Hiệp Thạnh, tỉnh Lâm Đồng',
            email: data.email || 'info@vuleits.com',
            phone: data.phone || '+84 963 373 213',
            mobile: data.mobile || '+84 982 068 806',
          });

          // Parse and set social links
          if (data.socialLinks) {
            try {
              const links = typeof data.socialLinks === 'string' 
                ? JSON.parse(data.socialLinks) 
                : data.socialLinks;
              setSocialLinks(Array.isArray(links) ? links : []);
            } catch {
              setSocialLinks([]);
            }
          } else {
            setSocialLinks([]);
          }

          // Load feature enabled state
          const enabled: Record<FeatureKey, boolean> = {} as Record<FeatureKey, boolean>;
          FEATURE_DEFINITIONS.forEach(f => {
            const key = `feature_${f.key}_enabled`;
            enabled[f.key] = data[key] !== 'false'; // Default to enabled if not set
          });
          setFeatureEnabled(enabled);
        }
      } catch {
        // Ignore errors
      }
    };

    fetchAllSettings();
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch {
      router.push('/login');
    }
  }, [router]);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [router.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [sidebarOpen]);

  // Close mobile sidebar on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        setSidebarOpen(false);
      }
      if (e.key === 'Escape' && userDropdownOpen) {
        setUserDropdownOpen(false);
      }
    };
    if (sidebarOpen || userDropdownOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [sidebarOpen, userDropdownOpen]);

  // Close user dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (userDropdownOpen && !target.closest('.user-dropdown')) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userDropdownOpen]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Sidebar Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-opacity-50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full bg-slate-900 shadow-2xl z-50 transform transition-all duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${
          sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
        } w-64`}
        aria-label="Sidebar navigation"
      >
        <div className="flex flex-col h-full">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900 h-16">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {companySettings.logo && (
                  <img
                    src={getUploadUrl(companySettings.logo)}
                    alt={companySettings.companyName || 'Company Logo'}
                    className="h-10 w-10 object-cover rounded-full flex-shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  {companySettings.companyName && (
                    <div className="flex items-center gap-2">
                      <span className="text-md font-semibold text-cyan-400 font-zcool truncate">
                        {companySettings.companyName}
                      </span>
                    </div>
                  )}
                  {companySettings.slogan ? (
                    <p className="text-sm text-slate-400 mt-0.5 font-zcool truncate">{companySettings.slogan}</p>
                  ) : (
                    <p className="text-sm text-slate-400 mt-0.5 font-zcool">{t('common.bringYourSuccess')}</p>
                  )}
                </div>
              </div>
            )}
            {sidebarCollapsed && (
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="flex items-center justify-center w-full cursor-pointer hover:bg-slate-800 rounded transition-colors p-1"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                {companySettings.logo ? (
                  <img
                    src={getUploadUrl(companySettings.logo)}
                    alt={companySettings.companyName || 'Company Logo'}
                    className="h-10 w-10 object-cover rounded-full"
                  />
                ) : (
                  <Logo size="sm" />
                )}
              </button>
            )}
            <div className="flex items-center gap-2 flex-shrink-0">
              {!sidebarCollapsed && (
                <button
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="hidden lg:flex p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                  aria-label="Collapse sidebar"
                  title="Collapse sidebar"
                >
                  <svg
                    className="w-5 h-5 transition-transform"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
              )}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                aria-label="Close sidebar"
              >
                <IconClose className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Sidebar Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-3">
            <ul className="space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 group ${
                        active
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/20 text-cyan-400 border-l-4 border-cyan-400 shadow-lg shadow-cyan-500/20'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-cyan-400'
                      }`}
                      title={sidebarCollapsed ? item.name : ''}
                    >
                      <Icon
                        className={`flex-shrink-0 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'} h-5 w-5 ${
                          active ? 'text-white' : 'text-slate-300'
                        }`}
                      />
                      {!sidebarCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
        {/* Top Navigation Bar */}
        <header className={`fixed top-0 right-0 left-0 bg-slate-900 border-b border-slate-800 shadow-lg z-20 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'
        }`}>
          <div className="px-4 py-3 flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 text-slate-300 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
                aria-label="Toggle sidebar"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <Link
                href="/"
                className="flex items-center text-white font-bold text-lg"
              >
                <span className="whitespace-nowrap bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">WebApp Manager</span>
              </Link>
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.length > 0 && (
                <div className="hidden md:flex items-center gap-2 pr-3 mr-3 border-r border-slate-700 text-slate-300">
                  {socialLinks.map((link, index) => (
                    <a
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-cyan-400 transition-colors"
                      title={link.platform}
                      aria-label={link.platform}
                    >
                      {renderSocialIcon(link)}
                    </a>
                  ))}
                </div>
              )}
              {/* User Dropdown */}
              <div className="relative user-dropdown">
                {user ? (
                  <>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <div className="hidden md:flex flex-col items-end">
                        <span className="text-sm font-medium text-white">{user.name}</span>
                        <span className="text-xs text-slate-400">{user.role}</span>
                      </div>
                      {user.avatar ? (
                        <img
                          src={getUploadUrl(user.avatar)}
                          alt={user.name}
                          className="h-8 w-8 rounded-full border-2 border-cyan-400 cursor-pointer"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 cursor-pointer">
                          <span className="text-xs font-medium text-white">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </button>
                    {/* Dropdown Menu */}
                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 overflow-hidden">
                        <div className="py-2">
                          <div className="px-4 py-2 border-b border-slate-700">
                            <p className="text-sm font-medium text-white">{user.name}</p>
                            <p className="text-xs text-slate-400">{user.email}</p>
                          </div>
                          <Link
                            href={`/settings`}
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <IconUser className="h-4 w-4" />
                            <span>{t('header.profile')}</span>
                          </Link>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              handleLogout();
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                            <span>{t('header.logout')}</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                ) : !userLoading ? (
                  <>
                    <button
                      onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                      className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <IconUser className="h-6 w-6 text-slate-300" />
                    </button>
                    {/* Dropdown Menu for Non-logged in users */}
                    {userDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-xl border border-slate-700 z-50 overflow-hidden">
                        <div className="py-2">
                          <Link
                            href="/login"
                            onClick={() => setUserDropdownOpen(false)}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                            </svg>
                            <span>{t('header.login')}</span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </>
                ) : null}
              </div>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="pt-16 px-4 py-6 lg:px-6 pb-6 md:pb-24 mt-[50px]">
          <div className="max-w-7xl mx-auto">{children}</div>
        </main>

        {/* Footer */}
        <footer className={`hidden md:block fixed bottom-0 right-0 left-0 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-t border-slate-700 z-20 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'
        }`}>
          <div className="px-4 py-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col gap-6">
                {/* Top Row: Company Name, Copyright, and Company Info */}
                <div className="flex flex-col xxl:flex-row items-start xxl:items-center xxl:justify-between gap-4">
                  <div className="flex flex-wrap items-start md:items-center gap-2 md:gap-4 text-sm">
                    {companySettings.companyName && (
                      <span className="text-slate-400 text-xs font-zcool">
                        {companySettings.companyName}
                      </span>
                    )}
                    <span className="hidden md:inline text-slate-400">|</span>
                    <span className="text-slate-400 text-xs flex items-center gap-2">
                      © {currentYear} {t('footer.allRightsReserved')}
                      <span className="hidden md:inline text-slate-400">|</span>
                      <a
                        href="/privacy"
                        className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors text-xs font-zcool"
                      >
                        <IconDocument className="h-4 w-4" />
                        <span>{t('footer.privacy')}</span>
                      </a>
                    </span>
                  </div>
                  <div className="flex flex-wrap items-start md:items-center gap-2 md:gap-4 text-sm w-full xxl:w-auto">
                    {companySettings.address && (
                      <>
                        <span className="hidden md:inline text-slate-400">|</span>
                        <span className="flex items-center gap-1.5 text-slate-400 text-xs font-zcool">
                          <IconMapPin className="h-4 w-4 flex-shrink-0" />
                          <span className="break-words">{t('footer.address')}: {companySettings.address}</span>
                        </span>
                      </>
                    )}
                    {companySettings.email && (
                      <>
                        <span className="hidden md:inline text-slate-400">|</span>
                        <a
                          href={`mailto:${companySettings.email}`}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors text-xs"
                        >
                          <IconMail className="h-4 w-4 flex-shrink-0" />
                          <span>{companySettings.email}</span>
                        </a>
                      </>
                    )}
                    {companySettings.phone && (
                      <>
                        <span className="hidden md:inline text-slate-400">|</span>
                        <a
                          href={`tel:${companySettings.phone}`}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors text-xs"
                        >
                          <IconPhone className="h-4 w-4 flex-shrink-0" />
                          <span>{companySettings.phone}</span>
                        </a>
                      </>
                    )}
                    {companySettings.mobile && (
                      <>
                        <span className="hidden md:inline text-slate-400">|</span>
                        <a
                          href={`tel:${companySettings.mobile}`}
                          className="flex items-center gap-1.5 text-slate-400 hover:text-cyan-400 transition-colors text-xs"
                        >
                          <IconPhone className="h-4 w-4 flex-shrink-0" />
                          <span>{companySettings.mobile}</span>
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
