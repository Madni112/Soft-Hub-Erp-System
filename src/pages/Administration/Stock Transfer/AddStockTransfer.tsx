import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

const AddStockTransfer = () => {
  const [loading, setLoading] = useState(false);
  const [metadataLoading, setMetadataLoading] = useState(true);
  const [locations, setLocations] = useState<any[]>([]);
  const [productList, setProductList] = useState<any[]>([]);

  const location = useLocation();
  const navigate = useNavigate();

  const editData = location.state?.transfer;
  const isEditMode = !!editData;

  useEffect(() => {
    const fetchTransferMetadata = async () => {
      try {
        setMetadataLoading(true);
        const { data: locData } = await supabase.from('inventory_locations').select('id, name').order('name', { ascending: true });
        const { data: prodData } = await supabase.from('products').select('id, product_name, current_stock, uom');
        
        if (locData) setLocations(locData);
        if (prodData) setProductList(prodData);
      } catch (err: any) {
        toast.error('Failed to load system metadata setup list vectors');
      } finally {
        setMetadataLoading(false);
      }
    };
    fetchTransferMetadata();
  }, []);

  const validationSchema = Yup.object().shape({
    fromLocation: Yup.string().required('Source location is mandatory'),
    toLocation: Yup.string().required('Destination location is mandatory')
      .notOneOf([Yup.ref('fromLocation')], 'Source and Destination warehouses cannot be identical!'),
    transferDate: Yup.string().required('Required'),
    items: Yup.array().of(
      Yup.object().shape({
        itemName: Yup.string().required('Required'),
        qty: Yup.number().typeError('Numeric values only').min(1, 'Min 1').required('Required')
      })
    ).min(1, 'Please add at least one stock row line item')
  });

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  if (metadataLoading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-6xl text-xs">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
          <h3 className="font-semibold text-black dark:text-white text-base">
            {isEditMode ? `View Transfer Slip: ${editData.transfer_no}` : 'Initialize Multi-Warehouse Stock Transfer'}
          </h3>
          <button type="button" onClick={() => navigate('/Administration/StockTransfer/List')} className="text-sm font-medium text-primary hover:underline">
            Back to History
          </button>
        </div>

        <Formik
          initialValues={isEditMode ? {
            transferNo: editData.transfer_no || '',
            fromLocation: editData.from_location || '',
            toLocation: editData.to_location || '',
            transferDate: editData.transfer_date || '',
            status: editData.status || 'Confirm',
            remarks: editData.remarks || '',
            items: editData.items || [{ itemName: '', qty: 1, uom: 'Nos' }]
          } : {
            transferNo: `TRF-${Date.now().toString().slice(-6)}`,
            fromLocation: '',
            toLocation: '',
            transferDate: new Date().toISOString().split('T')[0],
            status: 'Confirm',
            remarks: '',
            items: [{ itemName: '', qty: 1, uom: 'Nos' }]
          }}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            if (isEditMode && editData.status === 'Confirm') {
              toast.error('Confirmed transfer slips cannot be re-modified or adjusted to prevent accounting lines mismatch fraud.');
              return;
            }

            try {
              setLoading(true);

              // LOOP LOCK VALIDATOR: Check if source warehouse actually has enough stock before firing transaction updates
              if (values.status === 'Confirm') {
                for (const item of values.items) {
                  const liveProd = productList.find(p => p.product_name === item.itemName);
                  if (liveProd && Number(liveProd.current_stock) < Number(item.qty)) {
                    toast.error(`Insufficient Balance: "${item.itemName}" only has ${liveProd.current_stock} items left in active pool balance.`);
                    setLoading(false);
                    return;
                  }
                }

                // BALANCING PIPELINE SCRIPT LOGS EXECUTION: Asynchronously run standard inventory adjustment queries
                for (const item of values.items) {
                  const liveProd = productList.find(p => p.product_name === item.itemName);
                  if (liveProd) {
                    const newCalculatedStockBalance = Number(liveProd.current_stock) - Number(item.qty);
                    await supabase.from('products').update({ current_stock: newCalculatedStockBalance }).eq('id', liveProd.id);
                  }
                }
              }

              const databasePayload = {
                transfer_no: values.transferNo,
                from_location: values.fromLocation,
                to_location: values.toLocation,
                transfer_date: values.transferDate,
                status: values.status,
                remarks: values.remarks.trim(),
                items: values.items
              };

              const { error } = isEditMode 
                ? await supabase.from('stock_transfers').update(databasePayload).eq('id', editData.id)
                : await supabase.from('stock_transfers').insert([databasePayload]);

              if (error) throw error;
              toast.success('Internal stock distribution movement transaction saved successfully!');
              navigate('/Administration/StockTransfer/List');
            } catch (err: any) {
              toast.error('Transaction Failed: ' + err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ handleChange, values, errors, touched, setFieldValue }) => (
            <Form className="p-6.5 space-y-6">
              
              {/* HEADER PARAMS LAYOUT FIELDS INPUT ROWS */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Transfer Document #:</label>
                  <input type="text" name="transferNo" readOnly value={values.transferNo} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-gray-50 dark:bg-meta-4/10 font-bold font-mono text-primary outline-none" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Source Warehouse (From): *</label>
                  <select name="fromLocation" disabled={isEditMode} onChange={handleChange} value={values.fromLocation} className={`w-full border rounded p-2 bg-transparent outline-none ${touched.fromLocation && errors.fromLocation ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}>
                    <option value="" className="bg-white dark:bg-boxdark font-semibold text-black dark:text-white text-xs normal-case tracking-normal py-1">Select Departure Point</option>
                    {locations.map(l => <option key={l.id} value={l.name} className="bg-white dark:bg-boxdark font-semibold text-black dark:text-white text-xs normal-case tracking-normal py-1">{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Destination Warehouse (To): *</label>
                  <select name="toLocation" disabled={isEditMode} onChange={handleChange} value={values.toLocation} className={`w-full border rounded p-2 bg-transparent outline-none ${touched.toLocation && errors.toLocation ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}>
                    <option value="" className="bg-white dark:bg-boxdark font-semibold text-black dark:text-white text-xs normal-case tracking-normal py-1">Select Receiving Destination</option>
                    {locations.map(l => <option key={l.id} value={l.name} className="bg-white dark:bg-boxdark font-semibold text-black dark:text-white text-xs normal-case tracking-normal py-1">{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Transfer Date: *</label>
                  <input type="date" name="transferDate" disabled={isEditMode} onChange={handleChange} value={values.transferDate} className="w-full border border-stroke dark:border-strokedark rounded p-2 bg-transparent outline-none font-bold" />
                </div>
              </div>

              {/* PRODUCT DISPATCH LOGS FIELD ARRAY MATRIX GRID */}
              <div className="border border-stroke dark:border-strokedark rounded p-4">
                <h4 className="font-bold text-primary text-xs uppercase tracking-wide mb-3">Transferred Product Lines Matrix</h4>
                
                <table className="w-full border-collapse border border-stroke dark:border-strokedark text-center">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-meta-4 font-bold">
                      <th className="p-2 border w-12">S#</th>
                      <th className="p-2 border text-left">Select Product Item Designation Label</th>
                      <th className="p-2 border w-36">Live Available WH Bal</th>
                      <th className="p-2 border w-28">UOM</th>
                      <th className="p-2 border w-32">Transfer Qty</th>
                      <th className="p-2 border w-12"></th>
                    </tr>
                  </thead>
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <tbody>
                        {values.items.map((item: any, index: number) => {
                          const matchedProdObject = productList.find(p => p.product_name === item.itemName);
                          const currentLiveSystemBalance = matchedProdObject ? matchedProdObject.current_stock : 0;
                          const currentUomString = matchedProdObject ? matchedProdObject.uom : 'Nos';

                          return (
                            <tr key={index} className="bg-white dark:bg-boxdark text-xs">
                              <td className="p-2 border font-medium text-black dark:text-white">{index + 1}</td>
                              <td className="p-2 border">
                                <select 
                                  name={`items.${index}.itemName`}
                                  disabled={isEditMode}
                                  value={item.itemName}
                                  onChange={(e) => {
                                    handleChange(e);
                                    const selectObj = productList.find(p => p.product_name === e.target.value);
                                    if (selectObj) setFieldValue(`items.${index}.uom`, selectObj.uom || 'Nos');
                                  }}
                                  className={`w-full rounded border p-2 bg-transparent outline-none focus:border-primary font-bold text-black dark:text-white border-stroke dark:border-strokedark`}
                                >
                                  <option value="" className="bg-white dark:bg-boxdark font-semibold text-black dark:text-white text-xs normal-case tracking-normal py-1">Pick Product</option>
                                  {productList.map(p => <option key={p.id} value={p.product_name} className="bg-white dark:bg-boxdark font-semibold text-black dark:text-white text-xs normal-case tracking-normal py-1">{p.product_name}</option>)}
                                </select>
                              </td>
                              <td className="p-2 border font-bold text-success font-mono">
                                {Number(currentLiveSystemBalance).toLocaleString()}
                              </td>
                              <td className="p-2 border text-gray-400 font-semibold">{currentUomString}</td>
                              <td className="p-2 border">
                                <input 
                                  type="number" 
                                  name={`items.${index}.qty`}
                                  disabled={isEditMode}
                                  onKeyDown={blockInvalidChar}
                                  onChange={handleChange}
                                  value={item.qty}
                                  className="w-full text-center outline-none border border-stroke rounded p-1 font-bold text-black dark:text-white bg-transparent focus:border-primary"
                                />
                              </td>
                              <td className="p-2 border text-center">
                                {!isEditMode && (
                                  <button type="button" onClick={() => remove(index)} className="text-red-500 font-bold hover:scale-110 duration-100">✕</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                        {!isEditMode && (
                          <tr>
                            <td colSpan={6} className="p-2 text-left">
                              <button type="button" onClick={() => push({ itemName: '', qty: 1, uom: 'Nos' })} className="text-success font-bold hover:underline">+ Append Item Row</button>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    )}
                  </FieldArray>
                </table>
              </div>

              {/* REMARKS EXPLANATORY STRIP INPUT CELL */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-3">
                  <label className="block text-gray-500 mb-1 font-medium">Transaction Remarks / Internal Tracking Notes:</label>
                  <input type="text" name="remarks" disabled={isEditMode} onChange={handleChange} value={values.remarks} className="w-full border border-stroke dark:border-strokedark rounded p-2.5 bg-transparent outline-none focus:border-primary" placeholder="Enter reason description details (e.g. Shifting 40L cylinder stock reserves to commercial retail shop terminal counter 1)" />
                </div>
                <div>
                  <label className="block text-gray-500 mb-1 font-medium">Slip State:</label>
                  <select name="status" disabled={isEditMode} onChange={handleChange} value={values.status} className="w-full border border-stroke dark:border-strokedark rounded p-2.5 bg-transparent font-bold text-primary">
                    <option value="Confirm">Confirm (Deduct & Transfer Instantly)</option>
                    <option value="Draft">Draft (Save Layout Only)</option>
                  </select>
                </div>
              </div>

              {/* ACTION FOOTER EXECUTION ROW BAR CONTROL */}
              <div className="pt-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3">
                {!isEditMode && (
                  <button type="submit" disabled={loading} className="bg-success text-white py-2 px-10 rounded font-medium hover:bg-opacity-90 transition shadow-sm" >
                    {loading ? <Spinner /> : 'Dispatch Stock'}
                  </button>
                )}
                <button type="button" onClick={() => navigate('/Administration/StockTransfer/List')} className="bg-danger text-white py-2 px-8 rounded font-medium hover:bg-opacity-90 transition shadow-sm" >
                  {isEditMode ? 'Close View' : 'Cancel'}
                </button>
              </div>

            </Form>
          )}
        </Formik>

      </div>
    </div>
  );
};

export default AddStockTransfer;
