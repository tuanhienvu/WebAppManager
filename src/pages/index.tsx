import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import Modal from '@/components/Modal';
import { IconPlus, IconEdit, IconDelete, IconExclamation } from '@/components/icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface Software {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    versions: number;
    tokens: number;
  };
}

export default function SoftwarePage() {
  const { t } = useLanguage();
  const { canAddData, canEditData, canDeleteData } = useCurrentUser();
  const [software, setSoftware] = useState<Software[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Software | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSoftware();
  }, []);

  const fetchSoftware = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/software');
      if (response.ok) {
        const data = await response.json();
        setSoftware(data);
      } else {
        setError(t('software.failedToFetch'));
      }
    } catch (err) {
      setError(t('software.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const url = editing ? `/api/software/${editing.id}` : '/api/software';
      const method = editing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(editing ? t('software.updatedSuccess') : t('software.createdSuccess'));
        setShowModal(false);
        setFormData({ name: '', description: '' });
        setEditing(null);
        fetchSoftware();
      } else {
        const data = await response.json();
        setError(data.error || t('software.failedToSave'));
      }
    } catch (err) {
      setError(t('software.errorSaving'));
    }
  };

  const handleEdit = (item: Software) => {
    setEditing(item);
    setFormData({
      name: item.name,
      description: item.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deletingId) return;

    try {
      const response = await fetch(`/api/software/${deletingId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setSuccess(t('software.deletedSuccess'));
        setShowDeleteModal(false);
        setDeletingId(null);
        fetchSoftware();
      } else {
        setError(t('software.failedToDelete'));
      }
    } catch (err) {
      setError(t('software.errorDeleting'));
    }
  };

  const openDeleteModal = (id: string) => {
    setDeletingId(id);
    setShowDeleteModal(true);
  };

  const resetModal = () => {
    setShowModal(false);
    setEditing(null);
    setFormData({ name: '', description: '' });
  };

  return (
    <Layout>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{t('software.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('software.subtitle')}</p>
            </div>
            {canAddData && (
              <button
                className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-sm font-medium rounded-lg hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 transition-all shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40"
                onClick={() => {
                  resetModal();
                  setShowModal(true);
                }}
              >
                <IconPlus className="mr-2 h-4 w-4" />
                {t('software.addSoftware')}
              </button>
            )}
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mx-6 mt-4 alert-notus-error">
            <div className="flex items-center justify-between">
              <span>{error}</span>
              <button
                className="text-red-800 hover:text-red-600"
                onClick={() => setError(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {success && (
          <div className="mx-6 mt-4 alert-notus-success">
            <div className="flex items-center justify-between">
              <span>{success}</span>
              <button
                className="text-green-800 hover:text-green-600"
                onClick={() => setSuccess(null)}
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="block w-full overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.name')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.description')}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('software.versions')}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('software.tokens')}</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('software.created')}</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('common.actions')}</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {software.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                        {t('software.noSoftwareFound')}
                      </td>
                    </tr>
                  ) : (
                    software.map((item, index) => (
                      <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">{item.description || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600">{item._count?.versions || 0}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center text-sm text-gray-600">{item._count?.tokens || 0}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{new Date(item.createdAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canEditData && (
                              <button
                                className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                                onClick={() => handleEdit(item)}
                                title={t('common.edit')}
                              >
                                <IconEdit className="h-4 w-4" />
                              </button>
                            )}
                            {canDeleteData && (
                              <button
                                className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                                onClick={() => openDeleteModal(item.id)}
                                title={t('common.delete')}
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
        onClose={resetModal}
        title={editing ? t('software.editSoftware') : t('software.addNewSoftware')}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('common.name')} <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              className="input-notus w-full"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('software.placeholderName')}
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-gray-700 text-sm font-semibold mb-2">
              {t('common.description')}
            </label>
            <textarea
              id="description"
              className="input-notus w-full"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('software.placeholderDescription')}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-6 py-2.5 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300"
              onClick={resetModal}
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              className="btn-notus-primary px-6 py-2.5"
            >
              {editing ? t('common.update') : t('common.create')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('software.deleteSoftware')}
        size="sm"
      >
        <div className="space-y-4">
          <div className="flex gap-4 items-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 flex-shrink-0">
              <IconExclamation className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h4 className="text-lg font-bold text-gray-900 mb-2">{t('software.deleteConfirmTitle')}</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                {t('software.deleteConfirmMessage')}
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
