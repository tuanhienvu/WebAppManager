import React, { useState, useEffect, useRef } from 'react';
import Layout from '@/components/Layout';
import MessagePopup from '@/components/MessagePopup';
import { IconRefresh, IconFilter, IconClose } from '@/components/icons';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatUTCDate, formatUTCTime } from '@/lib/date-format';
import { apiFetch } from '@/lib/api-client';
import { useCurrentUser } from '@/hooks/useCurrentUser';

interface AuditLog {
  id: string;
  tokenId: string;
  action: 'VALIDATE' | 'EXTEND' | 'REVOKE' | 'EXCHANGE' | 'CREATE';
  timestamp: string;
  ipAddress: string | null;
  userAgent: string | null;
  blockchainTxHash: string | null;
}

export default function AuditLogsPage() {
  const { t } = useLanguage();
  const { user, loading: userLoading, hasPermission } = useCurrentUser();
  const canReadAuditLogs = hasPermission('READ', 'AUDIT_LOGS');
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [filters, setFilters] = useState({
    tokenId: '',
    action: '',
    startDate: '',
    endDate: '',
  });
  const [showFilters, setShowFilters] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchKeyRef = useRef<string>('');

  useEffect(() => {
    if (userLoading) {
      return;
    }
    if (!user) {
      return;
    }
    if (!canReadAuditLogs) {
      setLogs([]);
      setLoading(false);
      lastFetchKeyRef.current = '';
      return;
    }
    
    // Create a unique key for this fetch based on page and filters
    // We exclude canReadAuditLogs from the key to prevent refetch when permissions are calculated
    const fetchKey = `${user.id}-${page}-${JSON.stringify(filters)}`;
    
    // Only fetch if this is a new combination of parameters
    if (lastFetchKeyRef.current !== fetchKey) {
      lastFetchKeyRef.current = fetchKey;
      fetchLogs();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user?.id, page, filters, canReadAuditLogs]);

  const fetchLogs = async () => {
    if (!canReadAuditLogs) {
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((page - 1) * limit).toString(),
      });

      if (filters.tokenId) params.append('tokenId', filters.tokenId);
      if (filters.action) params.append('action', filters.action);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await apiFetch(`/api/audit-logs?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        // Ensure logs is always an array, handle both old and new API formats
        const logsArray = Array.isArray(data) ? data : (data.logs || []);
        setLogs(logsArray);
        setTotal(data.pagination?.total ?? logsArray.length);
      } else {
        setError(t('auditLogs.failedToFetch'));
      }
    } catch (err) {
      setError(t('auditLogs.errorLoading'));
    } finally {
      setLoading(false);
    }
  };

  const getActionBadge = (action: string) => {
    const badges: Record<string, React.ReactElement> = {
      VALIDATE: <span className="badge-notus-success font-bold">{action}</span>,
      EXTEND: <span className="badge-notus-info font-bold">{action}</span>,
      REVOKE: <span className="badge-notus-danger font-bold">{action}</span>,
      EXCHANGE: <span className="badge-notus-warning font-bold">{action}</span>,
      CREATE: <span className="badge-notus-success font-bold">{action}</span>,
    };
    return badges[action] || <span className="badge-notus-info">{action}</span>;
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({ tokenId: '', action: '', startDate: '', endDate: '' });
    setPage(1);
  };

  const hasActiveFilters = filters.tokenId || filters.action || filters.startDate || filters.endDate;

  const totalPages = Math.ceil(total / limit);

  if (!userLoading && user && !canReadAuditLogs) {
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
              <h2 className="text-2xl font-bold text-gray-900">{t('auditLogs.title')}</h2>
              <p className="text-sm text-gray-500 mt-1">{t('auditLogs.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all shadow-md shadow-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/40"
                onClick={() => setShowFilters(!showFilters)}
              >
                <IconFilter className="mr-2 h-4 w-4" />
                {t('auditLogs.filters')}
              </button>
              <button
                className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-cyan-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all shadow-md shadow-cyan-500/30 hover:shadow-lg hover:shadow-cyan-500/40"
                onClick={fetchLogs}
              >
                <IconRefresh className="mr-2 h-4 w-4" />
                {t('auditLogs.refresh')}
              </button>
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

        {/* Filters */}
        {showFilters && (
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-semibold text-gray-700 uppercase">{t('auditLogs.filterOptions')}</h4>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-gray-600 hover:text-gray-800 flex items-center gap-1"
                >
                  <IconClose className="h-3 w-3" />
                  {t('auditLogs.clearFilters')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label htmlFor="tokenId" className="block text-gray-700 text-sm font-semibold mb-2">
                  {t('auditLogs.tokenId')}
                </label>
                <input
                  id="tokenId"
                  type="text"
                  className="input-notus w-full font-mono text-sm"
                  value={filters.tokenId}
                  onChange={(e) => handleFilterChange('tokenId', e.target.value)}
                  placeholder="Filter by token ID"
                />
              </div>
              <div>
                <label htmlFor="action" className="block text-gray-700 text-sm font-semibold mb-2">
                  {t('auditLogs.action')}
                </label>
                <select
                  id="action"
                  className="input-notus w-full"
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                >
                  <option value="">{t('common.all')} {t('auditLogs.action')}</option>
                  <option value="VALIDATE">{t('auditLogs.validate')}</option>
                  <option value="EXTEND">{t('auditLogs.extend')}</option>
                  <option value="REVOKE">{t('auditLogs.revoke')}</option>
                  <option value="EXCHANGE">{t('auditLogs.exchange')}</option>
                  <option value="CREATE">{t('auditLogs.create')}</option>
                </select>
              </div>
              <div>
                <label htmlFor="startDate" className="block text-gray-700 text-sm font-semibold mb-2">
                  {t('auditLogs.startDate')}
                </label>
                <input
                  id="startDate"
                  type="date"
                  className="input-notus w-full"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-gray-700 text-sm font-semibold mb-2">
                  {t('auditLogs.endDate')}
                </label>
                <input
                  id="endDate"
                  type="date"
                  className="input-notus w-full"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>
            </div>
            {hasActiveFilters && (
              <div className="mt-4 flex flex-wrap gap-2">
                {filters.tokenId && (
                  <span className="badge-notus-info">
                    Token: {filters.tokenId.substring(0, 12)}...
                    <button
                      onClick={() => handleFilterChange('tokenId', '')}
                      className="ml-2 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.action && (
                  <span className="badge-notus-info">
                    Action: {filters.action}
                    <button
                      onClick={() => handleFilterChange('action', '')}
                      className="ml-2 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.startDate && (
                  <span className="badge-notus-info">
                    From: {filters.startDate}
                    <button
                      onClick={() => handleFilterChange('startDate', '')}
                      className="ml-2 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.endDate && (
                  <span className="badge-notus-info">
                    To: {filters.endDate}
                    <button
                      onClick={() => handleFilterChange('endDate', '')}
                      className="ml-2 hover:text-blue-900"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Table */}
        <div className="w-full table-scroll-container p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  {t('auditLogs.showing')} <span className="font-semibold">{logs?.length ?? 0}</span> {t('auditLogs.of')}{' '}
                  <span className="font-semibold">{total}</span> {t('auditLogs.results')}
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden min-w-full">
                <table className="w-full min-w-max">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('auditLogs.timestamp')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('auditLogs.tokenId')}</th>
                      <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('auditLogs.action')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('auditLogs.ipAddress')}</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('auditLogs.userAgent')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {!logs || logs.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center">
                            <p className="text-sm font-medium">{t('auditLogs.noLogsFound')}</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      (logs || []).map((log, index) => (
                        <tr key={log.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900">{formatUTCDate(log.timestamp)}</span>
                              <span className="text-xs text-gray-500">{formatUTCTime(log.timestamp)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="font-mono text-xs text-gray-700">{log.tokenId.substring(0, 12)}...</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                              log.action === 'VALIDATE' || log.action === 'CREATE' ? 'bg-green-100 text-green-800' :
                              log.action === 'REVOKE' ? 'bg-red-100 text-red-800' :
                              log.action === 'EXCHANGE' ? 'bg-orange-100 text-orange-800' :
                              'bg-blue-100 text-blue-800'
                            }`}>
                              {log.action}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                            {log.ipAddress ? (
                              <span className="font-mono">{log.ipAddress}</span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate" title={log.userAgent || ''}>
                            {log.userAgent || <span className="text-gray-400">-</span>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    {t('auditLogs.page')} <span className="font-semibold">{page}</span> {t('auditLogs.of')}{' '}
                    <span className="font-semibold">{totalPages}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      {t('auditLogs.previous')}
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (page <= 3) {
                        pageNum = i + 1;
                      } else if (page >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = page - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 ${
                            pageNum === page
                              ? 'bg-purple-600 text-white focus:ring-purple-500'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300'
                          }`}
                          onClick={() => setPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                    <button
                      className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      disabled={page === totalPages}
                    >
                      {t('auditLogs.next')}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
