import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { axiosService } from '../service/axois';
import { useModal } from '../Context/Modal';
import Spinner from '../ui/Spinner';

interface UpdateUsersProps {
  userData: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    admission_year: string;
    examRoom_id: string;
    phone_number: string;
    image: string | null;
    camera_id: string;
    exam_hall?: string;
  };
}

const UpdateExamRoom: React.FC<UpdateUsersProps> = ({ userData }) => {
  const [examRooms, setExamRooms] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [loading, setLoading] = useState<boolean>();
  const { hideModal } = useModal();

  useEffect(() => {
    fetchExamRooms();
  }, []);

  const fetchExamRooms = async () => {
    const response = await axiosService.get('/exam-hall');
    setExamRooms(response.data);
  };

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      exam_hall: userData.exam_hall || '',
    },
    validationSchema: Yup.object({
      exam_hall: Yup.string().required('Exam Room is required'),
    }),
    onSubmit: async (values) => {
      try {
        setLoading(true);
        // Update user data
        await axiosService.put(`/user/${userData.id}`, values, {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        hideModal(true);
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div>
      <form className="p-4   md:p-5" onSubmit={formik.handleSubmit}>
        {/* Exam Room Selection */}
        <div className="col-span-2 mb-4 sm:col-span-1">
          <label
            htmlFor="exam_hall"
            className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
          >
            Select Exam Room
          </label>
          <select
            id="exam_hall"
            name="exam_hall"
            className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
            value={formik.values.exam_hall}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
          >
            <option value="">Select Exam Room</option>
            {examRooms.map((room) => (
              <option key={room.id} value={room.id}>
                {room.name}
              </option>
            ))}
          </select>
          {formik.touched.exam_hall && formik.errors.exam_hall && (
            <div className="text-red-500 text-sm">
              {formik.errors.exam_hall}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="col-span-2">
          <button
            type="submit"
            className={`w-full py-2 px-4 text-white ${
              loading ? 'bg-primary/70' : 'bg-primary'
            } rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500   focus:ring-opacity-50`}
            disabled={loading}
          >
            {loading ? (
              <Spinner />
            ) : userData.exam_hall ? (
              'Update Exam   Room'
            ) : (
              'Add Exam Room'
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UpdateExamRoom;
