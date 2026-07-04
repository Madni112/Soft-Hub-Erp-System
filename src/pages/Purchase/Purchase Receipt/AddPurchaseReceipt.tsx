import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

function AddPurchaseReceipt() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);

  const [vendorOptions, setVendorOptions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [totalOutstandingLiability, setTotalOutstandingLiability] = useState<number>(0);

  const editData = location.state?.receiptRecord;
  const isEditMode = !!editData;

  useEffect(() => {
    const fetchPaymentMetadata = async () => {
      try {
        setMetadataLoading(true);
        const { data: vData } = await supabase.from('vendors').select('id, vendor_name').order('vendor_name', { ascending: true });
        const { data: bankData } = await supabase.from('banks').select('id, bankName, accountTitle, accountNumber');

        if (vData) setVendorOptions(vData);
        if (bankData) setBankAccounts(bankData);

        if (isEditMode && editData) {
          setTimeout(() => {
            handleInstantVendorLookup(editData.customer_name);
          }, 300);
        }
      } catch (err: any) {
        console.error(err.message);
      } finally {
        setMetadataLoading(false);
      }
    };
    fetchPaymentMetadata();
  }, [isEditMode, editData]);

  const handleInstantVendorLookup = async (vendorName: string) => {
    if (!vendorName) {
      setTotalOutstandingLiability(0);
      return;
    }
    try {
      const { data: purchases } = await supabase
        .from('supplier_purchases')
        .select('total_amount, amount_paid')
        .eq('supplier_name', vendorName);

      const { data: pastPayments } = await supabase
        .from('financial_vouchers')
        .select('total_amount')
        .eq('customer_name', vendorName)
        .or('voucher_type.eq.Cash Payment Voucher,voucher_type.eq.Bank Payment Voucher');

      let grossPurchasesCost = 0;
      if (purchases) {
        purchases.forEach((p: any) => {
          grossPurchasesCost += (Number(p.total_amount) || 0) - (Number(p.amount_paid) || 0);
        });
      }

      let totalClearedViaVouchers = 0;
      if (pastPayments) {
        const currentEditId = editData?.id || null;
        pastPayments.forEach((v: any) => {
          if (!isEditMode || v.id !== currentEditId) {
            totalClearedViaVouchers += (Number(v.total_amount) || 0);
          }
        });
      }

      const netOwedLiability = Math.max(0, grossPurchasesCost - totalClearedViaVouchers);
      setTotalOutstandingLiability(netOwedLiability);
    } catch (err: any) {
      console.error(err);
    }
  };

  const validationSchema = Yup.object().shape({
    vendorName: Yup.string().required('Vendor selection is mandatory'),
    voucherType: Yup.string().required('Required'),
    paymentDate: Yup.string().required('Required'),
    amount: Yup.number().typeError('Must be a number').min(1, 'Amount must be greater than 0').required('Required'),
    selectedBankId: Yup.string().when('voucherType', {
      is: 'By Bank',
      then: () => Yup.string().required('Source bank is required'),
      otherwise: () => Yup.string().nullable()
    })
  });

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  if (metadataLoading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;
  return (
    <div className="mx-auto max-w-full text-xs text-black dark:text-bodydark">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-semibold text-black dark:text-white text-base">
            {isEditMode ? 'Modify Purchase Receipt Voucher' : 'Log Vendor Outflow Purchase Receipt'}
          </h3>
          <button type="button" onClick={() => navigate('/Purchase/Purchase Receipt/List')} className="text-sm font-medium text-primary hover:underline cursor-pointer">Back to Registry Log</button>
        </div>

        <div className="p-6">
          <Formik
            initialValues={isEditMode ? {
              voucherNo: editData.voucher_no || '',
              voucherType: editData.voucher_type === 'Bank Payment Voucher' ? 'By Bank' : 'By Cash',
              vendorName: editData.customer_name || '',
              selectedBankId: editData.metadata?.selectedBankId || '',
              paymentDate: editData.voucher_date || '',
              amount: editData.total_amount || '',
              notes: editData.narration || ''
            } : {
              voucherNo: `PRC-${Date.now().toString().slice(-6)}`,
              voucherType: 'By Cash',
              vendorName: '',
              selectedBankId: '',
              paymentDate: new Date().toISOString().split('T'),
              amount: '',
              notes: ''
            }}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={async (values) => {
              const enteredAmount = Number(values.amount) || 0;
              if (enteredAmount > totalOutstandingLiability) {
                toast.error(`Overpayment Error: Outstanding balance due is Rs. ${totalOutstandingLiability.toLocaleString()}.`);
                return;
              }

              try {
                setLoading(true);
                const assetAccountCode = values.voucherType === 'By Cash' ? '1002001' : '1002002';
                
                const balancedJournalItems = [
                  { accountCode: '2001001', description: `Settled balance due to ${values.vendorName}`, debit: enteredAmount, credit: 0 },
                  { accountCode: assetAccountCode, description: `Fund drawn via ${values.voucherNo}`, debit: 0, credit: enteredAmount }
                ];

                const bankTrackingString = values.voucherType === 'By Bank' ? ` | Source Bank: ${values.selectedBankId}` : '';
                const compositeNarration = `Paid to Vendor: ${values.vendorName} | Ref: ${values.voucherNo}${bankTrackingString} | Remarks: ${values.notes.trim()}`.trim();

                const payload = {
                  voucher_no: values.voucherNo,
                  voucher_type: values.voucherType === 'By Cash' ? 'Cash Payment Voucher' : 'Bank Payment Voucher',
                  voucher_date: values.paymentDate,
                  customerName: values.vendorName,
                  customer_name: values.vendorName,
                  narration: compositeNarration,
                  notes: compositeNarration,
                  total_amount: enteredAmount,
                  items: balancedJournalItems,
                  metadata: { 
                    selectedBankId: values.voucherType === 'By Bank' ? values.selectedBankId : null,
                    moduleSource: 'purchase_receipt'
                  }
                };

                const { error: voucherError } = isEditMode
                  ? await supabase.from('financial_vouchers').update(payload).eq('id', editData.id)
                  : await supabase.from('financial_vouchers').insert([payload]);

                if (voucherError) throw voucherError;

                const { data: openPurchases } = await supabase
                  .from('supplier_purchases')
                  .select('id, total_amount, amount_paid')
                  .eq('supplier_name', values.vendorName)
                  .order('created_at', { ascending: true });

                if (openPurchases) {
                  let cashPoolLeftToAllocate = enteredAmount;
                  
                  for (const pur of openPurchases) {
                    if (cashPoolLeftToAllocate <= 0) break;

                    const totalAmt = Number(pur.total_amount) || 0;
                    const currentPaid = Number(pur.amount_paid) || 0;
                    const remainingOnThisBill = Math.max(0, totalAmt - currentPaid);

                    if (remainingOnThisBill > 0) {
                      const allocationToThisBill = Math.min(cashPoolLeftToAllocate, remainingOnThisBill);
                      const newPaidTotalForBill = currentPaid + allocationToThisBill;

                      await supabase
                        .from('supplier_purchases')
                        .update({ amount_paid: newPaidTotalForBill })
                        .eq('id', pur.id);

                      cashPoolLeftToAllocate -= allocationToThisBill;
                    }
                  }
                }

                toast.success('Purchase Receipt payment processed and supplier balances updated cleanly!');
                navigate('/Purchase/Purchase Receipt/List');
              } catch (err: any) {
                toast.error(err.message);
              } finally {
                setLoading(false);
              }
            }}
          >
            {({ handleChange, values, errors, touched }) => (
              <Form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase">Receipt Note #:</label>
                    <p className="text-primary font-bold p-2.5 bg-gray-50 dark:bg-meta-4/10 rounded font-mono text-sm border dark:border-strokedark">{values.voucherNo}</p>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase">Settlement Method: *</label>
                    <select name="voucherType" onChange={handleChange} value={values.voucherType} className="w-full border border-stroke p-2.5 bg-white text-black dark:bg-boxdark dark:text-white font-bold outline-none text-xs dark:border-strokedark">
                      <option value="By Cash">By Cash Drawer</option>
                      <option value="By Bank">By Bank Wire</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase">Select Target Vendor: *</label>
                    <select
                      name="vendorName"
                      value={values.vendorName}
                      disabled={isEditMode}
                      onChange={(e) => {
                        handleChange(e);
                        handleInstantVendorLookup(e.target.value);
                      }}
                      className={`w-full border rounded p-2.5 bg-white text-black dark:bg-boxdark dark:text-white font-bold outline-none text-xs ${touched.vendorName && errors.vendorName ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                    >
                      <option value="">-- Choose Vendor Account --</option>
                      {vendorOptions.map(v => <option key={v.id} value={v.vendor_name}>{v.vendor_name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase">Payment Date: *</label>
                    <input type="date" name="paymentDate" onChange={handleChange} value={values.paymentDate} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-bold outline-none text-black dark:text-white text-xs" />
                  </div>
                </div>
                {values.voucherType === 'By Bank' && (
                  <div className="p-4 bg-primary/5 rounded border border-primary/20 animate-fade-in md:w-1/2">
                    <label className="block text-primary dark:text-white font-bold mb-1.5 uppercase text-[11px]">Source Bank Account: *</label>
                    <select name="selectedBankId" onChange={handleChange} value={values.selectedBankId} className="w-full border rounded p-2.5 bg-white text-black dark:bg-boxdark dark:text-white font-bold outline-none border-stroke dark:border-strokedark text-xs">
                      <option value="">-- Select Bank Account Title --</option>
                      {bankAccounts.map(b => <option key={b.id} value={b.bankName}>{b.bankName} - {b.accountTitle} ({b.accountNumber || '-'})</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase text-success">Transferred Amount (PKR): *</label>
                    <input type="number" name="amount" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.amount} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-black text-success text-sm placeholder-0.00" />
                    {values.vendorName && (
                      <div className="mt-2 p-2.5 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 font-bold text-xs rounded border border-red-200/50 inline-block tracking-wide">
                        📉 Current Credit Debt Owed: <span className="underline font-black text-sm ml-1">Rs. {totalOutstandingLiability.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-1 font-bold uppercase">Remarks Description Notes:</label>
                    <textarea name="notes" rows={2} onChange={handleChange} value={values.notes} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent outline-none text-black dark:text-white text-xs placeholder-Enter transfer tracking receipt codes notes..." />
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-stroke dark:border-strokedark">
                  <button type="button" onClick={() => navigate('/Purchase/Purchase Receipt/List')} className="rounded bg-danger py-2.5 px-8 font-medium text-white hover:bg-opacity-90 transition text-xs shadow-sm h-10 min-w-36 cursor-pointer">Cancel</button>
                  <button type="submit" disabled={loading || !values.vendorName} className="rounded bg-primary py-2.5 px-10 font-bold text-white hover:bg-opacity-90 transition text-xs shadow-sm h-10 min-w-36 cursor-pointer font-semibold">
                    {loading ? <Spinner /> : isEditMode ? 'Update Receipt' : 'Record Receipt'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export default AddPurchaseReceipt;
