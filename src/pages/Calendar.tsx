import React, { useState, useEffect } from 'react';
import { FaCircle } from 'react-icons/fa';
import {
  MdKeyboardDoubleArrowLeft,
  MdKeyboardDoubleArrowRight,
} from 'react-icons/md';

interface CalendarProps {
  presentDates: number[]; // Array of dates marked as present
}

const Calendar: React.FC<CalendarProps> = ({ presentDates }) => {
  const [dates, setDates] = useState<(number | null)[]>([]); // Dates of the current calendar view
  const [month, setMonth] = useState<number>(new Date().getMonth()); // Current month
  const [year, setYear] = useState<number>(new Date().getFullYear()); // Current year

  const daysOfWeek: string[] = [
    'Sun',
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
  ];

  // Generate dates for the selected month
  useEffect(() => {
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // First day of the month
    const daysInMonth = new Date(year, month + 1, 0).getDate(); // Total days in the month

    const emptyStartDays = Array(firstDayOfMonth).fill(null); // Empty slots before the first day
    const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1); // Days of the current month
    const totalDays = [...emptyStartDays, ...monthDays];

    // Ensure the calendar has full weeks (42 days max)
    const totalSlots = 7 * Math.ceil(totalDays.length / 7); // Ensure a multiple of 7 slots
    const paddedDates = [
      ...totalDays,
      ...Array(totalSlots - totalDays.length).fill(null),
    ];

    setDates(paddedDates);
  }, [month, year]);

  // Navigate to the previous or next month
  const changeMonth = (increment: number) => {
    const newMonth = month + increment;
    if (newMonth < 0) {
      setMonth(11); // December of the previous year
      setYear((prevYear) => prevYear - 1);
    } else if (newMonth > 11) {
      setMonth(0); // January of the next year
      setYear((prevYear) => prevYear + 1);
    } else {
      setMonth(newMonth);
    }
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-900">
      <div className="flex space-x-6 my-6">
        <div className="flex gap-3 items-center">
          <FaCircle className="text-green-500" />
          Present
        </div>
        <div className="flex gap-3 items-center">
          <FaCircle className="text-red-500" />
          Absent
        </div>
      </div>
      {/* Header */}
      <div className="flex justify-between items-center mb-4 ">
        {/* Previous Button */}
        <button
          onClick={() => changeMonth(-1)}
          className="hidden sm:block px-4 py-2 bg-primary text-white rounded-md hover:bg-gray-300 mb-2 sm:mb-0"
        >
          Previous
        </button>
        <div className="px-4 py-2 bg-primary block sm:hidden">
          <MdKeyboardDoubleArrowLeft className="text-white" />
        </div>

        {/* Month Year Heading */}
        <h2 className="text-lg font-semibold text-center sm:text-left sm:mx-4 dark:text-white">
          {new Date(year, month).toLocaleString('default', { month: 'long' })}{' '}
          {year}
        </h2>

        {/* Next Button */}
        <button
          onClick={() => changeMonth(1)}
          className="hidden sm:block px-4 py-2 bg-primary text-white rounded-md hover:bg-gray-300 mt-2 sm:mt-0 "
        >
          Next
        </button>
        <div className="px-4 py-2 bg-primary block sm:hidden ">
          <MdKeyboardDoubleArrowRight className="text-white" />
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 text-center  ">
        {/* Days of the week */}
        {daysOfWeek.map((day) => (
          <div
            key={day}
            className="font-semibold text-gray-700 dark:text-white"
          >
            {day}
          </div>
        ))}
        {/* Calendar dates */}
        {dates.map((date, index) => {
          const isSunday = index % 7 === 0; // Check if the day is Sunday (first column of each week)
          return (
            <div
              key={index}
              className={`h-10 lg:h-20 flex items-center justify-center border dark:bg-black  ${
                date === null ? 'bg-gray-100' : 'bg-white'
              } ${
                isSunday
                  ? 'bg-yellow-100 text-yellow-600 border-yellow-500' // Apply yellow background for Sundays
                  : date && presentDates.includes(date)
                  ? 'bg-green-100 text-green-600 border-green-500'
                  : date
                  ? 'bg-red-100 text-red-600 border-red-500'
                  : ''
              }`}
            >
              {date || ''}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
