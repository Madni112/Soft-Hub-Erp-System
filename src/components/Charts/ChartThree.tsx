import { ApexOptions } from 'apexcharts';
import React, { useState, useEffect } from 'react';
import ReactApexChart from 'react-apexcharts';

// Define the interface for the props that will be passed into the component
interface ChartThreeProps {
  title: string;
  present: number;
  absent: number;
}

const options: ApexOptions = {
  chart: {
    fontFamily: 'Satoshi, sans-serif',
    type: 'donut',
  },
  colors: ['#34D399', '#EF4444', '#F59E0B', '#3B82F6'],
  labels: ['Present', 'Absent'],
  legend: {
    show: false,
    position: 'bottom',
  },
  plotOptions: {
    pie: {
      donut: {
        size: '65%',
        background: 'transparent',
      },
    },
  },
  dataLabels: {
    enabled: false,
  },
  responsive: [
    {
      breakpoint: 2600,
      options: {
        chart: {
          width: 380,
        },
      },
    },
    {
      breakpoint: 640,
      options: {
        chart: {
          width: 200,
        },
      },
    },
  ],
};

const ChartThree: React.FC<ChartThreeProps> = ({ title, present, absent }) => {
  const [state, setState] = useState<{ series: number[] }>({
    series: [present, absent],
  });

  // Optionally, if you want to dynamically update the chart when props change
  useEffect(() => {
    setState({
      series: [present, absent],
    });
  }, [present, absent]);

  return (
    <div className="sm:px-7.5 col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark xl:col-span-5">
      <div className="mb-3 justify-between gap-4 sm:flex">
        <div>
          <h5 className="text-xl font-semibold text-black dark:text-white">
            {title}
          </h5>
        </div>
        <div></div>
      </div>

      <div className="mb-2">
        <div id="chartThree" className="mx-auto flex justify-center">
          <ReactApexChart
            options={options}
            series={state.series}
            type="donut"
          />
        </div>
      </div>

      <div className="-mx-8 flex flex-wrap items-center justify-center gap-y-3">
        <div className="sm:w-1/2 w-full px-8">
          <div className="flex w-full items-center">
            <span className="mr-2 block h-3 w-full max-w-3 rounded-full bg-green-500"></span>
            <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white">
              <span>Total Present</span>
              <span>{present}</span>
            </p>
          </div>
        </div>
        <div className="sm:w-1/2 w-full px-8">
          <div className="flex w-full items-center">
            <span className="mr-2 block h-3 w-full max-w-3 rounded-full bg-red-500"></span>
            <p className="flex w-full justify-between text-sm font-medium text-black dark:text-white">
              <span>Total Absent</span>
              <span>{absent}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartThree;
