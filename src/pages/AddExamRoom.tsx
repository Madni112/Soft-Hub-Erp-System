import React, { useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { axiosService } from '../service/axois';
import { useModal } from '../Context/Modal';
import Spinner from '../ui/Spinner';

const AddExamRoom: React.FC = () => {
  const { hideModal } = useModal();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const formik = useFormik({
    initialValues: {
      name: '',
    },
    validationSchema: Yup.object({
      name: Yup.string().required('Exam Room Name is required'),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setError(null);
        await axiosService.post('/exam-hall', values);
        hideModal(true);
      } catch (error) {
        setError('Failed to add the Exam Room. Please try again.');
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
              htmlFor="name"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Exam Room Name
            </label>
            <input
              type="text"
              name="name"
              id="name"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="e.g., Room A"
              value={formik.values.name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.name && formik.errors.name && (
              <div className="text-red-500 text-sm">{formik.errors.name}</div>
            )}
          </div>
        </div>

        {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

        <button
          type="submit"
          className={`w-full ${
            loading ? 'bg-primary/70' : 'bg-primary'
          } text-white p-2 rounded-lg hover:bg-blue-600`}
          disabled={loading}
        >
          {loading ? <Spinner /> : 'Add Exam Room'}
        </button>
      </form>
    </div>
  );
};

export default AddExamRoom;
