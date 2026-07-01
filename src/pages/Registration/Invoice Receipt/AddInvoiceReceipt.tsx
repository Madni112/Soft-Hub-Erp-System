import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

function AddInvoiceReceipt() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);

  const [invoiceOptions, setInvoiceOptions] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [invoiceTotal, setInvoiceTotal] = useState<number>(0);
  const [remainingBalance, setRemainingBalance] = useState<number>(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [salesman, setSalesman] = useState('');

  const editData = location.state?.receipt;
  const isEditMode = !!editData;

  useEffect(() => {
    const fetchReceiptMetadata = async () => {
      try {
        const { data: invData } = await supabase.from('sales_invoices').select('id, customer_name, total_amount').order('id', { ascending: false });
        const { data: bankData } = await supabase.from('banks').select('id, bankName, accountTitle, accountNumber');

        if (invData) setInvoiceOptions(invData);
        if (bankData) setBankAccounts(bankData);

        if (isEditMode && editData) {
          setSelectedInvoiceId(String(editData.original_invoice_no));
          setCustomerName(editData.customerName || editData.customer_name || '');
          setSalesman(editData.salesman || 'General');
        }
      } catch (err: any) {
        console.error('Metadata load failure:', err.message);
      }
    };
    fetchReceiptMetadata();
  }, [isEditMode, editData]);

  useEffect(() => {
    const handleOutsideClick = () => setIsDropdownOpen(false);
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();
  const validationSchema = Yup.object().shape({
    invoiceNo: Yup.string(),
    paymentTerm: Yup.string(),
    receiptDate: Yup.string(),
    customerName: Yup.string(),
    amount: Yup.number(),
    selectedBankId: Yup.string()
  });

  return (
    <div className="mx-auto max-w-full text-xs">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-semibold text-black dark:text-white text-base">Invoice Receipt Processing Wizard</h3>
          <button type="button" onClick={() => navigate('/Registration/InvoiceReceipt/List')} className="text-sm font-medium text-primary hover:underline cursor-pointer">See List</button>
        </div>

        <div className="p-6">
          <Formik
            initialValues={isEditMode ? {
              receiptNo: editData.voucher_no || '',
              paymentTerm: editData.voucher_type === 'Bank Receipt Voucher' ? 'By Bank' : 'By Cash',
              selectedBankId: editData.metadata?.selectedBankId || '',
              receiptDate: editData.voucher_date || '',
              amount: editData.total_amount || 0,
              notes: editData.narration || ''
            } : {
              receiptNo: `RCP-${Date.now().toString().slice(-6)}`,
              paymentTerm: 'By Cash',
              selectedBankId: '',
              receiptDate: new Date().toISOString().split('T')[0],
              customerName: '',
              salesman: '',
              amount: '',
              notes: ''
            }}
            enableReinitialize={true}
            validationSchema={validationSchema}
            onSubmit={async () => { }}
          >
            {({ handleChange, values }: any) => {
              const filteredInvoiceOptions = invoiceOptions.filter(inv =>
                inv.id.toString().includes(searchQuery) ||
                inv.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
              );

              const handleInstantSelect = async (invoiceId: string) => {
                if (!invoiceId) return;
                try {
                  const { data: invData, error } = await supabase
                    .from('sales_invoices')
                    .select('*')
                    .eq('id', Number(invoiceId))
                    .single();

                  if (error || !invData) {
                    toast.error('Sales invoice not found.');
                    return;
                  }

                  const netTotal = Number(invData.total_amount) || 0;
                  setInvoiceTotal(netTotal);

                  const { data: pastReceipts } = await supabase
                    .from('financial_vouchers')
                    .select('id, total_amount')
                    .eq('original_invoice_no', invoiceId)
                    .or('voucher_type.eq.Cash Receipt Voucher,voucher_type.eq.Bank Receipt Voucher');

                  const initialInvoicePaymentsArray = invData.bankPayments || [];
                  const totalPaidAtSaleTime = initialInvoicePaymentsArray.reduce((sum: number, curr: any) => sum + (Number(curr.bankAmount) || 0), 0);
                  const currentEditId = editData?.id || null;
                  const totalPaidViaVouchers = pastReceipts ? pastReceipts.filter((r: any) => !isEditMode || r.id !== currentEditId).reduce((sum: number, r: any) => sum + (Number(r.total_amount) || 0), 0) : 0;

                  const netRemaining = Math.max(0, netTotal - totalPaidAtSaleTime - totalPaidViaVouchers);
                  setRemainingBalance(netRemaining);

                  setSelectedInvoiceId(String(invoiceId));
                  setCustomerName(invData.customerName || invData.customer_name || 'General Client');
                  setSalesman(invData.salesman || 'General');
                  values.amount = netRemaining;

                  setIsDropdownOpen(false);
                  setSearchQuery('');
                  toast.success(`Invoice ID ${invoiceId} loaded!`);
                } catch (err: any) {
                  console.error(err);
                }
              };
              const handleValidateAndSubmit = async () => {
                if (!selectedInvoiceId) return toast.error('Validation Error: Original Invoice ID is missing!');
                if (!values.receiptDate) return toast.error('Validation Error: Clearing Date field cannot be empty!');
                if (values.amount === '' || values.amount === null || values.amount === undefined) return toast.error('Validation Error: Collected Payment Amount is required!');

                const enteredAmount = Number(values.amount) || 0;
                if (enteredAmount <= 0) return toast.error('Validation Error: Payment amount must be greater than 0 PKR!');

                // ✅ CRITICAL USER EXPERIENCE OVERPAYMENT PROTECTION
                if (enteredAmount > remainingBalance) {
                  return toast.error(`Validation Error: Overpayment blocked! You entered Rs. ${enteredAmount.toLocaleString()}, but the true remaining invoice balance is only Rs. ${remainingBalance.toLocaleString()}.`);
                }

                if (!customerName) return toast.error('Validation Error: Customer data is unverified!');
                if (values.paymentTerm === 'By Bank' && !values.selectedBankId) return toast.error('Validation Error: Target bank account selector is empty!');

                try {
                  setLoading(true);
                  const cashAmt = enteredAmount;
                  const assetAccountCode = values.paymentTerm === 'By Cash' ? '1002001' : '1002002';

                  const balancedJournalItems = [
                    { accountCode: assetAccountCode, salesman: salesman, description: `Received via INV-${selectedInvoiceId}`, debit: cashAmt, credit: 0 },
                    { accountCode: '1001001', salesman: salesman, description: `Debt cleared against INV-${selectedInvoiceId}`, debit: 0, credit: cashAmt }
                  ];

                  const bankTrackingString = values.paymentTerm === 'By Bank' ? ` | Bank ID: ${values.selectedBankId}` : '';
                  const compositeNarration = `Customer: ${customerName} | Salesman: ${salesman} | Invoice Ref: INV-${selectedInvoiceId}${bankTrackingString} | Note: ${values.notes.trim()}`.trim();

                  const payload = {
                    voucher_no: values.receiptNo,
                    voucher_type: values.paymentTerm === 'By Cash' ? 'Cash Receipt Voucher' : 'Bank Receipt Voucher',
                    voucher_date: values.receiptDate,
                    original_invoice_no: selectedInvoiceId,
                    customerName: customerName,
                    customer_name: customerName,
                    salesman: salesman,
                    narration: compositeNarration,
                    notes: compositeNarration,
                    total_amount: cashAmt,
                    items: balancedJournalItems,
                    metadata: { selectedBankId: values.selectedBankId }
                  };

                  const { error } = isEditMode
                    ? await supabase.from('financial_vouchers').update(payload).eq('id', editData.id)
                    : await supabase.from('financial_vouchers').insert([payload]);

                  if (error) throw error;

                  // ✅ AUTOMATED FRONT-END FALLBACK STATUS MUTATION
                  // Computes target string instantly to update the source record view row
                  const netOutstandingAfterPayment = remainingBalance - cashAmt;
                  let targetStatusString = 'Partial';
                  if (netOutstandingAfterPayment <= 1) {
                    targetStatusString = 'Paid';
                  } else if (cashAmt === 0) {
                    targetStatusString = 'Unpaid';
                  }

                  // Force-push the status updates to sales_invoices record columns
                  await supabase
                    .from('sales_invoices')
                    .update({ receipt_status: targetStatusString }) // Change receipt_status to your exact status column name if it differs (e.g. payment_status)
                    .eq('id', Number(selectedInvoiceId));

                  toast.success('Invoice receipt processed successfully!');
                  navigate('/Registration/InvoiceReceipt/List');
                } catch (err: any) {
                  toast.error(err.message);
                } finally {
                  setLoading(false);
                }
              };

              return (
                <Form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold uppercase">Receipt Note #:</label>
                      <p className="text-primary font-bold p-2 bg-gray-50 dark:bg-meta-4/10 rounded font-mono text-sm">{values.receiptNo}</p>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold uppercase">Payment Term: *</label>
                      <select name="paymentTerm"
                        onChange={(e) => {
                          handleChange(e);
                          if (selectedInvoiceId) {
                            handleInstantSelect(selectedInvoiceId);
                          }
                        }}
                        value={values.paymentTerm}
                        className="w-full border border-stroke dark:border-strokedark rounded p-2.5 bg-white text-black dark:bg-boxdark dark:text-white font-bold outline-none"
                      >
                        <option value="By Cash">By Cash</option>
                        <option value="By Bank">By Bank</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold uppercase">Original Invoice ID: *</label>
                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <div
                          onClick={() => !isEditMode && setIsDropdownOpen(!isDropdownOpen)}
                          className={`w-full rounded border border-stroke p-2 bg-white dark:bg-boxdark font-bold text-black dark:text-white min-h-[34px] flex items-center justify-between cursor-pointer ${isEditMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span>{selectedInvoiceId ? `INV-${selectedInvoiceId.padStart(4, '0')}` : '-- Select & Search Invoice --'}</span>
                          <span className="text-gray-400">▼</span>
                        </div>
                        {isDropdownOpen && (
                          <div className="absolute left-0 mt-1 w-full min-w-[280px] bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded shadow-2xl z-9999 p-2 space-y-2">
                            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Type customer name or ID..." className="w-full rounded border border-stroke p-1.5 outline-none focus:border-primary bg-transparent text-black dark:text-white font-medium text-xs" autoFocus />
                            <div className="max-h-48 overflow-y-auto text-left font-semibold text-black dark:text-white">
                              {filteredInvoiceOptions.length === 0 ? (
                                <div className="p-2 text-gray-400 text-center">No results located</div>
                              ) : (
                                filteredInvoiceOptions.map((inv) => (
                                  <div key={inv.id}
                                    onClick={() => handleInstantSelect(String(inv.id))}
                                    className="p-2 hover:bg-primary hover:text-white rounded cursor-pointer duration-100 flex justify-between items-center text-xs text-black dark:text-white dark:hover:text-white"
                                  >
                                    <span>INV-{String(inv.id).padStart(4, '0')} - {inv.customer_name}</span>
                                    <span className="text-[10px] opacity-60 ml-2">Rs. {Number(inv.total_amount).toLocaleString()}</span>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold uppercase">Clearing Date: *</label>
                      <input type="date" name="receiptDate" onChange={handleChange} value={values.receiptDate} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-bold text-black dark:text-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold uppercase">Customer Name:</label>
                      <input type="text" name="customerName" readOnly value={customerName} className="w-full rounded border border-stroke p-2 bg-gray-100 dark:bg-meta-4/30 outline-none font-bold text-gray-600 dark:text-gray-300" placeholder="" />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold uppercase">Salesman:</label>
                      <input type="text" name="salesman" readOnly value={salesman} className="w-full rounded border border-stroke p-2 bg-gray-100 dark:bg-meta-4/30 outline-none font-bold text-gray-500" placeholder="" />
                    </div>
                    {values.paymentTerm === 'By Bank' ? (
                      <div>
                        <label className="block text-gray-500 mb-1 font-bold uppercase text-primary">Target Bank Account: *</label>
                        <select name="selectedBankId" onChange={handleChange} value={values.selectedBankId} className="w-full border rounded p-2.5 bg-white text-black dark:bg-boxdark dark:text-white font-bold outline-none border-stroke dark:border-strokedark">
                          <option value="">-- Select Active Bank Ledger --</option>
                          {bankAccounts.map(b => <option key={b.id} value={b.id}>{`${b.bankName} - ${b.accountTitle} (${b.accountNumber || '-'})`}</option>)}
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block text-gray-500 mb-1 font-bold uppercase text-success">Target Cash Vault Account:</label>
                        <p className="p-2 rounded border border-stroke bg-gray-50 dark:bg-meta-4/10 font-bold text-success text-xs">Main Cash Ledger Register</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold uppercase text-success">Collected Payment Amount (PKR): *</label>
                      <input type="number" name="amount" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.amount} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent font-extrabold text-success text-sm" placeholder="0.00" />
                      {invoiceTotal > 0 && (
                        <div className="flex flex-col gap-0.5 mt-1 text-[10px] font-medium text-gray-400">
                          <p>Original Billing Full Total Worth: Rs. {invoiceTotal.toLocaleString()}</p>
                          <p className="text-danger font-bold">Remaining Outstanding Balance: Rs. {remainingBalance.toLocaleString()}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-1 font-bold uppercase">Transaction Memo Remarks:</label>
                      <textarea name="notes" rows={2} onChange={handleChange} value={values.notes} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent outline-none text-black dark:text-white text-xs" placeholder="Add receipt memos..." />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-4 border-t border-stroke dark:border-strokedark">
                    <button type="button" onClick={handleValidateAndSubmit} className="rounded bg-success py-2.5 px-10 font-bold text-white hover:bg-opacity-90 transition text-xs shadow-sm h-10 min-w-36 cursor-pointer font-semibold" >
                      {loading ? <Spinner /> : isEditMode ? 'Update Receipt' : 'Record Receipt'}
                    </button>
                    <button type="button" onClick={() => navigate('/Registration/InvoiceReceipt/List')} className="rounded bg-danger py-2.5 px-8 font-medium text-white hover:bg-opacity-90 transition text-xs shadow-sm h-10 min-w-36 cursor-pointer" >Cancel</button>
                  </div>
                </Form>
              );
            }}
          </Formik>
        </div>
      </div>
    </div>
  );
}

export default AddInvoiceReceipt;
