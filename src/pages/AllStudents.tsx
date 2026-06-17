import { useEffect, useState } from 'react';
import { useModal } from '../Context/Modal';
import AddUsers from './AddUsers';
import { axiosService } from '../service/axois';
import { UserRole } from '../constant/auth';
import Attendance from './Attendence';
import { FaEye } from 'react-icons/fa';
import UpdateUserExamRoom from './UpdateExamRoom';
import { useAuth } from '../Context/Auth';
import { PiStudentBold } from 'react-icons/pi';
import { CiEdit } from 'react-icons/ci';
import { MdDeleteOutline } from 'react-icons/md';

const AllStudents = () => {
  const { role } = useAuth();
  const [loading, setLoading] = useState<boolean>();
  const [students, setStudents] = useState<any[]>([]); // Use any[] or a defined type for student data
  const { showModal } = useModal();

  const addStudent = () => {
    showModal(<AddUsers />, 'Add Student', (result) => {
      if (result) {
        getStudents();
        // Perform actions or API calls here
      }
    });
  };

  const UpdateExamRoom = (user: any) => {
    showModal(
      <UpdateUserExamRoom userData={user} />,
      'Add/Update Exam Room',
      (result) => {
        if (result) {
          getStudents();
          // Perform actions or API calls here
        }
      },
    );
  };
  const getAttendaceById = (userId: string) => {
    showModal(<Attendance userId={userId} />, 'Attendance');
  };

  useEffect(() => {
    getStudents();
  }, []);

  const getStudents = async () => {
    try {
      setLoading(true);
      const response = await axiosService.get(`/user?role=${UserRole.STUDENT}`);
      console.log(response.data);
      setStudents(response.data); // Assuming the response has an array of students
    } catch (error) {
      console.error('Error fetching students:', error);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="flex justify-end my-2">
        {role === UserRole.ADMIN && (
          <button
            onClick={addStudent}
            className="bg-primary p-3  rounded text-white font-medium flex gap-2 items-center"
          >
            Add Student
            <PiStudentBold className="font-medium " />
          </button>
        )}
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
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Phone Number
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Department
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Batch
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Attendance
                </th>
                {role === UserRole.ADMIN && (
                  <th className="py-4 px-4 font-medium text-black dark:text-white">
                    Actions{' '}
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {students.map((student, key) => (
                <tr key={key}>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {key + 1}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {student.firstName} {student.lastName}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {student.email || 'N/A'}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {student.phoneNumber || 'N/A'}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {(student.department &&
                        student.department.department_name) ||
                        'N/A'}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {student.admissionYear || 'N/A'}
                    </h5>
                  </td>

                  <td className="border-b border-[#eee] py-5 px-4 dark:border-stroked">
                    <div className="flex items-center justify-center space-x-3.5">
                      <button
                        onClick={() => getAttendaceById(student.id)}
                        className="hover:text-primary  "
                      >
                        <FaEye className="text-xl" />
                      </button>
                    </div>
                  </td>
                  {role === UserRole.ADMIN && (
                    <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                      <div className="flex items-center space-x-3.5">
                        <button className="hover:text-primary">
                          <CiEdit onClick={() => UpdateExamRoom(student)} />
                        </button>
                        <button className="hover:text-primary">
                          <MdDeleteOutline />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default AllStudents;
