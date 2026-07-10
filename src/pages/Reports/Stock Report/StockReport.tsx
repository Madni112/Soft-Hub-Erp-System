import React, { useState, useEffect } from 'react';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdLayers, MdStore } from 'react-icons/md';

const StockReport = () => {
  const [loading, setLoading] = useState(true);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<string[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState('');
  const [searchQuery, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchStockReportDetails = async () => {
      try {
        setLoading(true);
        const { data: stock, error: sErr } = await supabase.from('warehouse_inventory').select('*');
        if (sErr) throw sErr;

        const sList = stock || [];
        setInventoryList(sList);

        const isolatedWarehouseBins = Array.from(new Set(sList.map((st: any) => st.warehouse_name).filter(Boolean))) as string[];
        setWarehouses(isolatedWarehouseBins);
      } catch (err: any) {
        toast.error('Inventory log block configuration breach: ' + err.message);
      } final: {
        setLoading(false);
      }
    };
    fetchStockReportDetails();
  }, []);

  const filteredInventoryItems = inventoryList.filter(st => {
    const matchesWarehouse = selectedWarehouse ? st.warehouse_name === selectedWarehouse : true;
    const matchesProductText = (st.product_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesWarehouse && matchesProductText;
  });

  const aggregateTotalPhysicalProductUnitsInWarehouse = filteredInventoryItems.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0);
  const isolatedActiveSkuCounterLinesUniqueCount = filteredInventoryItems.length;
  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 text-black dark:text-bodydark text-xs">
      <div>
        <h2 className="text-xl font-bold text-black dark:text-white">Warehouse Inventory Bin Valuation Report</h2>
        <p className="text-xs text-gray-400">View real-time storage allocations, product balances and specific warehouse stock metrics</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div><span className="text-gray-400 font-bold block uppercase text-[10px]">Net Available Storage Counts</span><b className="text-warning text-base font-black font-mono">{aggregateTotalPhysicalProductUnitsInWarehouse.toLocaleString()} Physical Units</b></div>
          <div className="p-2.5 bg-warning/10 rounded text-warning"><MdLayers size={20} /></div>
        </div>
        <div className="rounded-sm border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark flex items-center justify-between">
          <div><span className="text-gray-400 font-bold block uppercase text-[10px]">Active Tracked Item SKU Profiles</span><b className="text-blue-600 text-base font-black font-mono">{isolatedActiveSkuCounterLinesUniqueCount.toLocaleString()} Unique Lines</b></div>
          <div className="p-2.5 bg-blue-50 dark:bg-meta-4 rounded text-blue-600"><MdStore size={20} /></div>
        </div>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 pb-4 border-b border-stroke dark:border-strokedark">
          <div>
            <label className="block text-gray-500 font-bold mb-1">Isolate Storage Receiving Warehouse Partition:</label>
            <select value={selectedWarehouse} onChange={(e) => setSelectedWarehouse(e.target.value)} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent text-xs font-bold outline-none text-black dark:text-white">
              <option value="">-- All Warehouses Across System --</option>
              {warehouses.map(w => <option key={w} value={w}>{w}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-gray-500 font-bold mb-1">Filter Item Catalog Search Query Name:</label>
            <input type="text" value={searchQuery} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Type product SKU code description nomenclature..." className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent text-xs font-semibold outline-none focus:border-primary text-black dark:text-white" />
          </div>
        </div>

        {loading ? (
          <div className="flex h-32 items-center justify-center"><Spinner /></div>
        ) : filteredInventoryItems.length === 0 ? (
          <p className="text-center py-8 italic text-gray-400">No stock levels tracked within these parameters configuration matrices.</p>
        ) : (
          <div className="max-w-full overflow-x-auto">
            <table className="w-full table-auto border-collapse text-left">
              <thead>
                <tr className="bg-gray-2 dark:bg-meta-4 font-bold border-b border-stroke text-black dark:text-white text-[10px] uppercase tracking-wider">
                  <th className="p-3 w-16">S#</th>
                  <th className="p-3">Product Catalog Item Designation SKU</th>
                  <th className="p-3">Storage Allocation Bin</th>
                  <th className="p-3 text-center pr-6">Available Stock Count Balance</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventoryItems.map((st, idx) => (
                  <tr key={st.id} className="border-b font-semibold border-stroke dark:border-strokedark text-black dark:text-white hover:bg-slate-50/40">
                    <td className="p-3 text-gray-400">{idx + 1}</td>
                    <td className="p-3 font-bold text-black dark:text-white">{st.product_name}</td>
                    <td className="p-3"><span className="bg-blue-50 dark:bg-meta-4 text-primary dark:text-white px-2.5 py-0.5 rounded-sm uppercase text-[10px] font-black tracking-wide inline-flex items-center">{st.warehouse_name}</span></td>
                    <td className="p-3 text-center font-mono font-black text-warning pr-6">{Number(st.quantity || 0).toLocaleString()} Units</td>
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

export default StockReport;
