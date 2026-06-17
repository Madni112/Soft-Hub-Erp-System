import React, { useState, useEffect } from 'react'; 
import { useLocation, useNavigate } from 'react-router-dom'; 
import { Formik, Form } from 'formik'; 
import * as Yup from 'yup'; 
import { supabase } from '../../../Context/supabaseClient'; 
import { toast } from 'react-hot-toast'; 
import Spinner from '../../../ui/Spinner'; 

const AddCustomer = () => { 
  const [loading, setLoading] = useState(false); 
  const [companies, setCompanies] = useState<any[]>([]); 
  const location = useLocation(); 
  const navigate = useNavigate(); 

  // Extract customer data if passed via navigation (Edit Mode) 
  const editData = location.state?.customer; 
  const isEditMode = !!editData; 

  useEffect(() => { 
    const fetchCompanies = async () => { 
      const { data } = await supabase.from('companies').select('id, name'); 
      if (data) setCompanies(data); 
    }; 
    fetchCompanies(); 
  }, []); 

  const validationSchema = Yup.object().shape({ 
    customerName: Yup.string().required('Required'), 
    ntnNo: Yup.string().required('Required'), 
    primaryPhone: Yup.string().required('Required'), 
    province: Yup.string().required('Required'), 
  }); 

  const handleSubmit = async (values: any) => { 
    setLoading(true); 
    try { 
      // --- DYNAMIC DUPLICATE VALIDATION CHECK ENGINE ---
      // Scans database for matching name + company combinations
      let query = supabase
        .from('customers')
        .select('id')
        .eq('customerName', values.customerName.trim())
        .eq('company', values.company || '');

      // If updating, exclude current customer row ID from duplicate scan parameters
      if (isEditMode) {
        query = query.neq('id', editData.id);
      }

      const { data: existingRecords, error: checkError } = await query;

      if (checkError) throw checkError;

      // If a match is found, halt execution block and warn the operator
      if (existingRecords && existingRecords.length > 0) {
        toast.error('A customer with this exact name and company selection already exists!');
        setLoading(false);
        return;
      }

      if (isEditMode) { 
        const { error } = await supabase 
          .from('customers') 
          .update(values) 
          .eq('id', editData.id); 
        
        if (error) throw error; 
        toast.success('Customer updated successfully!'); 
        navigate('/customers/list'); 
      } else { 
        // INSERT NEW CUSTOMER 
        const { error } = await supabase.from('customers').insert([values]); 
        if (error) throw error; 
        toast.success('Customer added successfully!'); 
        navigate('/customers/list'); // Redirect to list after successful addition
      } 
    } catch (err: any) { 
      toast.error(err.message); 
    } finally { 
      setLoading(false); 
    } 
  }; 

  return ( 
    <div className="mx-auto max-w-270"> 
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark"> 
        <div className="border-b border-stroke py-4 px-6.5 dark:border-strokedark flex justify-between items-center"> 
          <h3 className="font-medium text-black dark:text-white"> 
            {isEditMode ? `Edit Customer: ${editData.customerName}` : 'New Customer Information'} 
          </h3> 
          <button 
            onClick={() => navigate('/customers/list')} 
            className="text-sm text-primary hover:underline font-medium"
          >
            {isEditMode ? 'Back to List' : 'See List'}
          </button> 
        </div> 

        <Formik 
          initialValues={editData || { customerName: '', ntnNo: '', cnicNo: '', primaryPhone: '', address: '', province: '', company: '', website: '', stRegNo: '', notes: '', followUpDate: '' }} 
          enableReinitialize={true} 
          validationSchema={validationSchema} 
          onSubmit={handleSubmit} 
        > 
          {({ handleChange, values, errors, touched }) => ( 
            <Form className="p-6.5"> 
              <div className="grid grid-cols-1 gap-x-12 gap-y-6 md:grid-cols-2"> 
                {/* Left Column */} 
                <div className="flex flex-col gap-5.5"> 
                  <div> 
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Customer Name *</label> 
                    <input name="customerName" onChange={handleChange} value={values.customerName} className={`w-full rounded border bg-transparent text-black dark:text-white p-3 outline-none focus:border-primary ${touched.customerName && errors.customerName ? 'border-red-500' : 'border-stroke'}`} /> 
                  </div> 
                  <div> 
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">CNIC/Reg No.</label> 
                    <input name="cnicNo" onChange={handleChange} value={values.cnicNo} placeholder="XXXXX-XXXXXXX-X" className="w-full rounded border border-stroke bg-transparent text-black dark:text-white p-3 outline-none focus:border-primary" /> 
                  </div> 
                  <div> 
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Address</label> 
                    <textarea name="address" rows={3} onChange={handleChange} value={values.address} className="w-full rounded border border-stroke bg-transparent text-black dark:text-white p-3 outline-none focus:border-primary"></textarea> 
                  </div> 
                  <div> 
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Company</label> 
                    <select name="company" onChange={handleChange} value={values.company} className="w-full rounded border border-stroke bg-transparent text-black dark:text-white p-3 outline-none focus:border-primary bg-transparent"> 
                      <option value="">Select Company</option> 
                      {companies.map(c => <option key={c.id} value={c.name}>{c.name}</option>)} 
                      <option value="Bismillah Gas Supplier">Bismillah Gas Supplier</option> 
                    </select> 
                  </div> 
                </div> 

                {/* Right Column */} 
                <div className="flex flex-col gap-5.5"> 
                  <div> 
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">NTN No. *</label> 
                    <input name="ntnNo" onChange={handleChange} value={values.ntnNo} className={`w-full rounded border bg-transparent text-black dark:text-white p-3 outline-none focus:border-primary ${touched.ntnNo && errors.ntnNo ? 'border-red-500' : 'border-stroke'}`} /> 
                  </div> 
                  <div> 
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Primary Phone *</label> 
                    <input name="primaryPhone" onChange={handleChange} value={values.primaryPhone} className={`w-full rounded border bg-transparent text-black dark:text-white p-3 outline-none focus:border-primary ${touched.primaryPhone && errors.primaryPhone ? 'border-red-500' : 'border-stroke'}`} /> 
                  </div> 
                  <div> 
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Province *</label> 
                    <select name="province" onChange={handleChange} value={values.province} className={`w-full rounded border bg-transparent text-black dark:text-white p-3 outline-none focus:border-primary bg-transparent ${touched.province && errors.province ? 'border-red-500' : 'border-stroke'}`}> 
                      <option value="">Select Province</option> 
                      <option value="Sindh">Sindh</option> 
                      <option value="Punjab">Punjab</option> 
                      <option value="Balochistan">Balochistan</option> 
                      <option value="Khyber Pakhtunkhwa">Khyber Pakhtunkhwa</option> 
                      <option value="Islamabad">Islamabad</option> 
                    </select> 
                  </div> 
                  <div> 
                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">Follow-up Date</label> 
                    <input type="date" name="followUpDate" onChange={handleChange} value={values.followUpDate} className="w-full rounded border border-stroke bg-transparent text-black dark:text-white p-3 outline-none focus:border-primary" /> 
                  </div> 
                </div> 
              </div> 
              
              <div className="mt-8 flex justify-end gap-4"> 
                <button type="submit" disabled={loading} className="rounded bg-primary py-2 px-10 font-medium text-white hover:bg-opacity-90 transition disabled:bg-opacity-50"> 
                  {loading ? <Spinner /> : isEditMode ? 'Update Customer' : 'Save Customer'} 
                </button> 
              </div> 
            </Form> 
          )} 
        </Formik> 
      </div> 
    </div> 
  ); 
}; 

export default AddCustomer;
