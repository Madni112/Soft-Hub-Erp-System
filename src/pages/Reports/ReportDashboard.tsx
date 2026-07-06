import React, { useState, useEffect } from 'react';
import { supabase } from '../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../ui/Spinner';
import { MdTrendingUp, MdLocalMall, MdLayers, MdAccountBalanceWallet } from 'react-icons/md';

const ReportDashboard = () => {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase' | 'stock' | 'accounts'>('sales');
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchaseData, setPurchaseData] = useState<any[]>([]);
  const [stockData, setStockData] = useState<any[]>([]);
  const [voucherData, setVoucherData] = useState<any[]>([]);

  const [summary, setSummary] = useState({ grossSales: 0, grossPurchases: 0, itemsInStock: 0, financialNetWorth: 0 });

  const fetchSystemReports = async () => {
    try {
      setLoading(true);
      const { data: sales, error: sErr } = await supabase.from('sales_invoices').select('*');
      const { data: purchases, error: pErr } = await supabase.from('supplier_purchases').select('*');
      const { data: stock, error: iErr } = await supabase.from('warehouse_inventory').select('*');
      const { data: vouchers, error: vErr } = await supabase.from('financial_vouchers').select('*');

      if (sErr || pErr || iErr || vErr) throw new Error('Failed to download system ledgers data pool partitions');

      setSalesData(sales || []);
      setPurchaseData(purchases || []);
      setStockData(stock || []);
      setVoucherData(vouchers || []);

      let totalSalesSum = 0;
      sales?.forEach(s => totalSalesSum += Number(s.total_amount || 0));

      let totalPurSum = 0;
      purchases?.forEach(p => totalPurSum += Number(p.total_amount || 0));

      let totalStockUnits = 0;
      stock?.forEach(st => totalStockUnits += Number(st.quantity || 0));

      let totalLiquidAssets = 0;
      vouchers?.forEach(v => {
        if (v.voucher_type?.includes('Receipt')) totalLiquidAssets += Number(v.total_amount || 0);
        if (v.voucher_type?.includes('Payment')) totalLiquidAssets -= Number(v.total_amount || 0);
      });

      setSummary({
        grossSales: totalSalesSum,
        grossPurchases: totalPurSum,
        itemsInStock: totalStockUnits,
        financialNetWorth: totalLiquidAssets
      });
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemReports();
  }, []);
  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative text-black dark:text-bodydark text-xs">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-black dark:text-white">ERP Corporate Analytics Reporting Center</h2>
          <p className="text-xs text-gray-400">Generate, filter and inspect transactional audit sheets balances records</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div><span className="text-gray-400 font-bold block uppercase text-[10px]">Gross Sales Volume</span><b className="text-success text-base font-black font-mono">Rs. {summary.grossSales.toLocaleString()}</b></div>
          <div className="p-2.5 bg-success/10 rounded text-success"><MdTrendingUp size={22} /></div>
        </div>
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div><span className="text-gray-400 font-bold block uppercase text-[10px]">Procurement Expenses</span><b className="text-primary text-base font-black font-mono">Rs. {summary.grossPurchases.toLocaleString()}</b></div>
          <div className="p-2.5 bg-primary/10 rounded text-primary"><MdLocalMall size={22} /></div>
        </div>
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div><span className="text-gray-400 font-bold block uppercase text-[10px]">Warehouse Shelf Stocks</span><b className="text-warning text-base font-black font-mono">{summary.itemsInStock.toLocaleString()} Units</b></div>
          <div className="p-2.5 bg-warning/10 rounded text-warning"><MdLayers size={22} /></div>
        </div>
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div><span className="text-gray-400 font-bold block uppercase text-[10px]">Net Cash Drawer Liquidity</span><b className="text-purple-600 text-base font-black font-mono">Rs. {summary.financialNetWorth.toLocaleString()}</b></div>
          <div className="p-2.5 bg-purple-100 dark:bg-purple-950/20 rounded text-purple-600"><MdAccountBalanceWallet size={22} /></div>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 border-b border-stroke dark:border-strokedark pb-4">
          <div className="flex border border-stroke dark:border-strokedark rounded p-1 bg-gray-50 dark:bg-meta-4/20">
            {(['sales', 'purchase', 'stock', 'accounts'] as const).map((tab) => (
              <button key={tab} type="button" onClick={() => setActiveTab(tab)} className={`py-1.5 px-4 rounded text-xs font-bold uppercase transition tracking-wide cursor-pointer ${activeTab === tab ? 'bg-primary text-white shadow-sm' : 'text-gray-500 hover:text-black dark:hover:text-white'}`}>
                {tab} Report
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="border border-stroke dark:border-strokedark rounded p-1.5 bg-transparent font-bold outline-none text-black dark:text-white" />
            <span className="text-gray-400 font-bold">to</span>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="border border-stroke dark:border-strokedark rounded p-1.5 bg-transparent font-bold outline-none text-black dark:text-white" />
          </div>
        </div>
        {loading ? (
          <div className="flex h-48 items-center justify-center"><Spinner /></div>
        ) : (
          <div className="max-w-full overflow-x-auto">
            {activeTab === 'sales' && (
              <table className="w-full table-auto border-collapse text-left">
                <thead>
                  <tr className="bg-gray-100 dark:bg-meta-4 font-bold text-black dark:text-white border-b border-stroke uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-16">S#</th>
                    <th className="p-3">Invoice Code</th>
                    <th className="p-3">Client Customer</th>
                    <th className="p-3">Sale Type</th>
                    <th className="p-3 text-right pr-6">Gross Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {salesData.map((s, i) => (
                    <tr key={s.id} className="border-b font-semibold border-stroke dark:border-strokedark text-black dark:text-white hover:bg-slate-50/50">
                      <td className="p-3 text-gray-400">{i + 1}</td>
                      <td className="p-3 font-mono font-black text-primary">INV-{s.id}</td>
                      <td className="p-3">{s.customer_name}</td>
                      <td className="p-3 uppercase">{s.payment_term || 'Cash'}</td>
                      <td className="p-3 text-right font-mono font-black text-success pr-6">Rs. {Number(s.total_amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'purchase' && (
              <table className="w-full table-auto border-collapse text-left">
                <thead>
                  <tr className="bg-gray-100 dark:bg-meta-4 font-bold text-black dark:text-white border-b border-stroke uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-16">S#</th>
                    <th className="p-3">Purchase Code</th>
                    <th className="p-3">Supplier Merchant</th>
                    <th className="p-3">Warehouse Bin</th>
                    <th className="p-3 text-right pr-6">Bill payables</th>
                  </tr>
                </thead>
                <tbody>
                  {purchaseData.map((p, i) => (
                    <tr key={p.id} className="border-b font-semibold border-stroke dark:border-strokedark text-black dark:text-white hover:bg-slate-50/50">
                      <td className="p-3 text-gray-400">{i + 1}</td>
                      <td className="p-3 font-mono font-black text-primary">{p.purchase_no}</td>
                      <td className="p-3">{p.supplier_name}</td>
                      <td className="p-3 text-gray-400 uppercase font-bold">{p.target_warehouse}</td>
                      <td className="p-3 text-right font-mono font-black text-success pr-6">Rs. {Number(p.total_amount || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {activeTab === 'stock' && (
              <table className="w-full table-auto border-collapse text-left">
                <thead>
                  <tr className="bg-gray-100 dark:bg-meta-4 font-bold text-black dark:text-white border-b border-stroke uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-16">S#</th>
                    <th className="p-3">Product Name Item</th>
                    <th className="p-3">Assigned Location</th>
                    <th className="p-3 text-center">Available stock balance</th>
                  </tr>
                </thead>
                <tbody>
                  {stockData.map((st, i) => (
                    <tr key={st.id} className="border-b font-semibold border-stroke dark:border-strokedark text-black dark:text-white hover:bg-slate-50/50">
                      <td className="p-3 text-gray-400">{i + 1}</td>
                      <td className="p-3 font-bold text-black dark:text-white">{st.product_name}</td>
                      <td className="p-3"><span className="bg-blue-50 dark:bg-meta-4 text-primary dark:text-white px-2 py-0.5 rounded-sm uppercase text-[10px] font-black">{st.warehouse_name}</span></td>
                      <td className="p-3 text-center font-mono font-black text-warning">{Number(st.quantity || 0).toLocaleString()} Units</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {activeTab === 'accounts' && (
              <table className="w-full table-auto border-collapse text-left">
                <thead>
                  <tr className="bg-gray-100 dark:bg-meta-4 font-bold text-black dark:text-white border-b border-stroke uppercase tracking-wider text-[10px]">
                    <th className="p-3 w-16">S#</th>
                    <th className="p-3">Voucher Ref #</th>
                    <th className="p-3">Description Narrative</th>
                    <th className="p-3 text-center">Voucher Type</th>
                    <th className="p-3 text-right pr-6">Fund value</th>
                  </tr>
                </thead>
                <tbody>
                  {voucherData.map((v, i) => {
                    const isDisbursement = v.voucher_type?.includes('Payment');
                    return (
                      <tr key={v.id} className="border-b font-semibold border-stroke dark:border-strokedark text-black dark:text-white hover:bg-slate-50/50">
                        <td className="p-3 text-gray-400">{i + 1}</td>
                        <td className="p-3 font-mono font-black text-primary">{v.voucher_no}</td>
                        <td className="p-3 text-gray-500 max-w-xs truncate">{v.narration || v.notes}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${isDisbursement ? 'bg-red-50 text-red-600 border-red-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'}`}>
                            {v.voucher_type}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-mono font-black pr-6 ${isDisbursement ? 'text-danger' : 'text-success'}`}>
                          {isDisbursement ? '-' : '+'} Rs. {Number(v.total_amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportDashboard;
