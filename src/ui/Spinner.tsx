import React from 'react';

type SpinnerProps = {
  size?: string; // Example: 'w-8 h-8'
  color?: string; // Example: 'border-blue-600'
};

const Spinner: React.FC<SpinnerProps> = ({
  size = 'w-6 h-6',
  color = 'border-white',
}) => {
  return (
    <div role="status" className="flex items-center justify-center">
      <div
        className={`${size} border-[3px] border-t-transparent rounded-full animate-spin ${color}`}
      ></div>
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
