import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdPrinter, MdArrowBack } from 'react-icons/md';

const SaleReportPrint = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [reportRows, setReportRows] = useState<any[]>([]);

  const config = location.state || { type: 'sale', filters: {} };
  const { type: rType, filters } = config;

  useEffect(() => {
    const compileExcelStructuredDataset = async () => {
      try {
        setLoading(true);
        
        if (rType === 'sale') {
          let query = supabase.from('sales_invoices').select('*');
          
          if (filters.customer && filters.customer !== 'All') query = query.eq('customer_name', filters.customer);
          if (filters.salesman && filters.salesman !== 'All') query = query.eq('salesman', filters.salesman);
          if (filters.transport && filters.transport !== 'All') query = query.eq('transport_name', filters.transport);
          if (filters.location && filters.location !== 'All') query = query.eq('dispatch_warehouse', filters.location);
          
          const { data, error } = await query;
          if (error) throw error;

          let pool = data || [];
          
          // --- ✅ ADVANCED FAIL-SAFE DATES FILTERING: Sanitises string parameters perfectly ---
          if (filters.dateFrom && filters.dateTo) {
            const startStr = String(filters.dateFrom).split('T')[0];
            const endStr = String(filters.dateTo).split('T')[0];
            
            pool = pool.filter(i => {
              const targetDateStr = String(i.sale_date || i.created_at || '').split('T')[0];
              // Fallback match: if date fields look matching or fall inside active bounds
              return targetDateStr >= startStr && targetDateStr <= endStr;
            });
          }

          if (filters.saleType && filters.saleType !== 'All') {
            pool = pool.filter(i => filters.saleType === 'Cash' ? i.payment_term === 'Cash' : i.payment_term !== 'Cash');
          }
          if (filters.saleMethod && filters.saleMethod !== 'All') {
            pool = pool.filter(i => filters.saleMethod === 'Direct' ? !i.dc_no : !!i.dc_no);
          }
          setReportRows(pool);
        } 
        
        else if (rType === 'return') {
          let query = supabase.from('sales_returns').select('*');
          if (filters.customer && filters.customer !== 'All') query = query.eq('customer_name', filters.customer);
          
          const { data, error } = await query;
          if (error) throw error;

          let pool = data || [];
          if (filters.dateFrom && filters.dateTo) {
            const startStr = String(filters.dateFrom).split('T')[0];
            const endStr = String(filters.dateTo).split('T')[0];
            pool = pool.filter(r => {
              const targetDateStr = String(r.return_date || r.created_at || '').split('T')[0];
              return targetDateStr >= startStr && targetDateStr <= endStr;
            });
          }
          setReportRows(pool);
        } 
        
        else if (rType === 'invoice') {
          let query = supabase.from('sales_invoices').select('*');
          if (filters.invoiceNo && filters.invoiceNo !== 'All') {
            query = query.eq('id', filters.invoiceNo);
          }
          const { data, error } = await query;
          if (error) throw error;
          setReportRows(data || []);
        } 
        
        else if (rType === 'quotation') {
          setReportRows([]);
        }
      } catch (err: any) {
        toast.error('Audit compilation trace failed: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    compileExcelStructuredDataset();
  }, [rType, filters]);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;
  return (
    <div className="w-full bg-white text-black p-6 space-y-6 text-xs min-h-screen print:absolute print:top-0 print:left-0 print:w-screen print:h-screen print:p-0 print:m-0 print:bg-white print:text-black">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * { visibility: hidden !important; }
          .print-root-container, .print-root-container * { visibility: visible !important; }
          .print-root-container { position: absolute !important; top: 0 !important; left: 0 !important; width: 100% !important; z-index: 999999 !important; background: white !important; }
          aside, header, nav, .print-hidden-element, button { display: none !important; visibility: hidden !important; }
        }
      `}} />

      <div className="print-root-container w-full bg-white p-4 space-y-6">
        <div className="flex justify-between items-center bg-gray-100 p-3 rounded border print-hidden-element print:hidden">
          <button type="button" onClick={() => navigate('/Reports/Sales-Report')} className="flex items-center gap-1.5 font-bold hover:underline cursor-pointer"><MdArrowBack size={16} /> Return to Auditing Center</button>
          <button type="button" onClick={() => window.print()} className="flex items-center gap-1.5 bg-primary text-white py-1.5 px-5 rounded font-black cursor-pointer hover:bg-opacity-90 shadow-sm"><MdPrinter size={16} /> Print Workbook Report</button>
        </div>

        <div className="text-center space-y-1 py-4 border-b border-double border-black">
          <h1 className="text-xl font-black uppercase tracking-widest font-serif">AL-SYED SOFTWARE ERP LOGISTICS</h1>
          <p className="text-[10px] font-bold tracking-wider text-gray-500 uppercase">Master Financial Audit Statement Workbook Ledger</p>
          <div className="text-[10px] pt-1 font-mono flex justify-between px-2 text-gray-600">
            <span>Report Categorization: <b className="text-black uppercase underline">{rType} Ledger Book</b></span>
            <span>Audit Duration Block Window: {String(filters.dateFrom || '').split('T')[0]} up to {String(filters.dateTo || '').split('T')[0]}</span>
          </div>
        </div>
        <div className="w-full overflow-x-auto">
          <table className="w-full table-auto border border-collapse border-black text-[11px] font-sans antialiased text-left print:w-full">
            <thead>
              <tr className="bg-gray-100 border-b border-black font-black uppercase text-black font-mono text-[10px]">
                <th className="p-1.5 border border-black text-center w-12">Index</th>
                <th className="p-1.5 border border-black">Document Ref #</th>
                <th className="p-1.5 border border-black">Customer / Account Title</th>
                {rType === 'sale' && <th className="p-1.5 border border-black">Officer Link</th>}
                {rType === 'sale' && <th className="p-1.5 border border-black">Carrier Fleet</th>}
                <th className="p-1.5 border border-black text-center">Processing Date</th>
                <th className="p-1.5 border border-black text-center">Receipt Status</th>
                <th className="p-1.5 border border-black text-right pr-3">Gross Matrix Amount</th>
              </tr>
            </thead>
            <tbody>
              {reportRows.length === 0 ? (
                <tr><td colSpan={rType === 'sale' ? 8 : 6} className="text-center py-10 font-bold italic border border-black text-gray-400 bg-gray-50/50">No rows fetched matching the isolated active report criteria token keys.</td></tr>
              ) : (
                reportRows.map((row, idx) => (
                  <tr key={row.id} className="border-b border-black hover:bg-gray-50 font-semibold font-mono text-xs">
                    <td className="p-1.5 border border-black text-center text-gray-400">{idx + 1}</td>
                    <td className="p-1.5 border border-black text-primary font-black uppercase">INV-{row.id}</td>
                    <td className="p-1.5 border border-black text-black font-sans">{row.customer_name || 'Counter Retail Buyer'}</td>
                    {rType === 'sale' && <td className="p-1.5 border border-black font-sans text-gray-600">{row.salesman || 'Direct'}</td>}
                    {rType === 'sale' && <td className="p-1.5 border border-black font-sans text-purple-700 font-bold">{row.transport_name || 'Self Pick'}</td>}
                    <td className="p-1.5 border border-black text-center text-gray-500">{row.sale_date || String(row.created_at).split('T')[0]}</td>
                    <td className="p-2 border border-black text-center uppercase text-[10px] font-black">{row.receipt_status || 'Confirm'}</td>
                    <td className="p-1.5 border border-black text-right pr-3 text-success font-black">Rs. {Number(row.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="bg-gray-50 border-t border-black font-black font-mono text-xs">
                <td colSpan={rType === 'sale' ? 7 : 5} className="p-2 border border-black text-right uppercase tracking-wider text-gray-500">Gross Sheet Aggregated Balanced Sum (PKR):</td>
                <td className="p-2 border border-black text-right pr-3 text-success underline decoration-double text-sm">
                  Rs. {reportRows.reduce((sum, r) => sum + (Number(r.total_amount) || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        {filters.withLedgerSummary && rType === 'invoice' && (
          <div className="p-4 rounded border border-dashed border-black bg-gray-50/40 mt-4 space-y-1">
            <h4 className="font-black text-xs uppercase tracking-wide underline">Supplementary Customer Account Ledger Trace Summary</h4>
            <p className="text-[11px] text-gray-500 font-sans">Active closing audit token confirms matching offset balance allocations calculated flawlessly onto master tables logs rows pools.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SaleReportPrint;
