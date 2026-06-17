import { useEffect, useState } from 'react';
import { useModal } from '../Context/Modal';
import { axiosService } from '../service/axois';

import { CiEdit } from 'react-icons/ci';
import { MdDeleteOutline } from 'react-icons/md';
import AddDepartment from './AddDepartment';
import { HiHomeModern } from 'react-icons/hi2';

const AllDepartments = () => {
  const { showModal } = useModal();
  const [Departments, setDepartments] = useState<any[]>([]); // Use any[] or a defined type for Department data

  const addDepartment = () => {
    showModal(<AddDepartment />, 'Add Department', (result) => {
      if (result) {
        getDepartments();
      }
    });
  };

  useEffect(() => {
    getDepartments();
  }, []);

  const getDepartments = async () => {
    try {
      const response = await axiosService.get('/department');
      console.log(response.data);
      setDepartments(response.data);
    } catch (error) {
      console.error('Error fetching Departments:', error);
    }
  };

  return (
    <>
      <div className="flex justify-end my-2">
        <button
          onClick={addDepartment}
          className="bg-primary p-3  rounded text-white font-medium flex gap-2 items-center"
        >
          Add Department
          <HiHomeModern />
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
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Name
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="">
              {Departments.map((Department, key) => (
                <tr key={key}>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white">
                      {key + 1}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <h5 className="font-medium text-black dark:text-white pl-0">
                      {Department.department_name}
                    </h5>
                  </td>

                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark">
                    <div className="flex items-center space-x-3.5">
                      <button className="hover:text-primary">
                        <CiEdit />
                      </button>
                      <button className="hover:text-primary">
                        <MdDeleteOutline />
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

export default AllDepartments;
