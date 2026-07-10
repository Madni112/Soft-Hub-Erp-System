import React, { useState, useEffect } from 'react';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

const AccountReport = () => {
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [voucherData, setVoucherData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalReceipts: 0, totalPayments: 0, netLiquidity: 0 });

  const fetchFinancialReportPool = async () => {
    try {
      setLoading(true);
      const { data: vouchers, error } = await supabase
        .from('financial_vouchers')
        .select('*')
        .order('voucher_date', { ascending: false });

      if (error) throw error;

      const filteredVouchers = (vouchers || []).filter(v => {
        const d = v.voucher_date || v.created_at?.split('T')[0];
        return d >= dateFrom && d <= dateTo;
      });

      let receiptsSum = 0;
      let paymentsSum = 0;

      filteredVouchers.forEach(v => {
        const amt = Number(v.total_amount) || 0;
        if (v.voucher_type?.includes('Receipt')) {
          receiptsSum += amt;
        } else if (v.voucher_type?.includes('Payment')) {
          paymentsSum += amt;
        }
      });

      setVoucherData(filteredVouchers);
      setSummary({
        totalReceipts: receiptsSum,
        totalPayments: paymentsSum,
        netLiquidity: receiptsSum - paymentsSum
      });
    } catch (err: any) {
      toast.error('Ledger Balance Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFinancialReportPool();
  }, [dateFrom, dateTo]);
  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative text-black dark:text-bodydark text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white">Financial Ledger & Accounts Audit Report</h2>
          <p className="text-xs text-gray-400">Track dual-entry vouchers, asset liquidities, and corporate capital summaries</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-bold block uppercase text-[10px]">Total Inbound Receipts</span>
            <b className="text-success text-base font-black font-mono">Rs. {summary.totalReceipts.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
          </div>
          <div className="p-2.5 bg-success/10 rounded text-success text-base font-bold">IN</div>
        </div>
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-bold block uppercase text-[10px]">Total Outbound Payments</span>
            <b className="text-danger text-base font-black font-mono">Rs. {summary.totalPayments.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b>
          </div>
          <div className="p-2.5 bg-danger/10 rounded text-danger text-base font-bold">OUT</div>
        </div>
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div>
            <span className="text-gray-400 font-bold block uppercase text-[10px]">Net Cash Drawer Liquidity</span>
            <b className={`text-base font-black font-mono ${summary.netLiquidity >= 0 ? 'text-primary' : 'text-danger'}`}>
              Rs. {summary.netLiquidity.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </b>
          </div>
          <div className="p-2.5 bg-primary/10 rounded text-primary text-base font-bold">BAL</div>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-stroke dark:border-strokedark pb-4">
          <div className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            Detailed Financial Ledger Book
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={dateFrom} 
              onChange={(e) => setDateFrom(e.target.value)} 
              className="border border-stroke dark:border-strokedark rounded p-1.5 bg-transparent font-bold outline-none text-black dark:text-white text-xs" 
            />
            <span className="text-gray-400 font-bold">to</span>
            <input 
              type="date" 
              value={dateTo} 
              onChange={(e) => setDateTo(e.target.value)} 
              className="border border-stroke dark:border-strokedark rounded p-1.5 bg-transparent font-bold outline-none text-black dark:text-white text-xs" 
            />
          </div>
        </div>

        {loading ? (
          <div className="flex h-48 items-center justify-center"><Spinner /></div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto border-collapse text-left">
              <thead>
                <tr className="bg-gray-100 dark:bg-meta-4 font-bold text-black dark:text-white border-b border-stroke dark:border-strokedark uppercase tracking-wider text-[10px]">
                  <th className="p-3 w-16">S#</th>
                  <th className="p-3 w-28">Voucher Ref #</th>
                  <th className="p-3 w-32">Posting Date</th>
                  <th className="p-3">Description Narrative Account</th>
                  <th className="p-3 w-36 text-center">Voucher Classification</th>
                  <th className="p-3 w-40 text-right pr-6">Fund Transferred</th>
                </tr>
              </thead>
              <tbody>
                {voucherData.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 italic text-gray-400 dark:text-gray-500">
                      No matching double-entry cash flow vouchers found inside this date block constraint.
                    </td>
                  </tr>
                ) : (
                  voucherData.map((v, index) => {
                    const isDisbursement = v.voucher_type?.includes('Payment');
                    return (
                      <tr key={v.id} className="border-b font-semibold border-stroke dark:border-strokedark text-black dark:text-white hover:bg-slate-50/50 dark:hover:bg-meta-4/5 text-xs">
                        <td className="p-3 text-gray-400">{index + 1}</td>
                        <td className="p-3 font-mono font-black text-primary">{v.voucher_no}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-400">{v.voucher_date || '-'}</td>
                        <td className="p-3 text-gray-500 max-w-xs truncate">{v.narration || v.notes || '-'}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${isDisbursement ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' : 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30'}`}>
                            {v.voucher_type || 'Journal Entry'}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-mono font-black pr-6 ${isDisbursement ? 'text-danger' : 'text-success'}`}>
                          {isDisbursement ? '-' : '+'} Rs. {Number(v.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountReport;
