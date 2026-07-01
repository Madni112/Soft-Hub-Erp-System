import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

const AddSalesReturn = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingInvoice, setFetchingInvoice] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const editData = location.state?.returnRecord;
  const isEditMode = !!editData;

  const [initialFormValues, setInitialFormValues] = useState({
    originalInvoiceNo: '',
    customerName: '',
    salesman: '',
    scenarioType: '',
    returnDate: new Date().toISOString().split('T')[0],
    returnType: 'On Credit',
    remarks: '',
    items: [{ itemName: '', location: '', rp: 0, mrp: 0, qty: 1, gstRate: 18, fTaxPer: 0, returnedQty: 1 }]
  });

  useEffect(() => {
    if (isEditMode && editData) {
      setInitialFormValues({
        originalInvoiceNo: editData.original_invoice_no || '',
        customerName: editData.customer_name || '',
        salesman: editData.salesman || '',
        scenarioType: editData.scenario_type || '',
        returnDate: editData.return_date || editData.created_at?.split('T')[0],
        returnType: editData.return_type || 'On Credit',
        remarks: editData.remarks || '',
        items: editData.items || []
      });
    }
  }, [editData, isEditMode]);
  const handleInvoiceLookup = async (invoiceId: string, setFieldValue: any) => {
    if (!invoiceId.trim()) return;

    try {
      setFetchingInvoice(true);
      const { data: invData, error } = await supabase
        .from('sales_invoices')
        .select('*')
        .eq('id', invoiceId)
        .single();

      if (error) {
        toast.error('Invoice not found in database record layers.');
        return;
      }

      if (invData) {
        toast.success('Original invoice found! Loading data...');
        setFieldValue('customerName', invData.customer_name || '');
        setFieldValue('salesman', invData.salesman || 'General');
        setFieldValue('scenarioType', invData.scenario_type || '');
        
        const mappedItems = (invData.items || []).map((item: any) => ({
          itemName: item.itemName || '',
          location: item.location || '',
          rp: Number(item.rp) || 0,
          mrp: Number(item.mrp) || 0,
          gstRate: Number(item.gstRate) || 0,
          fTaxPer: Number(item.fTaxPer) || 0,
          qty: Number(item.qty) || 1, 
          returnedQty: Number(item.qty) || 1 
        }));
        
        setFieldValue('items', mappedItems);
      }
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setFetchingInvoice(false);
    }
  };

  const validationSchema = Yup.object().shape({
    originalInvoiceNo: Yup.string().required('Original Invoice # is mandatory'),
    customerName: Yup.string().required('Required'),
    items: Yup.array().of(
      Yup.object().shape({
        itemName: Yup.string().required('Required'),
        returnedQty: Yup.number()
          .typeError('Must be a number')
          .min(1, 'Min 1')
          .required('Required')
      })
    ).min(1)
  });

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) => 
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  const generateUniqueReturnNo = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    return `CRN-${timestamp}-${randomCode}`;
  };
  return (
    <div className="mx-auto max-w-full">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-semibold text-black dark:text-white text-base">
            {isEditMode ? 'Modify Sales Return Debit Note' : 'Add New Sales Return'}
          </h3>
        </div>

        <Formik
          initialValues={initialFormValues}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            setLoading(true);

            let totalQty = 0;
            let totalAmountBeforeTax = 0;
            let totalGstAmount = 0;
            let totalNetAmt = 0;

            const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";

            values.items.forEach((item: any) => {
              const rQty = Number(item.returnedQty) || 0;
              const rp = Number(item.rp) || 0;
              const mrp = Number(item.mrp) || 0;
              const gstRate = Number(item.gstRate) || 0;
              const fTaxPer = Number(item.fTaxPer) || 0;

              const basePrice = isThirdSchedule ? mrp : rp;
              const lineAmount = basePrice * rQty;
              const lineGst = (lineAmount / 100) * gstRate;
              const lineFTax = (lineAmount / 100) * fTaxPer;

              totalQty += rQty;
              totalAmountBeforeTax += lineAmount;
              totalGstAmount += lineGst;
              totalNetAmt += (lineAmount + lineGst + lineFTax);
            });

            const databasePayload = {
              original_invoice_no: values.originalInvoiceNo,
              customer_name: values.customerName,
              salesman: values.salesman,
              scenario_type: values.scenarioType,
              return_date: values.returnDate,
              return_type: values.returnType,
              remarks: values.remarks,
              total_quantity: totalQty,
              total_amount: totalAmountBeforeTax,
              total_gst_amount: totalGstAmount,
              total_net_amount: totalNetAmt,
              items: values.items
            };

            try {
              if (isEditMode) {
                const { data: oldReturn } = await supabase.from('sales_returns').select('items').eq('id', editData.id).single();
                if (oldReturn?.items) {
                  for (const oldItem of oldReturn.items) {
                    const { data: p } = await supabase.from('products').select('current_stock').eq('product_name', oldItem.itemName).single();
                    if (p) await supabase.from('products').update({ current_stock: (Number(p.current_stock) || 0) - Number(oldItem.returnedQty) }).eq('product_name', oldItem.itemName);
                  }
                }
                const { error } = await supabase.from('sales_returns').update(databasePayload).eq('id', editData.id);
                if (error) throw error;
                for (const newItem of values.items) {
                  const { data: p } = await supabase.from('products').select('current_stock').eq('product_name', newItem.itemName).single();
                  if (p) await supabase.from('products').update({ current_stock: (Number(p.current_stock) || 0) + Number(newItem.returnedQty) }).eq('product_name', newItem.itemName);
                }
                toast.success('Sales Return Note updated successfully!');
              } else {
                const { error } = await supabase.from('sales_returns').insert([databasePayload]);
                if (error) throw error;
                for (const item of values.items) {
                  const { data: p } = await supabase.from('products').select('current_stock').eq('product_name', item.itemName).single();
                  if (p) await supabase.from('products').update({ current_stock: (Number(p.current_stock) || 0) + Number(item.returnedQty) }).eq('product_name', item.itemName);
                }
                toast.success('Sales Return Note saved and stock reverted successfully!');
              }
              navigate('/Sales-Return/Debit-Notes/List');
            } catch (err: any) {
              toast.error(err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ values, handleChange, setFieldValue }) => (
            <Form className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4 mb-6 text-sm">
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">Return No:</label>
                  <p className="text-primary font-bold text-sm">
                    {isEditMode ? `RTN-${String(editData.id).padStart(4, '0')}` : '(Auto Generated)'}
                  </p>
                </div>
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">Original Invoice No: *</label>
                  <div className="relative flex">
                    <input type="text" name="originalInvoiceNo" onChange={handleChange} onBlur={(e) => handleInvoiceLookup(e.target.value, setFieldValue)} value={values.originalInvoiceNo} className="w-full rounded border border-stroke p-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-xs font-bold" placeholder="Type Invoice ID (e.g. 12)" disabled={isEditMode} required />
                    {fetchingInvoice && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">Customer Name:</label>
                  <input type="text" name="customerName" readOnly value={values.customerName} className="w-full rounded border border-stroke p-2 bg-gray-100 dark:bg-meta-4 outline-none text-xs font-semibold text-gray-600 dark:text-gray-300" placeholder="Auto-populated" />
                </div>
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">Return Date:</label>
                  <input type="date" name="returnDate" onChange={handleChange} value={values.returnDate} className="w-full rounded border border-stroke p-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">Return Settlement:</label>
                  <select name="returnType" onChange={handleChange} value={values.returnType} className="w-full rounded border border-stroke p-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-xs">
                    <option value="On Credit">On Credit (Adjust Balance)</option>
                    <option value="Cash">Cash (Immediate Payback)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">Salesman:</label>
                  <input type="text" name="salesman" readOnly value={values.salesman} className="w-full rounded border border-stroke p-2 bg-gray-100 dark:bg-meta-4 outline-none text-xs text-gray-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">FBR Calculation Scenario Type:</label>
                  <input type="text" name="scenarioType" readOnly value={values.scenarioType} className="w-full rounded border border-stroke p-2 bg-gray-100 dark:bg-meta-4_30 outline-none text-xs text-gray-500 truncate" placeholder="Auto-filled target profile layout schema" />
                </div>
              </div>
              <div className="overflow-x-auto mb-6 border border-stroke dark:border-strokedark rounded-sm">
                <table className="w-full border-collapse text-[12px] text-center min-w-[1000px]">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-meta-4 text-black dark:text-white font-bold uppercase tracking-wider border-b border-stroke">
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-12">S.#</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark">Item Description</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-28">R.P</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-28">MRP</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-24">Sold Qty</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-28 bg-blue-50/50 dark:bg-meta-4/20 text-primary">Returned Qty</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-24">GST %</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-24">Tax Amt</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-32">Net Ret. Amount</th>
                      <th className="p-2">Line Status</th>
                    </tr>
                  </thead>
                  <FieldArray name="items">
                    {() => (
                      <tbody className="bg-white dark:bg-boxdark">
                        {values.items.map((item: any, index: number) => {
                          const rQty = Number(item.returnedQty) || 0;
                          const soldQty = Number(item.qty) || 0;
                          const rp = Number(item.rp) || 0;
                          const mrp = Number(item.mrp) || 0;
                          const gstRate = Number(item.gstRate) || 0;
                          const fTaxPer = Number(item.fTaxPer) || 0;
                          const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";
                          const basePrice = isThirdSchedule ? mrp : rp;
                          
                          const baseAmount = basePrice * rQty;
                          const gstAmount = (baseAmount / 100) * gstRate;
                          const fTaxAmount = (baseAmount / 100) * fTaxPer;
                          const netRowAmount = baseAmount + gstAmount + fTaxAmount;

                          return (
                            <tr key={index} className="border-b border-stroke dark:border-strokedark">
                              <td className="p-2 border-r border-stroke dark:border-strokedark font-medium bg-gray-50 dark:bg-meta-4/10">{index + 1}</td>
                              <td className="p-2 border-r border-stroke dark:border-strokedark font-semibold text-left text-black dark:text-white px-4">{item.itemName || 'No Product Loaded'}</td>
                              <td className="p-2 border-r border-stroke dark:border-strokedark text-gray-500">{rp.toFixed(2)}</td>
                              <td className="p-2 border-r border-stroke dark:border-strokedark text-gray-500">{mrp.toFixed(2)}</td>
                              <td className="p-2 border-r border-stroke dark:border-strokedark font-medium text-gray-600">{soldQty}</td>
                              <td className="p-1 border-r border-stroke dark:border-strokedark bg-blue-50/20">
                                <input type="number" name={`items.${index}.returnedQty`} onKeyDown={blockInvalidChar} onChange={(e) => { const val = Number(e.target.value); if (val > soldQty) { toast.error(`Cannot return more than originally sold (${soldQty})`); setFieldValue(`items.${index}.returnedQty`, soldQty); } else { handleChange(e); } }} value={item.returnedQty} className="w-20 p-1 border border-primary rounded text-center font-bold bg-transparent text-primary outline-none" disabled={!values.originalInvoiceNo} />
                              </td>
                              <td className="p-2 border-r border-stroke dark:border-strokedark text-gray-500">{gstRate}%</td>
                              <td className="p-2 border-r border-stroke dark:border-strokedark font-medium text-gray-500">{gstAmount.toFixed(2)}</td>
                              <td className="p-2 border-r border-stroke dark:border-strokedark font-bold text-black dark:text-white">{netRowAmount.toFixed(2)}</td>
                              <td className="p-2 text-gray-400 italic text-xs">Reverting Stock</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    )}
                  </FieldArray>
                </table>
              </div>

              <div className="flex flex-col md:flex-row justify-between items-start gap-6 mt-6 border-t border-stroke dark:border-strokedark pt-6">
                <div className="w-full md:w-1/2">
                  <label className="block text-xs font-semibold uppercase text-gray-500 mb-1">Return Reason / Internal Notes:</label>
                  <textarea name="remarks" rows={3} onChange={handleChange} value={values.remarks} className="w-full rounded border border-stroke p-3 text-xs outline-none focus:border-primary bg-transparent dark:border-strokedark" placeholder="Enter return conditions details..."></textarea>
                </div>
                <div className="w-full md:w-1/3 space-y-2 text-xs border border-stroke dark:border-strokedark rounded-sm p-4 bg-gray-50/50 dark:bg-meta-4/10">
                  <div className="flex justify-between border-b pb-1.5 dark:border-strokedark">
                    <span className="text-gray-600 dark:text-gray-400">Total Returned Items:</span>
                    <b className="text-danger text-sm font-bold">{values.items.reduce((sum: number, i: any) => sum + (Number(i.returnedQty) || 0), 0)}</b>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 dark:border-strokedark">
                    <span className="text-gray-600 dark:text-gray-400">Taxable Value Reverted:</span>
                    <b className="text-black dark:text-white text-sm">
                      {values.items.reduce((sum: number, i: any) => sum + ((values.scenarioType === "Sale of 3rd Schedule Goods" ? Number(i.mrp) : Number(i.rp)) * (Number(i.returnedQty) || 0)), 0).toFixed(2)}
                    </b>
                  </div>
                  <div className="flex justify-between border-b pb-1.5 dark:border-strokedark">
                    <span className="text-gray-600 dark:text-gray-400">Sales Tax Reverted:</span>
                    <b className="text-black dark:text-white text-sm">
                      {values.items.reduce((sum: number, i: any) => sum + (((values.scenarioType === "Sale of 3rd Schedule Goods" ? Number(i.mrp) : Number(i.rp)) * (Number(i.returnedQty) || 0) / 100) * (Number(i.gstRate) || 0)), 0).toFixed(2)}
                    </b>
                  </div>
                  <div className="flex justify-between pt-1 text-danger font-extrabold text-base uppercase tracking-tight">
                    <span>Total Balance Adjusted:</span>
                    <span>
                      {values.items.reduce((sum: number, i: any) => { const base = values.scenarioType === "Sale of 3rd Schedule Goods" ? Number(i.mrp) : Number(i.rp); const amt = base * (Number(i.returnedQty) || 0); return sum + (amt + ((amt / 100) * (Number(i.gstRate) || 0)) + ((amt / 100) * (Number(i.fTaxPer) || 0))); }, 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 border-t border-stroke pt-5 mt-6 dark:border-strokedark">
                <button type="submit" disabled={loading || !values.originalInvoiceNo} className="rounded bg-success py-2.5 px-10 font-medium text-white hover:bg-opacity-90 transition disabled:opacity-40 text-sm shadow-xs" >
                  {loading ? <Spinner /> : isEditMode ? 'Update Return' : 'Save Return Note'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddSalesReturn;
