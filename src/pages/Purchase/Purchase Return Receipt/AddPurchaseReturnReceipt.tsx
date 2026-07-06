import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

function AddPurchaseReturnReceipt() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [returnOptions, setReturnOptions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [selectedReturnDetails, setSelectedReturnDetails] = useState({ total: 0, pending: 0, vendor: '' });

  const editData = location.state?.receiptRecord;
  const isEditMode = !!editData;

  useEffect(() => {
    const fetchReceiptMetadata = async () => {
      try {
        setMetadataLoading(true);
        const { data: rData } = await supabase.from('purchase_returns').select('return_no, vendor_name, total_amount, amount_paid');
        const { data: bankData } = await supabase.from('banks').select('id, bankName');

        if (rData) setReturnOptions(rData);
        if (bankData) setBankAccounts(bankData);

        if (isEditMode && editData) {
          handleActiveReturnCalculation(editData.return_no, rData || []);
        }
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setMetadataLoading(false);
      }
    };
    fetchReceiptMetadata();
  }, [isEditMode, editData]);

  const handleActiveReturnCalculation = async (returnNo: string, allReturnsList: any[]) => {
    if (!returnNo) {
      setSelectedReturnDetails({ total: 0, pending: 0, vendor: '' });
      return;
    }
    const matchedReturn = allReturnsList.find(r => r.return_no === returnNo);
    if (matchedReturn) {
      const gross = Number(matchedReturn.total_amount) || 0;
      const upfrontPaid = Number(matchedReturn.amount_paid) || 0;

      const { data: receiptsData } = await supabase
        .from('purchase_return_receipts')
        .select('id, amount_received')
        .eq('return_no', returnNo);

      let subsequentPaidSum = 0;
      if (receiptsData) {
        receiptsData.forEach((rec: any) => {
          if (!isEditMode || rec.id !== editData?.id) {
            subsequentPaidSum += Number(rec.amount_received) || 0;
          }
        });
      }

      setSelectedReturnDetails({
        total: gross,
        pending: Math.max(0, gross - (upfrontPaid + subsequentPaidSum)),
        vendor: matchedReturn.vendor_name
      });
    }
  };

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  if (metadataLoading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;
  return (
    <div className="mx-auto max-w-full text-xs text-black dark:text-bodydark">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-semibold text-black dark:text-white text-base">Purchase Return Collection Receipt</h3>
          <button type="button" onClick={() => navigate('/Purchase/Purchase-Return-Receipt/List')} className="text-sm font-medium text-primary hover:underline cursor-pointer">Back to List</button>
        </div>
        <div className="p-6">
          <Formik
            initialValues={isEditMode ? {
              receiptNo: editData.receipt_no || '',
              returnNo: editData.return_no || '',
              paymentMethod: editData.payment_method || 'By Cash',
              selectedBankId: editData.metadata?.selectedBankId || '',
              paymentDate: editData.payment_date || '',
              amount: editData.amount_received || '',
              notes: editData.remarks || ''
            } : {
              receiptNo: `PRR-${Date.now().toString().slice(-6)}`,
              returnNo: '',
              paymentMethod: 'By Cash',
              selectedBankId: '',
              paymentDate: new Date().toISOString().split('T'),
              amount: '',
              notes: ''
            }}
            validationSchema={Yup.object().shape({
              returnNo: Yup.string().required('Required'),
              paymentMethod: Yup.string().required('Required'),
              paymentDate: Yup.string().required('Required'),
              amount: Yup.number().min(1).required('Required')
            })}
            onSubmit={async (values) => {
              if (Number(values.amount) > selectedReturnDetails.pending) {
                toast.error('Cannot collect more than the total remaining credit balance!');
                return;
              }
              try {
                setLoading(true);
                const payload = {
                  receipt_no: values.receiptNo,
                  return_no: values.returnNo,
                  vendor_name: selectedReturnDetails.vendor,
                  payment_date: values.paymentDate,
                  payment_method: values.paymentMethod,
                  amount_received: Number(values.amount) || 0,
                  remarks: values.notes.trim()
                };

                const { error } = isEditMode 
                  ? await supabase.from('purchase_return_receipts').update(payload).eq('id', editData.id)
                  : await supabase.from('purchase_return_receipts').insert([payload]);

                if (error) throw error;
                toast.success('Return collection settled cleanly!');
                navigate('/Purchase/Purchase-Return-Receipt/List');
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            {({ handleChange, values, setFieldValue, touched, errors }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div><label className="block text-gray-500 mb-1 font-bold uppercase">Receipt Code #:</label><p className="text-primary font-bold p-2 bg-gray-50 rounded border dark:bg-meta-4/20 border-stroke dark:border-strokedark font-mono">{values.receiptNo}</p></div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase">Select Target Return: *</label>
                    <select name="returnNo" value={values.returnNo} onChange={(e) => { setFieldValue('returnNo', e.target.value); handleActiveReturnCalculation(e.target.value, returnOptions); }} className="w-full border p-2 bg-white outline-none dark:bg-boxdark border-stroke dark:border-strokedark text-xs font-bold text-black dark:text-white">
                      <option value="">-- Choose Return Note --</option>
                      {returnOptions.map(r => <option key={r.return_no} value={r.return_no}>{r.return_no} ({r.vendor_name})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase">Collection Method: *</label>
                    <select name="paymentMethod" onChange={handleChange} value={values.paymentMethod} className="w-full border p-2 bg-white outline-none dark:bg-boxdark border-stroke dark:border-strokedark text-xs font-bold text-black dark:text-white">
                      <option value="By Cash">By Cash</option>
                      <option value="By Bank">By Bank</option>
                    </select>
                  </div>
                  <div><label className="block text-gray-500 mb-1 font-bold uppercase">Entry Date: *</label><input type="date" name="paymentDate" onChange={handleChange} value={values.paymentDate} className="w-full border p-2 bg-transparent outline-none border-stroke dark:border-strokedark text-xs font-bold text-black dark:text-white" /></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase text-success">Collected Amount: *</label>
                    <input type="number" name="amount" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.amount} className="w-full border p-2 font-black text-success text-xs outline-none bg-transparent focus:border-primary border-stroke dark:border-strokedark" />
                    {values.returnNo && (
                      <div className="mt-2 p-2 bg-purple-50 dark:bg-meta-4/20 text-purple-600 dark:text-purple-400 font-bold rounded text-[11px] border border-purple-200">
                        📉 Gross Debit Note: Rs. {selectedReturnDetails.total.toLocaleString()} | 🔍 Balance Collectable: <span className="underline ml-1">Rs. {selectedReturnDetails.pending.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div><label className="block text-gray-500 mb-1 font-bold uppercase">Remarks Notes:</label><textarea name="notes" rows={2} onChange={handleChange} value={values.notes} className="w-full border p-2 bg-transparent outline-none border-stroke dark:border-strokedark text-xs text-black dark:text-white" placeholder="Enter transaction reference details..." /></div>
                </div>

                <div className="pt-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3">
                  <button type="button" onClick={() => navigate('/Purchase/Purchase-Return-Receipt/List')} className="rounded bg-[#cb3c53] py-2 px-8 font-semibold text-white h-9 min-w-32 cursor-pointer transition hover:bg-opacity-90">Cancel</button>
                  <button type="submit" disabled={loading} className="rounded bg-primary py-2 px-10 font-bold text-white h-9 min-w-32 cursor-pointer transition hover:bg-opacity-90">{loading ? <Spinner /> : 'Disburse Receipt'}</button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export default AddPurchaseReturnReceipt;
