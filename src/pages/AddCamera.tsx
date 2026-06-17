import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { axiosService } from '../service/axois';
import { useModal } from '../Context/Modal';
import Spinner from '../ui/Spinner';

const AddCamera: React.FC = () => {
  const [departments, setDepartments] = useState([]);
  const { hideModal } = useModal();
  const [loading, setLoading] = useState<boolean>();

  useEffect(() => {
    getDepartment();
  }, []);

  const getDepartment = async () => {
    const response = await axiosService.get('/department');
    setDepartments(response.data); // Assuming the response has an array of departments
  };

  const formik = useFormik({
    initialValues: {
      camera_name: '',
      description: '',
      department_id: '', // Ensure this matches with the field
    },
    validationSchema: Yup.object({
      camera_name: Yup.string().required('Camera Name is required'),
      description: Yup.string().required('Description is required'),
      department_id: Yup.string().required('Department is required'),
    }),
    onSubmit: async (values) => {
      console.log(values);
      try {
        setLoading(true);
        await axiosService.post('/camera', values);
      } finally {
        setLoading(false);
      }
      hideModal(true);
    },
  });

  return (
    <div>
      <form className="p-4 md:p-5" onSubmit={formik.handleSubmit}>
        <div className="grid gap-4 mb-4 grid-cols-1">
          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="camera_name"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Camera Name
            </label>
            <input
              type="text"
              name="camera_name"
              id="camera_name"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="eg: John"
              value={formik.values.camera_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.camera_name && formik.errors.camera_name && (
              <div className="text-red-500 text-sm">
                {formik.errors.camera_name}
              </div>
            )}
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="description"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Description
            </label>
            <input
              type="text"
              name="description"
              id="description"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="Camera description"
              value={formik.values.description}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.description && formik.errors.description && (
              <div className="text-red-500 text-sm">
                {formik.errors.description}
              </div>
            )}
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="department_id"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Department
            </label>
            <select
              id="department_id"
              name="department_id"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              value={formik.values.department_id}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            >
              <option value="">Select Department</option>
              {departments.map((departments: any) => (
                <option key={departments.id} value={departments.id}>
                  {departments.department_name}
                </option>
              ))}
            </select>
            {formik.touched.department_id && formik.errors.department_id && (
              <div className="text-red-500 text-sm">
                {formik.errors.department_id}
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
          {loading ? <Spinner /> : 'Add Camera'}
        </button>
      </form>
    </div>
  );
};

export default AddCamera;
