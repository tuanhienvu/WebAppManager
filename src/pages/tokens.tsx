import React, { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { IconPlus, IconEdit, IconDelete, IconCheckCircle, IconXCircle } from '@/components/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLanguage } from '@/contexts/LanguageContext';

interface AccessToken {
  id: string;
  token: string;
  softwareId: string;
  versionId: string | null;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  permissions: string[];
  expiresAt: string;
  owner: string | null;
  software?: { name: string };
  version?: { version: string };
}

export default function TokensPage() {
  const { t } = useLanguage();
  const { canAddData, canEditData, canDeleteData } = useCurrentUser();
  const [tokens, setTokens] = useState<AccessToken[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showValidateModal, setShowValidateModal] = useState(false);
  const [validateToken, setValidateToken] = useState('');
  const [validateResult, setValidateResult] = useState<any>(null);
  const [editing, setEditing] = useState<AccessToken | null>(null);
  const [formData, setFormData] = useState({
    softwareId: '',
    versionId: '',
    expiresAt: '',
    permissions: [] as string[],
    status: 'ACTIVE' as 'ACTIVE' | 'EXPIRED' | 'REVOKED',
    owner: '',
  });
  const [software, setSoftware] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  const permissionOptions = ['READ', 'WRITE', 'SYNC', 'EXCHANGE', 'EXTEND'];

  useEffect(() => {
    fetchTokens();
    fetchSoftware();
  }, [activeTab]);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      const status = activeTab === 0 ? undefined : activeTab === 1 ? 'ACTIVE' : activeTab === 2 ? 'EXPIRED' : undefined;
      const url = status ? `/api/tokens?status=${status}&includeSoftware=true&includeVersion=true` : '/api/tokens?includeSoftware=true&includeVersion=true';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setTokens(data);
      } else {
        setError(t('tokens.failedToLoad'));
      }
    } catch (err) {
      setError(t('tokens.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const fetchSoftware = async () => {
    try {
      const response = await fetch('/api/software');
      if (response.ok) {
        const data = await response.json();
        setSoftware(data);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const fetchVersions = async (softwareId: string) => {
    try {
      const response = await fetch(`/api/versions?softwareId=${softwareId}`);
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      }
    } catch (err) {
      // Silent fail
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const url = editing ? `/api/tokens/${editing.id}` : '/api/tokens';
      const method = editing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        versionId: formData.versionId || null,
        owner: formData.owner || null,
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setSuccess(editing ? t('tokens.updatedSuccess') : t('tokens.createdSuccess'));
        setShowModal(false);
        resetForm();
        fetchTokens();
      } else {
        const data = await response.json();
        setError(data.error || t('tokens.failedToSave'));
      }
    } catch (err) {
      setError(t('tokens.errorSaving'));
    }
  };

  const handleValidate = async () => {
    try {
      setValidateResult(null);
      const response = await fetch(`/api/tokens/validate/${validateToken}`);
      const data = await response.json();
      setValidateResult(data);
    } catch (err) {
      setValidateResult({ valid: false, error: t('tokens.errorValidating') });
    }
  };

  const handleEdit = (token: AccessToken) => {
    setEditing(token);
    // Format expiresAt for datetime-local input (ISO string without timezone)
    const expiresAtDate = new Date(token.expiresAt);
    const localDateTime = new Date(expiresAtDate.getTime() - expiresAtDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
    
    setFormData({
      softwareId: token.softwareId,
      versionId: token.versionId || '',
      expiresAt: localDateTime,
      permissions: token.permissions || [],
      status: token.status,
      owner: token.owner || '',
    });
    
    // Fetch versions for the software
    if (token.softwareId) {
      fetchVersions(token.softwareId);
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t('tokens.deleteConfirmMessage'))) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const response = await fetch(`/api/tokens/${id}`, {
        method: 'DELETE',
      });

      if (response.ok || response.status === 204) {
        setSuccess(t('tokens.deletedSuccess'));
        fetchTokens();
      } else {
        const data = await response.json();
        setError(data.error || t('tokens.failedToDelete'));
      }
    } catch (err) {
      setError(t('tokens.errorDeleting'));
    }
  };

  const resetForm = () => {
    setEditing(null);
    setFormData({
      softwareId: '',
      versionId: '',
      expiresAt: '',
      permissions: [],
      status: 'ACTIVE',
      owner: '',
    });
    setVersions([]);
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, React.ReactElement> = {
      ACTIVE: <span className="badge-notus-success font-bold">{status}</span>,
      EXPIRED: <span className="badge-notus-danger font-bold">{status}</span>,
      REVOKED: <span className="badge-notus-warning font-bold">{status}</span>,
    };
    return badges[status] || <span className="badge-notus-info">{status}</span>;
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('tokens.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('tokens.subtitle')}</p>
            </div>
            <div className="flex gap-2">
              <button
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40"
                onClick={() => setShowValidateModal(true)}
              >
                {t('tokens.validateToken')}
              </button>
              {canAddData && (
                <button
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40"
                  onClick={() => {
                    resetForm();
                    setShowModal(true);
                  }}
                >
                  <IconPlus className="mr-2 h-4 w-4" />
                  {t('tokens.addToken')}
                </button>
              )}
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

        <div className="block w-full overflow-x-auto p-6">
          <div className="flex gap-2 mb-4 border-b border-gray-200">
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 0 ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab(0)}
            >
              <IconCheckCircle className="mr-2 h-4 w-4 inline" />
              {t('tokens.allTokens')}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 1 ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab(1)}
            >
              <IconCheckCircle className="mr-2 h-4 w-4 inline" />
              {t('tokens.active')}
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 2 ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              onClick={() => setActiveTab(2)}
            >
              <IconXCircle className="mr-2 h-4 w-4 inline" />
              {t('tokens.expired')}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.token')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.software')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.version')}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.status')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.permissions')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.expiresAt')}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokens.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                        {t('tokens.noTokensFound')}
                      </td>
                    </tr>
                  ) : (
                    tokens.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="font-mono text-xs text-gray-700">{item.token.substring(0, 16)}...</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.software?.name || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{item.version?.version || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                            item.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                            item.status === 'EXPIRED' ? 'bg-red-100 text-red-800' :
                            'bg-orange-100 text-orange-800'
                          }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          <span className="truncate">{item.permissions.join(', ') || '-'}</span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(item.expiresAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canEditData && (
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                title="Edit token"
                              >
                                <IconEdit className="h-4 w-4" />
                              </button>
                            )}
                            {canDeleteData && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Delete token"
                              >
                                <IconDelete className="h-4 w-4" />
                              </button>
                            )}
                            {!canEditData && !canDeleteData && (
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
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => { setShowModal(false); resetForm(); }}
        title={editing ? t('tokens.editToken') : t('tokens.createNewToken')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="softwareId" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('tokens.software')} <span className="text-red-500">*</span>
              {editing && <span className="ml-2 text-xs text-gray-500 font-normal">(cannot be changed)</span>}
            </label>
            <select
              id="softwareId"
              className="input-notus w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
              value={formData.softwareId}
              disabled={!!editing}
              onChange={async (e) => {
                const newSoftwareId = e.target.value;
                setFormData({ ...formData, softwareId: newSoftwareId, versionId: '' });
                if (newSoftwareId) {
                  await fetchVersions(newSoftwareId);
                } else {
                  setVersions([]);
                }
              }}
            >
              <option value="">{t('tokens.selectSoftware')}</option>
              {software.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="versionId" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('tokens.version')}
            </label>
            <select
              id="versionId"
              className="input-notus w-full disabled:bg-gray-100 disabled:cursor-not-allowed"
              value={formData.versionId}
              onChange={(e) => setFormData({ ...formData, versionId: e.target.value })}
              disabled={!formData.softwareId}
            >
              <option value="">{t('tokens.selectVersion')}</option>
              {versions.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.version}
                </option>
              ))}
            </select>
            {formData.softwareId && versions.length === 0 && (
              <p className="mt-1 text-xs text-gray-500">{t('tokens.noVersionsAvailable')}</p>
            )}
          </div>
          <div>
            <label htmlFor="expiresAt" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('tokens.expiresAt')} <span className="text-red-500">*</span>
            </label>
            <input
              id="expiresAt"
              type="datetime-local"
              className="input-notus w-full"
              required
              value={formData.expiresAt}
              onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-gray-700 text-sm font-semibold mb-2">{t('tokens.permissions')}</label>
            <div className="space-y-2 border border-gray-200 rounded-lg p-3 bg-gray-50">
              {permissionOptions.map((perm) => (
                <label key={perm} className="flex items-center justify-between cursor-pointer hover:bg-white p-2 rounded transition-colors">
                  <span className="text-sm text-gray-700">{perm}</span>
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={formData.permissions.includes(perm)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({
                          ...formData,
                          permissions: [...formData.permissions, perm],
                        });
                      } else {
                        setFormData({
                          ...formData,
                          permissions: formData.permissions.filter((p) => p !== perm),
                        });
                      }
                    }}
                  />
                </label>
              ))}
            </div>
          </div>
          <div>
            <label htmlFor="status" className="block text-gray-700 text-sm font-semibold mb-2">{t('tokens.status')}</label>
            <select
              id="status"
              className="input-notus w-full"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
            >
              <option value="ACTIVE">ACTIVE</option>
              <option value="EXPIRED">EXPIRED</option>
              <option value="REVOKED">REVOKED</option>
            </select>
          </div>
          <div>
            <label htmlFor="owner" className="block text-gray-700 text-sm font-semibold mb-2">{t('tokens.owner')}</label>
            <input
              id="owner"
              type="text"
              className="input-notus w-full"
              value={formData.owner}
              onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
              placeholder={t('tokens.enterOwner')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={() => { setShowModal(false); resetForm(); }}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-notus-warning px-6 py-2.5">
              {editing ? t('common.update') : t('common.create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Validate Modal */}
      <Modal
        isOpen={showValidateModal}
        onClose={() => {
          setShowValidateModal(false);
          setValidateToken('');
          setValidateResult(null);
        }}
        title={t('tokens.validateToken')}
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="validateToken" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('tokens.token')}
            </label>
            <input
              id="validateToken"
              type="text"
              className="input-notus w-full font-mono text-sm"
              value={validateToken}
              onChange={(e) => setValidateToken(e.target.value)}
              placeholder={t('tokens.enterToken')}
            />
          </div>
          <button
            type="button"
            className="btn-notus-secondary w-full px-6 py-2.5"
            onClick={handleValidate}
          >
            {t('tokens.validate')}
          </button>
          {validateResult && (
            <div className={`p-4 rounded-lg border-t-4 ${
              validateResult.valid
                ? 'bg-green-50 border-green-500 text-green-800'
                : 'bg-red-50 border-red-500 text-red-800'
            }`}>
              {validateResult.valid ? (
                <div className="space-y-2">
                  <p className="font-bold text-lg">✓ {t('tokens.valid')}</p>
                  <div className="space-y-1 text-sm">
                    <p><span className="font-semibold">{t('tokens.status')}:</span> {validateResult.token?.status}</p>
                    <p><span className="font-semibold">{t('tokens.expiresAt')}:</span> {new Date(validateResult.token?.expiresAt).toLocaleString()}</p>
                  </div>
                </div>
              ) : (
                <p className="font-semibold">{validateResult.error}</p>
              )}
            </div>
          )}
          <div className="flex justify-end pt-2 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={() => setShowValidateModal(false)}
            >
              {t('common.close')}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}

