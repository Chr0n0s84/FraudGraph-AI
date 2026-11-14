import React, { useState, useMemo } from 'react';
import { Transaction, TransactionStatus } from '../types.ts';
import { SearchIcon, ArrowRightIcon, FileTextIcon, FilterIcon } from './Icons.tsx';

interface TransactionsTableProps {
  transactions: Transaction[];
  newTxIds?: Set<string>;
  onSelectAccount: (accountId: string) => void;
}

export function TransactionsTable({ transactions, newTxIds, onSelectAccount }: TransactionsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [sortBy, setSortBy] = useState<'time' | 'amount'>('time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter((tx) => {
        const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
        const matchesSearch =
          searchTerm === '' ||
          tx.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tx.channel.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
      })
      .sort((a, b) => {
        if (sortBy === 'amount') {
          return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
        }
        return sortOrder === 'desc'
          ? new Date(b.time).getTime() - new Date(a.time).getTime()
          : new Date(a.time).getTime() - new Date(b.time).getTime();
      });
  }, [transactions, searchTerm, statusFilter, sortBy, sortOrder]);

  const toggleSort = (field: 'time' | 'amount') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div>
          <h2 className="font-display font-bold text-lg text-[#f8fafc] flex items-center gap-2">
            <FileTextIcon size={18} className="text-[#00f2fe]" />
            Forensic Transaction Ledger
          </h2>
          <p className="text-xs text-[#94a3b8] font-mono-data">
            GET /transactions?limit=50 &bull; Newest forensic ledger logs
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 md:w-56">
            <SearchIcon size={14} className="absolute left-2.5 top-2.5 text-[#94a3b8]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search ID, sender, receiver..."
              className="w-full bg-[#070b16] border border-[rgba(56,189,248,0.2)] focus:border-[#00f2fe] rounded pl-8 pr-3 py-1.5 text-xs text-[#f8fafc] font-mono-data outline-none transition-colors"
            />
          </div>

          {/* Status Filter buttons */}
          <div className="flex items-center gap-1 font-mono-data text-[11px] bg-[#070b16] p-1 rounded border border-[rgba(56,189,248,0.15)]">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-2 py-1 rounded transition-colors ${
                statusFilter === 'all' ? 'bg-[#00f2fe] text-[#080d1a] font-bold' : 'text-[#94a3b8] hover:text-[#f8fafc]'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setStatusFilter('high')}
              className={`px-2 py-1 rounded transition-colors ${
                statusFilter === 'high' ? 'bg-[#f43f5e] text-[#080d1a] font-bold' : 'text-[#f43f5e] hover:bg-[#f43f5e]/10'
              }`}
            >
              High
            </button>
            <button
              onClick={() => setStatusFilter('suspicious')}
              className={`px-2 py-1 rounded transition-colors ${
                statusFilter === 'suspicious'
                  ? 'bg-[#f59e0b] text-[#080d1a] font-bold'
                  : 'text-[#f59e0b] hover:bg-[#f59e0b]/10'
              }`}
            >
              Suspicious
            </button>
            <button
              onClick={() => setStatusFilter('normal')}
              className={`px-2 py-1 rounded transition-colors ${
                statusFilter === 'normal'
                  ? 'bg-[#10b981] text-[#080d1a] font-bold'
                  : 'text-[#10b981] hover:bg-[#10b981]/10'
              }`}
            >
              Normal
            </button>
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="glass-panel rounded-lg overflow-hidden border border-[rgba(56,189,248,0.15)]">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse text-xs font-mono-data">
            <thead className="sticky top-0 bg-[#0b1329] border-b border-[rgba(56,189,248,0.2)] text-[#94a3b8] z-10">
              <tr>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Tx ID</th>
                <th
                  className="py-2.5 px-3 uppercase tracking-wider text-[10px] cursor-pointer hover:text-[#00f2fe]"
                  onClick={() => toggleSort('time')}
                >
                  Timestamp {sortBy === 'time' && (sortOrder === 'desc' ? '▼' : '▲')}
                </th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Source (From)</th>
                <th className="py-2.5 px-2 text-center uppercase tracking-wider text-[10px]">&rarr;</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Target (To)</th>
                <th
                  className="py-2.5 px-3 uppercase tracking-wider text-[10px] text-right cursor-pointer hover:text-[#00f2fe]"
                  onClick={() => toggleSort('amount')}
                >
                  Amount {sortBy === 'amount' && (sortOrder === 'desc' ? '▼' : '▲')}
                </th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px]">Channel</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px] text-center">Status</th>
                <th className="py-2.5 px-3 uppercase tracking-wider text-[10px] text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.04)]">
              {filteredTransactions.map((tx, idx) => {
                const isEven = idx % 2 === 0;
                const isNew = newTxIds?.has(tx.id) ?? false;
                return (
                  <tr
                    key={tx.id}
                    data-new={isNew ? 'true' : undefined}
                    className={`transition-colors duration-150 border-l-2 hover:border-l-[#00f2fe] hover:bg-[#0f1c3f] ${
                      isNew
                        ? 'animate-row-flash border-l-[#00f2fe] bg-[rgba(0,242,254,0.18)]'
                        : `border-l-transparent ${isEven ? 'bg-[#080d1a]' : 'bg-[#0b1329]'}`
                    }`}
                  >
                    {/* Tx ID */}
                    <td className="py-2.5 px-3 text-[#38bdf8] font-bold">{tx.id}</td>

                    {/* Timestamp */}
                    <td className="py-2.5 px-3 text-[#94a3b8] text-[11px]">
                      {tx.time.replace('T', ' ')}
                    </td>

                    {/* From Account */}
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onSelectAccount(tx.from)}
                        className="text-[#f8fafc] hover:text-[#00f2fe] hover:underline font-semibold flex items-center gap-1 group text-left"
                        title={`Inspect account ${tx.from}`}
                      >
                        <span className="group-hover:text-[#00f2fe]">{tx.from}</span>
                      </button>
                    </td>

                    {/* Direction Arrow */}
                    <td className="py-2.5 px-2 text-center text-[#475569]">
                      <ArrowRightIcon size={12} className="inline text-[#94a3b8]" />
                    </td>

                    {/* To Account */}
                    <td className="py-2.5 px-3">
                      <button
                        onClick={() => onSelectAccount(tx.to)}
                        className="text-[#f8fafc] hover:text-[#00f2fe] hover:underline font-semibold flex items-center gap-1 group text-left"
                        title={`Inspect account ${tx.to}`}
                      >
                        <span className="group-hover:text-[#00f2fe]">{tx.to}</span>
                      </button>
                    </td>

                    {/* Amount */}
                    <td className="py-2.5 px-3 text-right font-bold text-[#f8fafc]">
                      <span className="text-[#94a3b8] font-normal mr-0.5">₹</span>
                      {tx.amount.toLocaleString()}
                    </td>

                    {/* Channel */}
                    <td className="py-2.5 px-3">
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#070b16] border border-[rgba(56,189,248,0.2)] text-[#94a3b8]">
                        {tx.channel}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-2.5 px-3 text-center">
                      {tx.status === 'high' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[rgba(244,63,94,0.15)] text-[#f43f5e] border border-[rgba(244,63,94,0.4)]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#f43f5e] animate-pulse" />
                          CRITICAL
                        </span>
                      ) : tx.status === 'suspicious' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[rgba(245,158,11,0.15)] text-[#f59e0b] border border-[rgba(245,158,11,0.4)]">
                          SUSPICIOUS
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[rgba(16,185,129,0.12)] text-[#10b981] border border-[rgba(16,185,129,0.35)]">
                          CLEAN
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => onSelectAccount(tx.from)}
                        className="text-[10px] text-[#00f2fe] hover:underline"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table footer info */}
        <div className="p-3 bg-[#0b1329] border-t border-[rgba(56,189,248,0.1)] flex items-center justify-between text-xs text-[#94a3b8] font-mono-data">
          <span>Showing {filteredTransactions.length} of {transactions.length} records</span>
          <span className="text-[#38bdf8]">Click any account ID to trigger drill-down dossier</span>
        </div>
      </div>
    </div>
  );
}
