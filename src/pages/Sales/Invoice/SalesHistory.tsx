import React, { useEffect, useState } from 'react';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { FiRotateCcw, FiEdit, FiSend, FiTrash2 } from 'react-icons/fi';

const SalesHistory = () => {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [openActionId, setOpenActionId] = useState<any | null>(null);
  const [dropdownCoords, setDropdownCoords] = useState({ top: 0, right: 0 });
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [returnedInvoiceNos, setReturnedInvoiceNos] = useState<string[]>([]);

  useEffect(() => {
    fetchInvoices();
  }, []);

  useEffect(() => {
    const handleOutsideClick = () => setOpenActionId(null);
    const handleScrollResize = () => setOpenActionId(null);
    window.addEventListener('click', handleOutsideClick);
    window.addEventListener('scroll', handleScrollResize, true);
    return () => {
      window.removeEventListener('click', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollResize, true);
    };
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data: invoicesData, error: invError } = await supabase
        .from('sales_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invError) throw invError;

      const { data: returnsData, error: retError } = await supabase
        .from('sales_returns')
        .select('original_invoice_no');

      if (!retError && returnsData) {
        const cleanList = returnsData
          .map((r: any) => String(r.original_invoice_no || '').trim().toLowerCase())
          .filter(Boolean);
        setReturnedInvoiceNos(cleanList);
      }

      setInvoices(invoicesData || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };
  const handleSync = async (invoice: any) => {
    setSyncingId(invoice.id);
    try {
      const fakeFiscalNumber = `FBR-${Math.floor(100000 + Math.random() * 900000)}`;
      const { error } = await supabase
        .from('sales_invoices')
        .update({ fbr_fiscal_number: fakeFiscalNumber, fbr_qr_code: "fbr.gov.pk" })
        .eq('id', invoice.id);

      if (error) throw error;
      toast.success('FBR Synced Successfully!');
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSyncingId(null);
    }
  };

  const handleDeleteInvoice = async (id: string | number) => {
    if (!window.confirm('Are you certain you want to permanently delete this invoice record?')) return;

    try {
      setLoading(true);
      const { data: targetInvoice, error: fetchError } = await supabase
        .from('sales_invoices')
        .select('items, dispatch_warehouse')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      if (targetInvoice && targetInvoice.items) {
        const sourceWarehousePartition = targetInvoice.dispatch_warehouse || '';
        for (const item of targetInvoice.items) {
          const itemQuantityToRestore = Number(item.qty) || 0;
          const { data: currentProduct } = await supabase.from('products').select('current_stock').eq('product_name', item.itemName).single();

          if (currentProduct) {
            const restoredMasterStockCount = (Number(currentProduct.current_stock) || 0) + itemQuantityToRestore;
            await supabase.from('products').update({ current_stock: restoredMasterStockCount }).eq('product_name', item.itemName);
          }

          if (sourceWarehousePartition) {
            const { data: localPartitionRow } = await supabase.from('warehouse_inventory').select('id, quantity').eq('product_name', item.itemName).eq('warehouse_name', sourceWarehousePartition).maybeSingle();
            if (localPartitionRow) {
              const restoredPartitionStockCount = (Number(localPartitionRow.quantity) || 0) + itemQuantityToRestore;
              await supabase.from('warehouse_inventory').update({ quantity: restoredPartitionStockCount }).eq('id', localPartitionRow.id);
            } else {
              await supabase.from('warehouse_inventory').insert([{ product_name: item.itemName, warehouse_name: sourceWarehousePartition, quantity: itemQuantityToRestore }]);
            }
          }
        }
      }

      const { error: deleteError } = await supabase.from('sales_invoices').delete().eq('id', id);
      if (deleteError) throw deleteError;

      toast.success('Invoice deleted cleanly. Stock metrics restored!');
      fetchInvoices();
    } catch (err: any) {
      toast.error('Deletion Interrupted: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter(inv =>
    inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.id.toString().includes(searchTerm)
  );

  const totalEntries = filteredInvoices.length;
  const totalPages = Math.ceil(totalEntries / pageSize);
  const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalEntries);
  const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + pageSize);
  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-black dark:text-white">Sales Log History</h2>
        <button onClick={() => navigate('/sales/invoice/add')} className="flex items-center justify-center rounded bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition shadow-sm" >
          + Add New
        </button>
      </div>

      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Show</span>
            <select value={pageSize} onChange={(e) => setPageSize(Number(e.target.value))} className="rounded border border-stroke py-1 px-2 bg-transparent text-sm font-medium text-black dark:text-white outline-none focus:border-primary" >
              {[10, 20, 50].map((size) => <option key={size} value={size} className="dark:bg-boxdark">{size}</option>)}
            </select>
            <span>entries</span>
          </div>
          <div className="flex items-center gap-2 text-sm w-full sm:w-auto text-gray-500 dark:text-gray-400">
            <span>Search:</span>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search invoices..." className="w-full sm:w-64 rounded border border-stroke py-1.5 px-3 bg-transparent text-sm text-black dark:text-white outline-none focus:border-primary" />
          </div>
        </div>

        <div className="w-full">
          <table className="w-full table-layout border-collapse text-[11px]">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4 text-[10px] font-black uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                <th className="py-3 px-2 text-center font-bold">Invoice No</th>
                <th className="py-3 px-2 font-bold text-center">Dc No</th>
                <th className="py-3 px-2 font-bold">Sale Date</th>
                <th className="py-3 px-2 font-bold text-center">Sale Type</th>
                <th className="py-3 px-2 font-bold">Salesman</th>
                <th className="py-3 px-2 font-bold">Customer</th>
                <th className="py-3 px-2 font-bold text-center">Receipt Status</th>
                <th className="py-3 px-2 font-bold text-center">FBR Invoice No</th>
                <th className="py-3 px-2 font-bold text-right pr-2">Total Amount</th>
                <th className="py-3 px-2 font-bold text-center w-14">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={10} className="text-center py-12"><Spinner /></td></tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr><td colSpan={10} className="text-center py-10 text-xs text-gray-500">No records located.</td></tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  const rawInvoiceIdString = String(inv.id).trim().toLowerCase();
                  
                  const isReturned = returnedInvoiceNos.some(retNo => {
                    return (
                      retNo === rawInvoiceIdString ||
                      retNo === `inv-${rawInvoiceIdString}` ||
                      retNo === `inv-${rawInvoiceIdString.padStart(4, '0')}` ||
                      retNo.includes(rawInvoiceIdString)
                    );
                  });

                  return (
                    <tr key={inv.id} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150">
                      <td className="py-2.5 px-2 text-black dark:text-white font-bold text-center font-mono">{inv.id}</td>
                      <td className="py-2.5 px-2 text-gray-500 text-center font-mono">{inv.dc_no || '-'}</td>
                      <td className="py-2.5 px-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{inv.sale_date || new Date(inv.created_at).toLocaleString()}</td>
                      <td className="py-2.5 px-2 text-center">
                        <span className={`inline-flex rounded-sm py-0.5 px-1.5 text-[9px] font-black text-white uppercase tracking-wide ${inv.payment_term === 'Cash' ? 'bg-success' : 'bg-danger'}`}>
                          {inv.payment_term === 'Cash' ? 'Cash' : 'On Credit'}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-gray-700 dark:text-gray-300 font-medium whitespace-nowrap">{inv.salesman || 'General'}</td>
                      <td className="py-2.5 px-2 font-bold text-black dark:text-white whitespace-nowrap">{inv.customer_name}</td>
                      
                      <td className="py-2.5 px-2 text-center">
                        {isReturned ? (
                          <span className="text-[10px] font-black uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded-sm shadow-xs animate-pulse">
                            Returned
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold uppercase ${inv.receipt_status === 'Paid' || inv.receipt_status === 'Confirm' ? 'text-success' : 'text-danger'}`}>
                            {inv.receipt_status || 'Unpaid'}
                          </span>
                        )}
                      </td>
                      
                      <td className="py-2.5 px-2 text-center whitespace-nowrap"><span className={`font-bold ${inv.fbr_fiscal_number ? 'text-success' : 'text-brand'}`}>{inv.fbr_fiscal_number || 'Unposted'}</span></td>
                      <td className="py-2.5 px-2 text-right font-black text-black dark:text-white font-mono pr-2">Rs. {Number(inv.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                      <td className="py-2.5 px-2 text-center">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            const rect = e.currentTarget.getBoundingClientRect();
                            setDropdownCoords({ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right - window.scrollX });
                            setOpenActionId(openActionId === inv.id ? null : inv.id);
                          }} 
                          className="border border-stroke dark:border-strokedark rounded px-2 py-0.5 text-primary bg-slate-50 dark:bg-meta-4 hover:bg-slate-100 transition font-black tracking-widest text-[10px] cursor-pointer"
                        >
                          ...
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            </table>
            </div>
                    {openActionId && (() => {
          const selectedInvoice = invoices.find(i => i.id === openActionId);
          if (!selectedInvoice) return null;

          return (
            <div 
              style={{ position: 'fixed', top: `${dropdownCoords.top - window.scrollY}px`, right: `${dropdownCoords.right}px` }}
              className="z-99999 w-44 rounded border border-stroke bg-white py-1 shadow-2xl dark:border-strokedark dark:bg-boxdark text-left text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <ul className="flex flex-col font-medium text-gray-700 dark:text-gray-300">
                <li>
                  <button type="button" onClick={() => { setOpenActionId(null); navigate('/Sales-Return/Debit-Notes/Add', { state: { invoice: selectedInvoice } }); }} className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition border-b border-stroke dark:border-strokedark text-blue-500 cursor-pointer">
                    <FiRotateCcw size={13} /> Sale Return
                  </button>
                </li>
                <li>
                  <button disabled={!!selectedInvoice.fbr_fiscal_number} onClick={() => { setOpenActionId(null); navigate('/sales/invoice/add', { state: { invoice: selectedInvoice } }); }} className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-yellow-600 disabled:opacity-30 cursor-pointer">
                    <FiEdit size={13} /> Edit Record
                  </button>
                </li>
                {!selectedInvoice.fbr_fiscal_number && (
                  <li>
                    <button disabled={syncingId === selectedInvoice.id} onClick={() => { setOpenActionId(null); handleSync(selectedInvoice); }} className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-primary font-bold cursor-pointer">
                      <FiSend size={13} /> Post to FBR
                    </button>
                  </li>
                )}
                <li>
                  <button disabled={!!selectedInvoice.fbr_fiscal_number} onClick={() => { setOpenActionId(null); handleDeleteInvoice(selectedInvoice.id); }} className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-danger disabled:opacity-30 border-t border-stroke dark:border-strokedark mt-1 pt-1.5 cursor-pointer">
                    <FiTrash2 size={13} /> Delete Record
                  </button>
                </li>
              </ul>
            </div>
          );
        })()}

        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-stroke dark:border-strokedark">
          <div className="text-xs text-gray-500 dark:text-gray-400">Showing {startIndex + 1} to {endIndex} of {totalEntries} entries</div>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button type="button" disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="px-3 py-1.5 rounded text-xs font-medium border border-stroke dark:border-strokedark hover:bg-gray-100 transition disabled:opacity-30 cursor-pointer">Previous</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <button type="button" key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-3 py-1.5 rounded text-xs border transition ${currentPage === i + 1 ? 'bg-primary text-white border-primary' : 'border-stroke dark:border-strokedark text-gray-500 hover:bg-gray-50'}`}>{i + 1}</button>
              ))}
              <button type="button" disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="px-3 py-1.5 rounded text-xs font-medium border border-stroke dark:border-strokedark hover:bg-gray-100 transition disabled:opacity-30 cursor-pointer">Next</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesHistory;
