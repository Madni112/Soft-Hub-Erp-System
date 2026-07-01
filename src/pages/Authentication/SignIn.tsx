import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Logo from '../../images/logo/authenFace.png';
import Spinner from '../../ui/Spinner';
import { useAuth } from '../../Context/Auth';

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
    <div className="rounded-sm dark:border-strokedark dark:bg-boxdark h-full">
      <div className="flex flex-wrap justify-center items-center">
        {/* Right Side: Sign In Form */}
        <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 h-[100vh] flex items-center">
          <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
            <h2 className="mb-9 text-2xl text-blue-900 flex gap-2 text-center items-center font-bold dark:text-white sm:text-title-xl2">
              <img height={70} width={100} src={Logo} alt="Logo" />
              Sign In to SoftHub
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
                    className={`w-full rounded-lg border bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white ${
                      formik.touched.email && formik.errors.email ? 'border-red-500' : 'border-stroke'
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
                    className={`w-full rounded-lg border bg-transparent py-4 pl-6 pr-10 text-black outline-none focus:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white ${
                      formik.touched.password && formik.errors.password ? 'border-red-500' : 'border-stroke'
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
                  className={`w-full cursor-pointer rounded-lg border p-4 text-white transition hover:bg-opacity-90 ${
                    loading ? 'bg-primary/80 border-primary/80 cursor-not-allowed' : 'bg-primary border-primary'
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
