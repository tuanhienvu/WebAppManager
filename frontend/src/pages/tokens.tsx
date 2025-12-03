import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import MessagePopup from '@/components/MessagePopup';
import { IconPlus, IconEdit, IconDelete, IconCheckCircle, IconXCircle, IconDownload } from '@/components/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatUTCDate, formatUTCDateTime } from '@/lib/date-format';
import { apiFetch } from '@/lib/api-client';

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
  const { user, loading: userLoading, hasPermission } = useCurrentUser();
  const canReadTokens = hasPermission('READ', 'TOKENS');
  const canCreateTokens = hasPermission('CREATE', 'TOKENS');
  const canUpdateTokens = hasPermission('UPDATE', 'TOKENS');
  const canDeleteTokens = hasPermission('DELETE', 'TOKENS');
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
  const [selectedTokenIds, setSelectedTokenIds] = useState<string[]>([]);
  const selectAllRef = useRef<HTMLInputElement>(null);

  const permissionOptions = ['READ', 'WRITE', 'SYNC', 'EXCHANGE', 'EXTEND'];

  useEffect(() => {
    if (userLoading) {
      return;
    }
    if (!user) {
      return;
    }
    if (!canReadTokens) {
      setTokens([]);
      setLoading(false);
      return;
    }
    fetchTokens();
    fetchSoftware();
  }, [userLoading, user, canReadTokens, activeTab]);

  const fetchTokens = async () => {
    if (!canReadTokens) {
      setTokens([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const status = activeTab === 0 ? undefined : activeTab === 1 ? 'ACTIVE' : activeTab === 2 ? 'EXPIRED' : undefined;
      const url = status ? `/api/tokens?status=${status}&includeSoftware=true&includeVersion=true` : '/api/tokens?includeSoftware=true&includeVersion=true';
      const response = await apiFetch(url);
      if (response.ok) {
        const data = await response.json();
        setTokens(data);
        setSelectedTokenIds((prev) =>
          prev.filter((id) => data.some((token: AccessToken) => token.id === id)),
        );
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
      const response = await apiFetch('/api/software');
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
      const response = await apiFetch(`/api/versions?softwareId=${softwareId}`);
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

    if ((editing && !canUpdateTokens) || (!editing && !canCreateTokens)) {
      setError(t('common.notAuthorized'));
      return;
    }

    try {
      const url = editing ? `/api/tokens/${editing.id}` : '/api/tokens';
      const method = editing ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        versionId: formData.versionId || null,
        owner: formData.owner || null,
      };

      const response = await apiFetch(url, {
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
      const response = await apiFetch(`/api/tokens/validate/${validateToken}`);
      const data = await response.json();
      setValidateResult(data);
    } catch (err) {
      setValidateResult({ valid: false, error: t('tokens.errorValidating') });
    }
  };

  const handleEdit = (token: AccessToken) => {
    if (!canUpdateTokens) {
      setError(t('common.notAuthorized'));
      return;
    }
    setEditing(token);
    const expiresAtDate = new Date(token.expiresAt).toISOString().slice(0, 16);
    
    setFormData({
      softwareId: token.softwareId,
      versionId: token.versionId || '',
      expiresAt: expiresAtDate,
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

    if (!canDeleteTokens) {
      setError(t('common.notAuthorized'));
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const response = await apiFetch(`/api/tokens/${id}`, {
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

  const handleExportTokens = () => {
    try {
      setError(null);
      if (!tokens || selectedTokenIds.length !== 1) {
        setError(t('tokens.exportSelectPrompt'));
        return;
      }

      const selectedToken = tokens.find((token) => token.id === selectedTokenIds[0]);
      if (!selectedToken) {
        setError(t('tokens.exportSelectPrompt'));
        return;
      }

      const exportData = {
        id: selectedToken.id,
        token: selectedToken.token,
        softwareId: selectedToken.softwareId,
        softwareName: selectedToken.software?.name ?? null,
        versionId: selectedToken.versionId,
        version: selectedToken.version?.version ?? null,
        status: selectedToken.status,
        permissions: selectedToken.permissions,
        expiresAt: selectedToken.expiresAt,
        owner: selectedToken.owner,
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.href = url;
      link.download = `tokens-${timestamp}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSuccess(t('tokens.exportSuccess'));
    } catch (err) {
      setError(t('tokens.errorLoading'));
    }
  };

  const toggleTokenSelection = (id: string) => {
    setSelectedTokenIds((prev) =>
      prev.includes(id) ? prev.filter((tokenId) => tokenId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedTokenIds.length === tokens.length) {
      setSelectedTokenIds([]);
    } else {
      setSelectedTokenIds(tokens.map((token) => token.id));
    }
  };

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        selectedTokenIds.length > 0 && selectedTokenIds.length < tokens.length;
    }
  }, [selectedTokenIds, tokens.length]);

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

  if (!userLoading && user && !canReadTokens) {
    return (
      <Layout>
        <div className="bg-white border border-red-200 text-red-700 rounded-lg p-8 text-center">
          {t('common.notAuthorized')}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('tokens.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('tokens.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={handleExportTokens}
                disabled={selectedTokenIds.length === 0}
              >
                <IconDownload className="mr-2 h-4 w-4" />
                {t('tokens.exportSelected')}
              </button>
              <button
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40"
                onClick={() => setShowValidateModal(true)}
              >
                {t('tokens.validateToken')}
              </button>
              {canCreateTokens && (
                <button
                  className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40"
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
          <MessagePopup
            variant="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}

        {success && (
          <MessagePopup
            variant="success"
            message={success}
            onClose={() => setSuccess(null)}
          />
        )}

        <div className="block w-full table-scroll-container p-6">
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
            <div className="table-scroll-container">
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-full">
                <table className="w-full min-w-max">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-center">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        id="select-all-tokens"
                        name="select-all-tokens"
                        className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                        checked={tokens.length > 0 && selectedTokenIds.length === tokens.length}
                        onChange={handleSelectAll}
                        aria-label="Select all tokens"
                      />
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.actions')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.token')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.software')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.version')}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.status')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.permissions')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('tokens.expiresAt')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tokens.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        {t('tokens.noTokensFound')}
                      </td>
                    </tr>
                  ) : (
                    tokens.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 text-center">
                          <input
                            type="checkbox"
                            id={`select-token-${item.id}`}
                            name={`select-token-${item.id}`}
                            className="h-4 w-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                            checked={selectedTokenIds.includes(item.id)}
                            onChange={() => toggleTokenSelection(item.id)}
                            aria-label={`Select token ${item.token}`}
                          />
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canUpdateTokens && (
                              <button
                                onClick={() => handleEdit(item)}
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                title="Edit token"
                              >
                                <IconEdit className="h-4 w-4" />
                              </button>
                            )}
                            {canDeleteTokens && (
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                title="Delete token"
                              >
                                <IconDelete className="h-4 w-4" />
                              </button>
                            )}
                            {!canUpdateTokens && !canDeleteTokens && (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </div>
                        </td>
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
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatUTCDate(item.expiresAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
                </table>
              </div>
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
                <label key={perm} htmlFor={`token-permission-${perm}`} className="flex items-center justify-between cursor-pointer hover:bg-white p-2 rounded transition-colors">
                  <span className="text-sm text-gray-700">{perm}</span>
                  <input
                    type="checkbox"
                    id={`token-permission-${perm}`}
                    name={`token-permission-${perm}`}
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
          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-200">
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
                    <p><span className="font-semibold">{t('tokens.expiresAt')}:</span> {formatUTCDateTime(validateResult.token?.expiresAt)}</p>
                  </div>
                </div>
              ) : (
                <p className="font-semibold">{validateResult.error}</p>
              )}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-gray-200">
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

