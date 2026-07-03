import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { FiPlus, FiX } from 'react-icons/fi';

const AddChartOfAccount = () => {
    const [loading, setLoading] = useState(false);
    const [metadataLoading, setMetadataLoading] = useState(true);

    // Database metadata state pools
    const [categoriesList, setCategoriesList] = useState<any[]>([]);
    const [controlsList, setControlsList] = useState<any[]>([]);

    // Modals view and input trackers
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryInput, setNewCategoryInput] = useState('');

    const [showControlModal, setShowControlModal] = useState(false);
    const [newControlInput, setNewControlInput] = useState('');
    const [modalSelectedCategory, setModalSelectedCategory] = useState('');
    const [modalSubmitting, setModalSubmitting] = useState(false);

    const location = useLocation();
    const navigate = useNavigate();

    const editData = location.state?.account;
    const isEditMode = !!editData;

    const fetchLiveCOAMetadata = async () => {
        try {
            const { data: catData } = await supabase.from('coa_categories').select('name').order('name', { ascending: true });
            const { data: ctrlData } = await supabase.from('coa_controls').select('category_name, control_name').order('control_name', { ascending: true });

            if (catData) setCategoriesList(catData);
            if (ctrlData) setControlsList(ctrlData);
        } catch (err: any) {
            console.error(err.message);
        } finally {
            setMetadataLoading(false);
        }
    };

    useEffect(() => {
        fetchLiveCOAMetadata();
    }, []);

    const handleAddNewCategoryDB = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanName = newCategoryInput.trim();
        if (!cleanName) return;

        try {
            setModalSubmitting(true);
            const { error } = await supabase.from('coa_categories').insert([{ name: cleanName }]);
            if (error) throw error;

            toast.success('Category level schema profile added!');
            setNewCategoryInput('');
            setShowCategoryModal(false);
            await fetchLiveCOAMetadata();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setModalSubmitting(false);
        }
    };

    const handleAddNewControlDB = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanCtrl = newControlInput.trim();
        if (!modalSelectedCategory || !cleanCtrl) {
            toast.error('Both parameters fields are mandatory');
            return;
        }

        try {
            setModalSubmitting(true);
            const { error } = await supabase.from('coa_controls').insert([{ category_name: modalSelectedCategory, control_name: cleanCtrl }]);
            if (error) throw error;

            toast.success('Control specification block appended safely!');
            setNewControlInput('');
            setShowControlModal(false);
            await fetchLiveCOAMetadata();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setModalSubmitting(false);
        }
    };

    const validationSchema = Yup.object().shape({
        categoryCode: Yup.string().required('Required'),
        controlCode: Yup.string().required('Required'),
        accountCode: Yup.string().required('Required'),
        accountTitle: Yup.string().required('Required'),
    });

    if (metadataLoading) return <div className="flex h-48 items-center justify-center"><Spinner /></div>;

    return (
        <div className="mx-auto max-w-4xl">
            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">

                <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
                    <h3 className="font-semibold text-black dark:text-white text-base">
                        Add Chart of Account
                    </h3>
                    <button
                        type="button"
                        onClick={() => navigate('/Registration/Chart of Account/List')}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        Back to Directory
                    </button>

                </div>

                <Formik
                    initialValues={isEditMode ? {
                        categoryCode: editData.category_code || '',
                        controlCode: editData.control_code || '',
                        accountCode: editData.account_code || '',
                        accountTitle: editData.account_title || '',
                        notes: editData.notes || ''
                    } : {
                        categoryCode: '',
                        controlCode: '',
                        accountCode: '',
                        accountTitle: '',
                        notes: ''
                    }}
                    enableReinitialize={true}
                    validationSchema={validationSchema}
                    onSubmit={async (values) => {
                        setLoading(true);

                        const databasePayload = {
                            category_code: values.categoryCode,
                            control_code: values.controlCode,
                            account_code: values.accountCode.trim(),
                            account_title: values.accountTitle.trim(),
                            notes: values.notes.trim()
                        };

                        try {
                            const { error } = isEditMode
                                ? await supabase.from('chart_of_accounts').update(databasePayload).eq('id', editData.id)
                                : await supabase.from('chart_of_accounts').insert([databasePayload]);

                            if (error) throw error;
                            toast.success('Account registered successfully!');
                            navigate('/Registration/Chart of Account/List');
                        } catch (err: any) {
                            toast.error(err.message);
                        } finally {
                            setLoading(false);
                        }
                    }}
                >
                    {({ handleChange, values, errors, touched, setFieldValue }) => {
                        const activeFilteredControls = controlsList.filter(c => c.category_name === values.categoryCode);

                        return (
                            <Form className="space-y-5 text-xs text-gray-700 dark:text-gray-300 p-4">

                                {/* CATEGORY DROPDOWN WITH DARK MODE BG OVERRIDES */}
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <label className="w-full md:w-48 block font-bold text-black dark:text-white text-xs uppercase tracking-wide">Category Code: *</label>
                                    <div className="w-full md:w-150 flex items-center gap-2">
                                        <select
                                            name="categoryCode"
                                            value={values.categoryCode}
                                            onChange={(e) => {
                                                handleChange(e);
                                                setFieldValue('controlCode', '');
                                            }}
                                            className={`flex-1 rounded border px-3 h-10 bg-transparent text-xs font-semibold text-black dark:text-white outline-none focus:border-primary ${touched.categoryCode && errors.categoryCode ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                        >
                                            <option value="" className="dark:bg-boxdark text-gray-400">-- Select Category Code --</option>
                                            {categoriesList.map(c => <option key={c.name} value={c.name} className="dark:bg-boxdark text-black dark:text-white">{c.name}</option>)}
                                        </select>
                                        <button type="button" onClick={() => setShowCategoryModal(true)} className="h-10 w-10 shrink-0 flex items-center justify-center rounded border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20 hover:bg-slate-100 text-gray-500 hover:text-black dark:hover:text-white font-bold transition"><FiPlus size={16} /></button>
                                    </div>
                                </div>

                                {/* CONTROL CODE DROPDOWN WITH DARK MODE BG OVERRIDES */}
                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <label className="w-full md:w-48 block font-bold text-black dark:text-white text-xs uppercase tracking-wide">Control Code: *</label>
                                    <div className="w-full md:w-150 flex items-center gap-2">
                                        <select
                                            name="controlCode"
                                            value={values.controlCode}
                                            onChange={handleChange}
                                            disabled={!values.categoryCode}
                                            className={`flex-1 rounded border px-3 h-10 bg-transparent text-xs font-semibold text-black dark:text-white outline-none focus:border-primary disabled:opacity-50 ${touched.controlCode && errors.controlCode ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`}
                                        >
                                            <option value="" className="dark:bg-boxdark text-gray-400">-- Select Control Code --</option>
                                            {activeFilteredControls.map(c => <option key={c.control_name} value={c.control_name} className="dark:bg-boxdark text-black dark:text-white">{c.control_name}</option>)}
                                        </select>
                                        <button type="button" onClick={() => {
                                            if (values.categoryCode) setModalSelectedCategory(values.categoryCode);
                                            setShowControlModal(true);
                                        }} className="h-10 w-10 shrink-0 flex items-center justify-center rounded border border-stroke dark:border-strokedark bg-slate-50 dark:bg-meta-4/20 hover:bg-slate-100 text-gray-500 hover:text-black dark:hover:text-white font-bold transition"><FiPlus size={16} /></button>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <label className="w-full md:w-48 block font-bold text-black dark:text-white text-xs uppercase tracking-wide">Chart of Accounts Code: *</label>
                                    <div className="w-full md:w-150">
                                        <input type="text" name="accountCode" onChange={handleChange} value={values.accountCode} className={`w-full rounded border px-3 h-10 bg-transparent font-mono font-bold text-xs ${touched.accountCode && errors.accountCode ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} placeholder="Enter Account Serial (e.g. 1010-001)" />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <label className="w-full md:w-48 block font-bold text-black dark:text-white text-xs uppercase tracking-wide">Account Title: *</label>
                                    <div className="w-full md:w-150">
                                        <input type="text" name="accountTitle" onChange={handleChange} value={values.accountTitle} className={`w-full rounded border px-3 h-10 bg-transparent font-bold text-xs ${touched.accountTitle && errors.accountTitle ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} placeholder="Enter Ledger Title Name" />
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                                    <label className="w-full md:w-48 block font-bold text-black dark:text-white text-xs uppercase tracking-wide">Notes:</label>
                                    <div className="w-full md:w-150">
                                        <input type="text" name="notes" onChange={handleChange} value={values.notes} className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent outline-none focus:border-primary" placeholder="Optional notes coordinates info" />
                                    </div>
                                </div>

                                {/* FIXED: ALIGNED ACTION BUTTONS RIGHT AND APPLIED RED BACKGROUND FOR CANCEL */}
                                <div className="flex justify-end gap-4 pt-4 border-t border-stroke dark:border-strokedark">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/Registration/Chart of Account/List')}
                                        className="rounded bg-danger py-2.5 px-8 font-medium text-white hover:bg-opacity-90 transition text-xs shadow-sm h-10 min-w-36"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="rounded bg-primary py-2.5 px-8 font-medium text-white hover:bg-opacity-90 transition disabled:bg-opacity-40 text-xs shadow-sm h-10 min-w-36"
                                    >
                                        {loading ? <Spinner /> : 'Save Record'}
                                    </button>

                                </div>

                            </Form>
                        );
                    }}
                </Formik>

                {/* OVERLAY MODAL CATEGORY */}
                {showCategoryModal && (
                    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                        <div className="w-full max-w-sm rounded border border-stroke bg-white p-5 shadow-2xl dark:border-strokedark dark:bg-boxdark">
                            <div className="flex items-center justify-between border-b pb-2 mb-3">
                                <h4 className="font-bold text-black dark:text-white uppercase tracking-wide">Add Category Node</h4>
                                <button type="button" onClick={() => setShowCategoryModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><FiX size={18} /></button>
                            </div>
                            <form onSubmit={handleAddNewCategoryDB} className="space-y-4">
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">New Category Name: *</label>
                                    <input type="text" value={newCategoryInput} onChange={(e) => setNewCategoryInput(e.target.value)} className="w-full border rounded h-10 px-3 bg-transparent outline-none focus:border-primary font-bold" placeholder="e.g., Liabilities" required />
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <button type="button" onClick={() => setShowCategoryModal(false)} className="rounded border px-4 h-9 font-medium hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button>
                                    <button type="submit" disabled={modalSubmitting} className="rounded bg-success px-5 h-9 font-medium text-white hover:bg-opacity-90">{modalSubmitting ? '...' : 'Add'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* OVERLAY MODAL CONTROL CODE */}
                {showControlModal && (
                    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
                        <div className="w-full max-w-sm rounded border border-stroke bg-white p-5 shadow-2xl dark:border-strokedark dark:bg-boxdark">
                            <div className="flex items-center justify-between border-b pb-2 mb-3">
                                <h4 className="font-bold text-black dark:text-white uppercase tracking-wide">Add Control Sub-Group</h4>
                                <button type="button" onClick={() => setShowControlModal(false)} className="text-gray-400 hover:text-black dark:hover:text-white"><FiX size={18} /></button>
                            </div>
                            <form onSubmit={handleAddNewControlDB} className="space-y-4">
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">Parent Category Pillar: *</label>
                                    <select value={modalSelectedCategory} onChange={(e) => setModalSelectedCategory(e.target.value)} className="w-full border rounded h-10 px-2 bg-transparent font-semibold dark:bg-boxdark text-black dark:text-white" required>
                                        <option value="">-- Choose Category --</option>
                                        {categoriesList.map(c => <option key={c.name} value={c.name} className="dark:bg-boxdark">{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-500 mb-1 font-medium">Control Account Title Name: *</label>
                                    <input type="text" value={newControlInput} onChange={(e) => setNewControlInput(e.target.value)} className="w-full border rounded h-10 px-3 bg-transparent outline-none focus:border-primary font-bold" placeholder="e.g., LOCAL PURCHASE" required />
                                </div>
                                <div className="flex justify-end gap-2 pt-2 border-t">
                                    <button type="button" onClick={() => setShowControlModal(false)} className="rounded border px-4 h-9 font-medium hover:bg-gray-50 dark:hover:bg-meta-4">Cancel</button>
                                    <button type="submit" disabled={modalSubmitting} className="rounded bg-success px-5 h-9 font-medium text-white hover:bg-opacity-90">{modalSubmitting ? '...' : 'Add'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};

export default AddChartOfAccount;
