import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

const AddOpeningStock = () => {
    const [loading, setLoading] = useState(false);
    const [locations, setLocations] = useState<any[]>([]);
    const [products, setProducts] = useState<any[]>([]);

    const location = useLocation();
    const navigate = useNavigate();

    const editData = location.state?.stock;
    const isEditMode = !!editData;

    const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
        ['-', 'e', 'E', '+'].includes(e.key) && e.preventDefault();

    useEffect(() => {
        const fetchMetadata = async () => {
            try {
                const { data: locData } = await supabase.from('inventory_locations').select('*');
                if (locData) setLocations(locData);

                const { data: prodData } = await supabase
                    .from('products')
                    .select('id, product_name, retail_price, mrp');

                if (prodData) setProducts(prodData);
            } catch (err: any) {
                console.error('Metadata fetch error:', err.message);
            }
        };
        fetchMetadata();
    }, []);
    1
    const validationSchema = Yup.object().shape({
        itemName: Yup.string().required('Required'),
        batchNumber: Yup.string().required('Required'),
        location: Yup.string().required('Required'),
        qty: Yup.number().min(1, 'Min 1').required('Required'),
        rp: Yup.number().min(0, 'Min 0').required('Required'),
        mrp: Yup.number().min(0, 'Min 0').required('Required'),
        openingDate: Yup.string().required('Required'),
        expiryDate: Yup.string().nullable(),
    });


    const handleSubmit = async (values: any) => {
        setLoading(true);
        try {
            // 1. Calculate final total value amount
            const finalValues = {
                ...values,
                amount: Number(values.qty) * Number(values.rp),
                expiryDate: values.expiryDate === "" ? null : values.expiryDate
            };

            if (isEditMode) {
                // --- EDIT MODE TRANSITION LOOP ---
                // Calculate the difference between the new quantity and the old quantity
                const oldQty = Number(editData.qty) || 0;
                const newQty = Number(values.qty) || 0;
                const qtyDifference = newQty - oldQty;

                // Save the updated opening stock log entries
                const { error: stockError } = await supabase
                    .from('opening_stocks')
                    .update(finalValues)
                    .eq('id', editData.id);

                if (stockError) throw stockError;

                // If the item quantity changed, sync the master products catalog ledger ledger
                if (qtyDifference !== 0) {
                    // Fetch the item's current stock profile tracking line from your 'products' table
                    const { data: currentProduct, error: fetchError } = await supabase
                        .from('products')
                        .select('current_stock')
                        .eq('product_name', values.itemName)
                        .single();

                    if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

                    if (currentProduct) {
                        const updatedStockBalance = (Number(currentProduct.current_stock) || 0) + qtyDifference;

                        await supabase
                            .from('products')
                            .update({ current_stock: updatedStockBalance })
                            .eq('product_name', values.itemName);
                    }
                }

                toast.success('Stock profile updated and product inventory synchronized!');
                navigate('/Inventory/OpeningStock/List');

            } else {
                // --- INSERT MODE TRANSITION LOOP ---
                // Save the initial opening stock record log entries
                const { error: stockError } = await supabase
                    .from('opening_stocks')
                    .insert([finalValues]);

                if (stockError) throw stockError;

                // Fetch the product's active ledger profile inside your 'products' table
                const { data: currentProduct, error: fetchError } = await supabase
                    .from('products')
                    .select('current_stock')
                    .eq('product_name', values.itemName)
                    .single();

                if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

                if (currentProduct) {
                    // Add the newly declared opening balance amount directly onto the product's existing live tracking count
                    const updatedStockBalance = (Number(currentProduct.current_stock) || 0) + Number(values.qty);

                    const { error: productUpdateError } = await supabase
                        .from('products')
                        .update({ current_stock: updatedStockBalance })
                        .eq('product_name', values.itemName);

                    if (productUpdateError) throw productUpdateError;
                }

                toast.success('Opening stock initialized and product inventory increased successfully!');
                navigate('/Inventory/OpeningStock/List');
            }
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateUniqueStockNo = () => {
        const timestamp = Date.now().toString().slice(-6);
        const randomCode = Math.floor(1000 + Math.random() * 9000);
        return `STK-${timestamp}-${randomCode}`;
    };

    return (
        <div className="mx-auto max-w-270">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
                <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
                    <h3 className="font-medium text-black dark:text-white">
                        {isEditMode ? `Modify Stock: ${editData.stockNo}` : 'Initialize Opening Stock'}
                    </h3>
                    <span
                        onClick={() => navigate('/Inventory/OpeningStock/List')}
                        className="text-sm text-primary font-medium hover:underline cursor-pointer"
                    >
                        {isEditMode ? '← Back to List' : '👁 See List'}
                    </span>
                </div>

                <Formik
                    initialValues={editData || {
                        stockNo: generateUniqueStockNo(),
                        itemName: '', batchNumber: '', location: '',
                        qty: 1, rp: 0, mrp: 0, amount: 0,
                        openingDate: new Date().toISOString().split('T')[0],
                        expiryDate: null // Updated to null default
                    }}
                    enableReinitialize={false}
                    validationSchema={validationSchema}
                    onSubmit={handleSubmit}
                >

                    {({ handleChange, setFieldValue, values, errors, touched }) => {
                        const calculatedAmount = (Number(values.qty) * Number(values.rp)).toFixed(2);

                        return (
                            <Form className="p-6.5">
                                <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Stock Number (Auto Generated)</label>
                                        <input name="stockNo" readOnly value={values.stockNo} className="w-full rounded border border-stroke bg-gray-50 px-3 h-10 text-xs font-bold text-textColor dark:bg-meta-4/30 dark:text-white outline-none" />
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Item Name (Product) *</label>
                                        <select
                                            name="itemName"
                                            value={values.itemName}
                                            onChange={(e) => {
                                                const selectedProd = products.find(p => p.product_name === e.target.value);
                                                setFieldValue('itemName', e.target.value);
                                                if (selectedProd) {
                                                    setFieldValue('rp', selectedProd.retail_price || 0);
                                                    setFieldValue('mrp', selectedProd.mrp || 0);
                                                }
                                            }}
                                            className={`w-full rounded border px-3 h-10 bg-transparent text-xs font-bold outline-none focus:border-primary dark:bg-boxdark ${touched.itemName && errors.itemName ? 'border-red-500' : 'border-stroke dark:border-strokedark'
                                                }`}
                                        >
                                            <option value="">-- Select Existing Product --</option>
                                            {products.map((p) => (
                                                <option key={p.id} value={p.product_name}>{p.product_name}</option>
                                            ))}
                                        </select>
                                        {touched.itemName && errors.itemName && (
                                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.itemName)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Batch Number *</label>
                                        <input name="batchNumber" onChange={handleChange} value={values.batchNumber} placeholder="e.g., BN-001" className={`w-full rounded border px-3 h-10 bg-transparent text-xs ${touched.batchNumber && errors.batchNumber ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
                                        {touched.batchNumber && errors.batchNumber && (
                                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.batchNumber)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Location / Warehouse *</label>
                                        <select
                                            name="location"
                                            onChange={handleChange}
                                            value={values.location}
                                            className={`w-full rounded border px-3 h-10 bg-transparent text-xs font-bold outline-none focus:border-primary dark:bg-boxdark ${touched.location && errors.location ? 'border-red-500' : 'border-stroke dark:border-strokedark'
                                                }`}
                                        >
                                            <option value="">-- Select Warehouse --</option>
                                            {locations.map((loc) => {
                                                const label = loc.name || loc.locationName || loc.location_name;
                                                return <option key={loc.id} value={label}>{label}</option>;
                                            })}
                                        </select>
                                        {touched.location && errors.location && (
                                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.location)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Quantity *</label>
                                        <input type="number" name="qty" min="1" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.qty} className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-right font-bold ${touched.qty && errors.qty ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
                                        {touched.qty && errors.qty && (
                                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.qty)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Retail Price (R.P) *</label>
                                        <input type="number" name="rp" min="0" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.rp} className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-right font-bold ${touched.rp && errors.rp ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
                                        {touched.rp && errors.rp && (
                                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.rp)}</p>
                                        )}
                                    </div>
                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Maximum Retail Price (MRP) *</label>
                                        <input type="number" name="mrp" min="0" onKeyDown={blockInvalidChar} onChange={handleChange} value={values.mrp} className={`w-full rounded border px-3 h-10 bg-transparent text-xs text-right font-bold ${touched.mrp && errors.mrp ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
                                        {touched.mrp && errors.mrp && (
                                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.mrp)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Opening Date *</label>
                                        <input type="date" name="openingDate" onChange={handleChange} value={values.openingDate} className={`w-full rounded border px-3 h-10 bg-transparent text-xs ${touched.openingDate && errors.openingDate ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} />
                                        {touched.openingDate && errors.openingDate && (
                                            <p className="text-red-500 text-[10px] mt-1 font-semibold">{String(errors.openingDate)}</p>
                                        )}
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Expiry Date</label>
                                        <input type="date" name="expiryDate" onChange={handleChange} value={values.expiryDate} className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent text-xs" />
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="mb-2 block text-xs font-semibold text-black dark:text-white">Total Value Amount (PKR)</label>
                                        <input readOnly value={`Rs. ${Number(calculatedAmount).toLocaleString()}`} className="w-full rounded border border-stroke bg-gray-100 dark:bg-meta-4/20 px-3 h-11 text-sm font-extrabold text-success outline-none text-right" />
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end gap-4 border-t border-stroke pt-4 dark:border-strokedark">
                                    <button type="button" onClick={() => navigate('/Inventory/OpeningStock/List')} className="rounded bg-danger py-2 px-8 font-medium text-white hover:bg-opacity-90 text-sm cursor-pointer shadow-sm">Cancel</button>
                                    <button type="submit" disabled={loading} className="rounded bg-success py-2 px-10 font-medium text-white hover:bg-opacity-90 text-sm cursor-pointer shadow-sm">{loading ? <Spinner /> : isEditMode ? 'Update Stock' : 'Save Stock'}</button>
                                </div>
                            </Form>
                        );
                    }}
                </Formik>
            </div>
        </div>
    );
};

export default AddOpeningStock;
