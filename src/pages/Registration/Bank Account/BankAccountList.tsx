import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdEdit, MdDelete, MdAccountBalance } from 'react-icons/md';

const BankAccountList = () => {
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchBanks(); }, []);

  const fetchBanks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('banks')
        .select('*')
        .order('accountTitle', { ascending: true });

      if (error) throw error;
      setBanks(data || []);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to permanently delete this bank account ledger?')) {
      try {
        const { error } = await supabase.from('banks').delete().eq('id', id);
        if (error) throw error;
        toast.success('Account record removed successfully');
        fetchBanks();
      } catch (err: any) {
        toast.error(err.message);
      }
    }
  };

  return (
    <div className="rounded-sm border border-stroke bg-white px-5 pt-6 pb-2.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5 xl:pb-1">
      <div className="flex justify-between items-center mb-6 border-b border-stroke dark:border-strokedark pb-4">
        <h4 className="text-xl font-semibold text-black dark:text-white flex items-center gap-2">
          <MdAccountBalance className="text-primary text-2xl" /> Bank Accounts Directory
        </h4>
        <button 
          onClick={() => navigate('/Registration/Bank-Account/AddBank')}
          className="bg-primary hover:bg-opacity-90 text-white font-medium py-2 px-4 rounded text-sm transition-all shadow-sm"
        >
          + Add New Bank Account
        </button>
      </div>

      <div className="max-w-full overflow-x-auto">
        <table className="w-full table-auto text-sm">
          <thead>
            <tr className="bg-gray-2 text-left dark:bg-meta-4">
              <th className="py-4 px-4 font-medium text-black dark:text-white">Account Title</th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">Account Number</th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">Branch Name</th>
              <th className="py-4 px-4 font-medium text-black dark:text-white">Branch Code</th>
              <th className="py-4 px-4 font-medium text-black dark:text-white text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-10"><Spinner /></td></tr>
            ) : banks.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-10 text-gray-500">No records found. Click "+ Add New Bank Account" to begin.</td></tr>
            ) : (
              banks.map((b) => (
                <tr key={b.id} className="border-b border-[#eee] dark:border-strokedark hover:bg-gray-50 dark:hover:bg-black transition-colors">
                  <td className="py-5 px-4 font-medium text-black dark:text-white">{b.accountTitle}</td>
                  <td className="py-5 px-4 font-mono text-gray-600 dark:text-bodydark">{b.accountNumber}</td>
                  <td className="py-5 px-4">{b.branchName || 'N/A'}</td>
                  <td className="py-5 px-4 font-medium text-primary">{b.branchCode || 'N/A'}</td>
                  <td className="py-5 px-4">
                    <div className="flex items-center justify-center space-x-3.5">
                      <button 
                        onClick={() => navigate('/Registration/Bank-Account/AddBank', { state: { bank: b } })}
                        className="hover:text-primary transition-colors"
                        title="Edit Details"
                      >
                        <MdEdit size={20} />
                      </button>
                      <button 
                        onClick={() => handleDelete(b.id)}
                        className="hover:text-danger transition-colors"
                        title="Delete Ledger"
                      >
                        <MdDelete size={20} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BankAccountList;
