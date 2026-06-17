import React, { ReactNode } from 'react';

interface CardDataStatsProps {
  title: string;
  total: string;

  children: ReactNode;
}

const CardDataStats: React.FC<CardDataStatsProps> = ({
  title,
  total,

  children,
}) => {
  return (
    <div className="flex w-full gap-4 rounded-sm border border-stroke bg-white py-6 px-7.5 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex h-11.5 w-11.5 items-center justify-center rounded-full bg-meta-2 dark:bg-meta-4">
        {children}
      </div>

      <div className=" flex items-center justify-between">
        <div>
          <span className="text-sm font-medium">{title}</span>
          <h4 className="text-title-md font-bold text-black dark:text-white">
            {total}
          </h4>
        </div>
      </div>
    </div>
  );
};

export default CardDataStats;
