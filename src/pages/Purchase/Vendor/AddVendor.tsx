import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Formik, Form } from 'formik';
import * as Yup from 'yup';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';

const AddVendor = () => {
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const editData = location.state?.vendorRecord;
  const isEditMode = !!editData;

  const validationSchema = Yup.object().shape({
    vendorName: Yup.string().required('Vendor identity corporate name is mandatory'),
    contactName: Yup.string().nullable(),
    email: Yup.string().email('Please enter a valid structured email address pattern').nullable(),
    phoneNo: Yup.string().nullable(),
    cellNo: Yup.string().nullable(),
    address: Yup.string().nullable(),
    ntn: Yup.string().nullable()
  });

  const blockInvalidChar = (e: React.KeyboardEvent<HTMLInputElement>) =>
    ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault();
  return (
    <div className="mx-auto max-w-4xl text-black dark:text-bodydark text-xs">
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center">
          <h3 className="font-semibold text-black dark:text-white text-base">
            {isEditMode ? 'Modify Registered Vendor Profile Details' : 'Add New Commercial Business Vendor'}
          </h3>
          <button type="button" onClick={() => navigate('/Purchase/Vendor/List')} className="text-sm font-medium text-primary hover:underline cursor-pointer">
            Back to Vendor Directory
          </button>
        </div>

        <Formik
          initialValues={{
            vendorName: editData?.vendor_name || '',
            contactName: editData?.contact_name || '',
            email: editData?.email || '',
            phoneNo: editData?.phone_no || '',
            cellNo: editData?.cell_no || '',
            address: editData?.address || '',
            ntn: editData?.ntn || ''
          }}
          enableReinitialize={true}
          validationSchema={validationSchema}
          onSubmit={async (values) => {
            try {
              setLoading(true);

              const databasePayload = {
                vendor_name: values.vendorName.trim(),
                contact_name: values.contactName.trim() || null,
                email: values.email.trim() || null,
                phone_no: values.phoneNo.trim() || null,
                cell_no: values.cellNo.trim() || null,
                address: values.address.trim() || null,
                ntn: values.ntn.trim() || null
              };

              const { error } = isEditMode
                ? await supabase.from('vendors').update(databasePayload).eq('id', editData.id)
                : await supabase.from('vendors').insert([databasePayload]);

              if (error) throw error;

              toast.success(isEditMode ? 'Vendor metrics adjusted safely!' : 'Vendor account initialized error-free!');
              navigate('/Purchase/Vendor/List');
            } catch (err: any) {
              toast.error('Transaction Blocked: ' + err.message);
            } finally {
              setLoading(false);
            }
          }}
        >
          {({ handleChange, values, errors, touched }) => (
            <Form className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-gray-500 mb-1.5 font-bold uppercase tracking-wide">Vendor Corporate Name: *</label>
                  <input type="text" name="vendorName" onChange={handleChange} value={values.vendorName} className={`w-full rounded border px-3 h-10 bg-transparent text-xs font-bold text-black dark:text-white outline-none focus:border-primary ${touched.vendorName && errors.vendorName ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} placeholder="e.g., Siemens Logistics Pakistan" />
                  {touched.vendorName && errors.vendorName && <p className="text-red-500 font-bold text-[10px] mt-1">{String(errors.vendorName)}</p>}
                </div>

                <div>
                  <label className="block text-gray-500 mb-1.5 font-bold uppercase tracking-wide">Contact Person Representative Name:</label>
                  <input type="text" name="contactName" onChange={handleChange} value={values.contactName} className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent text-xs font-medium text-black dark:text-white outline-none focus:border-primary" placeholder="e.g., M. Ali Khan" />
                </div>

                <div>
                  <label className="block text-gray-500 mb-1.5 font-bold uppercase tracking-wide">Corporate Email Address:</label>
                  <input type="email" name="email" onChange={handleChange} value={values.email} className={`w-full rounded border px-3 h-10 bg-transparent text-xs font-medium text-black dark:text-white outline-none focus:border-primary ${touched.email && errors.email ? 'border-red-500' : 'border-stroke dark:border-strokedark'}`} placeholder="vendor@domain.com" />
                  {touched.email && errors.email && <p className="text-red-500 font-bold text-[10px] mt-1">{String(errors.email)}</p>}
                </div>

                <div>
                  <label className="block text-gray-500 mb-1.5 font-bold uppercase tracking-wide">National Tax Number (NTN Registration):</label>
                  <input type="text" name="ntn" onChange={handleChange} value={values.ntn} className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent text-xs font-bold font-mono text-black dark:text-white outline-none focus:border-primary" placeholder="e.g., 1234567-8" />
                </div>

                <div>
                  <label className="block text-gray-500 mb-1.5 font-bold uppercase tracking-wide">Landline Phone No.:</label>
                  <input type="text" name="phoneNo" onChange={handleChange} value={values.phoneNo} className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent text-xs text-black dark:text-white outline-none focus:border-primary" placeholder="e.g., 02134567890" />
                </div>

                <div>
                  <label className="block text-gray-500 mb-1.5 font-bold uppercase tracking-wide">Mobile Cell No.:</label>
                  <input type="text" name="cellNo" onChange={handleChange} value={values.cellNo} className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent text-xs font-bold text-black dark:text-white outline-none focus:border-primary" placeholder="e.g., 03001234567" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-gray-500 mb-1.5 font-bold uppercase tracking-wide">Business Physical Address:</label>
                  <input type="text" name="address" onChange={handleChange} value={values.address} className="w-full rounded border border-stroke dark:border-strokedark px-3 h-10 bg-transparent text-xs text-black dark:text-white outline-none focus:border-primary" placeholder="Plot reference, industrial area coordinates sector..." />
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-stroke dark:border-strokedark">
                <button type="button" onClick={() => navigate('/Purchase/Vendor/List')} className="rounded bg-danger py-2.5 px-8 font-medium text-white hover:bg-opacity-90 transition text-xs shadow-sm h-10 min-w-36 cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={loading} className="bg-success text-white py-2.5 px-12 rounded font-semibold text-sm hover:bg-opacity-90 transition shadow-sm font-bold cursor-pointer">
                  {loading ? <Spinner /> : isEditMode ? 'Update Vendor Account' : 'Save Vendor Profile'}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default AddVendor;
