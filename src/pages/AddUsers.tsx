import React, { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { axiosService } from '../service/axois';
import { UserRole } from '../constant/auth';
import { useModal } from '../Context/Modal';
import Spinner from '../ui/Spinner';

interface AddUsersProps {
  role?: string;
}

const AddUsers: React.FC<AddUsersProps> = ({ role = UserRole.STUDENT }) => {
  const { hideModal } = useModal();
  const [departments, setDepartments] = useState<
    { id: string; department_name: string }[]
  >([]);
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
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: role === UserRole.TEACHER ? UserRole.TEACHER : UserRole.STUDENT,
      admission_year: role === UserRole.STUDENT ? '' : '2016',
      department_id: '',
      phone_number: '',
      camera_id: '1',
      image: null,
    },
    validationSchema: Yup.object({
      first_name: Yup.string().required('First Name is required'),
      last_name: Yup.string().required('Last Name is required'),
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
      role: Yup.string().required('Role is required'),
      admission_year: Yup.number()
        .min(1900, 'Invalid year')
        .max(2099, 'Invalid year')
        .required('Admission Year is required'),
      department_id: Yup.string().required('Department is required'),
      phone_number: Yup.string()
        .max(10, 'Phone Number must be exactly 11 digits')
        .min(10, 'Phone Number must be exactly 11 digits')
        .required('Phone Number is required'),
      image: Yup.mixed().required('Student Picture is required'),
      camera_id: Yup.string().required('Camera is Required'),
    }),
    onSubmit: async (values) => {
      console.log(values);
      try {
        setLoading(true);
        await axiosService.post('/auth/register', values, {
          headers: {
            'Content-Type': 'multipart/form-data',
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
      <form className="p-4 md:p-5" onSubmit={formik.handleSubmit}>
        <div className="grid gap-4 mb-4 grid-cols-2">
          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="first_name"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              First Name
            </label>
            <input
              type="text"
              name="first_name"
              id="first_name"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="eg: John"
              value={formik.values.first_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.first_name && formik.errors.first_name && (
              <div className="text-red-500 text-sm">
                {formik.errors.first_name}
              </div>
            )}
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="last_name"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Last Name
            </label>
            <input
              type="text"
              name="last_name"
              id="last_name"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="eg: Doe"
              value={formik.values.last_name}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.last_name && formik.errors.last_name && (
              <div className="text-red-500 text-sm">
                {formik.errors.last_name}
              </div>
            )}
          </div>

          <div className="col-span-2">
            <label
              htmlFor="email"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="admin72@gmail.com"
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.email && formik.errors.email && (
              <div className="text-red-500 text-sm">{formik.errors.email}</div>
            )}
          </div>

          <div className="col-span-2">
            <label
              htmlFor="password"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              id="password"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="Enter password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.password && formik.errors.password && (
              <div className="text-red-500 text-sm">
                {formik.errors.password}
              </div>
            )}
          </div>

          {role === UserRole.STUDENT ? (
            <div className="col-span-2 sm:col-span-1">
              <label
                htmlFor="admission_year"
                className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
              >
                Admission Year
              </label>
              <input
                type="number"
                name="admission_year"
                id="admission_year"
                min="1900"
                max="2099"
                step="1"
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
                placeholder="2015"
                value={formik.values.admission_year}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
              />
              {formik.touched.admission_year &&
                formik.errors.admission_year && (
                  <div className="text-red-500 text-sm">
                    {formik.errors.admission_year}
                  </div>
                )}
            </div>
          ) : null}

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
              <option value="">Select department</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.department_name}
                </option>
              ))}
            </select>
            {formik.touched.department_id && formik.errors.department_id && (
              <div className="text-red-500 text-sm">
                {formik.errors.department_id}
              </div>
            )}
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label
              htmlFor="phone_number"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Phone Number
            </label>
            <input
              type="number"
              name="phone_number"
              id="phone_number"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              placeholder="03193529992"
              value={formik.values.phone_number}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
            />
            {formik.touched.phone_number && formik.errors.phone_number && (
              <div className="text-red-500 text-sm">
                {formik.errors.phone_number}
              </div>
            )}
          </div>

          <div className="col-span-2">
            <label
              htmlFor="image"
              className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
            >
              Student Picture
            </label>
            <input
              type="file"
              name="image"
              id="image"
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-600 focus:border-primary-600 block w-full p-2.5 dark:bg-gray-600 dark:border-gray-500 dark:placeholder-gray-400 dark:text-white dark:focus:ring-primary-500 dark:focus:border-primary-500"
              onChange={(event) =>
                formik.setFieldValue('image', event.currentTarget.files![0])
              }
              onBlur={formik.handleBlur}
            />
            {formik.touched.image && formik.errors.image && (
              <div className="text-red-500 text-sm">{formik.errors.image}</div>
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
          {loading ? (
            <Spinner />
          ) : (
            `Add ${role === UserRole.STUDENT ? role : 'Teacher'}`
          )}
        </button>
      </form>
    </div>
  );
};

export default AddUsers;
