import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { axiosService } from '../service/axois';
import { useModal } from '../Context/Modal';
import Spinner from '../ui/Spinner';

interface AddDepartmentProps {
  department_name?: string;
}

const AddDepartment: React.FC<AddDepartmentProps> = ({}) => {
  const { hideModal } = useModal();
  const [loading, setLoading] = useState<boolean>();
  const formik = useFormik({
    initialValues: {
      department_name: '',
    },
    validationSchema: Yup.object({
      department_name: Yup.string().required('Department Name is required'),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        await axiosService.post('/department', values);
        hideModal(true);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div>
      <form className="p-4 md:p-5" onSubmit={formik.handleSubmit}>
        <div className="grid gap-4 mb-4 grid-cols-1">
          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="department_name"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Department Name
            </label>
            <input
              type="text"
              name="department_name"
              id="department_name"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="eg: John"
              value={formik.values.department_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.department_name &&
              formik.errors.department_name && (
                <div className="text-red-500 text-sm">
                  {formik.errors.department_name}
                </div>
              )}
          </div>
        </div>

        <button
          type="submit"
          className={`w-full ${
            loading ? 'bg-primary/70' : 'bg-primary'
          } text-white p-2 rounded-lg hover:bg-blue-600`}
          disabled={loading}
        >
          {loading ? <Spinner /> : 'Add Department'}
        </button>
      </form>
    </div>
  );
};

export default AddDepartment;
