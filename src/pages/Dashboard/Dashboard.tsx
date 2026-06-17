import React, { useEffect, useState } from 'react';
import CardDataStats from '../../components/CardDataStats';
import ChartThree from '../../components/Charts/ChartThree';

import { FaUserGraduate } from 'react-icons/fa';

import { axiosService } from '../../service/axois';
import { UserRole } from '../../constant/auth';
import { useAuth } from '../../Context/Auth';

const Dashboard: React.FC = () => {
  const { role } = useAuth();
  const [count, setCount] = useState<any>({});

  useEffect(() => {
    getCount();
  }, []);

  const getCount = async () => {
    const response = await axiosService.get('/attendance/counts');
    console.log(response.data);
    setCount(response.data);
  };

  return (
    <>
      <div
        className={`grid ${
          role === UserRole.ADMIN
            ? 'grid-cols-1 gap-6 xl:grid-cols-2'
            : role === UserRole.TEACHER
            ? 'grid-cols-1 gap-6'
            : 'grid-cols-1'
        }`}
      >
        {role === UserRole.ADMIN && (
          <>
            <div>
              <CardDataStats
                title="Total Students"
                total={
                  (count && count.student && count.student.student_count) || '0'
                }
              >
                <FaUserGraduate />
              </CardDataStats>
            </div>
            <div>
              <CardDataStats
                title="Total Teachers"
                total={(count && count.tutor && count.tutor.tutor_count) || '0'}
              >
                <FaUserGraduate />
              </CardDataStats>
            </div>
            <div>
              <ChartThree
                title="Student Attendance"
                present={
                  (count && count.student && count.student.attendance_count) ||
                  0
                }
                absent={
                  (count &&
                    count.student &&
                    count.student.student_count -
                      +count.student.attendance_count) ||
                  0
                }
              />
            </div>
            <div>
              <ChartThree
                title="Teacher Attendance"
                present={
                  (count && count.tutor && count.tutor.attendance_count) || 0
                }
                absent={
                  (count &&
                    count.student &&
                    count.tutor.tutor_count - +count.tutor.attendance_count) ||
                  0
                }
              />
            </div>
          </>
        )}
        {role === UserRole.TEACHER && (
          <>
            <div className="flex flex-wrap gap-4">
              <CardDataStats
                title="Total Students"
                total={
                  (count && count.student && count.student.student_count) || '0'
                }
              >
                <FaUserGraduate />
              </CardDataStats>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-6">
              <ChartThree
                title="My Attendance"
                present={(count && count.current_user_attendance_count) || 0}
                absent={
                  (count &&
                    new Date().getDate() -
                      count.current_user_attendance_count) ||
                  0
                }
              />
              <ChartThree
                title="Students Attendance"
                present={
                  (count && count.student && count.student.attendance_count) ||
                  0
                }
                absent={
                  (count &&
                    count.student &&
                    count.student.student_count -
                      count.student.attendance_count) ||
                  0
                }
              />
            </div>
          </>
        )}
        {role === UserRole.STUDENT && (
          <div>
            <ChartThree
              title="My Attendance"
              present={(count && count.current_user_attendance_count) || 0}
              absent={
                (count &&
                  new Date().getDate() - count.current_user_attendance_count) ||
                0
              }
            />
          </div>
        )}
      </div>
    </>
  );
};

export default Dashboard;
