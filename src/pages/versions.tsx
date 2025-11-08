import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { IconPlus, IconEdit, IconDelete, IconExclamation } from '@/components/icons';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useLanguage } from '@/contexts/LanguageContext';

interface Version {
  id: string;
  softwareId: string;
  version: string;
  releaseDate: string;
  changelog: string | null;
  createdAt: string;
  updatedAt: string;
  software?: {
    id: string;
    name: string;
  };
}

interface Software {
  id: string;
  name: string;
}

export default function VersionsPage() {
  const { t } = useLanguage();
  const { canAddData, canEditData, canDeleteData } = useCurrentUser();
  const [versions, setVersions] = useState<Version[]>([]);
  const [software, setSoftware] = useState<Software[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Version | null>(null);
  const [formData, setFormData] = useState({
    softwareId: '',
    version: '',
    releaseDate: '',
    changelog: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchVersions();
    fetchSoftware();
  }, []);

  const fetchVersions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/versions?includeSoftware=true');
      if (response.ok) {
        const data = await response.json();
        setVersions(data);
      } else {
        setError(t('versions.failedToFetch'));
      }
    } catch (err) {
      setError(t('versions.errorLoading'));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const url = editing ? `/api/versions/${editing.id}` : '/api/versions';
      const method = editing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(editing ? t('versions.updatedSuccess') : t('versions.createdSuccess'));
        setShowModal(false);
        setFormData({ softwareId: '', version: '', releaseDate: '', changelog: '' });
        setEditing(null);
        fetchVersions();
      } else {
        const data = await response.json();
        setError(data.error || t('versions.failedToSave'));
      }
    } catch (err) {
      setError(t('versions.errorSaving'));
    }
  };

  const handleEdit = (item: Version) => {
    setEditing(item);
    setFormData({
      softwareId: item.softwareId,
      version: item.version,
      releaseDate: item.releaseDate.split('T')[0],
      changelog: item.changelog || '',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/versions/${deletingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess(t('versions.deletedSuccess'));
        setShowDeleteModal(false);
        setDeletingId(null);
        fetchVersions();
      } else {
        setError(t('versions.failedToDelete'));
      }
    } catch (err) {
      setError(t('versions.errorDeleting'));
    }
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('versions.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('versions.subtitle')}</p>
            </div>
            {canAddData && (
              <button
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40"
                onClick={() => {
                  setShowModal(true);
                  setEditing(null);
                }}
              >
                <IconPlus className="mr-2 h-4 w-4" />
                {t('versions.addVersion')}
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 alert-notus-error">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button className="text-red-800 hover:text-red-600" onClick={() => setError(null)}>×</button>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 alert-notus-success">
            <div className="flex items-center justify-between">
              <span>{success}</span>
              <button className="text-green-800 hover:text-green-600" onClick={() => setSuccess(null)}>×</button>
            </div>
          </div>
        )}

        <div className="block w-full overflow-x-auto p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('versions.software')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('versions.version')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('versions.releaseDate')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('versions.changelog')}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {versions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-12 text-center text-gray-500">{t('versions.noVersionsFound')}</td>
                    </tr>
                  ) : (
                    versions.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.software?.name || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">{item.version}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(item.releaseDate).toLocaleDateString()}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-md truncate">{item.changelog || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canEditData && (
                              <button
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                onClick={() => handleEdit(item)}
                                title="Edit"
                              >
                                <IconEdit className="h-4 w-4" />
                              </button>
                            )}
                            {canDeleteData && (
                              <button
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                onClick={() => {
                                  setDeletingId(item.id);
                                  setShowDeleteModal(true);
                                }}
                                title="Delete"
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
        onClose={() => setShowModal(false)}
        title={editing ? t('versions.editVersion') : t('versions.addNewVersion')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="softwareId" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('versions.software')} <span className="text-red-500">*</span>
            </label>
            <select
              id="softwareId"
              className="input-notus w-full"
              required
              value={formData.softwareId}
              onChange={(e) => setFormData({ ...formData, softwareId: e.target.value })}
              disabled={!!editing}
            >
              <option value="">{t('versions.selectSoftware')}</option>
              {software.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="version" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('versions.version')} <span className="text-red-500">*</span>
            </label>
            <input
              id="version"
              type="text"
              className="input-notus w-full"
              required
              value={formData.version}
              onChange={(e) => setFormData({ ...formData, version: e.target.value })}
              placeholder={t('versions.enterVersion')}
            />
          </div>
          <div>
            <label htmlFor="releaseDate" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('versions.releaseDate')} <span className="text-red-500">*</span>
            </label>
            <input
              id="releaseDate"
              type="date"
              className="input-notus w-full"
              required
              value={formData.releaseDate}
              onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="changelog" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('versions.changelog')}
            </label>
            <textarea
              id="changelog"
              className="input-notus w-full"
              rows={4}
              value={formData.changelog}
              onChange={(e) => setFormData({ ...formData, changelog: e.target.value })}
              placeholder={t('versions.enterChangelog')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={() => setShowModal(false)}
            >
              {t('common.cancel')}
            </button>
            <button type="submit" className="btn-notus-success px-6 py-2.5">
              {editing ? t('common.update') : t('common.create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('versions.deleteVersion')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
              <IconExclamation className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-2">{t('versions.deleteConfirmTitle')}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('versions.deleteConfirmMessage')}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={() => setShowDeleteModal(false)}
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              className="btn-notus-danger px-6 py-2.5"
              onClick={handleDelete}
            >
              {t('common.delete')}
            </button>
          </div>
        </div>
      </Modal>
    </Layout>
  );
}
