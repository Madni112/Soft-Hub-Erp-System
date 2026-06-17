import { useEffect, useState } from 'react';
import { axiosService } from '../service/axois';
import { UserRole } from '../constant/auth';
import { useModal } from '../Context/Modal';
import AddUsers from './AddUsers';
import { FaEye, FaUsers } from 'react-icons/fa';
import Attendance from './Attendence';

const Allteachers = () => {
  const { showModal } = useModal();
  const [teachers, setteachers] = useState<any[]>([]); // Use any[] or a defined type for teacher data

  const addTeacher = () => {
    showModal(<AddUsers role={UserRole.TEACHER} />, 'Add teacher', (result) => {
      if (result) {
        getteachers();
        // Perform actions or API calls here
      }
    });

    getteachers();
  };
  const getAttendaceById = (userId: string) => {
    showModal(<Attendance userId={userId} />, 'Attendance');
  };
  useEffect(() => {
    getteachers();
  }, []);

  const getteachers = async () => {
    try {
      const response = await axiosService.get(`/user?role=${UserRole.TEACHER}`);
      console.log(response.data);
      setteachers(response.data); // Assuming the response has an array of teachers
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  };

  return (
    <>
      <div className="flex justify-end my-2">
        <button
          onClick={addTeacher}
          className="bg-primary p-3  rounded text-white font-medium flex gap-2 items-center"
        >
          Add Teacher
          <FaUsers className="font-medium " />
        </button>
      </div>
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className=" py-4 px-4 font-medium text-black dark:text-white">
                  S.No
                </th>
                <th className=" py-4 px-4 font-medium text-black dark:text-white">
                  Name
                </th>
                <th className=" py-4 px-4 font-medium text-black dark:text-white">
                  Email
                </th>
                <th className=" py-4 px-4 font-medium text-black dark:text-white">
                  Phone Number
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Department
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Attendance
                </th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher, key) => (
                <tr key={key}>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {key + 1}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4  dark:border-strokedark ">
                    <h5 className="font-medium text-black dark:text-white">
                      {teacher.firstName} {teacher.lastName}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {teacher.email || 'N/A'}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4  dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {teacher.phoneNumber || 'N/A'}
                    </h5>
                  </td>

                  <td className="border-b border-[#eee] py-5 px-4  dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {(teacher.department &&
                        teacher.department.department_name) ||
                        'N/A'}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-stroked">
                    <div className="flex items-center justify-center space-x-3.5">
                      <button
                        onClick={() => getAttendaceById(teacher.id)}
                        className="hover:text-primary  "
                      >
                        <FaEye className="text-xl" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default Allteachers;
