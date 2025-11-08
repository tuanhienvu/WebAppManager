import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import {
  IconPlus,
  IconEdit,
  IconDelete,
  IconMail,
  IconPhone,
  IconUpload,
  IconLink,
} from '@/components/icons';
import { CompanySettings } from '@/types/company';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLanguage } from '@/contexts/LanguageContext';

interface SocialLink {
  platform: string;
  url: string;
}

interface Settings extends CompanySettings {
  socialLinks?: SocialLink[];
}

interface User {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'MANAGER' | 'USER';
  phone: string | null;
  avatar: string | null;
  isActive: boolean;
  permissions?: UserPermission[];
}

interface UserPermission {
  id: string;
  permission: string;
  resource: string | null;
}

export default function SettingsPage() {
  const { t } = useLanguage();
  const {
    canManageUsers,
    canAddUsers,
    isAdmin,
    user: currentUser,
    isUser,
    isManager,
  } = useCurrentUser();
  const [activeTab, setActiveTab] = useState(0);
  const [settings, setSettings] = useState<Settings>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userFormData, setUserFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'USER' as 'ADMIN' | 'MANAGER' | 'USER',
    phone: '',
    avatar: '',
  });
  const [logoUploadMode, setLogoUploadMode] = useState<'upload' | 'url'>('url');
  const [avatarUploadMode, setAvatarUploadMode] = useState<'upload' | 'url'>('url');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const hasEditingUser = Boolean(editingUser);
  const editingUserIsAdmin = editingUser?.role === 'ADMIN';
  const isReadOnlyUser = isUser;
  const isCompanyContactReadOnly = isUser || isManager;

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        // Parse socialLinks if it's a string (JSON stored in DB)
        if (data.socialLinks) {
          try {
            data.socialLinks = typeof data.socialLinks === 'string' 
              ? JSON.parse(data.socialLinks) 
              : data.socialLinks;
          } catch {
            data.socialLinks = [];
          }
        } else {
          data.socialLinks = [];
        }
        setSettings(data);
      }
    } catch {
      setError(t('settings.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = useCallback(async () => {
    try {
      // If user is USER role, only fetch their own profile
      if (isUser && currentUser) {
        const response = await fetch(`/api/users/${currentUser.id}`);
        if (response.ok) {
          const data = await response.json();
          setUsers([data]);
        }
      } else if (canManageUsers) {
        // ADMIN and MANAGER can fetch all users
        const response = await fetch('/api/users');
        if (response.ok) {
          const data = await response.json();
          setUsers(data);
        }
      }
    } catch (err) {
      console.error('Failed to load users:', err);
    }
  }, [canManageUsers, isUser, currentUser]);

  useEffect(() => {
    fetchSettings();
    // Fetch user's own profile even if they're USER role
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, fetchUsers]);

  const companyContactFields: Array<keyof Settings> = [
    'companyName',
    'slogan',
    'logo',
    'address',
    'email',
    'phone',
    'mobile',
  ];

  const updateSettingsField = <K extends keyof Settings>(field: K, value: Settings[K]) => {
    const isCompanyContactField = companyContactFields.includes(field);

    if (isReadOnlyUser || (isCompanyContactReadOnly && isCompanyContactField)) {
      return;
    }
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async () => {
    if (isReadOnlyUser) {
      return;
    }
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Convert socialLinks array to JSON string for storage
      // Only include fields that have values
      const settingsToSave: Record<string, string | null> = {};
      
      // Company settings
      if (settings.companyName !== undefined) settingsToSave.companyName = settings.companyName || null;
      if (settings.slogan !== undefined) settingsToSave.slogan = settings.slogan || null;
      if (settings.logo !== undefined) settingsToSave.logo = settings.logo || null;
      if (settings.address !== undefined) settingsToSave.address = settings.address || null;
      
      // Contact settings
      if (settings.email !== undefined) settingsToSave.email = settings.email || null;
      if (settings.phone !== undefined) settingsToSave.phone = settings.phone || null;
      if (settings.mobile !== undefined) settingsToSave.mobile = settings.mobile || null;
      
      // Social links
      if (settings.socialLinks !== undefined) {
        settingsToSave.socialLinks = settings.socialLinks && settings.socialLinks.length > 0
          ? JSON.stringify(settings.socialLinks)
          : null;
      }

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave),
      });

      if (response.ok) {
        setSuccess(t('settings.savedSuccess'));
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || t('settings.failedToSave'));
      }
    } catch {
      setError(t('settings.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      setSuccess(null);

      // Prevent USER role from editing other users
      if (isUser && editingUser && currentUser && editingUser.id !== currentUser.id) {
        setError(t('settings.cannotEditOtherUsers'));
        return;
      }

      // Prevent non-admin users from editing ADMIN users
      if (editingUserIsAdmin && !isAdmin) {
        setError(t('settings.onlyAdminCanEditAdminUsers'));
        return;
      }

      // Prevent USER role from changing their own role
      if (isUser && editingUser && userFormData.role !== editingUser.role) {
        setError(t('settings.cannotChangeRole'));
        return;
      }

      // Check if ADMIN already exists
      const existingAdmin = users.find(u => u.role === 'ADMIN');
      
      // If trying to create a new ADMIN or change a user to ADMIN
      if (userFormData.role === 'ADMIN') {
        // If there's already an ADMIN and we're not editing that ADMIN
        if (existingAdmin && (!editingUser || editingUser.id !== existingAdmin.id)) {
          setError(t('settings.onlyOneAdminAllowed'));
          return;
        }
      }

      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload: {
        email: string;
        name: string;
        role: 'ADMIN' | 'MANAGER' | 'USER';
        phone: string | null;
        avatar: string | null;
        password?: string;
      } = {
        email: userFormData.email,
        name: userFormData.name,
        role: userFormData.role,
        phone: userFormData.phone || null,
        avatar: userFormData.avatar || null,
      };

      // USER role cannot change their role - keep original role
      if (isUser && editingUser) {
        payload.role = editingUser.role;
      }

      // Only include password if provided or creating new user
      if (!editingUser || userFormData.password) {
        payload.password = userFormData.password;
      }

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(editingUser ? t('settings.userUpdatedSuccess') : t('settings.userCreatedSuccess'));
        setShowUserModal(false);
        resetUserForm();
        fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        const data = await response.json();
        setError(data.error || t('settings.failedToSaveUser'));
      }
    } catch {
      setError(t('settings.errorSavingUser'));
    }
  };

  const handleDeleteUser = async (id: string) => {
    const userToDelete = users.find(u => u.id === id);
    
    // Prevent deletion of ADMIN users
    if (userToDelete?.role === 'ADMIN') {
      setError(t('settings.cannotDeleteAdmin'));
      return;
    }

    if (!confirm(t('settings.deleteUserConfirmMessage'))) {
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setSuccess(t('settings.userDeletedSuccess'));
        fetchUsers();
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(t('settings.failedToDeleteUser'));
      }
    } catch {
      setError(t('settings.errorDeletingUser'));
    }
  };

  const handleAddSocialLink = () => {
    if (isReadOnlyUser) {
      return;
    }
    const currentLinks = settings.socialLinks || [];
    setSettings({
      ...settings,
      socialLinks: [...currentLinks, { platform: '', url: '' }],
    });
  };

  const handleRemoveSocialLink = (index: number) => {
    if (isReadOnlyUser) {
      return;
    }
    const currentLinks = settings.socialLinks || [];
    setSettings({
      ...settings,
      socialLinks: currentLinks.filter((_, i) => i !== index),
    });
  };

  const handleUpdateSocialLink = (index: number, field: 'platform' | 'url', value: string) => {
    if (isReadOnlyUser) {
      return;
    }
    const currentLinks = settings.socialLinks || [];
    const updatedLinks = [...currentLinks];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setSettings({
      ...settings,
      socialLinks: updatedLinks,
    });
  };

  const resetUserForm = () => {
    setEditingUser(null);
    setUserFormData({
      email: '',
      name: '',
      password: '',
      role: 'USER',
      phone: '',
      avatar: '',
    });
  };

  const handleEditUser = (user: User) => {
    // Prevent USER role from editing other users
    if (isUser && currentUser && user.id !== currentUser.id) {
      setError(t('settings.cannotEditOtherUsers'));
      return;
    }

    // Prevent non-admin users from editing ADMIN users
    if (user.role === 'ADMIN' && !isAdmin) {
      setError(t('settings.onlyAdminCanEditAdminUsers'));
      return;
    }
    
    setEditingUser(user);
    setUserFormData({
      email: user.email,
      name: user.name,
      password: '',
      role: user.role,
      phone: user.phone || '',
      avatar: user.avatar || '',
    });
    setShowUserModal(true);
  };

  const tabs = useMemo(() => {
    const baseTabs = [
      { name: t('settings.companySettings'), id: 0 },
      { name: t('settings.contact'), id: 1 },
      { name: t('settings.socialLinks'), id: 2 },
    ];

    if (isReadOnlyUser) {
      if (currentUser) {
        return [...baseTabs, { name: t('settings.profile'), id: 5 }];
      }
      return baseTabs;
    }

    const extendedTabs = [...baseTabs];

    if (canManageUsers) {
      extendedTabs.push({ name: t('settings.users'), id: 3 });
      extendedTabs.push({ name: t('settings.authorization'), id: 4 });
    }

    return extendedTabs;
  }, [t, canManageUsers, isReadOnlyUser]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab) && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  if (loading) {
    return (
      <Layout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('settings.subtitle')}</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="alert-notus-error mx-6 mt-4">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button className="text-red-800 hover:text-red-600" onClick={() => setError(null)}>×</button>
            </div>
          </div>
        )}

        {success && (
          <div className="alert-notus-success mx-6 mt-4">
            <div className="flex items-center justify-between">
              <span>{success}</span>
              <button className="text-green-800 hover:text-green-600" onClick={() => setSuccess(null)}>×</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="border-b border-gray-200 px-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-cyan-500 text-cyan-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Company Settings */}
          {activeTab === 0 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="companyName" className="block text-gray-700 text-sm font-semibold mb-2">
                  {t('settings.companyName')}
                </label>
                <input
                  id="companyName"
                  type="text"
                  className="input-notus w-full"
                  value={settings.companyName || ''}
                  onChange={(e) => updateSettingsField('companyName', e.target.value)}
                  readOnly={isCompanyContactReadOnly}
                  aria-readonly={isCompanyContactReadOnly}
                  placeholder={t('settings.enterCompanyName')}
                />
              </div>
              <div>
                <label htmlFor="slogan" className="block text-gray-700 text-sm font-semibold mb-2">
                  {t('settings.slogan')}
                </label>
                <input
                  id="slogan"
                  type="text"
                  className="input-notus w-full"
                  value={settings.slogan || ''}
                  onChange={(e) => updateSettingsField('slogan', e.target.value)}
                  readOnly={isCompanyContactReadOnly}
                  aria-readonly={isCompanyContactReadOnly}
                  placeholder={t('settings.enterSlogan')}
                />
              </div>
              <div>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  {t('settings.companyLogo')}
                </label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => {
                      if (isCompanyContactReadOnly) return;
                      setLogoUploadMode('upload');
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      logoUploadMode === 'upload'
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isCompanyContactReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isCompanyContactReadOnly}
                  >
                  <IconUpload className="h-4 w-4" />
                  {t('settings.upload')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                      if (isCompanyContactReadOnly) return;
                    setLogoUploadMode('url');
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    logoUploadMode === 'url'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${isCompanyContactReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={isCompanyContactReadOnly}
                >
                  <IconLink className="h-4 w-4" />
                  {t('settings.urlLink')}
                </button>
                </div>
                {logoUploadMode === 'upload' ? (
                  <div>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      disabled={isCompanyContactReadOnly}
                      onChange={async (e) => {
                        if (isCompanyContactReadOnly) {
                          return;
                        }
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadingLogo(true);
                          setError(null);
                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            const response = await fetch('/api/upload', {
                              method: 'POST',
                              body: formData,
                            });
                            if (response.ok) {
                              const data = await response.json();
                              setSettings({ ...settings, logo: data.url });
                              setSuccess(t('settings.logoUploadedSuccess'));
                              setTimeout(() => setSuccess(null), 3000);
                            } else {
                              const errorData = await response.json();
                              setError(errorData.error || t('settings.failedToUploadLogo'));
                            }
                          } catch {
                            setError(t('settings.errorUploadingLogo'));
                          } finally {
                            setUploadingLogo(false);
                          }
                        }
                      }}
                    />
                    <label
                      htmlFor="logo-upload"
                      className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg transition-colors ${
                        isCompanyContactReadOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-cyan-500'
                      }`}
                    >
                      <IconUpload className="h-5 w-5 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {uploadingLogo ? t('common.loading') : t('settings.clickToUploadLogo')}
                      </span>
                    </label>
                    <p className="mt-1 text-xs text-gray-500">{t('settings.maxFileSize')}</p>
                  </div>
                ) : (
                  <input
                    id="logo"
                    type="text"
                    className="input-notus w-full"
                    value={settings.logo || ''}
                    onChange={(e) => updateSettingsField('logo', e.target.value)}
                    readOnly={isCompanyContactReadOnly}
                    aria-readonly={isCompanyContactReadOnly}
                    placeholder={t('settings.enterLogoUrl')}
                  />
                )}
                {settings.logo && (
                  <div className="mt-2">
                    <img src={settings.logo} alt="Logo preview" className="h-16 w-16 object-contain rounded" />
                  </div>
                )}
              </div>
              <div>
                <label htmlFor="address" className="block text-gray-700 text-sm font-semibold mb-2">
                  {t('settings.address')}
                </label>
                <textarea
                  id="address"
                  className="input-notus w-full min-h-[100px] resize-y"
                  value={settings.address || ''}
                  onChange={(e) => updateSettingsField('address', e.target.value)}
                  readOnly={isCompanyContactReadOnly}
                  aria-readonly={isCompanyContactReadOnly}
                  placeholder={t('settings.enterAddress')}
                />
              </div>
              {!isCompanyContactReadOnly && (
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? t('settings.saving') : t('settings.saveCompanySettings')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contact Settings */}
          {activeTab === 1 && (
            <div className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
                  <IconMail className="h-4 w-4 inline mr-2" />
                  {t('settings.email')}
                </label>
                <input
                  id="email"
                  type="email"
                  className="input-notus w-full"
                  value={settings.email || ''}
                  onChange={(e) => updateSettingsField('email', e.target.value)}
                  readOnly={isCompanyContactReadOnly}
                  aria-readonly={isCompanyContactReadOnly}
                  placeholder={t('settings.enterEmail')}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-gray-700 text-sm font-semibold mb-2">
                  <IconPhone className="h-4 w-4 inline mr-2" />
                  {t('settings.phone')}
                </label>
                <input
                  id="phone"
                  type="tel"
                  className="input-notus w-full"
                  value={settings.phone || ''}
                  onChange={(e) => updateSettingsField('phone', e.target.value)}
                  readOnly={isCompanyContactReadOnly}
                  aria-readonly={isCompanyContactReadOnly}
                  placeholder={t('settings.enterPhone')}
                />
              </div>
              <div>
                <label htmlFor="mobile" className="block text-gray-700 text-sm font-semibold mb-2">
                  <IconPhone className="h-4 w-4 inline mr-2" />
                  {t('settings.mobile')}
                </label>
                <input
                  id="mobile"
                  type="tel"
                  className="input-notus w-full"
                  value={settings.mobile || ''}
                  onChange={(e) => updateSettingsField('mobile', e.target.value)}
                  readOnly={isCompanyContactReadOnly}
                  aria-readonly={isCompanyContactReadOnly}
                  placeholder={t('settings.enterMobile')}
                />
              </div>
              {!isCompanyContactReadOnly && (
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? t('settings.saving') : t('settings.saveContactSettings')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Social Links */}
          {activeTab === 2 && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t('settings.socialLinks')}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t('settings.addSocialLink')}</p>
                </div>
                {!isReadOnlyUser && (
                  <button
                    onClick={handleAddSocialLink}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40"
                  >
                    <IconPlus className="mr-2 h-4 w-4" />
                    {t('settings.addSocialLink')}
                  </button>
                )}
              </div>

              {(!settings.socialLinks || settings.socialLinks.length === 0) ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
                  <p className="text-gray-500 mb-2">{t('settings.noSocialLinksAdded')}</p>
                  <p className="text-sm text-gray-400">{t('settings.clickAddLinkMessage')}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {settings.socialLinks.map((link, index) => (
                    <div key={index} className="flex gap-3 items-start p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-gray-700 text-sm font-semibold mb-2">
                            {t('settings.platformName')}
                          </label>
                          <input
                            type="text"
                            className="input-notus w-full"
                            value={link.platform}
                            onChange={(e) => handleUpdateSocialLink(index, 'platform', e.target.value)}
                            readOnly={isReadOnlyUser}
                            aria-readonly={isReadOnlyUser}
                            placeholder={t('settings.enterPlatform')}
                          />
                        </div>
                        <div>
                          <label className="block text-gray-700 text-sm font-semibold mb-2">
                            {t('settings.url')}
                          </label>
                          <input
                            type="url"
                            className="input-notus w-full"
                            value={link.url}
                            onChange={(e) => handleUpdateSocialLink(index, 'url', e.target.value)}
                            readOnly={isReadOnlyUser}
                            aria-readonly={isReadOnlyUser}
                            placeholder={t('settings.enterUrl')}
                          />
                        </div>
                      </div>
                      {!isReadOnlyUser && (
                        <div className="flex items-end pt-7">
                          <button
                            onClick={() => handleRemoveSocialLink(index)}
                            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                            title={t('settings.removeLink')}
                          >
                            <IconDelete className="h-5 w-5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isReadOnlyUser && (
                <div className="flex justify-end pt-4 border-t border-gray-200">
                  <button
                    onClick={handleSaveSettings}
                    disabled={saving}
                    className="inline-flex items-center px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? t('settings.saving') : t('settings.saveSocialLinks')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Users Management */}
          {activeTab === 3 && canManageUsers && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">{t('settings.userAccounts')}</h3>
                {canAddUsers && (
                  <button
                    onClick={() => {
                      resetUserForm();
                      setShowUserModal(true);
                    }}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40"
                  >
                    <IconPlus className="mr-2 h-4 w-4" />
                    {t('settings.addUser')}
                  </button>
                )}
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.name')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('settings.email')}</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('settings.role')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('settings.phone')}</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('settings.status')}</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                          {t('settings.noUsersFound')}
                        </td>
                      </tr>
                    ) : (
                      users.map((user, index) => (
                        <tr key={user.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center">
                              {user.avatar ? (
                                <img src={user.avatar} alt={user.name} className="h-8 w-8 rounded-full mr-3" />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mr-3">
                                  <span className="text-xs font-medium text-white">{user.name.charAt(0).toUpperCase()}</span>
                                </div>
                              )}
                              <span className="text-sm font-medium text-gray-900">{user.name}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.email}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                              user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                              user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{user.phone || '-'}</td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                              user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? t('settings.active') : t('settings.inactive')}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* USER role can only edit their own profile */}
                              {isUser && currentUser && user.id === currentUser.id && (
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                  title={t('settings.editUserTitle')}
                                >
                                  <IconEdit className="h-4 w-4" />
                                </button>
                              )}
                              {/* ADMIN and MANAGER can edit users */}
                              {canManageUsers && (isAdmin || user.role !== 'ADMIN') && !isUser && (
                                <button
                                  onClick={() => handleEditUser(user)}
                                  className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                  title={t('settings.editUserTitle')}
                                >
                                  <IconEdit className="h-4 w-4" />
                                </button>
                              )}
                              {canManageUsers && user.role === 'ADMIN' && !isAdmin && (
                                <button
                                  disabled
                                  className="p-1.5 text-gray-400 cursor-not-allowed rounded"
                                  title={t('settings.onlyAdminCanEditAdminUsers')}
                                >
                                  <IconEdit className="h-4 w-4" />
                                </button>
                              )}
                              {/* USER role cannot edit other users */}
                              {isUser && currentUser && user.id !== currentUser.id && (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                              {user.role !== 'ADMIN' && (
                                <>
                                  {isAdmin ? (
                                    <button
                                      onClick={() => handleDeleteUser(user.id)}
                                      className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                      title={t('settings.deleteUserTitle')}
                                    >
                                      <IconDelete className="h-4 w-4" />
                                    </button>
                                  ) : (
                                    <button
                                      disabled
                                      className="p-1.5 text-gray-400 cursor-not-allowed rounded"
                                      title={t('settings.deleteUserAdminOnly')}
                                    >
                                      <IconDelete className="h-4 w-4" />
                                    </button>
                                  )}
                                </>
                              )}
                              {user.role === 'ADMIN' && (
                                <button
                                  disabled
                                  className="p-1.5 text-gray-400 cursor-not-allowed rounded"
                                  title={t('settings.cannotDeleteAdmin')}
                                >
                                  <IconDelete className="h-4 w-4" />
                                </button>
                              )}
                              {!canManageUsers && !isUser && (
                                <span className="text-xs text-gray-400">-</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Profile Tab - USER role only */}
          {activeTab === 5 && isUser && currentUser && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-900">{t('settings.profile')}</h3>
                {users.length > 0 && users[0].id === currentUser.id && (
                  <button
                    onClick={() => handleEditUser(users[0])}
                    className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40"
                  >
                    <IconEdit className="mr-2 h-4 w-4" />
                    {t('settings.editUser')}
                  </button>
                )}
              </div>

              {users.length > 0 && users[0].id === currentUser.id ? (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.name')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('settings.email')}</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('settings.role')}</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('settings.phone')}</th>
                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('settings.status')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="bg-white">
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center">
                            {users[0].avatar ? (
                              <img src={users[0].avatar} alt={users[0].name} className="h-8 w-8 rounded-full mr-3" />
                            ) : (
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center mr-3">
                                <span className="text-xs font-medium text-white">{users[0].name.charAt(0).toUpperCase()}</span>
                              </div>
                            )}
                            <span className="text-sm font-medium text-gray-900">{users[0].name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{users[0].email}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            users[0].role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                            users[0].role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {users[0].role}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{users[0].phone || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            users[0].isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {users[0].isActive ? t('settings.active') : t('settings.inactive')}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  {t('settings.noUsersFound')}
                </div>
              )}
            </div>
          )}

          {/* Authorization */}
          {activeTab === 4 && canManageUsers && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('settings.userPermissionsAuthorization')}</h3>
                <p className="text-sm text-gray-600 mb-6">
                  {t('settings.manageUserPermissions')}
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">{t('settings.roleBasedAccessControl')}</h4>
                  <p className="text-xs text-blue-700 mb-3">
                    {t('settings.roleBasedAccessControlDescription')}
                  </p>
                  <div className="text-xs text-blue-700 space-y-1">
                    <p><strong>• ADMIN:</strong> {t('settings.adminRoleDescription')}</p>
                    <p><strong>• MANAGER:</strong> {t('settings.managerRoleDescription')}</p>
                    <p><strong>• USER:</strong> {t('settings.userRoleDescription')}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('settings.roleDefinitions')}</h4>
                  <div className="space-y-2">
                    <div className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 rounded">ADMIN</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{t('settings.adminFullAccess')}</div>
                      </div>
                    </div>
                    <div className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">MANAGER</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{t('settings.managerLimitedAccess')}</div>
                      </div>
                    </div>
                    <div className="flex items-start p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded">USER</span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">{t('settings.userStandardAccess')}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">{t('settings.usersWithCustomPermissions')}</h4>
                  {users.filter(u => u.permissions && u.permissions.length > 0).length === 0 ? (
                    <p className="text-sm text-gray-500">{t('settings.noCustomPermissions')}</p>
                  ) : (
                    <div className="space-y-3">
                      {users
                        .filter(u => u.permissions && u.permissions.length > 0)
                        .map((user) => (
                          <div key={user.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-900">{user.name}</span>
                                <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                  user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {user.role}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">{user.email}</span>
                            </div>
                            <div className="mt-2">
                              <div className="text-xs font-medium text-gray-700 mb-1">{t('settings.customPermissions')}</div>
                              <div className="flex flex-wrap gap-1">
                                {user.permissions?.map((perm) => (
                                  <span
                                    key={perm.id}
                                    className="inline-flex items-center px-2 py-1 text-xs font-medium bg-cyan-100 text-cyan-800 rounded"
                                  >
                                    {perm.permission} {perm.resource && `(${perm.resource})`}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Create/Edit Modal */}
      <Modal
        isOpen={showUserModal}
        onClose={() => {
          setShowUserModal(false);
          resetUserForm();
        }}
        title={editingUser ? t('settings.editUser') : t('settings.createNewUser')}
        size="lg"
      >
        <form onSubmit={handleSaveUser} className="space-y-5">
          <div>
            <label htmlFor="userEmail" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('settings.email')} <span className="text-red-500">*</span>
            </label>
            <input
              id="userEmail"
              type="email"
              className="input-notus w-full"
              required
              value={userFormData.email}
              onChange={(e) => setUserFormData({ ...userFormData, email: e.target.value })}
              disabled={hasEditingUser || (editingUserIsAdmin && !isAdmin)}
            />
            {editingUser && <p className="mt-1 text-xs text-gray-500">{t('settings.emailCannotBeChanged')}</p>}
          </div>
          <div>
            <label htmlFor="userName" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('common.name')} <span className="text-red-500">*</span>
            </label>
            <input
              id="userName"
              type="text"
              className="input-notus w-full"
              required
              value={userFormData.name}
              onChange={(e) => setUserFormData({ ...userFormData, name: e.target.value })}
              placeholder={t('settings.enterName')}
              disabled={editingUserIsAdmin && !isAdmin}
            />
          </div>
          <div>
            <label htmlFor="userPassword" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('settings.password')} {!editingUser && <span className="text-red-500">*</span>}
            </label>
            <input
              id="userPassword"
              type="password"
              className="input-notus w-full"
              required={!editingUser}
              value={userFormData.password}
              onChange={(e) => setUserFormData({ ...userFormData, password: e.target.value })}
              placeholder={editingUser ? t('settings.leaveBlankForCurrentPassword') : t('settings.enterPassword')}
              disabled={editingUserIsAdmin && !isAdmin}
            />
            {editingUser && <p className="mt-1 text-xs text-gray-500">{t('settings.leaveBlankForCurrentPassword')}</p>}
          </div>
          <div>
            <label htmlFor="userRole" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('settings.role')} <span className="text-red-500">*</span>
            </label>
            <select
              id="userRole"
              className="input-notus w-full"
              required
              value={userFormData.role}
              onChange={(e) => setUserFormData({ ...userFormData, role: e.target.value as 'ADMIN' | 'MANAGER' | 'USER' })}
              disabled={(editingUserIsAdmin && !isAdmin) || (isUser && hasEditingUser)}
            >
              <option value="USER">{t('settings.user')}</option>
              <option value="MANAGER">{t('settings.manager')}</option>
              {/* Only allow ADMIN selection if no ADMIN exists or if editing the existing ADMIN */}
              {(!users.find(u => u.role === 'ADMIN') || (editingUser && editingUser.role === 'ADMIN')) && (
                <option value="ADMIN">{t('settings.admin')}</option>
              )}
            </select>
            {users.find(u => u.role === 'ADMIN') && (!editingUser || editingUser.role !== 'ADMIN') && (
              <p className="mt-1 text-xs text-gray-500">{t('settings.onlyOneAdminAllowedMessage')}</p>
            )}
            {editingUserIsAdmin && !isAdmin && (
              <p className="mt-1 text-xs text-red-500">{t('settings.onlyAdminCanEditAdminRoles')}</p>
            )}
            {isUser && editingUser && (
              <p className="mt-1 text-xs text-gray-500">{t('settings.cannotChangeRole')}</p>
            )}
          </div>
          <div>
            <label htmlFor="userPhone" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('settings.phone')}
            </label>
            <input
              id="userPhone"
              type="tel"
              className="input-notus w-full"
              value={userFormData.phone}
              onChange={(e) => setUserFormData({ ...userFormData, phone: e.target.value })}
              placeholder={t('settings.enterPhoneNumber')}
              disabled={editingUserIsAdmin && !isAdmin}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">
              {t('settings.avatar')}
            </label>
            <div className="flex gap-2 mb-3">
              <button
                type="button"
                onClick={() => setAvatarUploadMode('upload')}
                disabled={editingUserIsAdmin && !isAdmin}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  avatarUploadMode === 'upload'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${editingUserIsAdmin && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                  <IconUpload className="h-4 w-4" />
                  {t('settings.upload')}
                </button>
                <button
                  type="button"
                  onClick={() => setAvatarUploadMode('url')}
                  disabled={editingUserIsAdmin && !isAdmin}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    avatarUploadMode === 'url'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } ${editingUserIsAdmin && !isAdmin ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <IconLink className="h-4 w-4" />
                  {t('settings.urlLink')}
                </button>
            </div>
            {avatarUploadMode === 'upload' ? (
              <div>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={editingUserIsAdmin && !isAdmin}
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file && !(editingUserIsAdmin && !isAdmin)) {
                      setUploadingAvatar(true);
                      setError(null);
                      try {
                        const formData = new FormData();
                        formData.append('file', file);
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          body: formData,
                        });
                        if (response.ok) {
                          const data = await response.json();
                          setUserFormData({ ...userFormData, avatar: data.url });
                          setSuccess(t('settings.avatarUploadedSuccess'));
                          setTimeout(() => setSuccess(null), 3000);
                        } else {
                          const errorData = await response.json();
                          setError(errorData.error || t('settings.failedToUploadAvatar'));
                        }
                      } catch {
                        setError(t('settings.errorUploadingAvatar'));
                      } finally {
                        setUploadingAvatar(false);
                      }
                    }
                  }}
                />
                <label
                  htmlFor="avatar-upload"
                  className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg transition-colors ${
                    editingUserIsAdmin && !isAdmin
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:border-cyan-500'
                  }`}
                >
                  <IconUpload className="h-5 w-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {uploadingAvatar ? t('common.loading') : t('settings.clickToUploadAvatar')}
                  </span>
                </label>
                <p className="mt-1 text-xs text-gray-500">{t('settings.maxFileSize')}</p>
              </div>
            ) : (
              <input
                id="userAvatar"
                type="url"
                className="input-notus w-full"
                value={userFormData.avatar}
                onChange={(e) => setUserFormData({ ...userFormData, avatar: e.target.value })}
                placeholder={t('settings.enterAvatarUrl')}
                disabled={editingUserIsAdmin && !isAdmin}
              />
            )}
            {userFormData.avatar && (
              <div className="mt-2">
                <img src={userFormData.avatar} alt="Avatar preview" className="h-16 w-16 object-cover rounded-full" />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={() => {
                setShowUserModal(false);
                resetUserForm();
              }}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40"
            >
              {editingUser ? t('common.update') : t('common.create')}
            </button>
          </div>
        </form>
      </Modal>
    </Layout>
  );
}


