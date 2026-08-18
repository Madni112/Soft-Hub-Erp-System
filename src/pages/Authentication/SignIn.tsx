import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import IconDark from '../../images/logo/icon-dark.png';
import IconLight from '../../images/logo/icon-light.png';
import Spinner from '../../ui/Spinner';
import { useAuth } from '../../Context/Auth';
import DarkModeSwitcher from '../../components/Header/DarkModeSwitcher';

const SignIn: React.FC = () => {
  const { login } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Validation schema
  const validationSchema = Yup.object({
    email: Yup.string()
      .email('Invalid email format')
      .required('Email is required'),
    password: Yup.string()
      .min(8, 'Password must be at least 8 characters')
      .required('Password is required'),
  });

  // Formik hook
  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setLoading(true);
        setAuthError(null);
        // Integrated with the new Supabase login (email, password)
        await login(values.email, values.password);
      } catch (error: any) {
        // Capture Supabase-specific errors (e.g., "Invalid login credentials")
        setAuthError(error.message || 'An error occurred during sign in');
      } finally {
        setLoading(false);
      }
    },
  });

  return (
    <div className="rounded-sm dark:border-strokedark dark:bg-boxdark h-screen flex flex-col">
      {/* Navbar */}
      <header className="w-full bg-white dark:bg-boxdark drop-shadow-1">
        <div className="flex items-center justify-between px-4 py-4 md:px-6 2xl:px-11">
          <div className="flex items-center gap-4">
            <img className="hidden dark:block h-10 w-auto object-contain" src={IconDark} alt="NAM Logo" />
            <img className="block dark:hidden h-10 w-auto object-contain" src={IconLight} alt="NAM Logo" />
            <div className="flex items-center gap-1">
              <h1 className="text-lg font-extrabold text-blue-600"> NOOR <span className="text-black dark:text-gray-300">MADNI</span></h1>
              <span className="text-sm text-blue-600 font-bold"> IT <span className="text-black dark:text-gray-300">SOLUTIONS</span></span>
              <span className="text-xs text-blue-600 font-bold">ERP</span>
            </div>
          </div>
          <ul className="flex items-center gap-2 m-0 list-none">
            <DarkModeSwitcher />
          </ul>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 justify-center items-center bg-gray-50 dark:bg-boxdark-2">
        <div className="w-full max-w-md border-stroke dark:border-strokedark flex items-center justify-center p-4">
          <div className="w-full bg-white dark:bg-boxdark rounded-lg shadow-default dark:border-strokedark border-stroke border p-6 sm:p-10">
            <h2 className="mb-9 text-2xl text-blue-900 text-center font-bold dark:text-white sm:text-title-xl2">
              Sign In
            </h2>

            {/* Display Supabase Auth Errors */}
            {authError && (
              <div className="mb-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700">
                {authError}
              </div>
            )}

            <form onSubmit={formik.handleSubmit}>
              {/* Email Input */}
              <div className="mb-4">
                <label className="mb-2.5 block font-medium text-black dark:text-white">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="Enter your email"
                    className={`w-full rounded-lg border bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white ${formik.touched.email && formik.errors.email ? 'border-red-500' : 'border-stroke'
                      }`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.email}
                  />
                  {formik.touched.email && formik.errors.email && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.email}</p>
                  )}
                </div>
              </div>

              {/* Password Input */}
              <div className="mb-6">
                <label className="mb-2.5 block font-medium text-black dark:text-white">Password</label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="8+ Characters"
                    className={`w-full rounded-lg border bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white ${formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-stroke'
                      }`}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    value={formik.values.password}
                  />
                  {formik.touched.password && formik.errors.password && (
                    <p className="text-red-500 text-sm mt-1">{formik.errors.password}</p>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="mb-5">
                <button
                  type="submit"
                  className={`w-full cursor-pointer rounded-lg border p-4 text-white transition hover:bg-opacity-90 ${loading ? 'bg-primary/80 border-primary/80 cursor-not-allowed' : 'bg-primary border-primary'
                    }`}
                  disabled={loading}
                >
                  {loading ? <Spinner /> : 'Sign In'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
