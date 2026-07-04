import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form, FieldArray } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

const AddDeliveryChallan = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Route state evaluation to determine if the workflow represents Edit Mode
  const editData = location.state?.challan;
  const isEditMode = !!editData;

  // Track state definitions for initial values object model loading rules
  const [initialFormValues, setInitialFormValues] = useState({
    customerName: '',
    transportation: '',
    poNo: '',
    poDate: '',
    dcDate: new Date().toISOString().split('T')[0], // Defaults dynamically to today's timestamp
    vehicleNo: '',
    remarks: '',
    items: [{ poNoSub: '', pDescription: '', location: '', rate: 0, qty: 1, disAmt: 0, distPer: 0, discount: 0, notes: '' }]
  });

  // Fetch dynamic customers dataset array + pull target record payload properties if in Edit mode
  useEffect(() => {
    const initializeFormMetadata = async () => {
      try {
        setFetchingData(isEditMode);

        // 1. Load active customers directory lists
        const { data: custData } = await supabase.from('customers').select('id, customerName');
        if (custData) setCustomers(custData);

        // 2. Hydrate form values with existing dataset properties if updating
        if (isEditMode && editData?.id) {
          const { data: challanRecord, error } = await supabase
            .from('delivery_challans')
            .select('*')
            .eq('id', editData.id)
            .single();

          if (error) throw error;
          if (challanRecord) {
            setInitialFormValues({
              customerName: challanRecord.customer_name || '',
              transportation: challanRecord.transportation || '',
              poNo: challanRecord.po_no || '',
              poDate: challanRecord.po_date || '',
              dcDate: challanRecord.dc_date || challanRecord.created_at?.split('T')[0],
              vehicleNo: challanRecord.vehicle_no || '',
              remarks: challanRecord.remarks || '',
              items: challanRecord.items || [{ poNoSub: '', pDescription: '', location: '', rate: 0, qty: 1, disAmt: 0, distPer: 0, discount: 0, notes: '' }]
            });
          }
        }
      } catch (err: any) {
        toast.error('Initialization failure: ' + err.message);
      } finally {
        setFetchingData(false);
      }
    };

    initializeFormMetadata();
  }, [editData, isEditMode]);

  const validationSchema = Yup.object().shape({
    customerName: Yup.string().required('Customer selection is mandatory'),
    items: Yup.array().of(
      Yup.object().shape({
        pDescription: Yup.string().required('Required'),
        qty: Yup.number().typeError('Must be numeric').min(1, 'Min 1').required('Required'),
        rate: Yup.number().typeError('Must be numeric').min(0, 'Min 0').required('Required'),
      })
    ).min(1)
  });

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

  if (fetchingData) {
    return (
      <div className="flex h-48 items-center justify-center bg-white dark:bg-boxdark rounded-sm border border-stroke dark:border-strokedark">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-full">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

        {/* Dynamic Context Form Header Header Section */}
        <div className="flex justify-between border-b border-stroke py-4 px-6.5 dark:border-strokedark">
          <h3 className="font-semibold text-black dark:text-white text-base">
            {isEditMode ? `Edit Delivery Challan` : 'Add Delivery Challan'}
          </h3>
          <button
            onClick={() => navigate('/Delivery-Challan/List')}
            className="text-sm text-primary hover:underline font-medium"
          >
            {isEditMode ? 'Back to List' : 'See List'}
          </button>
        </div>

        <Formik
          initialValues={initialFormValues}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            setLoading(true);

            // Row-level totals calculation loop mappings to map to overall data summary cards
            const totalQty = values.items.reduce((acc, item) => acc + (Number(item.qty) || 0), 0);
            const baseAmount = values.items.reduce((acc, item) => acc + ((Number(item.rate) || 0) * (Number(item.qty) || 0)), 0);
            const totalDisc = values.items.reduce((acc, item) => {
              const rowGross = (Number(item.rate) || 0) * (Number(item.qty) || 0);
              const fixedDisc = Number(item.disAmt) || 0;
              const perDisc = (rowGross / 100) * (Number(item.distPer) || 0);
              const calculatedDiscount = Number(item.discount) || 0;
              return acc + fixedDisc + perDisc + calculatedDiscount;
            }, 0);
            const netAmount = baseAmount - totalDisc;

            // Structure data block matching database tracking layouts exactly
            const databasePayload = {
              customer_name: values.customerName,
              transportation: values.transportation,
              po_no: values.poNo,
              po_date: values.poDate,
              dc_date: values.dcDate,
              vehicle_no: values.vehicleNo,
              remarks: values.remarks,
              total_quantity: totalQty,
              total_amount: baseAmount,
              total_discount: totalDisc,
              total_net_amount: netAmount,
              items: values.items
            };

            try {
              if (isEditMode) {
                const { error } = await supabase
                  .from('delivery_challans')
                  .update(databasePayload)
                  .eq('id', editData.id);

                if (error) throw error;
                toast.success('Challan updated successfully!');
              } else {
                const { error } = await supabase
                  .from('delivery_challans')
                  .insert([databasePayload]);

                if (error) throw error;
                toast.success('Challan logged successfully!');
              }
              navigate('/Delivery-Challan/List'); // Redirect back straight to historical records grid
            } catch (err: any) {
              toast.error(err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ values, handleChange }) => (
            <Form className="p-6">

              {/* ===== SECTION 1: SYSTEM INPUT CONTROLS ROW MATRIX OVERVIEW ===== */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-x-6 gap-y-4 mb-6 text-sm">

                {/* Field 1: DC # Index identifier code view wrapper */}
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">DC #:</label>
                  <p className="text-primary font-bold text-sm">
                    {isEditMode ? `DC-ID-${editData.id}` : '(Auto Generated)'}
                  </p>
                </div>

                {/* Field 2: Customer drop-down picker parameter block */}
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">Customer / Business Name: *</label>
                  <select name="customerName" onChange={handleChange} value={values.customerName} className="w-full rounded border border-stroke p-2 bg-transparent dark:border-strokedark text-black dark:bg-meta-4 dark:text-white outline-none focus:border-primary text-xs">
                    <option value="">Select Reference</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.customerName}>{c.customerName}</option>
                    ))}
                  </select>
                </div>

                {/* Field 3: Transportation selector mapping */}
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">Transportation:</label>
                  <select name="transportation" onChange={handleChange} value={values.transportation} className="w-full rounded border border-stroke p-2 bg-white text-black dark:bg-meta-4 dark:text-white dark:border-strokedark outline-none focus:border-primary text-xs">
                    <option value="">Select Reference</option>
                    <option value="By Road Transport">By Road Transport</option>
                    <option value="Self Pickup">Self Pickup</option>
                    <option value="Third-Party Courier">Third-Party Courier</option>
                  </select>
                </div>

                {/* Field 4: P.O Number label context tracking */}
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">P.O No:</label>
                  <input type="text" name="poNo" onChange={handleChange} value={values.poNo} className="w-full rounded border border-stroke p-2 bg-transparent dark:border-strokedark text-black dark:text-white outline-none focus:border-primary text-xs" placeholder="Enter P.O reference Code" />
                </div>

                {/* Field 5: P.O Date registration element picker */}
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">P.O Date:</label>
                  <input type="date" name="poDate" onChange={handleChange} value={values.poDate} className="w-full rounded border border-stroke p-2 bg-transparent dark:border-strokedark text-black dark:bg-meta-4 dark:text-white outline-none focus:border-primary text-xs" />
                </div>

                {/* Field 6: DC Document log execution timestamp date */}
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">DC Date:</label>
                  <input type="date" name="dcDate" onChange={handleChange} value={values.dcDate} className="w-full rounded border border-stroke p-2 bg-transparent dark:border-strokedark text-black dark:bg-meta-4 dark:text-white outline-none focus:border-primary text-xs" />
                </div>

                {/* Field 7: Vehicle identification number plate tracking box */}
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">Vehicle No:</label>
                  <input type="text" name="vehicleNo" onChange={handleChange} value={values.vehicleNo} className="w-full rounded border border-stroke p-2 bg-transparent dark:border-strokedark text-black dark:text-white outline-none focus:border-primary text-xs" placeholder="e.g. LES-1122" />
                </div>

                {/* Field 8: Remarks description textbox logger block */}
                <div>
                  <label className="block font-medium text-black dark:text-white mb-1.5 text-xs uppercase tracking-wide">Remarks:</label>
                  <input type="text" name="remarks" onChange={handleChange} value={values.remarks} className="w-full rounded border border-stroke p-2 bg-transparent dark:border-strokedark text-black dark:text-white outline-none focus:border-primary text-xs" placeholder="Enter general annotations..." />
                </div>
              </div>

              {/* ===== SECTION 2: DATATABLE ROW SPREADSHEET INPUT FIELDS BLOCK ===== */}
              <div className="overflow-x-auto mb-6 border border-stroke dark:border-strokedark rounded-sm">
                <table className="w-full border-collapse text-[11px] text-center min-w-[1200px]">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-meta-4 text-black dark:text-white font-bold uppercase tracking-wider border-b border-stroke dark:border-strokedark">
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-10">S.#</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-28">P.O No#</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark">P/Description</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-24">Location</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-24">Rate</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-20">Qty</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-24">Amount</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-20">Dis: Amt</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-16">Dist %</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-24">Discount</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark w-28">Net Amount</th>
                      <th className="p-2 border-r border-stroke dark:border-strokedark">Notes</th>
                      <th className="p-2 w-10"> 🗑️ </th>
                    </tr>
                  </thead>
                  <FieldArray name="items">
                    {({ push, remove }) => (
                      <tbody className="bg-white dark:bg-boxdark">
                        {values.items.map((item: any, index: number) => {
                          // Math calculations mapped inline to your row constraints
                          const qty = Number(item.qty) || 0;
                          const rate = Number(item.rate) || 0;
                          const disAmt = Number(item.disAmt) || 0;
                          const distPer = Number(item.distPer) || 0;
                          const extraDiscount = Number(item.discount) || 0;

                          const amount = rate * qty;
                          const percentageDiscountValue = (amount / 100) * distPer;
                          const totalRowDiscount = disAmt + percentageDiscountValue + extraDiscount;
                          const netAmount = amount - totalRowDiscount;

                          return (
                            <tr key={index} className="border-b border-stroke dark:border-strokedark">
                              <td className="p-1 border-r border-stroke dark:border-strokedark font-medium bg-gray-50 dark:bg-meta-4/20 dark:text-white text-black">{index + 1}</td>
                              <td className="p-1 border-r border-stroke dark:border-strokedark"><input name={`items.${index}.poNoSub`} onChange={handleChange} value={item.poNoSub} className="w-full p-1 border border-stroke dark:border-strokedark dark:text-white text-black rounded-xs text-center bg-transparent" /></td>
                              <td className="p-1 border-r border-stroke dark:border-strokedark"><input name={`items.${index}.pDescription`} onChange={handleChange} value={item.pDescription} className="w-full p-1 border border-stroke dark:border-strokedark dark:text-white text-black rounded-xs bg-transparent" placeholder="Enter Product Description" required /></td>
                              <td className="p-1 border-r border-stroke dark:border-strokedark"><input name={`items.${index}.location`} onChange={handleChange} value={item.location} className="w-full p-1 border border-stroke dark:border-strokedark dark:text-white text-black rounded-xs text-center bg-transparent" placeholder="WH-Zone" /></td>
                              <td className="p-1 border-r border-stroke dark:border-strokedark"><input type="number" name={`items.${index}.rate`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.rate} className="w-full p-1 border border-stroke dark:border-strokedark dark:text-white text-black rounded-xs text-center bg-transparent" /></td>
                              <td className="p-1 border-r border-stroke dark:border-strokedark"><input type="number" name={`items.${index}.qty`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.qty} className="w-full p-1 border border-stroke dark:border-strokedark dark:text-white text-black rounded-xs text-center bg-transparent" /></td>

                              {/* Read-Only Output Fields */}
                              <td className="p-1 border-r border-stroke dark:border-strokedark font-medium text-gray-500">{amount.toFixed(2)}</td>
                              <td className="p-1 border-r border-stroke dark:border-strokedark"><input type="number" name={`items.${index}.disAmt`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.disAmt} className="w-full p-1 border border-stroke dark:border-strokedark dark:text-white text-black rounded-xs text-center bg-transparent" /></td>
                              <td className="p-1 border-r border-stroke dark:border-strokedark"><input type="number" name={`items.${index}.distPer`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.distPer} className="w-full p-1 border border-stroke dark:border-strokedark dark:text-white text-black rounded-xs text-center bg-transparent" /></td>
                              <td className="p-1 border-r border-stroke dark:border-strokedark"><input type="number" name={`items.${index}.discount`} onKeyDown={blockInvalidChar} onChange={handleChange} value={item.discount} className="w-full p-1 border border-stroke dark:border-strokedark dark:text-white text-black rounded-xs text-center bg-transparent" /></td>

                              <td className="p-1 border-r border-stroke dark:border-strokedark font-bold text-black dark:text-white">{netAmount.toFixed(2)}</td>
                              <td className="p-1 border-r border-stroke dark:border-strokedark"><input name={`items.${index}.notes`} onChange={handleChange} value={item.notes} className="w-full p-1 border border-stroke dark:border-strokedark dark:text-white text-black rounded-xs bg-transparent" placeholder="Line notes" /></td>
                              <td className="p-1 text-center">
                                <button type="button" disabled={values.items.length === 1} onClick={() => remove(index)} className="text-red-500 font-bold hover:text-red-700 transition disabled:opacity-20">✕</button>
                              </td>
                            </tr>
                          );
                        })}
                        <tr>
                          <td colSpan={13} className="p-2 text-left bg-gray-50 dark:bg-meta-4/10">
                            <button type="button" onClick={() => push({ poNoSub: '', pDescription: '', location: '', rate: 0, qty: 1, disAmt: 0, distPer: 0, discount: 0, notes: '' })} className="text-success font-bold text-xs tracking-wide hover:underline">+ Add Row</button>
                          </td>
                        </tr>
                      </tbody>
                    )}
                  </FieldArray>
                </table>
              </div>

              {/* ===== SECTION 3: CALCULATION TOTALS PANEL GRID LAYOUT SUMMARY ===== */}
              <div className="flex flex-col md:flex-row justify-end gap-10 mt-6 px-4 pb-6">
                <div className="w-full md:w-1/3 space-y-2 text-xs border border-stroke dark:border-strokedark rounded-sm p-4 bg-gray-50/50 dark:bg-meta-4/10">
                  <div className="flex justify-between border-b border-stroke pb-1.5 dark:border-strokedark">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Total Quantity:</span>
                    <b className="text-success text-sm font-bold">{(values.items.reduce((acc, item) => acc + (Number(item.qty) || 0), 0)).toFixed(2)}</b>
                  </div>
                  <div className="flex justify-between border-b border-stroke pb-1.5 dark:border-strokedark">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Total Amount:</span>
                    <b className="text-success text-sm font-bold">{(values.items.reduce((acc, item) => acc + ((Number(item.rate) || 0) * (Number(item.qty) || 0)), 0)).toFixed(2)}</b>
                  </div>
                  <div className="flex justify-between border-b border-stroke pb-1.5 dark:border-strokedark">
                    <span className="font-medium text-gray-600 dark:text-gray-400">Total Discount:</span>
                    <b className="text-success text-sm font-bold">{(values.items.reduce((acc, item) => {
                      const gross = (Number(item.rate) || 0) * (Number(item.qty) || 0);
                      const fDisc = Number(item.disAmt) || 0;
                      const pDisc = (gross / 100) * (Number(item.distPer) || 0);
                      const extra = Number(item.discount) || 0;
                      return acc + fDisc + pDisc + extra;
                    }, 0)).toFixed(2)}</b>
                  </div>
                  <div className="flex justify-between pt-1 text-success font-extrabold text-base uppercase tracking-tight">
                    <span>Total Net Amount:</span>
                    <span>{(values.items.reduce((acc, item) => {
                      const gross = (Number(item.rate) || 0) * (Number(item.qty) || 0);
                      const fDisc = Number(item.disAmt) || 0;
                      const pDisc = (gross / 100) * (Number(item.distPer) || 0);
                      const extra = Number(item.discount) || 0;
                      return acc + (gross - (fDisc + pDisc + extra));
                    }, 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* ===== SECTION 4: GLOBAL FORM ACTIONS FOOTER ROW CONTROLS ===== */}
              <div className="pt-4 mt-4 border-t border-stroke dark:border-strokedark flex justify-end gap-3">
                <button type="button" onClick={() => navigate('/Salesman/list')} className="bg-danger text-white py-2 px-8 rounded font-medium hover:bg-opacity-90 transition shadow-sm" >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className={`rounded ${isEditMode ? "bg-success" : "bg-primary"} py-2.5 px-8 font-medium text-white hover:bg-opacity-90 transition disabled:bg-opacity-40 text-sm shadow-xs`}>
                  {loading ? <Spinner /> : isEditMode ? 'Update Record' : 'Save Record'}
                </button>
              </div>

            </Form>
          )}
        </Formik>

      </div>
    </div>
  );
};

export default AddDeliveryChallan;
