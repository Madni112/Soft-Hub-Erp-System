import React, { useState, useEffect } from 'react';
import { FieldArray, Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../Context/supabaseClient';
import Spinner from '../../../ui/Spinner';
import { useNavigate, useParams } from 'react-router-dom';

const NewInvoice = () => {
  const navigate = useNavigate();
  const { id } = useParams(); 
  const isEditMode = !!id; 

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditMode);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]); 
  const [challanList, setChallanList] = useState<any[]>([]); // Tracks live delivery challans array

  const [invoiceData, setInvoiceData] = useState<any>({
    customerName: '',
    saleStatus: 'Confirm',
    paymentTerm: 'On Credit',
    saleDate: new Date().toISOString().split('T')[0],
    salesman: '',
    scenarioType: '',
    dcNo: '', // Maps to your database dc_no column
    whTaxPercentage: 0,
    selectedBank: '',
    bankAmount: 0,
    items: [{ extraDisAmt: 0, itemName: '', location: '', rp: 0, extraDiscPer: 0, mrp: 0, qty: 1, gstRate: 18, fTaxPer: 0, discAmt: 0, hsCode: '' }]
  });

  // Fetch Metadata, Invoice Record, Master Products, and Delivery Challans
  useEffect(() => {
    const fetchAllInvoiceMetadata = async () => {
      try {
        const { data: custData } = await supabase.from('customers').select('id, customerName');
        const { data: salesData } = await supabase.from('salesmen').select('id, name');
        const { data: prodData } = await supabase.from('products').select('id, product_name, retail_price, mrp, hs_code');
        const { data: dcData } = await supabase.from('delivery_challans').select('id, customer_name');

        if (custData) setCustomers(custData);
        if (salesData) setSalesmen(salesData);
        if (prodData) setProductList(prodData);
        if (dcData) setChallanList(dcData);

        if (isEditMode) {
          const { data: invData, error } = await supabase
            .from('sales_invoices')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;
          if (invData) {
            setInvoiceData({
              customerName: invData.customer_name || '',
              saleStatus: invData.sale_status || 'Confirm',
              paymentTerm: invData.payment_term || 'On Credit',
              saleDate: invData.sale_date || invData.created_at?.split('T')[0],
              salesman: invData.salesman || '',
              scenarioType: invData.scenario_type || '',
              dcNo: invData.dc_no || '',
              whTaxPercentage: invData.wh_tax_percentage || 0,
              selectedBank: invData.selected_bank || '',
              bankAmount: invData.bank_amount || 0,
              items: invData.items || [{ extraDisAmt: 0, itemName: '', location: '', rp: 0, extraDiscPer: 0, mrp: 0, qty: 1, gstRate: 18, fTaxPer: 0, discAmt: 0, hsCode: '' }]
            });
          }
        }
      } catch (err: any) {
        toast.error('Failed to load records: ' + err.message);
        navigate('/sales/list');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchAllInvoiceMetadata();
  }, [id, isEditMode, navigate]);

  const handleProductSelection = (selectedName: string, index: number, setFieldValue: any) => {
    const matchingProduct = productList.find(p => p.product_name === selectedName);
    if (matchingProduct) {
      setFieldValue(`items.${index}.itemName`, matchingProduct.product_name);
      setFieldValue(`items.${index}.rp`, Number(matchingProduct.retail_price) || 0);
      setFieldValue(`items.${index}.mrp`, Number(matchingProduct.mrp) || 0);
      setFieldValue(`items.${index}.hsCode`, matchingProduct.hs_code || '');
    }
  };

  const validationSchema = Yup.object().shape({
    customerName: Yup.string().required('Customer is required'),
    scenarioType: Yup.string().required('Scenario selection is mandatory'),
    items: Yup.array().of(
      Yup.object().shape({
        itemName: Yup.string().required('Required'),
        qty: Yup.number().typeError('Must be a number').min(1, 'Min 1').required('Required'),
      })
    ).min(1),
  });

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  if (initialLoading) {
    return (
      <div className="flex h-48 items-center justify-center"><Spinner /></div>
    );
  }

  return (
    <div className="mx-auto max-w-full">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

        <div className="flex items-center justify-between border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-medium text-black dark:text-white">
            {isEditMode ? 'Modify Sale Invoice' : 'Add Sale'}
          </h3>
          <button onClick={() => navigate('/sales/list')} className="text-sm font-medium text-primary hover:underline">
            {isEditMode ? 'Back to List' : 'See List'}
          </button>
        </div>

        <Formik
          initialValues={invoiceData}
          validationSchema={validationSchema}
          enableReinitialize={true} 
          onSubmit={async (values) => {
            setLoading(true);

            const totalNetAmt = values.items.reduce((acc: number, item: any) => {
              const qty = Number(item.qty) || 0;
              const rp = Number(item.rp) || 0;
              const mrp = Number(item.mrp) || 0;
              const gstRate = Number(item.gstRate) || 0;
              const extraDiscPer = Number(item.extraDiscPer) || 0;
              const fTaxPer = Number(item.fTaxPer) || 0;

              const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";
              
              let grossAmount = 0;
              let extraDisAmt = 0;
              let amount = 0;

              if (isThirdSchedule) {
                grossAmount = mrp * qty;
                extraDisAmt = ((rp * qty) / 100) * extraDiscPer;
                amount = grossAmount; 
              } else {
                grossAmount = rp * qty;
                extraDisAmt = (grossAmount / 100) * extraDiscPer;
                amount = grossAmount - extraDisAmt; 
              }

              const gst = (amount / 100) * gstRate;
              const ft = (amount / 100) * fTaxPer;

              return acc + (amount + gst + ft);
            }, 0);

            const databasePayload = {
              customer_name: values.customerName,
              sale_status: values.saleStatus,
              payment_term: values.paymentTerm,
              scenario_type: values.scenarioType,
              salesman: values.salesman,
              wh_tax_percentage: values.whTaxPercentage,
              selected_bank: values.selectedBank,
              bank_amount: values.bankAmount,
              total_amount: totalNetAmt,
              items: values.items,
              dc_no: values.dcNo // Saves linked delivery challan string directly
            };

            try {
              if (isEditMode) {
                const { error } = await supabase.from('sales_invoices').update(databasePayload).eq('id', id);
                if (error) throw error;
                toast.success('Sale Updated Successfully!');
              } else {
                const { error } = await supabase.from('sales_invoices').insert([databasePayload]);
                if (error) throw error;
                toast.success('Sale Saved Successfully!');
              }
              navigate('/sales/list');
            } catch (err: any) {
              toast.error(err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ values, handleChange, setFieldValue }) => {
            useEffect(() => {
              const isUnregistered = values.scenarioType === "Goods at Standard Rate to Unregistered Buyers";
              values.items.forEach((_item: any, idx: number) => {
                setFieldValue(`items.${idx}.fTaxPer`, isUnregistered ? 3 : 0);
              });
            }, [values.scenarioType, setFieldValue]);

            return (
              <Form className="p-4">

                {/* ROW 1: Header Info */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium mb-1">Invoice #:</label>
                    <p className="text-primary font-bold text-sm">
                      {isEditMode ? `INV-${String(id).padStart(4, '0')}` : '(Auto Generated)'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Sale Status:</label>
                    <select name="saleStatus" onChange={handleChange} value={values.saleStatus} className="w-full rounded border border-stroke p-2 text-sm bg-transparent dark:border-strokedark">
                      <option value="Confirm">Confirm</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Payment Term:</label>
                    <select name="paymentTerm" onChange={handleChange} value={values.paymentTerm} className="w-full rounded border border-stroke p-2 text-sm bg-transparent dark:border-strokedark">
                      <option value="On Credit">On Credit</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Sale Date:</label>
                    <input type="date" name="saleDate" onChange={handleChange} value={values.saleDate} className="w-full rounded border border-stroke p-2 text-sm bg-transparent dark:border-strokedark" />
                  </div>
                </div>

                {/* ROW 2: Selections */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                  <div>
                    {/* UPDATED: LINK DELIVERY CHALLAN SELECT DROPDOWN */}
                    <label className="block text-xs font-medium mb-1 text-primary font-bold">Link Delivery Challan:</label>
                    <select 
                      name="dcNo" 
                      onChange={(e) => {
                        handleChange(e);
                        const chosenDc = challanList.find(c => c.id.toString() === e.target.value);
                        if (chosenDc) {
                          setFieldValue('customerName', chosenDc.customer_name);
                        }
                      }} 
                      value={values.dcNo} 
                      className="w-full rounded border border-primary p-2 text-sm bg-blue-50/20 dark:bg-meta-4 outline-none focus:border-primary text-black dark:text-white font-semibold"
                    >
                      <option value="">-- Direct Sale (No Challan) --</option>
                      {challanList.map(dc => (
                        <option key={dc.id} value={dc.id}>
                          {`DC-${String(dc.id).padStart(4, '0')} (${dc.customer_name})`}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Customer Name:</label>
                    <select name="customerName" onChange={handleChange} value={values.customerName} className="w-full rounded border border-stroke p-2 text-sm bg-transparent dark:border-strokedark">
                      <option value="">-- Select Customer --</option>
                      {customers.map(c => <option key={c.id} value={c.customerName}>{c.customerName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Salesman:</label>
                    <select name="salesman" onChange={handleChange} value={values.salesman} className="w-full rounded border border-stroke p-2 text-sm bg-transparent dark:border-strokedark">
                      <option value="">-- Select Salesman --</option>
                      {salesmen.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Scenario Type:</label>
                    <select name="scenarioType" onChange={handleChange} value={values.scenarioType} className="w-full rounded border border-stroke p-2 text-sm bg-transparent dark:border-strokedark">
                      <option value="" disabled>-- Select Scenario Type --</option>
                      <option value="Goods at Standard Rate to Registered Buyers">Goods at Standard Rate to Registered Buyers</option>
                      <option value="Goods at Standard Rate to Unregistered Buyers">Goods at Standard Rate to Unregistered Buyers (Includes 3% Further Tax)</option>
                      <option value="Sale of 3rd Schedule Goods">Sale of 3rd Schedule Goods (Tax on MRP)</option>
                      <option value="Zero Rated Sale">Zero Rated Sale</option>
                    </select>
                  </div>
                </div>

                {/* TABLE: Line Items */}
                <div className="overflow-x-auto mb-6">
                  <table className="w-full border-collapse border border-stroke text-[12px] dark:border-strokedark">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-meta-4 text-center font-bold uppercase">
                        <th className="border p-1 w-6">S#</th>
                        <th className="border p-1 min-w-[200px]">Item Name</th>
                        <th className="border p-1 w-24">HS Code</th>
                        <th className="border p-1 w-20">Location</th>
                        <th className="border p-2 w-20">R.P</th>
                        <th className="border p-1 w-16">Ex.Dis %</th>
                        <th className="border p-1 w-20">Ex.Dis Amt</th>
                        <th className="border p-1 w-20">MRP</th>
                        <th className="border p-1 w-16">Qty</th>
                        <th className="border p-1 w-24">Gross Amt</th>
                        <th className="border p-1 w-16">GST %</th>
                        <th className="border p-1 w-20">GST Amt</th>
                        <th className="border p-1 w-24">Amount</th>
                        <th className="border p-1 w-16">F.Tax %</th>
                        <th className="border p-1 w-20">F.Tax Amt</th>
                        <th className="border p-1 w-28">Net Amount</th>
                        <th className="border p-1 w-6">Action</th>
                      </tr>
                    </thead>
                    <FieldArray name="items">
                      {({ push, remove }) => (
                        <tbody>
                          {values.items.map((item: any, index: number) => {
                            const qty = Number(item.qty) || 0;
                            const mrp = Number(item.mrp) || 0;
                            const rp = Number(item.rp) || 0;
                            const gstRate = Number(item.gstRate) || 0;
                            const extraDiscPer = Number(item.extraDiscPer) || 0;
                            const fTaxPer = Number(item.fTaxPer) || 0;

                            const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";

                            let grossAmount = 0;
                            let extraDisAmt = 0;
                            let amount = 0;

                            if (isThirdSchedule) {
                              grossAmount = mrp * qty;
                              extraDisAmt = ((rp * qty) / 100) * extraDiscPer; 
                              amount = grossAmount; 
                            } else {
                              grossAmount = rp * qty;
                              extraDisAmt = (grossAmount / 100) * extraDiscPer;
                              amount = grossAmount - extraDisAmt; 
                            }

                            const gstAmt = (amount / 100) * gstRate;
                            const fTaxAmt = (amount / 100) * fTaxPer;
                            const netAmt = amount + gstAmt + fTaxAmt;

                            return (
                              <tr key={index} className="text-center bg-white dark:bg-boxdark">
                                <td className="border p-1">{index + 1}</td>
                                <td className="border p-1">
                                  <select 
                                    name={`items.${index}.itemName`}
                                    onChange={(e) => handleProductSelection(e.target.value, index, setFieldValue)}
                                    value={item.itemName}
                                    className="w-full px-1 outline-none bg-transparent font-semibold text-black dark:text-white"
                                  >
                                    <option value="">-- Choose Item --</option>
                                    {productList.map(p => <option key={p.id} value={p.product_name}>{p.product_name}</option>)}
                                  </select>
                                </td>
                                <td className="border p-1 text-gray-400 font-mono">{item.hsCode || '-'}</td>
                                <td className="border p-1"><input name={`items.${index}.location`} onChange={handleChange} value={item.location} className="w-full text-center outline-none bg-transparent" placeholder="WH-1" /></td>
                                <td className="border p-1 text-gray-500 font-bold">{rp.toFixed(2)}</td>
                                <td className="border p-1"><input type="number" name={`items.${index}.extraDiscPer`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.extraDiscPer} className="w-full text-center outline-none bg-transparent border border-gray-200 dark:border-strokedark rounded" /></td>
                                <td className="border p-1 text-gray-400">{extraDisAmt.toFixed(2)}</td>
                                <td className="border p-1 text-gray-500">{mrp.toFixed(2)}</td>
                                <td className="border p-1"><input type="number" name={`items.${index}.qty`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.qty} className="w-full text-center outline-none bg-transparent font-bold border border-gray-300 dark:border-strokedark rounded" /></td>
                                <td className="border p-1 font-medium text-gray-600">{grossAmount.toFixed(2)}</td>
                                <td className="border p-1"><input type="number" name={`items.${index}.gstRate`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.gstRate} className="w-full text-center outline-none bg-transparent" /></td>
                                <td className="border p-1 text-gray-400">{gstAmt.toFixed(2)}</td>
                                <td className="border p-1 font-medium text-gray-600">{amount.toFixed(2)}</td>
                                <td className="border p-1 text-gray-400 font-bold">{fTaxPer}%</td>
                                <td className="border p-1 text-gray-400">{fTaxAmt.toFixed(2)}</td>
                                <td className="border p-1 text-black dark:text-white font-black bg-slate-50/50">{netAmt.toFixed(2)}</td>
                                <td className="border p-1 text-center">
                                  <button type="button" onClick={() => remove(index)} className="text-red-500 font-bold hover:scale-110 transition">✕</button>
                                </td>
                              </tr>
                            );
                          })}
                          <tr>
                            <td colSpan={17} className="p-2 text-left ">
                              <button type="button" onClick={() => push({ itemName: '', location: '', rp: 0, extraDiscPer: 0, mrp: 0, qty: 1, gstRate: 18, fTaxPer: values.scenarioType === "Goods at Standard Rate to Unregistered Buyers" ? 3 : 0, hsCode: '' })} className="text-success  font-bold hover:underline">+ Add Item Line</button>
                            </td>
                          </tr>
                        </tbody>
                      )}
                    </FieldArray>
                  </table>
                </div>

                {/* ===== CALCULATIONS TOTALS PANEL AND SUMMARY BLOCK ===== */}
                <div className="flex flex-col md:flex-row justify-end gap-10 mt-6 px-4">
                  <div className="flex flex-col gap-6 w-full md:w-1/2">
                    <div className="flex items-center justify-end gap-2 text-sm">
                      <label className="font-medium">WH Tax %:</label>
                      <input type="number" name="whTaxPercentage" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.whTaxPercentage} className="w-20 border p-1 outline-none bg-transparent border-stroke focus:border-primary dark:border-strokedark" />
                    </div>
                    <div className="flex items-center justify-end gap-2 text-sm ">
                      <label className="font-medium ml-4">WH Tax Amount:</label>
                      <input 
                        type="text" 
                        readOnly 
                        value={(() => {
                          const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";
                          const totalBaseTaxableAmt = values.items.reduce((acc: number, item: any) => {
                            const qty = Number(item.qty) || 0;
                            const rp = Number(item.rp) || 0;
                            const mrp = Number(item.mrp) || 0;
                            const extraDiscPer = Number(item.extraDiscPer) || 0;
                            
                            let amount = 0;
                            if (isThirdSchedule) {
                              amount = mrp * qty;
                            } else {
                              const gross = rp * qty;
                              const disc = (gross / 100) * extraDiscPer;
                              amount = gross - disc;
                            }
                            return acc + amount;
                          }, 0);
                          return ((totalBaseTaxableAmt / 100) * (values.whTaxPercentage || 0)).toFixed(2);
                        })()} 
                        className="w-32 border-b-2 border-stroke p-1 outline-none bg-transparent dark:border-strokedark text-right font-medium" 
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2 mt-4">
                      <select name="selectedBank" onChange={handleChange} value={values.selectedBank} className="flex-1 border border-stroke p-2 text-sm rounded outline-none focus:border-primary bg-transparent dark:border-strokedark">
                        <option value="">-- Select Bank Account --</option>
                      </select>
                      <input type="number" name="bankAmount" onChange={handleChange} value={values.bankAmount} className="w-24 border border-stroke p-2 text-sm rounded outline-none font-bold bg-transparent dark:border-strokedark" />
                    </div>
                  </div>

                  <div className="w-full md:w-1/4 space-y-1 text-xs">
                    <div className="flex justify-between border-b pb-1 dark:border-strokedark">
                      <span>Total Quantity:</span>
                      <b className="text-success text-sm">{(values.items.reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0)).toFixed(2)}</b>
                    </div>
                    <div className="flex justify-between border-b pb-1 dark:border-strokedark">
                      <span>Total Taxable Amount:</span>
                      <b className="text-success text-sm">
                        {(() => {
                          const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";
                          return values.items.reduce((acc: number, item: any) => {
                            const qty = Number(item.qty) || 0;
                            const rp = Number(item.rp) || 0;
                            const mrp = Number(item.mrp) || 0;
                            const extraDiscPer = Number(item.extraDiscPer) || 0;
                            
                            let amount = 0;
                            if (isThirdSchedule) {
                              amount = mrp * qty;
                            } else {
                              const gross = rp * qty;
                              const disc = (gross / 100) * extraDiscPer;
                              amount = gross - disc;
                            }
                            return acc + amount;
                          }, 0).toFixed(2);
                        })()}
                      </b>
                    </div>
                    <div className="flex justify-between border-b pb-1 dark:border-strokedark">
                      <span>Total GST Amount:</span>
                      <b className="text-success text-sm">
                        {(() => {
                          const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";
                          return values.items.reduce((acc: number, item: any) => {
                            const qty = Number(item.qty) || 0;
                            const rp = Number(item.rp) || 0;
                            const mrp = Number(item.mrp) || 0;
                            const extraDiscPer = Number(item.extraDiscPer) || 0;
                            const gstRate = Number(item.gstRate) || 0;
                            
                            let amount = 0;
                            if (isThirdSchedule) {
                              amount = mrp * qty;
                            } else {
                              const gross = rp * qty;
                              const disc = (gross / 100) * extraDiscPer;
                              amount = gross - disc;
                            }
                            return acc + ((amount / 100) * gstRate);
                          }, 0).toFixed(2);
                        })()}
                      </b>
                    </div>
                    <div className="flex justify-between border-b pb-1 dark:border-strokedark">
                      <span>Total Discount:</span>
                      <b className="text-success text-sm">
                        {values.items.reduce((acc: number, item: any) => {
                          const qty = Number(item.qty) || 0;
                          const rp = Number(item.rp) || 0;
                          const extraDiscPer = Number(item.extraDiscPer) || 0;
                          const gross = rp * qty;
                          return acc + ((gross / 100) * extraDiscPer);
                        }, 0).toFixed(2)}
                      </b>
                    </div>
                    <div className="flex justify-between border-b pb-1 dark:border-strokedark">
                      <span>Total Further Tax Amount:</span>
                      <b className="text-success text-sm">
                        {(() => {
                          const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";
                          return values.items.reduce((acc: number, item: any) => {
                            const qty = Number(item.qty) || 0;
                            const rp = Number(item.rp) || 0;
                            const mrp = Number(item.mrp) || 0;
                            const extraDiscPer = Number(item.extraDiscPer) || 0;
                            const fTaxPer = Number(item.fTaxPer) || 0;
                            
                            let amount = 0;
                            if (isThirdSchedule) {
                              amount = mrp * qty;
                            } else {
                              const gross = rp * qty;
                              const disc = (gross / 100) * extraDiscPer;
                              amount = gross - disc;
                            }
                            return acc + ((amount / 100) * fTaxPer);
                          }, 0).toFixed(2);
                        })()}
                      </b>
                    </div>
                    <div className="flex justify-between pt-2 text-success font-bold text-base border-t border-stroke dark:border-strokedark">
                      <span>Total Net Amount:</span>
                      <span>
                        {(() => {
                          const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";
                          return values.items.reduce((acc: number, item: any) => {
                            const qty = Number(item.qty) || 0;
                            const rp = Number(item.rp) || 0;
                            const mrp = Number(item.mrp) || 0;
                            const gstRate = Number(item.gstRate) || 0;
                            const extraDiscPer = Number(item.extraDiscPer) || 0;
                            const fTaxPer = Number(item.fTaxPer) || 0;

                            let amount = 0;
                            if (isThirdSchedule) {
                              amount = mrp * qty;
                            } else {
                              const gross = rp * qty;
                              const disc = (gross / 100) * extraDiscPer;
                              amount = gross - disc;
                            }

                            const gst = (amount / 100) * gstRate;
                            const ft = (amount / 100) * fTaxPer;
                            return acc + (amount + gst + ft);
                          }, 0).toFixed(2);
                        })()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-6.5">
                  <button type="submit" disabled={loading} className="bg-success text-white py-2.5 px-10 rounded font-medium hover:bg-opacity-90 transition shadow-sm" >
                    {loading ? <Spinner /> : isEditMode ? 'Update Invoice' : 'Save Record'}
                  </button>
                </div>

              </Form>
            );
          }}
        </Formik>

      </div>
    </div>
  );
};

export default NewInvoice;
