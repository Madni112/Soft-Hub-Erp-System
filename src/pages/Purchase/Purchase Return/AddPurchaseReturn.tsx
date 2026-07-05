import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

const AddPurchaseReturn = () => {
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [vendors, setVendors] = useState<any[]>([]);
  const [locations, setLocations] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  const editData = location.state?.returnRecord;
  const isEditMode = !!editData;

  useEffect(() => {
    const fetchReturnMetadata = async () => {
      try {
        setMetadataLoading(true);
        const { data: vData } = await supabase.from('vendors').select('id, vendor_name').order('vendor_name', { ascending: true });
        const { data: locData } = await supabase.from('inventory_locations').select('id, name').order('name', { ascending: true });
        const { data: prodData } = await supabase.from('products').select('id, product_name, purchase_price, uom');

        if (vData) setVendors(vData);
        if (locData) setLocations(locData);
        if (prodData) setProductList(prodData);
      } catch (err: any) {
        toast.error('Failed to load system return lookup profiles: ' + err.message);
      } finally {
        setMetadataLoading(false);
      }
    };
    fetchReturnMetadata();
  }, []);

  const validationSchema = Yup.object().shape({
    vendorName: Yup.string().required('Vendor selection is mandatory'),
    sourceWarehouse: Yup.string().required('Source warehouse selection is mandatory'),
    returnDate: Yup.string().required('Required'),
    items: Yup.array().of(
      Yup.object().shape({
        itemName: Yup.string().required('Required'),
        qty: Yup.number().typeError('Numeric lines only').min(1, 'Min 1').required('Required'),
        rate: Yup.number().typeError('Numeric lines only').min(0, 'Min 0').required('Required')
      })
    ).min(1)
  });

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  if (metadataLoading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;
  return (
    <div className="mx-auto max-w-full text-black dark:text-bodydark text-xs">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
          <h3 className="font-semibold text-black dark:text-white text-base">
            {isEditMode ? 'Modify Purchase Return Note (Debit Note)' : 'Create Outbound Purchase Return (Debit Note)'}
          </h3>
          <button type="button" onClick={() => navigate('/Purchase/Purchase-Return/List')} className="text-sm font-medium text-primary hover:underline cursor-pointer">
            Back to Registry Log
          </button>
        </div>

        <Formik
          initialValues={isEditMode ? {
            returnNo: editData.return_no || '',
            vendorName: editData.vendor_name || '',
            sourceWarehouse: editData.source_warehouse || '',
            returnDate: editData.return_date || '',
            remarks: editData.remarks || '',
            items: editData.items || [{ itemName: '', qty: 1, rate: 0, uom: 'Nos' }]
          } : {
            returnNo: `RTN-${Date.now().toString().slice(-6)}`,
            vendorName: '',
            sourceWarehouse: '',
            returnDate: new Date().toISOString().split('T')[0],
            remarks: '',
            items: [{ itemName: '', qty: 1, rate: 0, uom: 'Nos' }]
          }}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            try {
              setLoading(true);
              let totalReturnSum = 0;
              values.items.forEach((i: any) => { totalReturnSum += (Number(i.qty) * Number(i.rate)); });

              // Check actual warehouse counts first to prevent negative allocations
              for (const item of values.items) {
                const { data: currentStock } = await supabase
                  .from('warehouse_inventory')
                  .select('quantity')
                  .eq('product_name', item.itemName)
                  .eq('warehouse_name', values.sourceWarehouse)
                  .maybeSingle();

                const stockAvailable = currentStock ? Number(currentStock.quantity) : 0;
                if (!isEditMode && Number(item.qty) > stockAvailable) {
                  toast.error(`Stock Shortage Alert: You are attempting to return ${item.qty} units of ${item.itemName} from ${values.sourceWarehouse}, but only ${stockAvailable} are available.`);
                  setLoading(false);
                  return;
                }
              }

              const databasePayload = {
                return_no: values.returnNo,
                vendor_name: values.vendorName,
                source_warehouse: values.sourceWarehouse,
                return_date: values.returnDate,
                remarks: values.remarks.trim(),
                total_amount: totalReturnSum,
                items: values.items
              };

              if (isEditMode) {
                // Revert old inventory values first
                const { data: oldRtn } = await supabase.from('purchase_returns').select('items, source_warehouse').eq('id', editData.id).single();
                if (oldRtn?.items) {
                  for (const oldItem of oldRtn.items) {
                    const { data: p } = await supabase.from('warehouse_inventory').select('id, quantity').eq('product_name', oldItem.itemName).eq('warehouse_name', oldRtn.source_warehouse).maybeSingle();
                    if (p) await supabase.from('warehouse_inventory').update({ quantity: Number(p.quantity) + Number(oldItem.qty) }).eq('id', p.id);
                  }
                }
                const { error } = await supabase.from('purchase_returns').update(databasePayload).eq('id', editData.id);
                if (error) throw error;
                // Subtract new values
                for (const newItem of values.items) {
                  const { data: p } = await supabase.from('warehouse_inventory').select('id, quantity').eq('product_name', newItem.itemName).eq('warehouse_name', values.sourceWarehouse).maybeSingle();
                  if (p) await supabase.from('warehouse_inventory').update({ quantity: Math.max(0, Number(p.quantity) - Number(newItem.qty)) }).eq('id', p.id);
                }
              } else {
                const { error } = await supabase.from('purchase_returns').insert([databasePayload]);
                if (error) throw error;
                // Safely decrement warehouse stocks
                for (const item of values.items) {
                  const { data: p } = await supabase.from('warehouse_inventory').select('id, quantity').eq('product_name', item.itemName).eq('warehouse_name', values.sourceWarehouse).maybeSingle();
                  if (p) await supabase.from('warehouse_inventory').update({ quantity: Math.max(0, Number(p.quantity) - Number(item.qty)) }).eq('id', p.id);
                }
              }

              toast.success('Purchase Return (Debit Note) logged and inventory adjusted safely!');
              navigate('/Purchase/Purchase-Return/List');
            } catch (err: any) {
              toast.error('Submission Interrupted: ' + err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ handleChange, values, errors, touched, setFieldValue }) => (
            <Form className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-500 mb-1.5 font-bold">Debit Note Return #:</label>
                  <input type="text" readOnly value={values.returnNo} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-gray-50 dark:bg-meta-4/20 font-bold font-mono text-primary outline-none text-xs" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5 font-bold">Target Vendor Profile: *</label>
                  <select name="vendorName" onChange={handleChange} value={values.vendorName} className={`w-full border rounded p-2 bg-transparent outline-none text-black dark:text-white font-semibold focus:border-primary text-xs ${touched.vendorName && errors.vendorName ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}>
                    <option value="">-- Select Vendor --</option>
                    {vendors.map(v => <option key={v.id} value={v.vendor_name}>{v.vendor_name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5 font-bold">Dispatch Source Warehouse: *</label>
                  <select name="sourceWarehouse" onChange={handleChange} value={values.sourceWarehouse} className={`w-full border rounded p-2 bg-transparent outline-none text-black dark:text-white font-semibold focus:border-primary text-xs ${touched.sourceWarehouse && errors.sourceWarehouse ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}>
                    <option value="">-- Choose Pull Location --</option>
                    {locations.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1.5 font-bold">Return Processing Date: *</label>
                  <input type="date" name="returnDate" onChange={handleChange} value={values.returnDate} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent outline-none font-bold text-black dark:text-white focus:border-primary text-xs" />
                </div>
              </div>
              <div className="border border-stroke dark:border-strokedark rounded p-4 overflow-x-auto">
                <table className="w-full border-collapse border border-stroke dark:border-strokedark text-center min-w-[800px]">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-meta-4 font-bold text-black dark:text-white text-xs uppercase border-b border-stroke dark:border-strokedark">
                      <th className="p-2 border w-12">S#</th>
                      <th className="p-2 border text-left pl-4">Product Item Catalog Selection</th>
                      <th className="p-2 border w-24">UOM</th>
                      <th className="p-2 border w-32">Returning Qty</th>
                      <th className="p-2 border w-32 text-right pr-4">Cost Value (Unit)</th>
                      <th className="p-2 border w-36 text-right pr-4">Net Offset Value</th>
                      <th className="p-2 border w-12"></th>
                    </tr>
                  </thead>
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <tbody>
                        {values.items.map((item: any, index: number) => {
                          const matchedProduct = productList.find(p => p.product_name === item.itemName);
                          const currentUomString = matchedProduct ? matchedProduct.uom : 'Nos';
                          const lineNetTotal = (Number(item.qty) || 0) * (Number(item.rate) || 0);

                          return (
                            <tr key={index} className="bg-white dark:bg-boxdark text-xs border-b border-stroke dark:border-strokedark text-black dark:text-white">
                              <td className="p-2 border font-medium">{index + 1}</td>
                              <td className="p-2 border">
                                <select
                                  name={`items.${index}.itemName`}
                                  value={item.itemName}
                                  onChange={(e) => {
                                    handleChange(e);
                                    const match = productList.find(p => p.product_name === e.target.value);
                                    if (match) {
                                      setFieldValue(`items.${index}.rate`, match.purchase_price || 0);
                                      setFieldValue(`items.${index}.uom`, match.uom || 'Nos');
                                    }
                                  }}
                                  className="w-full rounded border p-2 bg-transparent outline-none focus:border-primary font-bold text-black dark:text-white border-stroke dark:border-strokedark text-xs"
                                >
                                  <option value="">-- Choose Product --</option>
                                  {productList.map(p => <option key={p.id} value={p.product_name}>{p.product_name}</option>)}
                                </select>
                              </td>
                              <td className="p-2 border text-gray-400 font-semibold uppercase">{currentUomString}</td>
                              <td className="p-2 border w-32"><input type="number" name={`items.${index}.qty`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.qty} className="w-full text-center outline-none border border-stroke rounded p-1 font-bold text-black dark:text-white bg-transparent focus:border-primary dark:border-strokedark text-xs" /></td>
                              <td className="p-2 border w-32"><input type="number" name={`items.${index}.rate`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.rate} className="w-full text-right pr-2 outline-none border border-stroke rounded p-1 font-bold text-black dark:text-white bg-transparent focus:border-primary dark:border-strokedark text-xs" /></td>
                              <td className="p-2 border text-right pr-4 font-mono font-black text-success text-sm">Rs. {lineNetTotal.toFixed(2)}</td>
                              <td className="p-2 border text-center w-12">
                                {values.items.length > 1 && (
                                  <button type="button" onClick={() => remove(index)} className="text-red-500 font-bold hover:scale-110 duration-100 cursor-pointer">✕</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td colSpan={7} className="p-2 text-left bg-gray-50/10">
                            <button type="button" onClick={() => push({ itemName: '', qty: 1, rate: 0, uom: 'Nos' })} className="text-success font-bold hover:underline cursor-pointer">+ Append Return Row</button>
                          </td>
                        </tr>
                      </tbody>
                    )}
                  </FieldArray>
                </table>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-2">
                  <label className="block text-gray-500 mb-1 font-bold">Return Reason / Allocation Memo Remarks:</label>
                  <input type="text" name="remarks" onChange={handleChange} value={values.remarks} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent outline-none focus:border-primary text-black dark:text-white text-xs" placeholder="Describe fault classifications, damage tokens or vendor authorization numbers..." />
                </div>
                <div className="text-right p-4 border border-stroke dark:border-strokedark rounded-sm bg-gray-50/50 dark:bg-meta-4/10">
                  <span className="text-gray-400 font-bold block text-xs uppercase mb-1">Total Credited Offset (PKR):</span>
                  <b className="text-success text-lg font-black font-mono">
                    Rs. {values.items.reduce((acc: number, curr: any) => acc + ((Number(curr.qty) || 0) * (Number(curr.rate) || 0)), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </b>
                </div>
              </div>

              <div className="pt-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => navigate('/Purchase/Purchase-Return/List')} 
                  className="rounded bg-[#cb3c53] py-2 px-8 font-semibold text-xs text-white hover:bg-opacity-90 transition shadow-sm h-9 min-w-32 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className={`rounded ${isEditMode ? 'bg-success' : 'bg-[#4338ca]'} py-2 px-8 font-semibold text-xs text-white hover:bg-opacity-90 transition shadow-sm h-9 min-w-32 cursor-pointer`}
                >
                  {loading ? <Spinner /> : isEditMode ? 'Update Note' : 'Save Return'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddPurchaseReturn;
