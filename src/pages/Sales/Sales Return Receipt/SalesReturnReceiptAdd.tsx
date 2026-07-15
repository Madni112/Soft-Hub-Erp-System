import React, { useState, useEffect, useRef } from 'react';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../Context/supabaseClient';
import Spinner from '../../../ui/Spinner';
import { useNavigate, useLocation } from 'react-router-dom';

const SaleReturnReceiptAdd = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const routeReceiptRow = location.state?.receiptRecord || location.state?.item || location.state?.record;
    const isEditMode = !!routeReceiptRow;

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(false);
    const [onCreditReturns, setOnCreditReturns] = useState<any[]>([]);
    const [filteredReturns, setFilteredReturns] = useState<any[]>([]);
    const [banksList, setBanksList] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [selectedReturnDetails, setSelectedReturnDetails] = useState<any>({
        totalAmount: 0,
        alreadyPaid: 0,
        remainingDue: 0
    });

    const [initialFormValues, setInitialFormValues] = useState<any>({
        processingDate: new Date().toISOString().split('T')[0],
        returnRowId: '',
        invoiceNoRef: '',
        customerName: '',
        settlementMode: 'Cash',
        selectedBankTitle: '',
        amountPaid: 0,
        remainingBalanceMax: 99999999
    });

    useEffect(() => {
        const fetchVoucherMetadata = async () => {
            try {
                setInitialLoading(true);

                const { data: returnsData } = await supabase
                    .from('sales_returns')
                    .select('id, original_invoice_no, customer_name, total_amount, payout_amount_paid, return_status');

                const { data: bankAccounts } = await supabase
                    .from('banks')
                    .select('id, bankName, accountTitle');

                if (bankAccounts) setBanksList(bankAccounts);

                if (returnsData) {
                    const eligibleReturns = returnsData.filter(r =>
                        r.return_status === 'On Credit' || (isEditMode && String(r.id) === String(routeReceiptRow.sales_return_id))
                    );
                    setOnCreditReturns(eligibleReturns);
                    setFilteredReturns(eligibleReturns.slice(0, 3));

                    if (isEditMode && routeReceiptRow) {
                        const currentActiveReturn = returnsData.find(r => String(r.id) === String(routeReceiptRow.sales_return_id));
                        if (currentActiveReturn) {
                            const isolatedPaidPool = Math.max(0, Number(currentActiveReturn.payout_amount_paid || 0) - Number(routeReceiptRow.amount_paid || 0));
                            const isolatedRemainingDue = Math.max(0, Number(currentActiveReturn.total_amount || 0) - isolatedPaidPool);

                            setSearchQuery(`${routeReceiptRow.original_invoice_no} (${routeReceiptRow.customer_name})`);
                            setSelectedReturnDetails({
                                totalAmount: currentActiveReturn.total_amount,
                                alreadyPaid: isolatedPaidPool,
                                remainingDue: isolatedRemainingDue
                            });

                            setInitialFormValues({
                                processingDate: routeReceiptRow.processing_date || new Date().toISOString().split('T')[0],
                                returnRowId: routeReceiptRow.sales_return_id || '',
                                invoiceNoRef: routeReceiptRow.original_invoice_no || '',
                                customerName: routeReceiptRow.customer_name || '',
                                settlementMode: routeReceiptRow.settlement_mode || 'Cash',
                                selectedBankTitle: routeReceiptRow.bank_account_title || '',
                                amountPaid: routeReceiptRow.amount_paid || 0,
                                remainingBalanceMax: isolatedRemainingDue
                            });
                        }
                    }
                }
            } catch (err: any) {
                toast.error('Failed to load credit return registers: ' + err.message);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchVoucherMetadata();
    }, [routeReceiptRow, isEditMode]);
    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, []);

    useEffect(() => {
        if (isEditMode) return;
        const term = searchQuery.trim().toLowerCase();
        if (!term) {
            setFilteredReturns(onCreditReturns.slice(0, 3));
            return;
        }
        const filtered = onCreditReturns.filter(r =>
            String(r.original_invoice_no).toLowerCase().includes(term) ||
            String(r.customer_name).toLowerCase().includes(term)
        );
        setFilteredReturns(filtered);
    }, [searchQuery, onCreditReturns, isEditMode]);

    const validationSchema = Yup.object().shape({
        returnRowId: Yup.string().required('Required'),
        customerName: Yup.string().required('Required'),
        invoiceNoRef: Yup.string().required('Required'),
        settlementMode: Yup.string().oneOf(['Cash', 'Bank']).required('Required'),
        selectedBankTitle: Yup.string().when('settlementMode', {
            is: 'Bank',
            then: (schema) => schema.required('Required'),
            otherwise: (schema) => schema.notRequired()
        }),
        amountPaid: Yup.number()
            .typeError('Must be a number')
            .required('Required')
            .min(1, 'Min 1')
            .max(Yup.ref('remainingBalanceMax'), 'Exceeds balance total!')
    });

    const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
        ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

    if (initialLoading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;
    return (
        <div className="mx-auto max-w-7xl flex flex-col gap-6 text-black dark:text-white text-xs">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="flex items-center justify-between border-b border-stroke py-4 px-6.5 dark:border-strokedark">
                    <h3 className="font-semibold text-black dark:text-white text-base">
                        {isEditMode ? 'Modify Return Note Cash-Back Settlement Entry' : 'Authorize Remaining Return Cash-Back Settlement Note'}
                    </h3>
                    <button onClick={() => navigate('/sales/sales-return-receipt/list')} className="text-sm font-medium text-primary hover:underline">Cancel & Return</button>
                </div>

                <Formik
                    initialValues={initialFormValues}
                    validationSchema={validationSchema}
                    enableReinitialize={true}
                    onSubmit={async (values) => {
                        try {
                            setLoading(true);

                            if (isEditMode) {
                                const { error: updateReceiptError } = await supabase
                                    .from('sales_return_receipts')
                                    .update({
                                        processing_date: values.processingDate,
                                        settlement_mode: values.settlementMode,
                                        bank_account_title: values.settlementMode === 'Bank' ? values.selectedBankTitle : null,
                                        amount_paid: Number(values.amountPaid)
                                    })
                                    .eq('id', routeReceiptRow.id);

                                if (updateReceiptError) throw updateReceiptError;

                                const absoluteNewTotalPaidBackSum = Number(selectedReturnDetails.alreadyPaid) + Number(values.amountPaid);
                                const isCompletelySettledNow = absoluteNewTotalPaidBackSum >= Number(selectedReturnDetails.totalAmount);

                                const { error: updateReturnError } = await supabase
                                    .from('sales_returns')
                                    .update({
                                        payout_amount_paid: absoluteNewTotalPaidBackSum,
                                        return_status: isCompletelySettledNow ? 'Paid' : 'On Credit'
                                    })
                                    .eq('id', values.returnRowId);

                                if (updateReturnError) throw updateReturnError;
                                toast.success('Collection receipt modification authorized!');
                            } else {
                                const { error: insertError } = await supabase.from('sales_return_receipts').insert([{
                                    processing_date: values.processingDate,
                                    sales_return_id: values.returnRowId,
                                    original_invoice_no: values.invoiceNoRef,
                                    customer_name: values.customerName,
                                    settlement_mode: values.settlementMode,
                                    bank_account_title: values.settlementMode === 'Bank' ? values.selectedBankTitle : null,
                                    amount_paid: Number(values.amountPaid)
                                }]);
                                if (insertError) throw insertError;

                                const absoluteNewTotalPaidBackSum = Number(selectedReturnDetails.alreadyPaid) + Number(values.amountPaid);
                                const isCompletelySettledNow = absoluteNewTotalPaidBackSum >= Number(selectedReturnDetails.totalAmount);

                                const { error: updateError } = await supabase
                                    .from('sales_returns')
                                    .update({
                                        payout_amount_paid: absoluteNewTotalPaidBackSum,
                                        return_status: isCompletelySettledNow ? 'Paid' : 'On Credit'
                                    })
                                    .eq('id', values.returnRowId);

                                if (updateError) throw updateError;
                                toast.success('Cash-back collection voucher approved!');
                            }
                            navigate('/sales/sales-return-receipt/list');
                        } catch (err: any) {
                            toast.error('Remittance processing failure: ' + err.message);
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    {({ values, handleChange, handleBlur, setFieldValue, errors, touched, submitCount }) => {
                        const hasAttempted = submitCount > 0;
                        return (
                            <Form className="p-6 grid grid-cols-1 md:grid-cols-4 gap-5 items-end">
                                <div>
                                    <label className="block font-bold text-gray-500 mb-1">Receipt Date:</label>
                                    <input type="date" name="processingDate" onChange={handleChange} value={values.processingDate} className="w-full rounded border border-stroke p-2 text-sm bg-white dark:bg-boxdark outline-none font-semibold text-black dark:text-white" />
                                </div>

                                <div className="relative space-y-1" ref={dropdownRef}>
                                    <label className="block font-bold text-primary mb-1">Search Outstanding Return Invoice: *</label>
                                    <input
                                        type="text"
                                        placeholder="🔍 Type Invoice # or Name..."
                                        value={searchQuery}
                                        onFocus={() => { if (!isEditMode) setIsDropdownOpen(true); }}
                                        onChange={(e) => {
                                            if (!isEditMode) {
                                                setSearchQuery(e.target.value);
                                                setIsDropdownOpen(true);
                                            }
                                        }}
                                        className={`w-full rounded border p-2 text-xs font-bold outline-none focus:border-primary ${isEditMode ? 'bg-gray-100 dark:bg-meta-4/20 text-gray-500 cursor-not-allowed' : 'bg-white dark:bg-boxdark text-black dark:text-white'} ${hasAttempted && errors.returnRowId ? 'border-red-500' : 'border-stroke dark:border-stroke'}`}
                                    />
                                    {isDropdownOpen && !isEditMode && (
                                        <div className="absolute left-0 right-0 top-full mt-1 bg-white dark:bg-boxdark border border-stroke dark:border-strokedark rounded shadow-2xl z-99999 max-h-44 overflow-y-auto scrollbar-thin">
                                            {filteredReturns.length === 0 ? (
                                                <div className="p-3 text-center text-xs text-gray-400 font-medium italic">No pending return options profiles.</div>
                                            ) : (
                                                filteredReturns.map(r => {
                                                    // --- ✅ CORE BALANCE COMPUTATION MATH TUNING ---
                                                    const remDue = Math.max(0, Number(r.total_amount || 0) - Number(r.payout_amount_paid || 0));
                                                    return (
                                                        <div
                                                            key={r.id}
                                                            onClick={() => {
                                                                setFieldValue('returnRowId', r.id);
                                                                setFieldValue('invoiceNoRef', r.original_invoice_no);
                                                                setFieldValue('customerName', r.customer_name);
                                                                setFieldValue('remainingBalanceMax', remDue);
                                                                setSearchQuery(`${r.original_invoice_no} (${r.customer_name})`);
                                                                setSelectedReturnDetails({
                                                                    totalAmount: Number(r.total_amount || 0),
                                                                    alreadyPaid: Number(r.payout_amount_paid || 0),
                                                                    remainingDue: remDue
                                                                });
                                                                setIsDropdownOpen(false);
                                                            }}
                                                            className="p-2.5 hover:bg-slate-100 dark:hover:bg-meta-4 cursor-pointer text-xs font-bold border-b border-stroke text-black dark:text-white"
                                                        >
                                                            📄 {r.original_invoice_no} - {r.customer_name} (Remaining Bal: Rs. {remDue.toLocaleString()})
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <label className="block font-bold text-gray-500 mb-1">Customer / Account Title:</label>
                                    <input type="text" name="customerName" disabled value={values.customerName} className="w-full rounded border border-stroke p-2 text-sm bg-gray-100 dark:bg-meta-4/20 text-gray-500 font-bold outline-none cursor-not-allowed" placeholder="Customer reference..." />
                                </div>

                                <div>
                                    <label className="block font-bold text-gray-500 mb-1">Settlement Mode Selector: *</label>
                                    <select name="settlementMode" value={values.settlementMode} onChange={handleChange} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-white dark:bg-boxdark outline-none font-black text-xs text-black dark:text-white focus:border-primary">
                                        <option value="Cash">Cash Ledger Account</option>
                                        <option value="Bank">Bank Account Wire Transfer</option>
                                    </select>
                                </div>

                                {values.settlementMode === 'Bank' && (
                                    <div className="md:col-span-2">
                                        <label className="block font-bold text-gray-500 mb-1">Choose Target Financial Bank Account: *</label>
                                        <select name="selectedBankTitle" value={values.selectedBankTitle} onChange={handleChange} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-white dark:bg-boxdark outline-none font-bold text-xs text-black dark:text-white focus:border-primary">
                                            <option value="">-- Choose Account Wire Registry --</option>
                                            {banksList.map(b => <option key={b.id} value={b.accountTitle}>{b.bankName} - {b.accountTitle}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className={values.settlementMode === 'Bank' ? 'md:col-span-2' : 'md:col-span-2'}>
                                    <label className="block font-bold text-danger mb-1">Remitted Cash Back Amount Paid (PKR): *</label>
                                    <input type="number" name="amountPaid" value={values.amountPaid} onKeyDown={blockInvalidChar} onChange={handleChange} placeholder="Type payment..." className={`w-full rounded border p-2 bg-transparent text-right font-black text-danger text-sm focus:border-primary outline-none text-black dark:text-white ${hasAttempted && errors.amountPaid ? 'border-red-500 bg-red-50' : 'border-stroke'}`} />
                                    {hasAttempted && errors.amountPaid && <p className="text-red-500 font-bold text-[10px] mt-1">⚠️ {String(errors.amountPaid)}</p>}
                                </div>

                                {values.returnRowId && (
                                    <div className="md:col-span-4 bg-gray-50 dark:bg-meta-4/20 p-3 rounded border border-stroke dark:border-strokedark font-mono text-[11px] grid grid-cols-3 text-center text-gray-500 dark:text-white">
                                        {/* --- ✅ TUNED BALANCE LOGIC: NOW SHOWING TRUE TAX-INCLUSIVE BALANCES --- */}
                                        <div>Total Return Value: <b className="block text-xs text-black dark:text-white">Rs. {Number(selectedReturnDetails.totalAmount).toLocaleString()}</b></div>
                                        <div>Already Refunded: <b className="block text-xs text-success">Rs. {Number(selectedReturnDetails.alreadyPaid).toLocaleString()}</b></div>
                                        <div>
                                            Remaining Return Cash Owed:
                                            <b className="block text-xs text-danger font-black">
                                                Rs. {Math.max(0, Number(selectedReturnDetails.remainingDue) - Number(values.amountPaid || 0)).toLocaleString()}
                                            </b>
                                        </div>
                                    </div>
                                )}

                                <div className="md:col-span-4 pt-4 mt-2 border-t border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4/5 p-4 rounded-sm">
                                    <button type="button" onClick={() => navigate('/sales/sales-return-receipt/list')} className="rounded border border-stroke dark:border-strokedark py-2 px-10 font-semibold text-sm text-black dark:text-white hover:bg-gray-100 transition cursor-pointer">Cancel</button>
                                    <button type="submit" disabled={loading} className="bg-success text-white py-2 px-12 rounded font-black text-sm hover:bg-opacity-90 transition shadow-sm cursor-pointer">{loading ? <Spinner /> : (isEditMode ? 'Modify Entry' : 'Save Record')}</button>
                                </div>
                            </Form>
                        );
                    }}
                </Formik>
            </div>
        </div>
    );
};  

export default SaleReturnReceiptAdd;
