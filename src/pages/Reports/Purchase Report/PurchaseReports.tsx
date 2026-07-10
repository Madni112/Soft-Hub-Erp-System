import React, { useState, useEffect } from 'react';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdLocalMall, MdFilterList } from 'react-icons/md';

const PurchaseReport = () => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<any[]>([]);
  const [vendorsList, setVendorsList] = useState<string[]>([]);

  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [selectedVendor, setSelectedVendor] = useState('');

  useEffect(() => {
    const fetchPurchaseReportData = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('supplier_purchases')
          .select('*')
          .order('purchase_date', { ascending: false });

        if (error) throw error;
        const pList = data || [];
        setPurchases(pList);

        const isolatedVendors = Array.from(new Set(pList.map((p: any) => p.supplier_name).filter(Boolean))) as string[];
        setVendorsList(isolatedVendors);
      } catch (err: any) {
        toast.error('Procurement history unreadable: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPurchaseReportData();
  }, []);

  const filteredPurchases = purchases.filter(p => {
    const pDate = p.purchase_date || p.created_at?.split('T')[0];
    const matchesDate = pDate >= dateFrom && pDate <= dateTo;
    const matchesVendor = selectedVendor ? p.supplier_name === selectedVendor : true;
    return matchesDate && matchesVendor;
  });

  const totalProcurementExpensesSum = filteredPurchases.reduce((sum, curr) => sum + (Number(curr.total_amount) || 0), 0);
  const totalUpfrontPaidSum = filteredPurchases.reduce((sum, curr) => sum + (Number(curr.amount_paid) || 0), 0);
  const totalVendorCreditDebtSum = Math.max(0, totalProcurementExpensesSum - totalUpfrontPaidSum);
  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-black dark:text-bodydark text-xs">
      <div>
        <h2 className="text-xl font-bold text-black dark:text-white">Wholesale Procurement Expense Report</h2>
        <p className="text-xs text-gray-400">Trace batch influx expenditures, cash outlays and credit line debt records</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div><span className="text-gray-400 font-bold block uppercase text-[10px]">Total Buy Costs</span><b className="text-primary text-base font-black font-mono">Rs. {totalProcurementExpensesSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
          <div className="p-2.5 bg-primary/10 rounded text-primary"><MdLocalMall size={20} /></div>
        </div>
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div><span className="text-gray-400 font-bold block uppercase text-[10px]">Liquid Advances Disbursed</span><b className="text-success text-base font-black font-mono">Rs. {totalUpfrontPaidSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
          <div className="p-2.5 bg-success/10 rounded text-success"><MdLocalMall size={20} /></div>
        </div>
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div><span className="text-gray-400 font-bold block uppercase text-[10px]">Net Credit Debt Created</span><b className="text-danger text-base font-black font-mono">Rs. {totalVendorCreditDebtSum.toLocaleString(undefined, { minimumFractionDigits: 2 })}</b></div>
          <div className="p-2.5 bg-danger/10 rounded text-danger"><MdLocalMall size={20} /></div>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 pb-4 border-b border-stroke dark:border-strokedark">
          <div>
            <label className="block text-gray-500 font-bold mb-1">Date From:</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent text-xs font-bold outline-none text-black dark:text-white" />
          </div>
          <div>
            <label className="block text-gray-500 font-bold mb-1">Date To:</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent text-xs font-bold outline-none text-black dark:text-white" />
          </div>
          <div>
            <label className="block text-gray-500 font-bold mb-1">Filter Wholesale Merchant Vendor:</label>
            <select value={selectedVendor} onChange={(e) => setSelectedVendor(e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent text-xs font-bold outline-none text-black dark:text-white">
              <option value="">-- All Vendors --</option>
              {vendorsList.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center"><Spinner /></div>
        ) : filteredPurchases.length === 0 ? (
          <p className="text-center py-8 italic text-gray-400">No consignment rows recorded within these matrix parameter boundaries.</p>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto border-collapse text-left">
              <thead>
                <tr className="bg-gray-2 dark:bg-meta-4 font-bold border-b border-stroke text-black dark:text-white text-[10px] uppercase tracking-wider">
                  <th className="p-3 w-16">S#</th>
                  <th className="p-3">Purchase No #</th>
                  <th className="p-3">Vendor Merchant Profile</th>
                  <th className="p-3">Receiving Storage Bin</th>
                  <th className="p-3 text-center">Payment Term Group</th>
                  <th className="p-3 text-right pr-6">Consignment Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredPurchases.map((p, idx) => (
                  <tr key={p.id} className="border-b font-semibold border-stroke dark:border-strokedark text-black dark:text-white hover:bg-slate-50/40">
                    <td className="p-3 text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-mono font-black text-primary">{p.purchase_no}</td>
                    <td className="p-3 whitespace-nowrap">{p.supplier_name}</td>
                    <td className="p-3 text-gray-400 uppercase font-black tracking-wide">{p.target_warehouse}</td>
                    <td className="p-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${p.payment_term === 'On Credit' ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{p.payment_term}</span></td>
                    <td className="p-3 text-right font-mono font-black text-success pr-6">Rs. {Number(p.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default PurchaseReport;
