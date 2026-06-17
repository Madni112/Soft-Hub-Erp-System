import React, { useEffect, useState } from 'react';
import Calendar from './Calendar';
import { axiosService } from '../service/axois';

function extractUniqueDates(data: any[]) {
  const uniqueDays = new Set();
  data.forEach((item) => {
    const day = new Date(item.createdAt).getDate();
    uniqueDays.add(day);
  });

  return Array.from(uniqueDays);
}
const Attendance: React.FC<{ userId: string }> = ({ userId }) => {
  const [presentDays, setPresentDays] = useState<number[]>([]);
  useEffect(() => {
    Attendance();
  }, []);
  const Attendance = async () => {
    const response = await axiosService.get(`/attendance?userId=${userId}`);
    console.log(response.data);
    const present = extractUniqueDates(response.data);
    setPresentDays(present as number[]);
  };

  return (
    <div className="bg-gray-50">
      <Calendar presentDates={presentDays} />
    </div>
  );
};

export default Attendance;
