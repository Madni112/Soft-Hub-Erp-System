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

  // Tracks which specific invoice row action box dropdown is open
  const [openActionId, setOpenActionId] = useState<any | null>(null);

  // Datatable pagination size attributes
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Closes any active floating menu layer if clicking somewhere else on screen
  useEffect(() => {
    const handleOutsideClick = () => setOpenActionId(null);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestAddRow = async () => {
    try {
      const testPayload = {
        customer_name: "Star Super Mart Test",
        sale_status: "Draft",
        payment_term: "On Credit",
        scenario_type: "Goods at Standard Rate to Registered Buyers",
        salesman: "Madni",
        wh_tax_percentage: 2,
        selected_bank: "Meezan Bank",
        bank_amount: 0,
        total_amount: 95.20,
        items: [
          {
            itemName: "Test Commercial Item Pack",
            location: "Main Warehouse A",
            rp: 100,
            extraDiscPer: 20,
            mrp: 50,
            qty: 1,
            gstRate: 18,
            fTaxPer: 0
          }
        ]
      };

      const { data, error } = await supabase
        .from('sales_invoices')
        .insert([testPayload])
        .select();

      if (error) throw error;
      toast.success('Test row injected successfully into Supabase!');
      fetchInvoices();
    } catch (err: any) {
      toast.error('SQL Insertion Failure: ' + err.message);
    }
  };

  const handleSync = async (invoice: any) => {
    setSyncingId(invoice.id);
    try {
      const fakeFiscalNumber = `FBR-${Math.floor(100000 + Math.random() * 900000)}`;

      const { error } = await supabase
        .from('sales_invoices')
        .update({
          fbr_fiscal_number: fakeFiscalNumber,
          fbr_qr_code: "fbr.gov.pk"
        })
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
      const { error } = await supabase
        .from('sales_invoices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Invoice deleted successfully.');
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.message);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, pageSize]);

  return (
    <div className="mx-auto max-w-7xl flex flex-col gap-6 relative">

      {/* HEADER ROW ACTIONS */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-black dark:text-white">Sales Log History</h2>

        <div className="flex items-center gap-3">
          <button
            onClick={handleTestAddRow}
            className="rounded bg-meta-3 py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition duration-150 shadow-sm"
          >
            🧪 Inject Test Row
          </button>
          <button
            onClick={() => navigate('/sales/add')}
            className="flex items-center justify-center rounded bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition duration-150 shadow-sm"
          >
            + Add New
          </button>
        </div>
      </div>

      {/* DATATABLE LIST CANVAS */}
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">

        {/* Dropdown Filters Panel Line */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Show</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-stroke py-1 px-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-sm font-medium text-black dark:text-white"
            >
              {[10, 20, 50].map((size) => (
                <option key={size} value={size} className="dark:bg-boxdark">{size}</option>
              ))}
            </select>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2 text-sm w-full sm:w-auto text-gray-500 dark:text-gray-400">
            <span>Search:</span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search invoices..."
              className="w-full sm:w-64 rounded border border-stroke py-1.5 px-3 bg-transparent dark:border-strokedark outline-none focus:border-primary text-sm text-black dark:text-white"
            />
          </div>
        </div>

        {/* FIXED: Changed to overflow-x-auto overflow-y-visible and added pb-28 padding room */}
        <div className="max-w-full overflow-x-auto overflow-y-visible pb-28">
          <table className="w-full table-auto border-collapse overflow-visible">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4 text-xs font-bold uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                <th className="py-4 px-4 font-semibold text-sm w-24">Invoice No</th>
                <th className="py-4 px-4 font-semibold text-sm w-20">Dc No</th>
                <th className="py-4 px-4 font-semibold text-sm">Sale Date</th>
                <th className="py-4 px-4 font-semibold text-sm w-28">Sale Type</th>
                <th className="py-4 px-4 font-semibold text-sm">Salesman</th>
                <th className="py-4 px-4 font-semibold text-sm">Customer</th>
                <th className="py-4 px-4 font-semibold text-sm w-32">Recipt Status</th>
                <th className="py-4 px-4 font-semibold text-sm">FBR Invocie No</th>
                <th className="py-4 px-4 font-semibold text-sm text-right">Total Amount</th>
                <th className="py-4 px-4 font-semibold text-sm w-24 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-sm">
                    <div className="flex justify-center items-center"><Spinner /></div>
                  </td>
                </tr>
              ) : paginatedInvoices.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">
                    No records located.
                  </td>
                </tr>
              ) : (
                paginatedInvoices.map((inv) => {
                  return (
                    <tr key={inv.id} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150 text-sm overflow-visible">
                      <td className="py-3.5 px-4 text-black dark:text-white font-medium">
                        {inv.id}
                      </td>
                      <td className="py-3.5 px-4 text-gray-500">
                        {inv.dc_no || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        {inv.sale_date ? inv.sale_date : new Date(inv.created_at).toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex rounded-sm py-0.5 px-2 text-xs font-bold text-white uppercase tracking-wide
                          ${inv.payment_term === 'Cash' ? 'bg-success' : 'bg-danger'}`}>
                          {inv.payment_term === 'Cash' ? 'Cash' : 'On Credit'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
                        {inv.salesman || 'General'}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-black dark:text-white whitespace-nowrap">
                        {inv.customer_name}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`text-xs font-semibold uppercase ${inv.receipt_status === 'Paid' ? 'text-success' : 'text-danger'}`}>
                          {inv.receipt_status || 'Unpaid'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`font-medium ${inv.fbr_fiscal_number ? 'text-success' : 'text-danger'}`}>
                          {inv.fbr_fiscal_number || 'Unposted'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-black dark:text-white">
                        {Number(inv.total_amount || 0).toFixed(2)}
                      </td>

                      {/* SAFELY REMOVED THE LENGTH RESTRAINT FOR PERFECT UPWARD AUTOMATION */}
                      <td className="py-3.5 px-4 text-center overflow-visible">
                        <div className="relative inline-block text-left overflow-visible">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenActionId(openActionId === inv.id ? null : inv.id);
                            }}
                            className="border border-stroke dark:border-strokedark rounded px-2.5 py-0.5 text-primary bg-slate-50 dark:bg-meta-4 hover:bg-slate-100 transition font-bold tracking-widest"
                          >
                            ...
                          </button>

                          {openActionId === inv.id && (
                            <div
                              /* FIXED: Opens upward if current row is any of the last 2 items, even if total length is short */
                              className={`absolute right-0 z-99999 w-44 rounded border border-stroke bg-white py-1 shadow-2xl dark:border-strokedark dark:bg-boxdark text-left
          ${paginatedInvoices.indexOf(inv) >= paginatedInvoices.length - 2 && paginatedInvoices.length > 1
                                  ? 'bottom-full mb-1'
                                  : 'top-full mt-1'
                                }`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ul className="flex flex-col text-xs font-medium text-gray-700 dark:text-gray-300">
                                <li>
                                  <button
                                    onClick={() => {
                                      setOpenActionId(null);
                                      navigate(`/sales/return/${inv.id}`);
                                    }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-left border-b border-stroke dark:border-strokedark text-blue-500"
                                  >
                                    <FiRotateCcw size={14} className="shrink-0" /> Sale Return
                                  </button>
                                </li>

                                <li>
                                  <button
                                    disabled={!!inv.fbr_fiscal_number}
                                    onClick={() => {
                                      setOpenActionId(null);
                                      navigate(`/sales/edit/${inv.id}`);
                                    }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-left text-yellow-600 disabled:opacity-30 disabled:hover:bg-transparent"
                                  >
                                    <FiEdit size={14} className="shrink-0" /> Edit Record
                                  </button>
                                </li>

                                {!inv.fbr_fiscal_number && (
                                  <li>
                                    <button
                                      disabled={syncingId === inv.id}
                                      onClick={() => {
                                        setOpenActionId(null);
                                        handleSync(inv);
                                      }}
                                      className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-left text-primary font-semibold"
                                    >
                                      <FiSend size={14} className="shrink-0" /> Post to FBR
                                    </button>
                                  </li>
                                )}

                                <li>
                                  <button
                                    disabled={!!inv.fbr_fiscal_number}
                                    onClick={() => {
                                      setOpenActionId(null);
                                      handleDeleteInvoice(inv.id);
                                    }}
                                    className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-left text-danger disabled:opacity-30 disabled:hover:bg-transparent border-t border-stroke dark:border-strokedark mt-1 pt-1.5"
                                  >
                                    <FiTrash2 size={14} className="shrink-0" /> Delete Record
                                  </button>
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </td>


                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* BOTTOM METRIC SUMMARY LINES COUNTER FOOTER */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-stroke dark:border-strokedark">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
                className="px-3 py-1.5 rounded text-xs font-medium border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition disabled:opacity-30"
              >
                Previous
              </button>

              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1.5 rounded text-xs border transition ${currentPage === i + 1
                      ? 'bg-primary text-white border-primary'
                      : 'border-stroke dark:border-strokedark text-gray-500 hover:bg-gray-50'
                    }`}
                >
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
                className="px-3 py-1.5 rounded text-xs font-medium border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition disabled:opacity-30"
              >
                Next
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SalesHistory;



// import React, { useEffect, useState } from 'react';
// import { supabase } from '../../Context/supabaseClient'; 
// import { toast } from 'react-hot-toast'; 
// import Spinner from '../../ui/Spinner'; 
// import { useNavigate } from 'react-router-dom';
// import { FiRotateCcw, FiEdit, FiSend, FiTrash2 } from 'react-icons/fi';

// const SalesHistory = () => {
//   const navigate = useNavigate();
//   const [invoices, setInvoices] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [syncingId, setSyncingId] = useState<string | null>(null);

//   // Tracks which specific invoice row action box dropdown is open
//   const [openActionId, setOpenActionId] = useState<any | null>(null);

//   // Datatable pagination size attributes
//   const [pageSize, setPageSize] = useState(10);
//   const [currentPage, setCurrentPage] = useState(1);

//   useEffect(() => {
//     fetchInvoices();
//   }, []);

//   // Closes any active floating menu layer if clicking somewhere else on screen
//   useEffect(() => {
//     const handleOutsideClick = () => setOpenActionId(null);
//     window.addEventListener('click', handleOutsideClick);
//     return () => window.removeEventListener('click', handleOutsideClick);
//   }, []);

//   const fetchInvoices = async () => {
//     try {
//       setLoading(true);
//       const { data, error } = await supabase
//         .from('sales_invoices')
//         .select('*')
//         .order('created_at', { ascending: false });

//       if (error) throw error;
//       setInvoices(data || []);
//     } catch (err: any) {
//       toast.error(err.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   const handleSync = async (invoice: any) => {
//     setSyncingId(invoice.id);
//     try {
//       const fakeFiscalNumber = `FBR-${Math.floor(100000 + Math.random() * 900000)}`;
      
//       const { error } = await supabase
//         .from('sales_invoices')
//         .update({ 
//           fbr_fiscal_number: fakeFiscalNumber, 
//           fbr_qr_code: "fbr.gov.pk" 
//         })
//         .eq('id', invoice.id);

//       if (error) throw error;
//       toast.success('FBR Synced Successfully!');
//       fetchInvoices();
//     } catch (err: any) {
//       toast.error(err.message);
//     } finally {
//       setSyncingId(null);
//     }
//   };

//   const handleDeleteInvoice = async (id: string | number) => {
//     if (!window.confirm('Are you certain you want to permanently delete this invoice record?')) return;
    
//     try {
//       const { error } = await supabase
//         .from('sales_invoices')
//         .delete()
//         .eq('id', id);

//       if (error) throw error;
//       toast.success('Invoice deleted successfully.');
//       fetchInvoices();
//     } catch (err: any) {
//       toast.error(err.message);
//     }
//   };

//   const filteredInvoices = invoices.filter(inv => 
//     inv.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
//     inv.id.toString().includes(searchTerm)
//   );

//   const totalEntries = filteredInvoices.length;
//   const totalPages = Math.ceil(totalEntries / pageSize);
//   const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
//   const endIndex = Math.min(startIndex + pageSize, totalEntries);
//   const paginatedInvoices = filteredInvoices.slice(startIndex, startIndex + pageSize);

//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, pageSize]);

//   return (
//     <div className="mx-auto max-w-7xl flex flex-col gap-6 relative">
      
//       {/* HEADER ROW ACTIONS */}
//       <div className="flex items-center justify-between">
//         <h2 className="text-xl font-bold text-black dark:text-white">Sales Log History</h2>
        
//         <button
//           onClick={() => navigate('/sales/add')} 
//           className="flex items-center justify-center rounded bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition duration-150 shadow-sm"
//         >
//           + Add New
//         </button>
//       </div>

//       {/* DATATABLE LIST CANVAS */}
//       <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
        
//         {/* Dropdown Filters Panel Line */}
//         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
//           <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
//             <span>Show</span>
//             <select
//               value={pageSize}
//               onChange={(e) => setPageSize(Number(e.target.value))}
//               className="rounded border border-stroke py-1 px-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-sm font-medium text-black dark:text-white"
//             >
//               {[10, 25, 50, 100].map((size) => (
//                 <option key={size} value={size} className="dark:bg-boxdark">{size}</option>
//               ))}
//             </select>
//             <span>entries</span>
//           </div>

//           <div className="flex items-center gap-2 text-sm w-full sm:w-auto text-gray-500 dark:text-gray-400">
//             <span>Search:</span>
//             <input
//               type="text"
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               placeholder="Search invoices..."
//               className="w-full sm:w-64 rounded border border-stroke py-1.5 px-3 bg-transparent dark:border-strokedark outline-none focus:border-primary text-sm text-black dark:text-white"
//             />
//           </div>
//         </div>

//         {/* Responsive Table Framework Wrapper */}
//         <div className="max-w-full overflow-x-auto overflow-y-visible pb-28">
//           <table className="w-full table-auto border-collapse overflow-visible">
//             <thead>
//               <tr className="bg-gray-2 text-left dark:bg-meta-4 text-xs font-bold uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
//                 <th className="py-4 px-4 font-semibold text-sm w-24">Invoice No</th>
//                 <th className="py-4 px-4 font-semibold text-sm w-20">Dc No</th>
//                 <th className="py-4 px-4 font-semibold text-sm">Sale Date</th>
//                 <th className="py-4 px-4 font-semibold text-sm w-28">Sale Type</th>
//                 <th className="py-4 px-4 font-semibold text-sm">Salesman</th>
//                 <th className="py-4 px-4 font-semibold text-sm">Customer</th>
//                 <th className="py-4 px-4 font-semibold text-sm w-32">Recipt Status</th>
//                 <th className="py-4 px-4 font-semibold text-sm">FBR Invocie No</th>
//                 <th className="py-4 px-4 font-semibold text-sm text-right">Total Amount</th>
//                 <th className="py-4 px-4 font-semibold text-sm w-24 text-center">Action</th>
//               </tr>
//             </thead>
//             <tbody>
//               {loading ? (
//                 <tr>
//                   <td colSpan={10} className="text-center py-12 text-sm">
//                     <div className="flex justify-center items-center"><Spinner /></div>
//                   </td>
//                 </tr>
//               ) : paginatedInvoices.length === 0 ? (
//                 <tr>
//                   <td colSpan={10} className="text-center py-10 text-sm text-gray-500 dark:text-gray-400">
//                     No records located.
//                   </td>
//                 </tr>
//               ) : (
//                 paginatedInvoices.map((inv) => {
//                   return (
//                     <tr key={inv.id} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150 text-sm overflow-visible">
//                       <td className="py-3.5 px-4 text-black dark:text-white font-medium">
//                         {inv.id}
//                       </td>
//                       <td className="py-3.5 px-4 text-gray-500">
//                         {inv.dc_no || '-'}
//                       </td>
//                       <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 whitespace-nowrap">
//                         {inv.sale_date ? inv.sale_date : new Date(inv.created_at).toLocaleString()}
//                       </td>
//                       <td className="py-3.5 px-4">
//                         <span className={`inline-flex rounded-sm py-0.5 px-2 text-xs font-bold text-white uppercase tracking-wide
//                           ${inv.payment_term === 'Cash' ? 'bg-success' : 'bg-danger'}`}>
//                           {inv.payment_term === 'Cash' ? 'Cash' : 'On Credit'}
//                         </span>
//                       </td>
//                       <td className="py-3.5 px-4 text-gray-700 dark:text-gray-300">
//                         {inv.salesman || 'General'}
//                       </td>
//                       <td className="py-3.5 px-4 font-medium text-black dark:text-white whitespace-nowrap">
//                         {inv.customer_name}
//                       </td>
//                       <td className="py-3.5 px-4">
//                         <span className={`text-xs font-semibold uppercase ${inv.receipt_status === 'Paid' ? 'text-success' : 'text-danger'}`}>
//                           {inv.receipt_status || 'Unpaid'}
//                         </span>
//                       </td>
//                       <td className="py-3.5 px-4">
//                         <span className={`font-medium ${inv.fbr_fiscal_number ? 'text-success' : 'text-danger'}`}>
//                           {inv.fbr_fiscal_number || 'Unposted'}
//                         </span>
//                       </td>
//                       <td className="py-3.5 px-4 text-right font-bold text-black dark:text-white">
//                         {Number(inv.total_amount || 0).toFixed(2)}
//                       </td>
                      
//                       {/* ACTION CELL SELECTION WRAPPER WITH IMPROVED DIRECTIONAL OVERFLOW GUARD */}
//                       <td className="py-3.5 px-4 text-center overflow-visible">
//                         <div className="relative inline-block text-left overflow-visible">
//                           <button
//                             onClick={(e) => {
//                               e.stopPropagation(); 
//                               setOpenActionId(openActionId === inv.id ? null : inv.id);
//                             }}
//                             className="border border-stroke dark:border-strokedark rounded px-2.5 py-0.5 text-primary bg-slate-50 dark:bg-meta-4 hover:bg-slate-100 transition font-bold tracking-widest"
//                           >
//                             ...
//                           </button>

//                           {openActionId === inv.id && (
//                             <div 
//                               className={`absolute right-0 z-99999 w-44 rounded border border-stroke bg-white py-1 shadow-2xl dark:border-strokedark dark:bg-boxdark text-left
//                                 ${paginatedInvoices.indexOf(inv) >= paginatedInvoices.length - 2 && paginatedInvoices.length > 1
//                                   ? 'bottom-full mb-1' 
//                                   : 'top-full mt-1'
//                                 }`}
//                               onClick={(e) => e.stopPropagation()} 
//                             >
//                               <ul className="flex flex-col text-xs font-medium text-gray-700 dark:text-gray-300">
                                
//                                 <li>
//                                   <button
//                                     onClick={() => {
//                                       setOpenActionId(null);
//                                       navigate(`/sales/return/${inv.id}`);
//                                     }}
//                                     className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-left border-b border-stroke dark:border-strokedark text-blue-500"
//                                   >
//                                     <FiRotateCcw size={14} className="shrink-0" /> Sale Return
//                                   </button>
//                                 </li>

//                                 <li>
//                                   <button
//                                     disabled={!!inv.fbr_fiscal_number}
//                                     onClick={() => {
//                                       setOpenActionId(null);
//                                       navigate(`/sales/edit/${inv.id}`);
//                                     }}
//                                     className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-left text-yellow-600 disabled:opacity-30 disabled:hover:bg-transparent"
//                                   >
//                                     <FiEdit size={14} className="shrink-0" /> Edit Record
//                                   </button>
//                                 </li>

//                                 {!inv.fbr_fiscal_number && (
//                                   <li>
//                                     <button
//                                       disabled={syncingId === inv.id}
//                                       onClick={() => {
//                                         setOpenActionId(null);
//                                         handleSync(inv);
//                                       }}
//                                       className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-left text-primary font-semibold"
//                                     >
//                                       <FiSend size={14} className="shrink-0" /> Post to FBR
//                                     </button>
//                                   </li>
//                                 )}

//                                 <li>
//                                   <button
//                                     disabled={!!inv.fbr_fiscal_number}
//                                     onClick={() => {
//                                       setOpenActionId(null);
//                                       handleDeleteInvoice(inv.id);
//                                     }}
//                                     className="flex items-center gap-2.5 w-full px-4 py-2 hover:bg-gray-100 dark:hover:bg-meta-4 transition text-left text-danger disabled:opacity-30 disabled:hover:bg-transparent border-t border-stroke dark:border-strokedark mt-1 pt-1.5"
//                                   >
//                                     <FiTrash2 size={14} className="shrink-0" /> Delete Record
//                                   </button>
//                                 </li>

//                               </ul>
//                             </div>
//                           )}
//                         </div>
//                       </td>

//                     </tr>
//                   );
//                 })
//               )}
//             </tbody>
//           </table>
//         </div>

//         {/* BOTTOM METRIC SUMMARY LINES COUNTER FOOTER */}
//         <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-stroke dark:border-strokedark">
//           <div className="text-sm text-gray-500 dark:text-gray-400">
//             Showing {startIndex + 1} to {endIndex} of {totalEntries} entries
//           </div>

//           {totalPages > 1 && (
//             <div className="flex items-center gap-1">
//               <button
//                 disabled={currentPage === 1}
//                 onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
//                 className="px-3 py-1.5 rounded text-xs font-medium border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition disabled:opacity-30"
//               >
//                 Previous
//               </button>
              
//               {Array.from({ length: totalPages }, (_, i) => (
//                 <button
//                   key={i + 1}
//                   onClick={() => setCurrentPage(i + 1)}
//                   className={`px-3 py-1.5 rounded text-xs border transition ${
//                     currentPage === i + 1
//                       ? 'bg-primary text-white border-primary'
//                       : 'border-stroke dark:border-strokedark text-gray-500 hover:bg-gray-50'
//                   }`}
//                 >
//                   {i + 1}
//                 </button>
//               ))}

//               <button
//                 disabled={currentPage === totalPages}
//                 onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
//                 className="px-3 py-1.5 rounded text-xs font-medium border border-stroke dark:border-strokedark hover:bg-gray-100 dark:hover:bg-meta-4 transition disabled:opacity-30"
//               >
//                 Next
//               </button>
//             </div>
//           )}
//         </div>

//       </div>
//     </div>
//   );
// };

// export default SalesHistory;
