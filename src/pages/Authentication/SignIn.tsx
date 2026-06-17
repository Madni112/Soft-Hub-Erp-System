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
      <div className="flex flex-wrap items-center">
        {/* Left Side: Illustration */}
        <div className="hidden w-full xl:block xl:w-1/2">
          <div className="py-17.5 px-26 text-center">
            <Link className="mb-5.5 inline-block" to="/"></Link>
            <p className="2xl:px-20 text-black dark:text-white">
              An AI base Face Detection Attendance Portal
            </p>
            <span className="mt-15 inline-block">
              <svg width="350" height="350" viewBox="0 0 350 350" fill="none" xmlns="http://w3.org">
                {/* SVG Paths from your original code */}
                <path d="M33.5825 294.844L30.5069 282.723C25.0538 280.414 19.4747 278.414 13.7961 276.732L13.4079 282.365L11.8335 276.159C4.79107 274.148 0 273.263 0 273.263C0 273.263 6.46998 297.853 20.0448 316.653L35.8606 319.429L23.5737 321.2C25.2813 323.253 27.1164 325.196 29.0681 327.019C48.8132 345.333 70.8061 353.736 78.1898 345.787C85.5736 337.838 75.5526 316.547 55.8074 298.235C49.6862 292.557 41.9968 288.001 34.2994 284.415L33.5825 294.844Z" fill="#F2F2F2" />
                <path d="M62.8332 281.679L66.4705 269.714C62.9973 264.921 59.2562 260.327 55.2652 255.954L52.019 260.576L53.8812 254.45C48.8923 249.092 45.2489 245.86 45.2489 245.86C45.2489 245.86 38.0686 270.253 39.9627 293.358L52.0658 303.903L40.6299 299.072C41.0301 301.712 41.596 304.324 42.3243 306.893C49.7535 332.77 64.2336 351.323 74.6663 348.332C85.0989 345.341 87.534 321.939 80.1048 296.063C77.8019 288.041 73.5758 280.169 68.8419 273.123L62.8332 281.679Z" fill="#F2F2F2" />
                {/* ... (Rest of SVG paths) ... */}
              </svg>
            </span>
          </div>
        </div>

        {/* Right Side: Sign In Form */}
        <div className="w-full border-stroke dark:border-strokedark xl:w-1/2 xl:border-l-2 h-[100vh] flex items-center">
          <div className="w-full p-4 sm:p-12.5 xl:p-17.5">
            <h2 className="mb-9 text-2xl text-blue-900 flex gap-2 items-center font-bold dark:text-white sm:text-title-xl2">
              <img height={70} width={100} src={Logo} alt="Logo" />
              Sign In to SoftHub.PK
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
