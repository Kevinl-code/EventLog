import React, { useState, useEffect, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client using your exact environment variable definitions
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-supabase-url.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "your-publishable-key";
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Structured Student Master Directory JSON
const STUDENT_DIRECTORY = {
  "255229101": "ABDUL RASIK S", "255229102": "ABISHEIK RUBAN C", "255229103": "ABISREE M",
  "255229104": "AFREEN M", "255229105": "AGSCE JEBAL B", "255229106": "AJAY RAAM E A",
  "255229107": "AMALA BINISHA C", "255229108": "ARAVINTHAN G", "255229109": "ARUMUGAPERUMAL S",
  "255229110": "BALAJI G", "255229111": "BALAMURUGAN P", "255229112": "BHUVANESHWARAN D",
  "255229113": "CYRIL SYLVESTER D", "255229114": "DHARANI K", "255229115": "DIVYA SRI M",
  "255229116": "DIWAKARAN A", "255229117": "EMEMA V", "255229118": "GAURI S",
  "255229119": "JAGADESHWARAN K", "255229120": "JENCY G", "255229121": "JENIFER JENITHA A",
  "255229122": "JERLIN G", "255229123": "JHONES J", "255229124": "JOEL A",
  "255229125": "KABIL B", "255229126": "KEERTHAN G", "255229127": "KEVIN LAZARUS B",
  "255229128": "KIRUTHIKA S", "255229129": "LAKSHITHAL", "255229130": "MAHALAKSHMI S",
  "255229131": "MANOVISHNU A V", "255229132": "NALAN S", "255229133": "NANDHINI R",
  "255229134": "NAVEENKUMAR C", "255229135": "NIDHEESH S", "255229136": "NIRMAL G",
  "255229137": "PRASANTH M", "255229138": "PRAVIN V", "255229139": "PREM SELVAN R",
  "255229140": "PRICILLA C", "255229141": "PRIYA THARSHINI R", "255229142": "RAJA VIGNESH P",
  "255229143": "RAJAKUMAR AZARIAH S", "255229144": "RITHIKA M", "255229145": "SARAN B",
  "255229146": "SARMILA BANU A", "255229147": "SELVAKUMAR K", "255229148": "SIVAGAMI A",
  "255229149": "SIVAKUMAR E", "255229150": "SRIRAM M", "255229151": "STANLEY WILSON M",
  "255229152": "SUSMITHA M", "255229153": "SWATHI S", "255229154": "THANUSIYA R",
  "255229155": "THIRUMALAI RAJAN S", "255229156": "THIRUPUGAZH M", "255229157": "VIJAY V S",
  "255229158": "YOGALAKSHMI K", "255229159": "JAYA VARSHINI I",
  "255229161": "KEERTHANA SIRJA S", "255229162": "SHARAN KUMAR", "255229163": "LOKESH"
};

export default function EventFundTracker() {
  const [globalEvent, setGlobalEvent] = useState('');
  const [globalContribution, setGlobalContribution] = useState('');
  const [defaultAmount, setDefaultAmount] = useState('');

  const [rollNo, setRollNo] = useState('');
  const [studentName, setStudentName] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');

  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    if (STUDENT_DIRECTORY[rollNo]) {
      setStudentName(STUDENT_DIRECTORY[rollNo]);
    } else {
      setStudentName('');
    }
  }, [rollNo]);

  useEffect(() => {
    setAmount(defaultAmount);
  }, [defaultAmount, globalEvent]);

  const fetchLogs = async () => {
    try {
      let { data, error } = await supabase
        .from('event_contributions')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      showToast('Failed to pull data updates from backend.', 'error');
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: '' }), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!globalEvent || !globalContribution || !rollNo || !amount) {
      showToast('Please fulfill all layout fields properly.', 'error');
      return;
    }
    
    setIsSubmitting(true);
    const payload = {
      roll_no: rollNo,
      student_name: studentName || "Unknown Student",
      department: "Data Science",
      event_name: globalEvent,
      contribution_type: globalContribution,
      amount: parseFloat(amount),
      payment_mode: paymentMode
    };

    try {
      const { error } = await supabase.from('event_contributions').insert([payload]);
      if (error) throw error;
      
      showToast(`Record registered successfully for ${payload.student_name}!`);
      setRollNo('');
      setAmount(defaultAmount);
      fetchLogs();
    } catch (err) {
      showToast('Database write failure. Check cloud values.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.event_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.roll_no.includes(searchQuery)
    );
  }, [logs, searchQuery]);

  const exportToCSV = () => {
    if (filteredLogs.length === 0) return showToast('No data log matches found to extract.', 'error');
    
    const headers = ['ID', 'Roll No', 'Name', 'Department', 'Event', 'Contribution Type', 'Amount (₹)', 'Payment Mode', 'Timestamp'];
    const rows = filteredLogs.map(log => [
      log.id, log.roll_no, log.student_name, log.department, log.event_name, log.contribution_type, log.amount, log.payment_mode, new Date(log.created_at).toLocaleString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Data_Science_Fund_Report_${globalEvent || 'General'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans premium-pattern antialiased selection:bg-indigo-500 selection:text-white p-4 md:p-8">
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 ${toast.type === 'error' ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'}`}>
          <div className={`w-2 h-2 rounded-full ${toast.type === 'error' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        <header className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 p-6 md:p-8 text-center md:text-left flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.1),transparent_50%)]" />
          <div>
            <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 rounded-full border border-indigo-500/20">
              Department Ledger System
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-2 text-white bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Data Science Event Fund Manager
            </h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">Bishop Heber College (Autonomous)</p>
          </div>
          <div className="bg-slate-950/50 border border-slate-800 px-6 py-4 rounded-2xl backdrop-blur-sm flex gap-6 justify-around items-center">
            <div className="text-center">
              <p className="text-xs font-medium text-slate-500 uppercase">Total Collection</p>
              <p className="text-2xl font-bold text-emerald-400 mt-0.5">₹{filteredLogs.reduce((acc, curr) => acc + Number(curr.amount), 0).toLocaleString('en-IN')}</p>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-center">
              <p className="text-xs font-medium text-slate-500 uppercase">Headcount Logs</p>
              <p className="text-2xl font-bold text-indigo-400 mt-0.5">{filteredLogs.length}</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-5 space-y-6">
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm space-y-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span className="w-1.5 h-4 bg-indigo-500 rounded-full" /> Event Configurations
              </h2>
              <p className="text-xs text-slate-400">Lock the event profile parameters below to streamline continuous student entry batches.</p>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold tracking-wide text-slate-400 uppercase mb-1">Custom Event Name</label>
                  <input type="text" placeholder="e.g., CyberFest 2026, Freshers Day" value={globalEvent} onChange={(e) => setGlobalEvent(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wide text-slate-400 uppercase mb-1">Custom Contribution Type</label>
                  <input type="text" placeholder="e.g., Registration Fee, Refreshment Fund" value={globalContribution} onChange={(e) => setGlobalContribution(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"/>
                </div>
                <div>
                  <label className="block text-xs font-semibold tracking-wide text-slate-400 uppercase mb-1">Default Base Amount (₹)</label>
                  <input type="number" placeholder="Set default event cost per student" value={defaultAmount} onChange={(e) => setDefaultAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm"/>
                </div>
              </div>
            </section>

            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
                  <span className="w-1.5 h-4 bg-emerald-500 rounded-full" /> Entry Form
                </h2>
                
                <div>
                  <label className="block text-xs font-semibold tracking-wide text-slate-400 uppercase mb-1">Roll Number</label>
                  <input type="text" placeholder="Enter 9-digit Student Roll Number" value={rollNo} onChange={(e) => setRollNo(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-mono tracking-wider placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors text-sm" required/>
                </div>

                <div>
                  <label className="block text-xs font-semibold tracking-wide text-slate-400 uppercase mb-1">Student Name</label>
                  <input type="text" placeholder="Auto-fills from Nominal Roll directory" value={studentName} readOnly className="w-full px-4 py-2.5 rounded-xl bg-slate-900/40 border border-slate-800/40 text-indigo-300 font-medium cursor-not-allowed text-sm" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold tracking-wide text-slate-400 uppercase mb-1">Amount (₹)</label>
                    <input type="number" placeholder="₹ Amount" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-semibold focus:outline-none focus:border-indigo-500 transition-colors text-sm" required/>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold tracking-wide text-slate-400 uppercase mb-1">Payment Mode</label>
                    <select value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors text-sm">
                      <option value="Cash">💵 Cash</option>
                      <option value="Mobile Payment">📱 Mobile Payment</option>
                    </select>
                  </div>
                </div>

                <button type="submit" disabled={isSubmitting || !globalEvent} className="w-full mt-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 font-bold tracking-wide text-white transition-all shadow-lg active:scale-[0.99] flex justify-center items-center gap-2 cursor-pointer text-sm">
                  {isSubmitting ? 'Logging Record...' : 'Secure Submit to Cloud'}
                </button>
                {!globalEvent && <p className="text-[11px] text-center text-rose-400">Specify configuration profile details above to enable logging submission controls.</p>}
              </form>
            </section>
          </div>

          <div className="lg:col-span-7">
            <section className="bg-slate-900/60 border border-slate-800/80 rounded-2xl backdrop-blur-sm shadow-sm flex flex-col h-full max-h-[690px] overflow-hidden">
              <div className="p-5 border-b border-slate-800/80 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-900/40">
                <div className="relative w-full sm:max-w-xs">
                  <input type="text" placeholder="Search event, roll, or student name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-xs transition-all" />
                  <span className="absolute left-3 top-2.5 text-slate-600 text-xs">🔍</span>
                </div>
                <button onClick={exportToCSV} className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-700 hover:border-indigo-500 bg-slate-900 text-slate-300 hover:text-white transition-all text-xs font-bold tracking-wide flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                  📤 Export Filtered Data (.CSV)
                </button>
              </div>

              <div className="overflow-x-auto flex-1 custom-scrollbar">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm border-b border-slate-800 z-10">
                    <tr>
                      <th className="p-4 text-xs font-bold tracking-wider text-slate-400 uppercase">Student Profile</th>
                      <th className="p-4 text-xs font-bold tracking-wider text-slate-400 uppercase">Event Metric Context</th>
                      <th className="p-4 text-xs font-bold tracking-wider text-slate-400 uppercase">Amount</th>
                      <th className="p-4 text-xs font-bold tracking-wider text-slate-400 uppercase">Method</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredLogs.length > 0 ? (
                      filteredLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-850/40 transition-colors group">
                          <td className="p-4">
                            <p className="font-semibold text-white text-sm tracking-wide">{log.student_name}</p>
                            <p className="text-xs font-mono text-indigo-400/80 mt-0.5">{log.roll_no} • <span className="text-slate-500">{log.department}</span></p>
                          </td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 text-[11px] font-semibold text-indigo-300 bg-indigo-500/10 rounded-md border border-indigo-500/20 max-w-max block truncate">
                              {log.event_name}
                            </span>
                            <p className="text-xs text-slate-400 mt-1 truncate max-w-[180px]">{log.contribution_type}</p>
                          </td>
                          <td className="p-4 font-bold text-sm text-emerald-400">
                            ₹{Number(log.amount).toLocaleString('en-IN')}
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center text-[11px] font-medium ${log.payment_mode === 'Cash' ? 'text-amber-400' : 'text-cyan-400'}`}>
                              {log.payment_mode === 'Cash' ? '💵 Cash' : '📱 Mobile'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center py-24 text-sm text-slate-600 font-medium">
                          No real-time event logs detected in database matching query.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}