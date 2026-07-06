import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../../Context/supabaseClient';
import { toast } from 'react-hot-toast';
import Spinner from '../../../ui/Spinner';
import { MdEdit, MdDelete, MdAccountBalanceWallet } from 'react-icons/md';

const ChartOfAccountList = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        fetchGeneralLedgerAccounts();
    }, []);

    const fetchGeneralLedgerAccounts = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('chart_of_accounts')
                .select('*')
                .order('account_code', { ascending: true });

            if (error) throw error;
            setAccounts(data || []);
        } catch (err: any) {
            toast.error('Failed to load ledger accounts: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteAccount = async (id: number | string) => {
        if (!window.confirm('Are you completely sure you want to permanently delete this sub-ledger account record? This can break historic financial statements.')) return;

        try {
            const { error } = await supabase
                .from('chart_of_accounts')
                .delete()
                .eq('id', id);

            if (error) throw error;
            toast.success('Account profile removed cleanly from financial database.');
            fetchGeneralLedgerAccounts();
        } catch (err: any) {
            toast.error(err.message);
        }
    };

    const filteredAccounts = accounts.filter((acc) =>
        acc.account_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.account_code?.includes(searchTerm) ||
        acc.control_code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        acc.category_code?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalEntries = filteredAccounts.length;
    const totalPages = Math.ceil(totalEntries / pageSize);
    const startIndex = totalEntries === 0 ? 0 : (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalEntries);
    const paginatedAccounts = filteredAccounts.slice(startIndex, startIndex + pageSize);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, pageSize]);

    return (
        <div className="mx-auto max-w-7xl flex flex-col gap-6 relative text-xs">

            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-black dark:text-white flex items-center gap-2">
                    Chart of Accounts Ledger Directory
                </h2>
                <button
                    type="button"
                    onClick={() => navigate('/Registration/Chart-of-Account/Add')}
                    className="flex items-center justify-center rounded bg-primary py-2 px-4 text-sm font-medium text-white hover:bg-opacity-90 transition duration-150 shadow-sm"
                >
                    + Add New Account
                </button>
            </div>

            <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Show</span>
                        <select
                            value={pageSize}
                            onChange={(e) => setPageSize(Number(e.target.value))}
                            className="rounded border border-stroke py-1 px-2 bg-transparent dark:border-strokedark outline-none focus:border-primary text-xs font-semibold text-black dark:text-white"
                        >
                            {[10, 20, 50, 100].map((size: number) => (
                                <option key={size} value={size} className="dark:bg-boxdark">{size}</option>
                            ))}
                        </select>
                        <span>entries</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs w-full sm:w-auto text-gray-500 dark:text-gray-400">
                        <span>Search:</span>
                        <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search code, titles, controls..." className="w-full sm:w-64 rounded border border-stroke py-1.5 px-3 bg-transparent dark:border-strokedark outline-none text-xs text-black dark:text-white" />
                    </div>
                </div>

                <div className="max-w-full overflow-x-auto">
                    <table className="w-full table-auto border-collapse">
                        <thead>
                            <tr className="bg-gray-2 text-left dark:bg-meta-4 text-xs font-bold uppercase tracking-wider text-black dark:text-white border-b border-stroke dark:border-strokedark">
                                <th className="py-4 px-4 font-semibold w-16">S#</th>
                                <th className="py-4 px-4 font-semibold w-28">Account Code</th>
                                <th className="py-4 px-4 font-semibold">Account Title</th>
                                <th className="py-4 px-4 font-semibold">Control Classification Group</th>
                                <th className="py-4 px-4 font-semibold w-36">Main Category</th>
                                <th className="py-4 px-4 font-semibold text-center w-24">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-12"><Spinner /></td></tr>
                            ) : paginatedAccounts.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-10 text-gray-400">No ledger financial accounts registered.</td></tr>
                            ) : (
                                paginatedAccounts.map((account, idx) => {
                                    const serialNumber = startIndex + idx + 1;
                                    return (
                                        <tr key={account.id} className="border-b border-stroke dark:border-strokedark hover:bg-slate-50 dark:hover:bg-meta-4/10 duration-150">
                                            <td className="py-3.5 px-4 font-medium text-black dark:text-white">{serialNumber}</td>
                                            <td className="py-3.5 px-4 font-mono font-bold text-primary tracking-wide">{account.account_code}</td>
                                            <td className="py-3.5 px-4 font-bold text-black dark:text-white uppercase tracking-tight flex items-center gap-1.5">
                                                <MdAccountBalanceWallet size={14} className="text-gray-400" /> {account.account_title}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600 dark:text-gray-400 font-semibold">{account.control_code}</td>
                                            <td className="py-3.5 px-4">
                                                <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-slate-100 dark:bg-meta-4 text-gray-600 dark:text-gray-300">
                                                    {account.category_code}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <div className="flex items-center justify-center space-x-3.5">
                                                    <button type="button" onClick={() => navigate('/Registration/Chart-of-Account/Add', { state: { account } })} className="text-gray-500 hover:text-primary transition p-0.5"><MdEdit size={18} /></button>
                                                   <button type="button" onClick={() => handleDeleteAccount(account.id)} className="text-gray-500 hover:text-danger transition p-0.5"><MdDelete size={18} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-stroke dark:border-strokedark">
                    <div className="text-xs text-gray-500 dark:text-gray-400">Showing {startIndex + 1} to {endIndex} of {totalEntries} entries</div>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="px-2 py-1 rounded border border-stroke text-[10px] font-medium disabled:opacity-30">Previous</button>
                            {Array.from({ length: totalPages }, (_, i) => <button key={i + 1} onClick={() => setCurrentPage(i + 1)} className={`px-2 py-1 rounded text-[10px] font-bold border transition ${currentPage === i + 1 ? 'bg-primary text-white border-primary' : 'border-stroke dark:border-strokedark text-gray-500 hover:bg-gray-50'}`}>{i + 1}</button>)}
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="px-2 py-1 rounded border border-stroke text-[10px] font-medium disabled:opacity-30">Next</button>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default ChartOfAccountList;
