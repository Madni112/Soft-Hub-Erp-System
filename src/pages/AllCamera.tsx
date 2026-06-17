import { useEffect, useState } from 'react';
import { useModal } from '../Context/Modal';
import { axiosService } from '../service/axois';

import { CiEdit } from 'react-icons/ci';
import { MdDeleteOutline } from 'react-icons/md';
import AddCamera from './AddCamera';
import { GiCctvCamera } from 'react-icons/gi';

const AllCameras = () => {
  const { showModal } = useModal();
  const [Cameras, setCameras] = useState<any[]>([]); // Use any[] or a defined type for Camera data

  const addCamera = () => {
    showModal(<AddCamera />, 'Add Camera', (result) => {
      if (result) {
        getCameras();
        // Perform actions or API calls here
      }
    });
  };
  //   showModal(<AddCamera />, 'Add Cameras', (result) => {
  //     if (result) {
  //       getCameras();
  //       // Perform actions or API calls here
  //     } else {
  //       console.log('Modal closed without submitting.');
  //     }
  //   });
  // };

  useEffect(() => {
    getCameras();
  }, []);

  const getCameras = async () => {
    try {
      const response = await axiosService.get('/camera');
      console.log(response.data);
      setCameras(response.data); // Assuming the response has an array of Cameras
    } catch (error) {
      console.error('Error fetching Cameras:', error);
    }
  };

  return (
    <>
      <div className="flex justify-end my-2">
        <button
          onClick={addCamera}
          className="bg-primary p-3  rounded text-white font-medium flex gap-2 items-center"
        >
          Add Camera
          <GiCctvCamera />
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
                <th className=" py-4 px-4 font-medium text-black dark:text-white">
                  Description
                </th>
                <th className=" py-4 px-4 font-medium text-black dark:text-white">
                  Department
                </th>
                <th className="py-4 px-4 font-medium text-black dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {Cameras.map((Camera, key) => (
                <tr key={key}>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark ">
                    <h5 className="font-medium text-black dark:text-white">
                      {key + 1}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark ">
                    <h5 className="font-medium text-black dark:text-white pl-0">
                      {Camera.cameraName}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark ">
                    <h5 className="font-medium text-black dark:text-white pl-0">
                      {Camera.description}
                    </h5>
                  </td>
                  <td className="border-b border-[#eee] py-5 px-4 dark:border-strokedark ">
                    <h5 className="font-medium text-black dark:text-white pl-0">
                      {Camera.department.department_name}
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

export default AllCameras;
