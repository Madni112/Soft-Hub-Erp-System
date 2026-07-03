import { MdDashboard, MdReceipt, MdPeople, MdAdminPanelSettings, MdEmojiTransportation, MdEdit, MdInventory2, MdClass, MdAccountBox, MdCategory, MdStraighten, MdDomain, MdInventory, MdBadge, MdShoppingCart, MdLocationOn, MdLocalShipping, MdCompareArrows, MdFormatListBulleted, MdAccountTree, MdReceiptLong, MdAccountBalance } from 'react-icons/md';
import Dashboard from '../pages/Dashboard/Dashboard';
import NewInvoice from '../pages/Sales/Invoice/NewInvoice';
import SalesHistory from '../pages/Sales/Invoice/SalesHistory';
import AddCustomer from '../pages/Sales/Customers/AddCustomer';
import CustomerHistory from '../pages/Sales/Customers/CustomerHistory';
import AddSalesman from '../pages/Sales/Salesman/AddSalesman';
import SalesmanHistory from '../pages/Sales/Salesman/SalesmanHistory';
import AddCompany from '../pages/Administration/AddCompany';
import DeliveryChallanHistory from '../pages/Sales/Delivery Challan/DeliveryChallanHistory';
import AddDeliveryChallan from '../pages/Sales/Delivery Challan/AddDeliveryChallan';
import PrintChallan from '../pages/Sales/Delivery Challan/PrintChallan';
import SalesReturnList from '../pages/Sales/Sales Return/SalesReturnList';
import AddSalesReturn from '../pages/Sales/Sales Return/AddSalesReturn';
import PrintSalesReturn from '../pages/Sales/Sales Return/PrintSalesReturn';
import ProductList from '../pages/Administration/Products/ProductList';
import AddProduct from '../pages/Administration/Products/AddProduct';
import Categories from '../pages/Administration/Categories';
import UomManager from '../pages/Administration/UomManager';
import Brands from '../pages/Administration/Brands';
import Designations from '../pages/Administration/Designations';
import EmployeeList from '../pages/Administration/Employees/EmployeeList';
import AddEmployee from '../pages/Administration/Employees/AddEmployee';
import LocationList from '../pages/Administration/Location/LocationList';
import AddLocation from '../pages/Administration/Location/AddLocation';
import TransportationList from '../pages/Administration/Transportation/TransportationList';
import AddTransportation from '../pages/Administration/Transportation/AddTransportation';
import StockTransferList from '../pages/Administration/Stock Transfer/StockTransferList';
import AddStockTransfer from '../pages/Administration/Stock Transfer/AddStockTransfer';
import ChartOfAccountList from '../pages/Registration/Chart of Account/ChartOfAccountList';
import AddChartOfAccount from '../pages/Registration/Chart of Account/AddChartOfAccount';
import VoucherList from '../pages/Registration/Vouchers/VoucherList';
import AddVoucher from '../pages/Registration/Vouchers/AddVoucher';
import BankAccountList from '../pages/Registration/Bank Account/BankAccountList';
import AddBank from '../pages/Registration/Bank Account/AddBankAccount';
import AddOpeningStock from '../pages/Registration/Opening Stock/AddOpeningStock';
import OpeningStockList from '../pages/Registration/Opening Stock/OpeningStockList';
import { Component } from 'react';
import AddInvoiceReceipt from '../pages/Registration/Invoice Receipt/AddInvoiceReceipt';
import InvoiceReceiptList from '../pages/Registration/Invoice Receipt/InvoiceReceiptList';
import AddMultiInvoiceReceipt from '../pages/Registration/Multi Invoice Receipt/AddMultiInvoiceReceipt';

export const adminRoutes = [
  {
    path: '/',
    component: <Dashboard />,
    label: 'Dashboard',
    icon: MdDashboard,
  },
  {
    label: 'Administation',
    icon: MdAdminPanelSettings,
    children: [
      {
        path: '/Administration/Categories/List',
        component: <Categories />,
        label: 'Categories',
        icon: MdCategory
      },
      {
        path: '/Administration/UOM/List',
        component: <UomManager />,
        label: 'UOM',
        icon: MdStraighten
      },
      {
        path: '/Administration/Brands',
        component: <Brands />,
        label: 'Brands',
        icon: MdDomain
      },
      {
        label: 'Products',
        icon: MdDashboard,
        path: '/Administration/Products/List',
        component: <ProductList />,
      },
      {
        path: '/Administration/Designations/List',
        component: <Designations />,
        label: 'Designations',
        icon: MdBadge
      },
      {
        path: '/Administration/Employees/List',
        component: <EmployeeList />,
        label: 'Employees',
        icon: MdPeople
      },
      {
        path: '/Administration/Locations/List',
        component: <LocationList />,
        label: 'Locations',
        icon: MdLocationOn
      },
      {
        path: '/Administration/Transportation/List',
        component: <TransportationList />,
        label: 'Transportation',
        icon: MdLocalShipping
      },
      {
        path: '/Administration/StockTransfer/List',
        component: <StockTransferList />,
        label: 'Stock Transfer',
        icon: MdCompareArrows
      },
      {
        path: '/company',
        component: <AddCompany />,
        label: 'Company',
        icon: MdAccountBox
      }
    ]
  },
  {
    label: 'REGISTRATION',
    icon: MdFormatListBulleted,
    children: [
      {
        path: '/Registration/Chart of Account/List',
        component: <ChartOfAccountList />,
        label: 'Chart Of Account',
        icon: MdAccountTree
      },
      {
        path: '/Registration/Vouchers/List',
        component: <VoucherList />,
        label: 'Vouchers',
        icon: MdReceiptLong
      },
      {
        path: '/Registration/Bank Account/BankAccountList',
        component: <BankAccountList />,
        label: 'Bank Account',
        icon: MdAccountBalance
      },
      {
        path: '/Inventory/OpeningStock/List',
        component: <OpeningStockList />,
        label: 'Opening Stock',
        icon: MdInventory
      },
      {
        path: '/Registration/InvoiceReceipt/List',
        component: <InvoiceReceiptList />,
        label: 'Invoice Receipt',
        icon: MdReceipt
      }
    ]
  },
  {
    label: 'Sales',
    icon: MdReceipt,
    children: [
      {
        label: 'Invoice',
        icon: MdReceipt,
        path: '/sales/invoice/list',
        component: <SalesHistory />
      },
      {
        label: 'Sales Return / Debit Notes',
        icon: MdEdit,
        path: '/Sales-Return/Debit-Notes/List',
        component: <SalesReturnList />,
      },
      {
        label: 'Customers',
        path: '/Customers/list',
        component: <CustomerHistory />,
        icon: MdPeople,
      },
      {
        label: 'Salesman',
        path: '/Salesman/list',
        component: <SalesmanHistory />,
        icon: MdPeople,
      },
      {
        label: 'Delivery Challan',
        path: '/Delivery-Challan/List',
        component: <DeliveryChallanHistory />,
        icon: MdEmojiTransportation,
      }
    ],
  },
  {
    path: '/Administration/Products/Add',
    component: <AddProduct />,
    label: 'Add Product',
    hideFromSidebar: true
  },
  {
    path: '/Administration/Employees/Add',
    component: <AddEmployee />,
    label: 'Add Employee',
    hideFromSidebar: true
  },
  {
    path: '/Administration/Locations/Add',
    component: <AddLocation />,
    label: 'Add Location',
    hideFromSidebar: true
  },
  {
    path: '/Administration/Transportation/Add',
    component: <AddTransportation />,
    label: 'Add Transportation',
    hideFromSidebar: true
  },
  {
    path: '/Administration/StockTransfer/Add',
    component: <AddStockTransfer />,
    label: 'Add Stock Transfer',
    hideFromSidebar: true
  },
  {
    path: '/Registration/Chart of Account/Add',
    component: <AddChartOfAccount />,
    hideFromSidebar: true
  },
  {
    path: '/Registration/Vouchers/Add',
    component: <AddVoucher />,
    label: 'Add Voucher',
    hideFromSidebar: true
  },
  {
    path: '/Delivery-Challan/Print/:id',
    component: <PrintChallan />,
    label: 'Print Challan',
    hideFromSidebar: true
  },
  {
    path: '/Sales-Return/Debit-Notes/Print/:id',
    component: <PrintSalesReturn />,
    label: 'Print Voucher',
    hideFromSidebar: true
  },
  {
    path: '/Registration/Bank Account/AddBank',
    component: <AddBank />,
    hideFromSidebar: true
  },
  {
    path: '/Inventory/OpeningStock/Add',
    component: <AddOpeningStock />,
    label: 'Add Opening Stock',
    hideFromSidebar: true
  },
  {
    path: '/sales/invoice/add',
    component: <NewInvoice />,
    label: 'New Invoice',
    hideFromSidebar: true
  },
  {
    path: '/Sales-Return/Debit-Notes/Add',
    component: <AddSalesReturn />,
    hideFromSidebar: true
  },
  {
    path: '/Registration/InvoiceReceipt/Add',
    component: <AddInvoiceReceipt />,
    hideFromSidebar: true
  },
  {
    path: '/Customers/customer-details',
    component: <AddCustomer />,
    hideFromSidebar: true
  },
  {
    path: '/Salesman/add',
    component: <AddSalesman />,
    hideFromSidebar: true
  },
  {
    path: '/Delivery-Challan/Details',
    component: <AddDeliveryChallan />,
    hideFromSidebar: true
  },
  {
    path: '/Registration/MultiInvoiceReceipt/Add',
    component: <AddMultiInvoiceReceipt/>,
    hideFromSidebar: true
  }
];
