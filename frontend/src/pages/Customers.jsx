import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { customerService } from '../services/customerService';
import { aiService } from '../services/aiService';
import PaginationToolbar from '../components/common/PaginationToolbar';
import SearchField from '../components/common/SearchField';
import LoadingScreen from '../components/common/LoadingScreen';
import {
  Users,
  TrendingDown,
  DollarSign,
  Mail,
  Sparkles,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Brain,
  Info,
  ChevronDown,
  ChevronUp,
  Send,
  X,
  Zap,
  CheckCheck,
  Clock,
  Ticket,
} from 'lucide-react';

const SEGMENT_COLORS = {
  Enterprise: {
    text: 'text-indigo-700',
    bg: 'bg-indigo-100',
    border: 'border-indigo-200',
  },
  Premium: {
    text: 'text-amber-700',
    bg: 'bg-amber-100',
    border: 'border-amber-200',
  },
  Standard: {
    text: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
};

const ChurnBar = ({ value = 0 }) => {
  const color =
    value >= 70
      ? 'bg-rose-500'
      : value >= 40
        ? 'bg-amber-500'
        : 'bg-emerald-500';

  const textColor =
    value >= 70
      ? 'text-rose-600'
      : value >= 40
        ? 'text-amber-600'
        : 'text-emerald-600';

  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-slate-200 rounded-full h-1.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>

      <span
        className={`text-xs font-semibold w-8 text-right ${textColor}`}
      >
        {value}%
      </span>
    </div>
  );
};

const Customers = () => {
  const queryClient = useQueryClient();

  // ---------------------------------------------------------
  // UI STATE - retained from frontend-ui
  // ---------------------------------------------------------
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc',
  });
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  // ---------------------------------------------------------
  // ML / AI STATE - retained from backend-work
  // ---------------------------------------------------------
  const [showModelDetails, setShowModelDetails] = useState(false);
  const [expandedCustomerId, setExpandedCustomerId] = useState(null);
  const [notification, setNotification] = useState('');
  const [campaignReviewOpen, setCampaignReviewOpen] = useState(false);
  const [campaignPhase, setCampaignPhase] = useState('idle');
  const [campaignSummary, setCampaignSummary] = useState(null);
  const [showCampaignAccounts, setShowCampaignAccounts] = useState(false);
  const [campaignAccountsPage, setCampaignAccountsPage] = useState(1);

  // Email modal state
  const [emailModalCustomer, setEmailModalCustomer] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailIncentive, setEmailIncentive] = useState('');
  const [emailIncentiveDesc, setEmailIncentiveDesc] = useState('');
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);

  // ---------------------------------------------------------
  // CUSTOMER QUERY
  // ---------------------------------------------------------
  // Keep the frontend-ui TanStack Query implementation.
  //
  // IMPORTANT:
  // The query function uses the real backend service.
  // We are NOT using mock/local customer state.
  // ---------------------------------------------------------
  const customersQuery = useQuery({
    queryKey: ['customers'],
    queryFn: customerService.getCustomers,
    staleTime: 2 * 60 * 1000,
  });

  const customers = customersQuery.data?.data || [];

  // ---------------------------------------------------------
  // MODEL INFO QUERY
  // ---------------------------------------------------------
  const modelInfoQuery = useQuery({
    queryKey: ['customers', 'churn-model-info'],
    queryFn: customerService.getChurnModelInfo,
    staleTime: 10 * 60 * 1000,
  });

  const modelInfo = modelInfoQuery.data || null;

  // ---------------------------------------------------------
  // RECALCULATE CHURN
  // ---------------------------------------------------------
  const recalculateMutation = useMutation({
    mutationFn: () => customerService.getCustomers({ ml: true }),

    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['customers'],
      });

      setNotification(
        'RandomForest Churn predictions updated successfully!'
      );

      setTimeout(() => setNotification(''), 4000);
    },

    onError: () => {
      setNotification(
        'Unable to recalculate churn predictions. Please try again.'
      );

      setTimeout(() => setNotification(''), 4000);
    },
  });

  const handleRecalculateChurn = () => {
    setNotification(
      'Running RandomForest inference across customer accounts...'
    );

    recalculateMutation.mutate();
  };

  // ---------------------------------------------------------
  // BATCH RETENTION CAMPAIGN
  // ---------------------------------------------------------
  const batchCampaignMutation = useMutation({
    mutationFn: async () => {
      setCampaignPhase('preparing');
      await Promise.resolve();
      setCampaignPhase('generating');
      return customerService.launchBatchRetentionCampaign(70);
    },

    onSuccess: (res) => {
      const summary = res?.data || {};
      setCampaignSummary(summary);
      setCampaignPhase('completed');
      setCampaignReviewOpen(false);
      setShowCampaignAccounts(false);
      setCampaignAccountsPage(1);
      queryClient.invalidateQueries({
        queryKey: ['customers'],
      });

      setNotification(
        `AI Retention Campaign Complete: Sent ${summary.sent || 0} of ${summary.totalEligible || highRisk} emails.`
      );

      setTimeout(() => setNotification(''), 5000);
    },

    onError: (error) => {
      setCampaignPhase('failed');
      setNotification(
        error.response?.data?.message || 'Unable to launch the retention campaign. Please try again.'
      );

      setTimeout(() => setNotification(''), 5000);
    },
  });

  const handleBatchRetentionCampaign = () => {
    if (highRisk > 0 && !batchCampaignMutation.isPending) {
      setCampaignReviewOpen(true);
      setCampaignPhase('review');
    }
  };

  const confirmBatchRetentionCampaign = () => {
    if (!batchCampaignMutation.isPending) {
      batchCampaignMutation.mutate();
    }
  };

  const campaignAccounts = useMemo(() => {
    const customerMap = new Map(customers.map((customer) => [String(customer.id), customer]));
    return (campaignSummary?.results || []).map((result) => ({
      ...customerMap.get(String(result.id)),
      ...result,
    }));
  }, [campaignSummary, customers]);

  const campaignAccountsPerPage = 8;
  const campaignAccountsTotalPages = Math.max(1, Math.ceil(campaignAccounts.length / campaignAccountsPerPage));
  const visibleCampaignAccounts = campaignAccounts.slice(
    (campaignAccountsPage - 1) * campaignAccountsPerPage,
    campaignAccountsPage * campaignAccountsPerPage
  );

  const alreadyContacted = campaignAccounts.filter((account) => account.reason === 'Campaign already sent').length;
  const remainingAccounts = Math.max(0, (campaignSummary?.totalEligible || 0) - alreadyContacted - (campaignSummary?.sent || 0));

  // ---------------------------------------------------------
  // SEARCH / FILTER / SORT
  // ---------------------------------------------------------
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();

    return customers.filter((customer) => {
      const matchesSegment =
        segmentFilter === 'All' ||
        customer.segment === segmentFilter;

      const matchesSearch =
        !query ||
        customer.name?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query);

      return matchesSegment && matchesSearch;
    });
  }, [customers, search, segmentFilter]);

  const handleSort = (key) => {
    let direction = 'asc';

    if (
      sortConfig.key === key &&
      sortConfig.direction === 'asc'
    ) {
      direction = 'desc';
    }

    setSortConfig({
      key,
      direction,
    });

    setCurrentPage(1);
  };

  const sortedItems = useMemo(() => {
    const items = [...filtered];

    if (!sortConfig.key) {
      return items;
    }

    items.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
      }

      if (typeof bVal === 'string') {
        bVal = bVal.toLowerCase();
      }

      if (aVal < bVal) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }

      if (aVal > bVal) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }

      return 0;
    });

    return items;
  }, [filtered, sortConfig]);

  const totalPages = Math.ceil(
    sortedItems.length / itemsPerPage
  );

  const paginatedItems = sortedItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ---------------------------------------------------------
  // SUMMARY
  // ---------------------------------------------------------
  const totalCustomers = customers.length;

  const highRisk = customers.filter(
    (customer) => (customer.churnRisk || 0) >= 70
  ).length;

  const avgLtv = customers.length
    ? Math.round(
        customers.reduce(
          (sum, customer) => sum + (customer.ltv || 0),
          0
        ) / customers.length
      )
    : 0;

  // ---------------------------------------------------------
  // SORT ICON
  // ---------------------------------------------------------
  const renderSortIcon = (key) => {
    if (sortConfig.key !== key) {
      return (
        <ChevronUp className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100" />
      );
    }

    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="w-3 h-3 text-brand-600" />
    ) : (
      <ChevronDown className="w-3 h-3 text-brand-600" />
    );
  };

  // ---------------------------------------------------------
  // AI WIN-BACK EMAIL
  // ---------------------------------------------------------
  const openEmailModal = async (customer) => {
    setEmailModalCustomer(customer);
    setEmailSubject('');
    setEmailBody('');
    setEmailIncentive('');
    setEmailIncentiveDesc('');
    setIsGeneratingEmail(true);

    try {
      const generated =
        await aiService.generateWinBackEmail(customer);

      setEmailSubject(generated?.subject || '');
      setEmailBody(generated?.body || '');
      setEmailIncentive(generated?.incentiveCode || '');
      setEmailIncentiveDesc(
        generated?.incentiveDesc || ''
      );
    } catch (error) {
      console.error(
        'Failed to generate win-back email:',
        error
      );

      setNotification(
        'Unable to generate AI email. Please try again.'
      );

      setTimeout(() => setNotification(''), 4000);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const regenerateEmailContent = async () => {
    if (!emailModalCustomer) {
      return;
    }

    setIsGeneratingEmail(true);

    try {
      const generated =
        await aiService.generateWinBackEmail(
          emailModalCustomer
        );

      setEmailSubject(generated?.subject || '');
      setEmailBody(generated?.body || '');
      setEmailIncentive(generated?.incentiveCode || '');
      setEmailIncentiveDesc(
        generated?.incentiveDesc || ''
      );
    } catch (error) {
      console.error(
        'Failed to regenerate email:',
        error
      );

      setNotification(
        'Unable to regenerate the email. Please try again.'
      );

      setTimeout(() => setNotification(''), 4000);
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      if (!emailModalCustomer) {
        throw new Error('No customer selected.');
      }

      const payload = {
        recipientName: emailModalCustomer.name,
        recipientEmail: emailModalCustomer.email,
        subject: emailSubject,
        body: emailBody,
        incentive: emailIncentive,
        churnRisk: emailModalCustomer.churnRisk,
      };

      return customerService.sendRetentionEmail(
        emailModalCustomer.id,
        payload
      );
    },

    onSuccess: () => {
      const customerName = emailModalCustomer?.name;

      setEmailModalCustomer(null);

      queryClient.invalidateQueries({
        queryKey: ['customers'],
      });

      setNotification(
        `Retention email delivered to ${customerName}!`
      );

      setTimeout(() => setNotification(''), 4000);
    },

    onError: () => {
      setNotification(
        'Unable to send retention email. Please try again.'
      );

      setTimeout(() => setNotification(''), 4000);
    },
  });

  const handleSendRetentionEmail = () => {
    if (!emailModalCustomer || !emailBody.trim()) {
      return;
    }

    sendEmailMutation.mutate();
  };

  // ---------------------------------------------------------
  // INITIAL LOADING
  // ---------------------------------------------------------
  // This preserves the frontend-ui loading behavior while
  // avoiding the full loader when cached data exists.
  // ---------------------------------------------------------
  if (customersQuery.isPending && !customersQuery.data) {
    return (
      <LoadingScreen label="Loading customer intelligence..." />
    );
  }

  if (customersQuery.isError) {
    return (
      <div className="p-8 text-center text-rose-700">
        <p>Unable to load customers.</p>
        <button
          onClick={() => customersQuery.refetch()}
          className="mt-3 text-sm text-brand-600 hover:underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* --------------------------------------------------- */}
      {/* TOAST                                               */}
      {/* --------------------------------------------------- */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 bg-white px-4 py-3 rounded-xl border border-brand-200 text-sm text-slate-700 shadow-xl flex items-center gap-2.5 animate-fade-in">
          <Sparkles className="w-4 h-4 text-brand-600 animate-spin" />
          <span>{notification}</span>
        </div>
      )}

      {/* --------------------------------------------------- */}
      {/* HEADER                                              */}
      {/* --------------------------------------------------- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900">
              Customers
            </h1>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-100 text-brand-700 border border-brand-200">
              <Brain className="w-3.5 h-3.5" />
              RandomForest ML Active
            </span>
          </div>

          <p className="text-slate-500 mt-1">
            Manage your customer base and monitor retention signals.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              setShowModelDetails(!showModelDetails)
            }
            className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 transition-all flex items-center gap-1.5"
          >
            <Info className="w-4 h-4 text-brand-600" />

            <span>Model Insights</span>

            {showModelDetails ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>

          <button
            onClick={handleRecalculateChurn}
            disabled={recalculateMutation.isPending}
            className="btn-primary text-xs flex items-center gap-2 py-2 px-4 shadow-lg shadow-brand-500/20 disabled:opacity-60"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                recalculateMutation.isPending
                  ? 'animate-spin'
                  : ''
              }`}
            />

            <span>
              {recalculateMutation.isPending
                ? 'Scoring...'
                : 'Recalculate with ML'}
            </span>
          </button>
        </div>
      </div>

      {/* Background refresh indicator */}
      {customersQuery.isFetching &&
        customersQuery.data && (
          <p className="text-xs text-slate-400">
            Refreshing customer data...
          </p>
        )}

      {/* --------------------------------------------------- */}
      {/* RETENTION CAMPAIGN BANNER                           */}
      {/* --------------------------------------------------- */}
      <>
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 via-white to-indigo-50 border border-rose-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm animate-fade-in">
          <div className="flex items-center gap-3.5">
            <div className="p-2.5 rounded-xl bg-rose-100 text-rose-600 border border-rose-200 flex-shrink-0">
              <Zap className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-slate-900">
                  {highRisk > 0 ? 'Autonomous Win-Back Agent Standing By' : 'Autonomous Win-Back Agent'}
                </h4>

                <span className="text-[11px] bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold border border-rose-200">
                  {highRisk} Accounts Critical (≥ 70%)
                </span>
              </div>

                <p className="text-xs text-slate-500 mt-0.5">
                {highRisk > 0
                  ? 'Personalized retention messages will be generated for flagged high churn accounts and sent through the configured email service after confirmation.'
                  : 'No customer accounts currently meet the 70% churn-risk threshold.'}
              </p>
            </div>
          </div>

          <button
            onClick={handleBatchRetentionCampaign}
            disabled={batchCampaignMutation.isPending || highRisk === 0}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 to-indigo-600 hover:from-rose-600 hover:to-indigo-700 text-white text-xs font-semibold shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 transition-all flex-shrink-0 disabled:opacity-60"
          >
            <Send
              className={`w-3.5 h-3.5 ${
                batchCampaignMutation.isPending
                  ? 'animate-spin'
                  : ''
              }`}
            />

            <span>
              {batchCampaignMutation.isPending
                ? 'Running Campaign...'
                : 'Launch AI Retention Campaign'}
            </span>
          </button>
        </div>

        {campaignSummary && campaignPhase === 'completed' && (
          <>
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-5">
                <div><p className="text-xs text-slate-500">Eligible</p><strong>{campaignSummary.totalEligible || 0}</strong></div>
                <div><p className="text-xs text-slate-500">Already contacted</p><strong>{alreadyContacted}</strong></div>
                <div><p className="text-xs text-slate-500">Remaining</p><strong>{remainingAccounts}</strong></div>
                <div><p className="text-xs text-slate-500">Sent this run</p><strong className="text-emerald-700">{campaignSummary.sent || 0}</strong></div>
                <div><p className="text-xs text-slate-500">Failed / skipped</p><strong className="text-rose-700">{(campaignSummary.failed || 0) + (campaignSummary.skipped || 0)}</strong></div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-200 pt-3">
                <p className="text-xs text-slate-600">Campaign processing details remain available below.</p>
                <button type="button" onClick={() => setShowCampaignAccounts((visible) => !visible)} className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-300 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 transition-colors hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
                  {showCampaignAccounts ? 'Hide account details' : `View all accounts (${campaignAccounts.length})`}
                  {showCampaignAccounts ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>

            {showCampaignAccounts && (
              <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 px-4 py-3">
                  <div>
                    <h4 className="text-sm font-semibold text-slate-900">Campaign account details</h4>
                    <p className="text-xs text-slate-500">{campaignAccounts.length} accounts included in the campaign response.</p>
                  </div>
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Page {campaignAccountsPage} of {campaignAccountsTotalPages}</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[680px] text-xs">
                    <thead className="bg-slate-50 text-left uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Customer</th>
                        <th className="px-4 py-3 font-semibold">Churn risk</th>
                        <th className="px-4 py-3 font-semibold">Segment</th>
                        <th className="px-4 py-3 text-right font-semibold">LTV</th>
                        <th className="px-4 py-3 text-right font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleCampaignAccounts.map((account) => {
                        const status = account.status || 'unknown';
                        const statusStyles = status === 'sent' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : status === 'skipped' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-rose-100 text-rose-700 border-rose-200';
                        return (
                          <tr key={String(account.id)} className="hover:bg-slate-50">
                            <td className="px-4 py-3"><p className="font-semibold text-slate-900">{account.name || 'Unknown customer'}</p><p className="mt-0.5 text-slate-500">{account.email || 'No email address'}</p></td>
                            <td className="px-4 py-3 font-semibold text-rose-700">{account.churnRisk ?? '—'}%</td>
                            <td className="px-4 py-3 text-slate-600">{account.segment || '—'}</td>
                            <td className="px-4 py-3 text-right font-semibold text-slate-900">{account.ltv == null ? '—' : `₹${Number(account.ltv).toLocaleString()}`}</td>
                            <td className="px-4 py-3 text-right"><span className={`inline-flex rounded-full border px-2.5 py-1 font-semibold capitalize ${statusStyles}`}>{status}</span>{account.reason && <p className="mt-1 max-w-40 text-right text-[11px] text-slate-400">{account.reason}</p>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {campaignAccountsTotalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                    <button type="button" onClick={() => setCampaignAccountsPage((page) => Math.max(1, page - 1))} disabled={campaignAccountsPage === 1} className="btn-secondary px-3 py-1.5 text-xs">Previous</button>
                    <span className="text-xs text-slate-500">{campaignAccountsPage} / {campaignAccountsTotalPages}</span>
                    <button type="button" onClick={() => setCampaignAccountsPage((page) => Math.min(campaignAccountsTotalPages, page + 1))} disabled={campaignAccountsPage === campaignAccountsTotalPages} className="btn-secondary px-3 py-1.5 text-xs">Next</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </>

      {campaignReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Review retention campaign</h3>
                <p className="mt-1 text-sm text-slate-500">The campaign will target {highRisk} account{highRisk === 1 ? '' : 's'} with churn risk at or above 70%.</p>
              </div>
              <button type="button" onClick={() => setCampaignReviewOpen(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-800">
              Personalized retention messages will use the available customer and business context. Emails will be dispatched only after you confirm.
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setCampaignReviewOpen(false)} className="btn-secondary text-sm">Cancel</button>
              <button type="button" onClick={confirmBatchRetentionCampaign} className="btn-primary flex items-center gap-2 text-sm" disabled={batchCampaignMutation.isPending}>
                <Send className="h-4 w-4" /> Confirm and launch
              </button>
            </div>
          </div>
        </div>
      )}

      {batchCampaignMutation.isPending && (
        <div className="rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {campaignPhase === 'preparing' && 'Preparing campaign...'}
          {campaignPhase === 'generating' && 'Generating personalized messages and sending emails...'}
        </div>
      )}

      {/* --------------------------------------------------- */}
      {/* MODEL INSIGHTS                                      */}
      {/* --------------------------------------------------- */}
      {showModelDetails && modelInfo && (
        <div className="glass-card p-5 border border-brand-200 bg-gradient-to-r from-white to-brand-50 rounded-2xl animate-fade-in space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-brand-100 text-brand-600">
                <Brain className="w-5 h-5" />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  {modelInfo.model_type ||
                    'RandomForestClassifier'}{' '}
                  Pipeline
                </h3>

                <p className="text-xs text-slate-500">
                  Trained on RFM features • Accuracy:{' '}
                  <span className="text-emerald-600 font-semibold">
                    {(
                      (modelInfo.training_accuracy || 0.91) *
                      100
                    ).toFixed(1)}
                    %
                  </span>{' '}
                  • 100 Estimators
                </p>
              </div>
            </div>

            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Live in FastAPI ML Service
            </span>
          </div>

          <div>
            <p className="text-xs text-slate-500 mb-2 font-medium">
              RandomForest Feature Importance Weights:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {modelInfo.feature_importances &&
                Object.entries(
                  modelInfo.feature_importances
                ).map(([feature, weight]) => {
                  const labelMap = {
                    order_count: 'Order Frequency',
                    ltv: 'Lifetime Value (LTV)',
                    recency_days: 'Inactivity Recency',
                    avg_order_value: 'Avg Order Spend',
                    segment_code: 'Tier Segment',
                  };

                  const pct = Math.round(weight * 100);

                  return (
                    <div
                      key={feature}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 font-medium">
                          {labelMap[feature] || feature}
                        </span>

                        <span className="text-brand-600 font-bold">
                          {pct}%
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 rounded-full h-1 overflow-hidden">
                        <div
                          className="bg-brand-500 h-full rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* --------------------------------------------------- */}
      {/* SUMMARY CARDS                                       */}
      {/* --------------------------------------------------- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-brand-100">
            <Users className="w-6 h-6 text-brand-600" />
          </div>

          <div>
            <p className="text-slate-500 text-sm">
              Total Customers
            </p>

            <p className="text-2xl font-bold text-slate-900">
              {totalCustomers}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-100">
            <TrendingDown className="w-6 h-6 text-rose-600" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <p className="text-slate-500 text-sm">
                High Churn Risk
              </p>

              <span className="text-[10px] bg-rose-100 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-bold">
                ≥ 70%
              </span>
            </div>

            <p className="text-2xl font-bold text-slate-900">
              {highRisk}
            </p>
          </div>
        </div>

        <div className="glass-card p-5 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-100">
            <DollarSign className="w-6 h-6 text-emerald-600" />
          </div>

          <div>
            <p className="text-slate-500 text-sm">
              Avg. Lifetime Value
            </p>

            <p className="text-2xl font-bold text-slate-900">
              ₹{avgLtv.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------- */}
      {/* CONTROLS                                            */}
      {/* --------------------------------------------------- */}
      <div className="flex flex-col md:flex-row gap-3">
        <SearchField
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          placeholder="Search by name or email..."
          className="flex-1"
        />

        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1">
          {[
            'All',
            'Enterprise',
            'Premium',
            'Standard',
          ].map((segment) => (
            <button
              key={segment}
              onClick={() => {
                setSegmentFilter(segment);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                segmentFilter === segment
                  ? 'bg-brand-600 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {segment}
            </button>
          ))}
        </div>
      </div>

      {/* --------------------------------------------------- */}
      {/* TABLE                                               */}
      {/* --------------------------------------------------- */}
      <div className="glass-card overflow-hidden">
        <PaginationToolbar
          currentPage={currentPage}
          totalPages={totalPages}
          totalResults={sortedItems.length}
          itemsPerPage={itemsPerPage}
          onPageChange={setCurrentPage}
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th
                  onClick={() => handleSort('name')}
                  className="group cursor-pointer text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Customer
                    {renderSortIcon('name')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('segment')}
                  className="group cursor-pointer text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center gap-1">
                    Segment
                    {renderSortIcon('segment')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('orders')}
                  className="group cursor-pointer text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    Orders
                    {renderSortIcon('orders')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('ltv')}
                  className="group cursor-pointer text-right text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4 transition-colors hover:bg-slate-100"
                >
                  <div className="flex items-center justify-end gap-1">
                    Lifetime Value
                    {renderSortIcon('ltv')}
                  </div>
                </th>

                <th
                  onClick={() => handleSort('churnRisk')}
                  className="group cursor-pointer text-left text-xs font-semibold text-slate-500 uppercase tracking-wider px-6 py-4"
                >
                  <div className="flex items-center gap-1">
                    Churn Risk
                    {renderSortIcon('churnRisk')}
                  </div>
                </th>

                <th className="text-center text-xs font-semibold text-slate-500 uppercase tracking-wider px-4 py-4">
                  AI Retention Action
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedItems.map((customer) => {
                const sc =
                  SEGMENT_COLORS[customer.segment] ||
                  SEGMENT_COLORS.Standard;

                const isHighRisk =
                  (customer.churnRisk || 0) >= 70;

                const isExpanded =
                  expandedCustomerId === customer.id;

                const hasSentEmail =
                  customer.retentionCampaign?.status ===
                  'Sent';

                return (
                  <React.Fragment key={customer.id}>
                    <tr
                      onClick={() =>
                        setExpandedCustomerId(
                          isExpanded ? null : customer.id
                        )
                      }
                      className={`hover:bg-slate-50/80 transition-colors cursor-pointer group ${
                        isHighRisk
                          ? 'bg-rose-50/30'
                          : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 ${
                              isHighRisk
                                ? 'bg-gradient-to-br from-rose-500 to-amber-600'
                                : 'bg-gradient-to-br from-brand-500 to-indigo-600'
                            }`}
                          >
                            {customer.name?.charAt(0)}
                          </div>

                          <div>
                            <div className="font-medium text-slate-900 flex items-center gap-2">
                              {customer.name}

                              {customer.mlPowered && (
                                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 border border-indigo-200">
                                  RF-ML
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 mt-0.5">
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <Mail className="w-3 h-3" />
                                {customer.email}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${sc.text} ${sc.bg} ${sc.border}`}
                        >
                          {customer.segment}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-right text-slate-900 font-medium">
                        {customer.orders}
                      </td>

                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-slate-900">
                          ₹{(customer.ltv || 0).toLocaleString()}
                        </span>
                      </td>

                      <td className="px-6 py-4 w-52">
                        <ChurnBar
                          value={customer.churnRisk || 0}
                        />
                      </td>

                      <td className="px-4 py-4 text-center">
                        <div
                          className="flex items-center justify-center gap-2"
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                        >
                          {isHighRisk ? (
                            hasSentEmail ? (
                              <button
                                onClick={() =>
                                  openEmailModal(customer)
                                }
                                className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-700 border border-emerald-200 hover:bg-emerald-200 transition-all"
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>Email Sent</span>
                              </button>
                            ) : (
                              <button
                                onClick={() =>
                                  openEmailModal(customer)
                                }
                                className="inline-flex items-center gap-1.5 text-xs px-3 py-1 rounded-lg font-semibold bg-rose-100 text-rose-700 hover:bg-rose-200 border border-rose-200 transition-all"
                              >
                                <Mail className="w-3.5 h-3.5" />
                                <span>AI Win-Back</span>
                              </button>
                            )
                          ) : (
                            <button
                              onClick={() =>
                                setExpandedCustomerId(
                                  isExpanded
                                    ? null
                                    : customer.id
                                )
                              }
                              className="text-xs px-2.5 py-1 rounded-lg font-medium bg-slate-100 text-slate-500 hover:text-slate-900 border border-slate-200 transition-all"
                            >
                              {isExpanded
                                ? 'Hide'
                                : 'Explain'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded ML Explanation */}
                    {isExpanded && (
                      <tr className="bg-slate-50 border-y border-slate-200 animate-fade-in">
                        <td
                          colSpan="6"
                          className="px-6 py-4"
                        >
                          <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <Brain className="w-4 h-4 text-brand-600" />

                                <span className="text-xs font-semibold text-slate-900">
                                  RandomForest Model Explanation
                                  for {customer.name}
                                </span>

                                <span
                                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                    isHighRisk
                                      ? 'bg-rose-100 text-rose-700'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}
                                >
                                  {customer.riskTier ||
                                    (isHighRisk
                                      ? 'High'
                                      : 'Healthy')}{' '}
                                  Risk Tier (
                                  {customer.churnRisk}%)
                                </span>
                              </div>

                              {customer
                                .retentionCampaign
                                ?.lastSentAt && (
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-brand-600" />
                                  Last Contacted:{' '}
                                  <strong className="text-slate-600">
                                    {new Date(
                                      customer
                                        .retentionCampaign
                                        .lastSentAt
                                    ).toLocaleDateString()}
                                  </strong>
                                </span>
                              )}
                            </div>

                            <div>
                              <p className="text-xs text-slate-500 mb-1.5 font-medium">
                                Identified Driving Factors:
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {customer.riskFactors?.length >
                                0 ? (
                                  customer.riskFactors.map(
                                    (rf, idx) => (
                                      <span
                                        key={idx}
                                        className={`text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 ${
                                          isHighRisk
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                                        }`}
                                      >
                                        {isHighRisk ? (
                                          <AlertTriangle className="w-3 h-3 text-rose-500" />
                                        ) : (
                                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                        )}

                                        {rf}
                                      </span>
                                    )
                                  )
                                ) : (
                                  <span className="text-xs text-slate-400">
                                    Engagement patterns within
                                    optimal retention bounds.
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                              <div className="flex items-center gap-2">
                                <span className="text-slate-500 font-medium">
                                  Recommended Action:
                                </span>

                                <span className="text-brand-700 font-medium">
                                  {customer.recommendation ||
                                    'Continue monitoring engagement'}
                                </span>
                              </div>

                              {isHighRisk && (
                                <button
                                  onClick={() =>
                                    openEmailModal(customer)
                                  }
                                  className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 self-start sm:self-auto"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                  <span>
                                    Draft AI Win-Back Email
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p>No customers match your search.</p>
            </div>
          )}
        </div>
      </div>

      {/* --------------------------------------------------- */}
      {/* AI WIN-BACK EMAIL MODAL                             */}
      {/* --------------------------------------------------- */}
      {emailModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-2xl rounded-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">

            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-md">
                  <Brain className="w-5 h-5" />
                </div>

                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    AI Win-Back Retention Agent
                  </h3>

                  <p className="text-xs text-slate-500">
                    Personalized retention proposal tailored to
                    customer churn profile
                  </p>
                </div>
              </div>

              <button
                onClick={() =>
                  setEmailModalCustomer(null)
                }
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Recipient Summary */}
            <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">To:</span>

                <strong className="text-slate-900 font-semibold">
                  {emailModalCustomer.name}
                </strong>

                <span className="text-slate-400">
                  ({emailModalCustomer.email})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 border border-rose-200 font-bold">
                  {emailModalCustomer.churnRisk}% Churn Risk
                </span>

                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {emailModalCustomer.segment} Tier
                </span>

                <span className="text-slate-400">
                  {emailModalCustomer.recency_days || 45}d
                  Inactive
                </span>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {isGeneratingEmail ? (
                <div className="py-16 flex flex-col items-center justify-center gap-3 text-center">
                  <Sparkles className="w-8 h-8 text-brand-600 animate-spin" />

                  <p className="text-sm font-medium text-slate-900">
                    Synthesizing churn risk drivers and drafting
                    incentive proposal...
                  </p>

                  <p className="text-xs text-slate-500">
                    BizPilot AI is calibrating the discount tier for{' '}
                    {emailModalCustomer.name}
                  </p>
                </div>
              ) : (
                <>
                  <div className="p-3 rounded-xl bg-brand-50 border border-brand-200 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <Ticket className="w-4 h-4 text-brand-600 flex-shrink-0" />

                      <div>
                        <span className="text-xs font-semibold text-slate-900 block">
                          AI Selected Incentive:{' '}
                          {emailIncentiveDesc}
                        </span>

                        <span className="text-[11px] text-slate-500">
                          Automated redemption code based on{' '}
                          {emailModalCustomer.segment} account tier
                        </span>
                      </div>
                    </div>

                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded bg-white text-brand-700 border border-brand-200">
                      {emailIncentive}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Email Subject
                    </label>

                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) =>
                        setEmailSubject(e.target.value)
                      }
                      className="input-field text-sm font-medium w-full"
                      placeholder="Subject line..."
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-600">
                        Email Message Body (AI Generated)
                      </label>

                      <button
                        onClick={regenerateEmailContent}
                        disabled={isGeneratingEmail}
                        className="text-xs text-brand-600 hover:text-brand-700 flex items-center gap-1 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Regenerate Variant
                      </button>
                    </div>

                    <textarea
                      rows={10}
                      value={emailBody}
                      onChange={(e) =>
                        setEmailBody(e.target.value)
                      }
                      className="input-field text-xs leading-relaxed font-mono w-full resize-none p-3.5"
                      placeholder="Email content..."
                    />
                  </div>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
              <button
                type="button"
                onClick={() =>
                  setEmailModalCustomer(null)
                }
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={regenerateEmailContent}
                  disabled={
                    isGeneratingEmail ||
                    sendEmailMutation.isPending
                  }
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 transition-all flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-600" />

                  <span>Regenerate with AI</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendRetentionEmail}
                  disabled={
                    isGeneratingEmail ||
                    sendEmailMutation.isPending ||
                    !emailBody.trim()
                  }
                  className="btn-primary text-xs py-2 px-5 flex items-center gap-2 shadow-lg shadow-brand-500/20 disabled:opacity-50"
                >
                  <Send
                    className={`w-3.5 h-3.5 ${
                      sendEmailMutation.isPending
                        ? 'animate-spin'
                        : ''
                    }`}
                  />

                  <span>
                    {sendEmailMutation.isPending
                      ? 'Dispatching...'
                      : 'Send Retention Email'}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;