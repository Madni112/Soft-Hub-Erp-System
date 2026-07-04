import React, { useState, useEffect } from 'react';
import { FieldArray, Formik, Form } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../Context/supabaseClient';
import Spinner from '../../../ui/Spinner';
import { useNavigate, useLocation } from 'react-router-dom';

const NewInvoice = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const editData = location.state?.invoice;
  const isEditMode = !!editData;
  const id = editData?.id;

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [salesmen, setSalesmen] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]);
  const [challanList, setChallanList] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [invoiceData, setInvoiceData] = useState<any>({
    customerName: editData?.customer_name || '',
    saleStatus: editData?.sale_status || 'Confirm',
    saleDate: editData?.sale_date || new Date().toISOString().split('T')[0],
    salesman: editData?.salesman || '',
    scenarioType: editData?.scenario_type || '',
    paymentTerm: editData?.payment_term || 'On Credit',
    dcNo: editData?.dc_no || '',
    whTaxPercentage: editData?.wh_tax_percentage || 0,
    cashAmountPaid: editData?.cash_amount_paid || 0,
    dispatchWarehouse: editData?.dispatch_warehouse || '',
    bankPayments: editData?.bankPayments || editData?.bank_payments || [{ selectedBank: '', bankAmount: 0 }],
    items: editData?.items || [{ extraDisAmt: 0, itemName: '', location: '', rp: 0, extraDiscPer: 0, mrp: 0, qty: 1, gstRate: 18, fTaxPer: 0, discAmt: 0, hsCode: '', availableQty: 0 }]
  });
  useEffect(() => {
    const fetchAllInvoiceMetadata = async () => {
      try {
        setInitialLoading(true);
        const { data: custData } = await supabase.from('customers').select('id, customerName');
        const { data: salesData } = await supabase.from('salesmen').select('id, name');
        const { data: prodData } = await supabase.from('products').select('id, product_name, retail_price, mrp, hs_code');
        const { data: dcData } = await supabase.from('delivery_challans').select('id, customer_name');
        const { data: bankData } = await supabase.from('banks').select('id, bankName, accountTitle');
        const { data: whData } = await supabase.from('inventory_locations').select('id, name').order('name', { ascending: true });

        if (custData) setCustomers(custData);
        if (salesData) setSalesmen(salesData);
        if (prodData) setProductList(prodData);
        if (dcData) setChallanList(dcData);
        if (bankData) setBanks(bankData);
        if (whData) setWarehouses(whData);
      } catch (err: any) {
        toast.error('Failed to load records: ' + err.message);
        navigate('/sales/invoice/list');
      } finally {
        setInitialLoading(false);
      }
    };
    fetchAllInvoiceMetadata();
  }, [navigate]);

  const handleProductSelectionWithWH = async (selectedName: string, index: number, chosenWarehouse: string, setFieldValue: any) => {
    const matchingProduct = productList.find(p => p.product_name === selectedName);
    if (!matchingProduct) {
      setFieldValue(`items.${index}.itemName`, '');
      setFieldValue(`items.${index}.availableQty`, 0);
      return;
    }

    setFieldValue(`items.${index}.itemName`, matchingProduct.product_name);
    setFieldValue(`items.${index}.rp`, Number(matchingProduct.retail_price) || 0);
    setFieldValue(`items.${index}.mrp`, Number(matchingProduct.mrp) || 0);
    setFieldValue(`items.${index}.hsCode`, matchingProduct.hs_code || '');

    if (!chosenWarehouse) {
      setFieldValue(`items.${index}.availableQty`, 0);
      return;
    }

    try {
      const { data: whStock, error } = await supabase
        .from('warehouse_inventory')
        .select('quantity')
        .eq('product_name', selectedName)
        .eq('warehouse_name', chosenWarehouse)
        .maybeSingle();

      if (error) throw error;
      setFieldValue(`items.${index}.availableQty`, whStock ? Number(whStock.quantity) : 0);
    } catch (err: any) {
      console.error(err.message);
      setFieldValue(`items.${index}.availableQty`, 0);
    }
  };
  const validationSchema = Yup.object().shape({
    customerName: Yup.string().required('Customer name selector cannot be left empty!'),
    scenarioType: Yup.string().required('Scenario type field selection is mandatory!'),
    dispatchWarehouse: Yup.string().required('Please choose the dispatch source warehouse partition location!'),
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
    return <div className="flex h-48 items-center justify-center"><Spinner /></div>;
  }
  return (
    <div className="mx-auto max-w-full text-black dark:text-bodydark text-xs">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex items-center justify-between border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-semibold text-black dark:text-white text-base">
            {isEditMode ? 'Modify Sale Invoice' : 'Add Sale'}
          </h3>
          <button onClick={() => navigate('/sales/invoice/list')} className="text-sm font-medium text-primary hover:underline">
            {isEditMode ? 'Back to List' : 'See List'}
          </button>
        </div>

        <Formik
          initialValues={invoiceData}
          validationSchema={validationSchema}
          enableReinitialize={true}
          onSubmit={async (values) => {
            const baseTotal = values.items.reduce((acc: number, item: any) => {
              const qty = Number(item.qty) || 0;
              const rp = Number(item.rp) || 0;
              const mrp = Number(item.mrp) || 0;
              const gstRate = Number(item.gstRate) || 0;
              const extraDiscPer = Number(item.extraDiscPer) || 0;
              const fTaxPer = Number(item.fTaxPer) || 0;
              const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";

              let amount = (rp * qty) - (((rp * qty) / 100) * extraDiscPer);
              amount = Math.max(0, amount);

              const gstBase = isThirdSchedule ? (mrp * qty) : amount;
              return acc + (amount + ((gstBase / 100) * gstRate) + ((amount / 100) * fTaxPer));
            }, 0);

            const whTaxAmt = (baseTotal / 100) * (values.whTaxPercentage || 0);
            const totalNetAmt = baseTotal - whTaxAmt;

            const cashPaid = Number(values.cashAmountPaid) || 0;
            const bankPaid = values.bankPayments.reduce((acc: number, curr: any) => acc + (Number(curr.bankAmount) || 0), 0);
            const collectivePaymentPaid = cashPaid + bankPaid;

            if (collectivePaymentPaid > totalNetAmt + 0.01) {
              toast.error(`Validation Error: Overpayment blocked! Total entered payments (Rs. ${collectivePaymentPaid.toLocaleString()}) cannot be greater than the Net Invoice Total (Rs. ${totalNetAmt.toLocaleString()}).`);
              return;
            }

            for (const item of values.items) {
              const { data: activeStock } = await supabase
                .from('warehouse_inventory')
                .select('quantity')
                .eq('product_name', item.itemName)
                .eq('warehouse_name', values.dispatchWarehouse)
                .maybeSingle();

              const availableQty = activeStock ? Number(activeStock.quantity) : 0;
              if (availableQty < Number(item.qty)) {
                toast.error(`Stock Error: "${item.itemName}" only has ${availableQty} units resting inside "${values.dispatchWarehouse}" warehouse partition.`);
                return;
              }
            }

            const databasePayload = {
              customer_name: values.customerName,
              sale_status: values.saleStatus,
              receipt_status: values.saleStatus,
              payment_term: values.paymentTerm,
              scenario_type: values.scenarioType,
              salesman: values.salesman,
              wh_tax_percentage: values.whTaxPercentage,
              bankPayments: values.bankPayments.filter((p: any) => (Number(p.bankAmount) || 0) > 0),
              total_amount: totalNetAmt,
              items: values.items,
              dc_no: values.dcNo,
              cash_amount_paid: cashPaid,
              dispatch_warehouse: values.dispatchWarehouse
            };

            try {
              setLoading(true);
              if (isEditMode) {
                const { data: oldInv } = await supabase.from('sales_invoices').select('items, dispatch_warehouse').eq('id', id).single();
                if (oldInv?.items) {
                  for (const oldItem of oldInv.items) {
                    const { data: p } = await supabase.from('warehouse_inventory').select('id, quantity').eq('product_name', oldItem.itemName).eq('warehouse_name', oldInv.dispatch_warehouse).maybeSingle();
                    if (p) await supabase.from('warehouse_inventory').update({ quantity: Number(p.quantity) + Number(oldItem.qty) }).eq('id', p.id);
                  }
                }
                const { error } = await supabase.from('sales_invoices').update(databasePayload).eq('id', id);
                if (error) throw error;
                for (const newItem of values.items) {
                  const { data: p } = await supabase.from('warehouse_inventory').select('id, quantity').eq('product_name', newItem.itemName).eq('warehouse_name', values.dispatchWarehouse).maybeSingle();
                  if (p) await supabase.from('warehouse_inventory').update({ quantity: Number(p.quantity) - Number(newItem.qty) }).eq('id', p.id);
                }
                toast.success('Sale Updated and Stock Reconciled!');
              } else {
                const { error } = await supabase.from('sales_invoices').insert([databasePayload]);
                if (error) throw error;
                for (const item of values.items) {
                  const { data: p } = await supabase.from('warehouse_inventory').select('id, quantity').eq('product_name', item.itemName).eq('warehouse_name', values.dispatchWarehouse).maybeSingle();
                  if (p) await supabase.from('warehouse_inventory').update({ quantity: Number(p.quantity) - Number(item.qty) }).eq('id', p.id);
                }
                toast.success('Sale Saved and Partition Stock Deducted!');
              }
              navigate('/sales/invoice/list');
            } catch (err: any) {
              toast.error(err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ values, handleChange, setFieldValue, errors, touched }) => {
            React.useEffect(() => {
              const isUnregistered = values.scenarioType === "Goods at Standard Rate to Unregistered Buyers";
              values.items.forEach((_item: any, idx: number) => {
                setFieldValue(`items.${idx}.fTaxPer`, isUnregistered ? 3 : 0);
              });
            }, [values.scenarioType, setFieldValue]);

            return (
              <Form className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <label className="block text-xs font-medium mb-1">Invoice #:</label>
                    <p className="text-primary font-bold text-sm">
                      {isEditMode ? `INV-${String(id).padStart(4, '0')}` : '(Auto Generated)'}
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Sale Status:</label>
                    <select name="saleStatus" onChange={handleChange} value={values.saleStatus} className="w-full rounded border border-stroke p-2 text-sm bg-white dark:bg-boxdark text-black dark:text-white dark:border-strokedark font-semibold">
                      <option value="Confirm">Confirm</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Payment Term:</label>
                    <select name="paymentTerm" onChange={handleChange} value={values.paymentTerm} className="w-full rounded border border-stroke p-2 text-sm bg-white dark:bg-boxdark text-black dark:text-white dark:border-strokedark font-semibold">
                      <option value="On Credit">On Credit</option>
                      <option value="Cash">Cash</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Sale Date:</label>
                    <input type="date" name="saleDate" onChange={handleChange} value={values.saleDate} className="w-full rounded border border-stroke p-2 text-sm bg-white dark:bg-boxdark text-black dark:text-white dark:border-strokedark font-semibold" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
                  <div>
                    <label className="block text-xs font-medium mb-1 text-primary font-bold">Link Delivery Challan:</label>
                    <select
                      name="dcNo"
                      onChange={(e) => {
                        handleChange(e);
                        const chosenDc = challanList.find(c => c.id.toString() === e.target.value);
                        if (chosenDc) setFieldValue('customerName', chosenDc.customer_name);
                      }}
                      value={values.dcNo}
                      className="w-full rounded border border-stroke p-2 text-sm bg-white dark:bg-boxdark text-black dark:text-white dark:border-strokedark font-semibold outline-none"
                    >
                      <option value="">-- Direct Sale (No Challan) --</option>
                      {challanList.map(dc => (
                        <option key={dc.id} value={dc.id}>{`DC-${String(dc.id).padStart(4, '0')} (${dc.customer_name})`}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Customer Name: *</label>
                    <select
                      name="customerName"
                      onChange={handleChange}
                      value={values.customerName}
                      className={`w-full rounded border p-2 text-sm text-black dark:text-white font-semibold outline-none transition-all ${submitAttempted && errors.customerName ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-stroke dark:border-strokedark bg-white dark:bg-boxdark'}`}
                    >
                      <option value="">-- Select Customer --</option>
                      {customers.map(c => <option key={c.id} value={c.customerName}>{c.customerName}</option>)}
                    </select>
                    {submitAttempted && errors.customerName && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">⚠️ {String(errors.customerName)}</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Dispatch Warehouse (From): *</label>
                    <select
                      name="dispatchWarehouse"
                      value={values.dispatchWarehouse}
                      onChange={async (e) => {
                        const selectedWH = e.target.value;
                        setFieldValue('dispatchWarehouse', selectedWH);
                        if (values.items && values.items.length > 0) {
                          for (let idx = 0; idx < values.items.length; idx++) {
                            const rowItem = values.items[idx];
                            if (rowItem.itemName) {
                              const { data: stockRecord } = await supabase.from('warehouse_inventory').select('quantity').eq('product_name', rowItem.itemName).eq('warehouse_name', selectedWH).maybeSingle();
                              setFieldValue(`items.${idx}.availableQty`, stockRecord ? Number(stockRecord.quantity) : 0);
                            }
                          }
                        }
                      }}
                      className={`w-full rounded border p-2 text-sm bg-white dark:bg-boxdark text-black dark:text-white font-bold outline-none focus:border-primary ${submitAttempted && errors.dispatchWarehouse ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-stroke dark:border-strokedark'}`}
                    >
                      <option value="">-- Choose Stock Bin --</option>
                      {warehouses.map(w => <option key={w.id} value={w.name}>{w.name}</option>)}
                    </select>
                    {submitAttempted && errors.dispatchWarehouse && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">⚠️ Required</p>}
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Salesman:</label>
                    <select name="salesman" onChange={handleChange} value={values.salesman} className="w-full rounded border border-stroke p-2 text-sm bg-white dark:bg-boxdark text-black dark:text-white dark:border-strokedark font-semibold">
                      <option value="">-- Select Salesman --</option>
                      {salesmen.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">Scenario Type: *</label>
                    <select
                      name="scenarioType"
                      onChange={handleChange}
                      value={values.scenarioType}
                      className={`w-full rounded border p-2 text-sm text-black dark:text-white font-semibold outline-none transition-all ${submitAttempted && errors.scenarioType ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : 'border-stroke dark:border-strokedark bg-white dark:bg-boxdark'}`}
                    >
                      <option value="">-- Select Scenario Type --</option>
                      <option value="Goods at Standard Rate to Registered Buyers">Goods at Standard Rate to Registered Buyers</option>
                      <option value="Goods at Standard Rate to Unregistered Buyers">Goods at Standard Rate to Unregistered Buyers</option>
                      <option value="Sale of 3rd Schedule Goods">Sale of 3rd Schedule Goods</option>
                      <option value="Zero Rated Sale">Zero Rated Sale</option>
                    </select>
                    {submitAttempted && errors.scenarioType && <p className="text-[10px] text-red-500 font-bold mt-1 ml-1">⚠️ {String(errors.scenarioType)}</p>}
                  </div>
                </div>
                <div className="w-full overflow-x-auto rounded-sm border border-stroke dark:border-strokedark mb-6 whitespace-nowrap">
                  <table className="w-full border-collapse text-[12px] min-w-[1450px] table-fixed">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-meta-4 text-center font-bold uppercase text-black dark:text-white border-b border-stroke dark:border-strokedark">
                        <th className="p-2 w-[40px] text-center">S#</th>
                        <th className="p-2 w-[220px] text-left">Item Name</th>
                        <th className="p-2 w-[110px] text-center bg-success/10 text-success font-black">Live WH Bal</th>
                        <th className="p-2 w-[80px] text-center">HS Code</th>
                        <th className="p-2 w-[80px] text-center">Location</th>
                        <th className="p-2 w-[100px] text-right pr-2">R.P</th>
                        <th className="p-2 w-[70px] text-center">Ex.Dis %</th>
                        <th className="p-2 w-[100px] text-right pr-2">Ex.Dis Amt</th>
                        <th className="p-2 w-[90px] text-right pr-2">MRP</th>
                        <th className="p-2 w-[70px] text-center">Qty</th>
                        <th className="p-2 w-[110px] text-right pr-2">Gross Amt</th>
                        <th className="p-2 w-[70px] text-center">GST %</th>
                        <th className="p-2 w-[100px] text-right pr-2">GST Amt</th>
                        <th className="p-2 w-[110px] text-right pr-2">Amount</th>
                        <th className="p-2 w-[70px] text-center">F.Tax %</th>
                        <th className="p-2 w-[100px] text-right pr-2">F.Tax Amt</th>
                        <th className="p-2 w-[120px] text-right pr-2">Net Amount</th>
                        <th className="p-2 w-[50px] text-center">Action</th>
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

                            let grossAmount = rp * qty;
                            let extraDisAmt = (grossAmount / 100) * extraDiscPer;
                            let amount = Math.max(0, grossAmount - extraDisAmt);

                            const gstBase = isThirdSchedule ? (mrp * qty) : amount;
                            const gstAmt = (gstBase / 100) * gstRate;
                            const fTaxAmt = (amount / 100) * fTaxPer;
                            const netAmt = amount + gstAmt + fTaxAmt;

                            const hasItemError = submitAttempted && errors.items && (errors.items as any)[index]?.itemName;

                            return (
                              <tr key={index} className="text-center bg-white dark:bg-boxdark border-b border-stroke dark:border-strokedark hover:bg-gray-50/50 dark:hover:bg-meta-4/5 transition-colors text-black dark:text-white">
                                <td className="p-2 text-center font-semibold w-[40px]">{index + 1}</td>
                                <td className="p-2 text-left w-[220px]">
                                  <select
                                    name={`items.${index}.itemName`}
                                    onChange={(e) => handleProductSelectionWithWH(e.target.value, index, values.dispatchWarehouse, setFieldValue)}
                                    value={item.itemName}
                                    className={`w-full px-1 py-1 exam border rounded text-xs transition-all ${hasItemError ? 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-900 focus:border-red-500' : 'border-stroke dark:border-strokedark bg-white dark:bg-boxdark focus:border-primary'}`}
                                  >
                                    <option value="">-- Choose Item --</option>
                                    {productList.map(p => <option key={p.id} value={p.product_name}>{p.product_name}</option>)}
                                  </select>
                                </td>
                                <td className="p-2 font-mono font-black text-success text-center bg-success/5 w-[110px]">
                                  {Number(item.availableQty || 0).toLocaleString()}
                                </td>
                                <td className="p-2 text-center text-gray-400 font-mono w-[80px]">{item.hsCode || '-'}</td>
                                <td className="p-2 w-[80px]"><input name={`items.${index}.location`} onChange={handleChange} value={item.location} className="w-full text-center outline-none bg-white dark:bg-boxdark border border-stroke dark:border-strokedark py-1 rounded text-black dark:text-white text-xs" placeholder="WH-1" /></td>
                                <td className="p-2 text-right text-gray-700 font-bold dark:text-white pr-2 w-[100px]">{rp.toFixed(2)}</td>
                                <td className="p-2 w-[70px]"><input type="number" name={`items.${index}.extraDiscPer`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.extraDiscPer} className="w-full text-center outline-none bg-white dark:bg-boxdark border border-stroke dark:border-strokedark py-1 text-black dark:text-white rounded font-semibold text-xs" /></td>
                                <td className="p-2 text-right text-gray-400 pr-2 w-[100px]">{extraDisAmt.toFixed(2)}</td>
                                <td className="p-2 text-right text-gray-500 pr-2 dark:text-white w-[90px]">{mrp.toFixed(2)}</td>
                                <td className="p-2 w-[70px]"><input type="number" name={`items.${index}.qty`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.qty} className="w-full text-center outline-none bg-white dark:bg-boxdark border border-primary dark:border-primary py-1 font-black text-black dark:text-white rounded text-xs" /></td>
                                <td className="p-2 text-right font-medium text-gray-600 dark:text-bodydark pr-2 w-[110px]">{grossAmount.toFixed(2)}</td>
                                <td className="p-2 w-[70px]"><input type="number" name={`items.${index}.gstRate`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.gstRate} className="w-full text-center outline-none bg-white dark:bg-boxdark border border-stroke dark:border-strokedark py-1 text-black dark:text-white font-bold rounded text-xs" /></td>
                                <td className="p-2 text-right text-gray-400 pr-2 w-[100px]">{gstAmt.toFixed(2)}</td>
                                <td className="p-2 text-right font-medium text-gray-600 dark:text-bodydark pr-2 w-[110px]">{amount.toFixed(2)}</td>
                                <td className="p-2 text-center text-gray-500 font-bold w-[70px]">{fTaxPer}%</td>
                                <td className="p-2 text-right text-gray-400 pr-2 w-[100px]">{fTaxAmt.toFixed(2)}</td>
                                <td className="p-2 text-right text-black dark:text-white font-black bg-slate-50/10 pr-2 w-[120px]">{netAmt.toFixed(2)}</td>
                                <td className="p-2 text-center w-[50px]">
                                  <button type="button" onClick={() => remove(index)} className="text-red-500 font-bold hover:text-red-700 hover:scale-110 transition text-sm">✕</button>
                                </td>
                              </tr>
                            );
                          })}
                          <tr>
                            <td colSpan={18} className="p-3 text-left bg-gray-50/50 dark:bg-meta-4/5">
                              <button type="button" onClick={() => push({ itemName: '', location: '', rp: 0, extraDiscPer: 0, mrp: 0, qty: 1, gstRate: 18, fTaxPer: values.scenarioType === "Goods at Standard Rate to Unregistered Buyers" ? 3 : 0, hsCode: '', availableQty: 0 })} className="text-success font-bold hover:underline flex items-center gap-1">+ Add Item Line</button>
                            </td>
                          </tr>
                        </tbody>
                      )}
                    </FieldArray>
                  </table>
                </div>
                <div className="flex flex-col md:flex-row justify-between gap-10 mt-6 px-4 pb-4">
                  <div className="flex flex-col gap-4 w-full md:w-1/2 border border-stroke p-4 rounded dark:border-strokedark bg-slate-50/10">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-success mb-2">1. Front Counter Cash Received Box (PKR)</h4>
                      <input type="number" name="cashAmountPaid" min="0" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.cashAmountPaid || 0} placeholder="0.00" className="w-full rounded border border-stroke p-2 bg-transparent text-right font-bold text-success text-sm focus:border-primary" />
                    </div>
                    <div className="border-t border-stroke dark:border-strokedark my-1"></div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary dark:text-white mb-2">2. Digital Bank Distribution Split (Optional)</h4>
                      <FieldArray name="bankPayments">
                        {({ push, remove }) => (
                          <div className="space-y-3">
                            {values.bankPayments.map((payment: any, index: number) => (
                              <div key={index} className="flex items-center gap-2">
                                <select name={`bankPayments.${index}.selectedBank`} onChange={handleChange} value={payment.selectedBank || ''} className="flex-1 border border-stroke p-2 text-xs rounded outline-none focus:border-primary bg-white dark:bg-boxdark font-semibold text-black dark:text-white">
                                  <option value="">-- Choose Account Wire --</option>
                                  {banks.map((b) => {
                                    const isAlreadySelected = values.bankPayments.some((p: any, pIdx: number) => p.selectedBank === b.accountTitle && pIdx !== index);
                                    return <option key={b.id} value={b.accountTitle} disabled={isAlreadySelected}>{b.bankName} - {b.accountTitle} {isAlreadySelected ? '(Selected)' : ''}</option>;
                                  })}
                                </select>
                                <input type="number" name={`bankPayments.${index}.bankAmount`} min="0" onKeyDown={blockInvalidChar} onChange={handleChange} value={payment.bankAmount || 0} placeholder="Amount" className="w-28 border border-stroke p-2 text-xs text-right rounded outline-none text-success font-bold bg-white dark:bg-boxdark" />
                                {values.bankPayments.length > 1 && <button type="button" onClick={() => remove(index)} className="text-red-500 font-bold px-1 text-xs">✕</button>}
                              </div>
                            ))}
                            <div className="flex justify-between items-center text-xs pt-1 text-black dark:text-white">
                              <button type="button" onClick={() => push({ selectedBank: '', bankAmount: 0 })} className="text-success font-bold hover:underline">+ Split Account Line</button>
                              <span className="text-gray-400 font-medium">Split Sum: <b className="text-success">Rs. {values.bankPayments.reduce((acc: number, curr: any) => acc + (Number(curr.bankAmount) || 0), 0).toLocaleString()}</b></span>
                            </div>
                          </div>
                        )}
                      </FieldArray>
                    </div>
                  </div>

                  <div className="w-full md:w-1/3 space-y-2 text-xs text-black dark:text-bodydark">
                    <div className="flex items-center justify-between border-b pb-1 dark:border-strokedark">
                      <span className="font-semibold text-gray-500">WH Tax %:</span>
                      <input type="number" name="whTaxPercentage" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.whTaxPercentage} className="w-20 border p-1 rounded text-right outline-none bg-white dark:bg-boxdark text-black dark:text-white border-stroke" />
                    </div>
                    <div className="flex justify-between border-b pb-1 dark:border-strokedark"><span>Total Quantity:</span><b className="text-success text-sm">{(values.items.reduce((acc: number, item: any) => acc + (Number(item.qty) || 0), 0)).toFixed(2)}</b></div>
                    <div className="flex justify-between border-b pb-1 dark:border-strokedark">
                      <span>Total Taxable Amount:</span>
                      <b className="text-success text-sm">
                        {values.items.reduce((acc: number, item: any) => {
                          const qty = Number(item.qty) || 0;
                          const rp = Number(item.rp) || 0;
                          const extraDiscPer = Number(item.extraDiscPer) || 0;
                          const gross = rp * qty;
                          return acc + Math.max(0, gross - ((gross / 100) * extraDiscPer));
                        }, 0).toFixed(2)}
                      </b>
                    </div>
                    <div className="flex justify-between border-b pb-1 dark:border-strokedark">
                      <span>Total GST Amount:</span>
                      <b className="text-success text-sm">
                        {values.items.reduce((acc: number, item: any) => {
                          const qty = Number(item.qty) || 0;
                          const rp = Number(item.rp) || 0;
                          const mrp = Number(item.mrp) || 0;
                          const gstRate = Number(item.gstRate) || 0;
                          const extraDiscPer = Number(item.extraDiscPer) || 0;
                          const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";
                          const base = isThirdSchedule ? (mrp * qty) : (rp * qty) - (((rp * qty) / 100) * extraDiscPer);
                          return acc + ((Math.max(0, base) / 100) * gstRate);
                        }, 0).toFixed(2)}
                      </b>
                    </div>
                    <div className="flex justify-between border-b pb-1 dark:border-strokedark">
                      <span>Total Further Tax Amount:</span>
                      <b className="text-success text-sm">
                        {values.items.reduce((acc: number, item: any) => {
                          const qty = Number(item.qty) || 0;
                          const rp = Number(item.rp) || 0;
                          const extraDiscPer = Number(item.extraDiscPer) || 0;
                          const fTaxPer = Number(item.fTaxPer) || 0;
                          const gross = rp * qty;
                          const base = gross - ((gross / 100) * extraDiscPer);
                          return acc + ((Math.max(0, base) / 100) * fTaxPer);
                        }, 0).toFixed(2)}
                      </b>
                    </div>
                    <div className="flex justify-between border-b pb-1 dark:border-strokedark pt-2">
                      <span className="font-bold text-sm text-black dark:text-white">Net Invoice Total:</span>
                      <b className="text-primary text-base font-black dark:text-white">
                        Rs. {(() => {
                          const baseTotal = values.items.reduce((acc: number, item: any) => {
                            const qty = Number(item.qty) || 0;
                            const rp = Number(item.rp) || 0;
                            const mrp = Number(item.mrp) || 0;
                            const gstRate = Number(item.gstRate) || 0;
                            const extraDiscPer = Number(item.extraDiscPer) || 0;
                            const fTaxPer = Number(item.fTaxPer) || 0;
                            const isThirdSchedule = values.scenarioType === "Sale of 3rd Schedule Goods";
                            let amount = (rp * qty) - (((rp * qty) / 100) * extraDiscPer);
                            amount = Math.max(0, amount);
                            const gstBase = isThirdSchedule ? (mrp * qty) : amount;
                            return acc + (amount + ((gstBase / 100) * gstRate) + ((amount / 100) * fTaxPer));
                          }, 0);
                          const whTaxAmt = (baseTotal / 100) * (values.whTaxPercentage || 0);
                          return (baseTotal - whTaxAmt).toLocaleString(undefined, { minimumFractionDigits: 2 });
                        })()}
                      </b>
                    </div>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-stroke dark:border-strokedark flex justify-between items-center bg-gray-50 dark:bg-meta-4/5 p-4 rounded-sm">
                  <button type="button" onClick={() => navigate('/sales/invoice/list')} className="rounded border border-stroke dark:border-strokedark py-2.5 px-10 font-semibold text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-meta-4 transition cursor-pointer">Cancel</button>
                  <button type="submit" disabled={loading} onClick={() => setSubmitAttempted(true)} className="bg-success text-white py-2.5 px-12 rounded font-semibold text-sm hover:bg-opacity-90 transition shadow-sm font-bold cursor-pointer">{loading ? <Spinner /> : isEditMode ? 'Update Invoice' : 'Save Record'}</button>
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
