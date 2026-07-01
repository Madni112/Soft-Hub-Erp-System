import DropdownNotification from './DropdownNotification';
import DropdownUser from './DropdownUser';
import DarkModeSwitcher from './DarkModeSwitcher';

const Header = (props: {
  sidebarOpen: string | boolean | undefined;
  setSidebarOpen: (arg0: boolean) => void;
}) => {
  return (
    <header className="w-full relative">
      <div className="flex flex-grow items-center bg-white drop-shadow-1 dark:bg-boxdark justify-between px-4 py-4 md:px-6 2xl:px-11">
        
        <div className={`transition-all duration-300 ${
          props.sidebarOpen 
            ? 'relative left-0' 
            : 'relative left-0'
        }`}>
          <button
            aria-controls="sidebar"
            onClick={(e) => {
              e.stopPropagation();
              props.setSidebarOpen(!props.sidebarOpen);
            }}
            className="block rounded-sm border border-stroke bg-white p-1.5 shadow-sm dark:border-strokedark dark:bg-boxdark hover:bg-gray-50"
          >
            <span className="relative block h-5.5 w-5.5 cursor-pointer">
              <span className="du-block absolute right-0 h-full w-full">
                <span className="relative left-0 top-0 my-1 block h-0.5 w-full rounded-sm bg-black dark:bg-white"></span>
                <span className="relative left-0 top-0 my-1 block h-0.5 w-full rounded-sm bg-black dark:bg-white"></span>
                <span className="relative left-0 top-0 my-1 block h-0.5 w-full rounded-sm bg-black dark:bg-white"></span>
              </span>
            </span>
          </button>
        </div>

        <div className="flex-1 lg:block hidden"></div>

        <div className="flex items-center gap-3 2xsm:gap-7">
          <ul className="flex items-center gap-2 2xsm:gap-4">
            <DarkModeSwitcher />
          </ul>
          <DropdownUser />
        </div>
      </div>
    </header>
  );
};

export default Header;