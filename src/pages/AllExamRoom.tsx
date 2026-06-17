import { useEffect, useState } from 'react';
import { useModal } from '../Context/Modal';
import { axiosService } from '../service/axois';
import { CiEdit } from 'react-icons/ci';
import { MdDeleteOutline } from 'react-icons/md';
import { RiHotelFill } from 'react-icons/ri';
import AddExamRoom from './AddExamRoom';

const AllExamRoom = () => {
  const { showModal } = useModal();
  const [ExamRoom, setExamRoom] = useState<any[]>([]);

  const addExamRoom = () => {
    showModal(<AddExamRoom />, 'Add ExamRoom', (result) => {
      if (result) {
        getExamRoom();
      } else {
        console.log('Modal closed without submitting.');
      }
    });
  };

  useEffect(() => {
    getExamRoom();
  }, []);

  const getExamRoom = async () => {
    try {
      const response = await axiosService.get('/exam-hall');

      setExamRoom(response.data);
    } catch (error) {}
  };

  return (
    <>
      <div className="flex justify-end my-2">
        <button
          onClick={addExamRoom}
          className="bg-primary p-3  rounded text-white font-medium flex gap-2 items-center"
        >
          Add Exam Room
          <RiHotelFill />
        </button>
      </div>
      <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
        <div className="max-w-full overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="bg-gray-2 text-left dark:bg-meta-4">
                <th className=" py-4 px-4 font-medium text-black dark:text-white ">
                  S.No
                </th>
                <th className=" py-4 px-4 font-medium text-black dark:text-white">
                  Name
                </th>

                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {ExamRoom.map((ExamRoom, key) => (
                <tr key={key}>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark ">
                    <h5 className="font-medium text-black dark:text-white">
                      {key + 1}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark ">
                    <h5 className="font-medium text-black dark:text-white pl-0">
                      {ExamRoom.name}
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

export default AllExamRoom;
