import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdPrint, MdArrowBack } from 'react-icons/md';

interface ReturnItem {
  itemName: string;
  qty: number;
  returnedQty: number;
  rp: number;
  mrp: number;
  gstRate: number;
  fTaxPer: number;
  location?: string;
}

interface ReturnData {
  id: number;
  original_invoice_no: string;
  customer_name: string;
  salesman: string;
  scenario_type: string;
  return_date: string;
  return_type: string;
  remarks: string;
  total_quantity: number;
  total_amount: number;
  total_gst_amount: number;
  total_net_amount: number;
  items: ReturnItem[];
  created_at: string;
}

const PrintSalesReturn = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [returnRecord, setReturnRecord] = useState<ReturnData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturnDetails = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('sales_returns')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) setReturnRecord(data);
      } catch (err: any) {
        toast.error('Error loading print data: ' + err.message);
        navigate('/Sales-Return/Debit-Notes/List');
      } finally {
        setLoading(false);
      }
    };

    fetchReturnDetails();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <Spinner />
      </div>
    );
  }

  if (!returnRecord) return null;

  return (
    <div className="mx-auto max-w-4xl p-4 md:p-8 bg-white text-black font-sans min-h-screen relative">
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          aside, nav, header, .no-print, button {
            display: none !important;
            opacity: 0 !important;
            visibility: hidden !important;
          }
          html, body, #root, .flex, main, div {
            width: 100% !important;
            max-width: 100% !important;
            min-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            position: static !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            transform: none !important;
            box-shadow: none !important;
          }
          .print-voucher {
            display: flex !important;
            flex-direction: column !important;
            width: 100% !important;
            min-height: 250mm !important;
            justify-content: space-between !important;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          table {
            width: 100% !important;
            table-layout: auto !important;
            border-collapse: collapse !important;
            margin-top: 15px !important;
          }
          th, td {
            padding: 10px 8px !important;
            border: 1px solid #000000 !important;
            font-size: 13px !important;
            text-align: center !important;
          }
        }
      `}</style>
      <div className="no-print flex justify-between items-center mb-6 bg-slate-50 p-4 rounded border border-stroke">
        <button
          onClick={() => navigate('/Sales-Return/Debit-Notes/List')}
          className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-black transition"
        >
          ← Back to List
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 rounded bg-primary py-2 px-5 text-sm font-medium text-white hover:bg-opacity-90 transition shadow-sm"
        >
          Print Voucher
        </button>
      </div>

      <div className="print-voucher bg-white">
        <div>
          <div className="text-center border-b border-gray-300 pb-4 mb-6">
            <h2 className="text-xl font-extrabold tracking-wide uppercase text-primary">Softhub-Pk ERP Distribution</h2>
            <p className="text-xs text-gray-500 font-medium">Plot 12, Industrial Area Phase II, Hyderabad, Sindh, Pakistan</p>
            <h3 className="text-md font-bold mt-3 border border-black inline-block px-4 py-1 uppercase bg-gray-50">Sales Return / Credit Note</h3>
          </div>

          <div className="grid grid-cols-2 gap-4 border-b border-gray-300 pb-4 mb-6 text-xs font-semibold">
            <div className="space-y-1">
              <p><span className="text-gray-500">Return Note # :</span> <span className="text-black font-bold">{`RTN-${String(returnRecord.id).padStart(4, '0')}`}</span></p>
              <p><span className="text-gray-500">Return Date :</span> <span className="text-black font-bold">{returnRecord.return_date || new Date(returnRecord.created_at).toLocaleDateString()}</span></p>
              <p><span className="text-gray-500">Settlement Type :</span> <span className="text-black font-bold text-danger">{returnRecord.return_type}</span></p>
            </div>
            <div className="space-y-1 md:text-left">
              <p><span className="text-gray-500">Original Invoice # :</span> <span className="text-black font-bold">{`INV-${String(returnRecord.original_invoice_no).padStart(4, '0')}`}</span></p>
              <p><span className="text-gray-500">Customer Name :</span> <span className="text-black font-bold">{returnRecord.customer_name}</span></p>
              <p><span className="text-gray-500">Salesman Name :</span> <span className="text-black font-bold">{returnRecord.salesman || 'General'}</span></p>
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-300 text-xs text-left">
              <thead>
                <tr className="bg-gray-100 text-black font-bold uppercase border-b border-gray-300 text-center">
                  <th className="border border-gray-300 p-2 w-12">S#</th>
                  <th className="border border-gray-300 p-2 text-left">Returned Product Details</th>
                  <th className="border border-gray-300 p-2 w-24">Base Rate</th>
                  <th className="border border-gray-300 p-2 w-20">Returned Qty</th>
                  <th className="border border-gray-300 p-2 w-20">GST %</th>
                  <th className="border border-gray-300 p-2 w-24">Tax Amount</th>
                  <th className="border border-gray-300 p-2 w-28">Net Reverted</th>
                </tr>
              </thead>
              <tbody>
                {returnRecord.items && returnRecord.items.map((item, idx) => {
                  const rQty = Number(item.returnedQty) || 0;
                  const isThirdSchedule = returnRecord.scenario_type === "Sale of 3rd Schedule Goods";
                  const basePrice = isThirdSchedule ? Number(item.mrp) : Number(item.rp);
                  
                  const baseAmount = basePrice * rQty;
                  const gstAmount = (baseAmount / 100) * (Number(item.gstRate) || 18);
                  const fTaxAmount = (baseAmount / 100) * (Number(item.fTaxPer) || 0);
                  const netRowAmount = baseAmount + gstAmount + fTaxAmount;

                  return (
                    <tr key={idx} className="font-medium text-center">
                      <td className="border border-gray-300 p-2 bg-gray-50/50">{idx + 1}</td>
                      <td className="border border-gray-300 p-2 text-left font-semibold text-black">{item.itemName}</td>
                      <td className="border border-gray-300 p-2">{basePrice.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 font-bold text-danger">{rQty}</td>
                      <td className="border border-gray-300 p-2">{item.gstRate}%</td>
                      <td className="border border-gray-300 p-2">{gstAmount.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 font-bold text-black">{netRowAmount.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-start mt-4">
            <div className="w-1/2 text-xs text-gray-600">
              {returnRecord.remarks && <p className="bg-gray-50 p-2 rounded border border-gray-200"><strong>Notes / Reason:</strong> {returnRecord.remarks}</p>}
            </div>
            <div className="w-1/3 text-xs space-y-1.5 font-medium">
              <div className="flex justify-between border-b pb-1">
                <span>Total Reverted Goods:</span>
                <span>{Number(returnRecord.total_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-b pb-1">
                <span>Total Sales Tax Reverted:</span>
                <span>{Number(returnRecord.total_gst_amount || 0).toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-1 text-danger font-extrabold text-sm uppercase">
                <span>Total Credit Adjusted:</span>
                <span>{Number(returnRecord.total_net_amount || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-12 pt-24 text-center text-[11px] font-bold uppercase tracking-wider text-gray-600 mt-auto">
          <div><div className="border-t border-black pt-2">Authorized Signature</div></div>
          <div><div className="border-t border-black pt-2">Customer Acknowledgment</div></div>
        </div>
      </div>
    </div>
  );
};

export default PrintSalesReturn;
