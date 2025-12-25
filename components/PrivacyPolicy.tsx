
import React from 'react';
import { X, Shield, Lock, Eye, Server, FileText, Database, Globe } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 rounded-t-2xl sticky top-0 z-10 backdrop-blur-md">
           <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <Shield size={24} className="text-blue-500" /> Privacy Policy
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">GDPR / AVG Compliant</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
              <X size={24} />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto text-slate-600 dark:text-slate-300 leading-relaxed space-y-8 text-sm md:text-base">
           
           <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs md:text-sm">
              <strong>Version:</strong> 1.2<br/>
              <strong>Last modified:</strong> {new Date().toLocaleDateString('en-US')}<br/>
              Filament Manager ("the App") values your privacy. This statement explains what personal data we collect, why we do it, and what your rights are.
           </div>

           <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                 <Database size={18} className="text-blue-500"/> 1. What data do we collect?
              </h3>
              <p className="mb-2">We process the following data when you use the App:</p>
              <ul className="list-disc pl-5 space-y-1 marker:text-blue-500">
                 <li><strong>Account Data:</strong> Email address and an encrypted password (via Supabase Auth).</li>
                 <li><strong>Usage Data:</strong> Inventory details you enter (filaments, printers, locations, notes).</li>
                 <li><strong>Technical Data:</strong> IP address, device type, and browser data (necessary for security and server stability).</li>
                 <li><strong>Feedback:</strong> Messages and ratings you voluntarily send through the app.</li>
                 <li><strong>Deletion Requests:</strong> Reasons provided during account deletion for service improvement.</li>
              </ul>
           </section>

           <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                 <FileText size={18} className="text-purple-500"/> 2. Purpose and Legal Basis
              </h3>
              <p className="mb-2">We process your data based on <strong>contract performance</strong> (to provide the service you signed up for) and <strong>legitimate interest</strong> (security and app improvement).</p>
              <ul className="list-disc pl-5 space-y-1">
                 <li>Managing your 3D printing inventory and logbook.</li>
                 <li>Securing your account and preventing unauthorized access.</li>
                 <li>Processing photos via AI for label recognition (only at your explicit request).</li>
              </ul>
           </section>

           <section className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-900/30">
              <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                 <Eye size={18} /> 3. Sharable Link (Showcase) & Privacy
              </h3>
              <p className="mb-3 text-sm">
                 The App includes an optional "Showcase" feature. If you <strong>actively enable</strong> this, specific parts of your data become publicly accessible via a unique URL.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-xs md:text-sm">
                 <div>
                    <strong className="text-green-600 dark:text-green-400 block mb-1">Publicly Visible:</strong>
                    <ul className="list-disc pl-4 space-y-1 opacity-80">
                       <li>Brand, Material & Color</li>
                       <li>Estimated remaining weight (availability)</li>
                    </ul>
                 </div>
                 <div>
                    <strong className="text-red-600 dark:text-red-400 block mb-1">ALWAYS Private:</strong>
                    <ul className="list-disc pl-4 space-y-1 opacity-80">
                       <li><Lock size={10} className="inline mr-1"/> Purchase prices & Suppliers</li>
                       <li><Lock size={10} className="inline mr-1"/> Specific storage locations</li>
                       <li><Lock size={10} className="inline mr-1"/> Personal notes</li>
                       <li><Lock size={10} className="inline mr-1"/> Print history & Email address</li>
                    </ul>
                 </div>
              </div>
              <p className="mt-3 text-xs italic opacity-70">
                 You can disable this feature at any time in settings. The public link will stop working immediately.
              </p>
           </section>

           <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                 <Server size={18} className="text-green-500"/> 4. Third-Party Services
              </h3>
              <p className="mb-2">We do not sell your data. We use the following providers for hosting and essential services:</p>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm border-collapse">
                    <thead>
                       <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2 font-bold">Service</th>
                          <th className="py-2 font-bold">Purpose</th>
                          <th className="py-2 font-bold">Location</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       <tr>
                          <td className="py-2">Supabase</td>
                          <td className="py-2">Database & Authentication</td>
                          <td className="py-2">EU (Frankfurt) / US</td>
                       </tr>
                       <tr>
                          <td className="py-2">Vercel</td>
                          <td className="py-2">Application Hosting</td>
                          <td className="py-2">Global (CDN)</td>
                       </tr>
                       <tr>
                          <td className="py-2">Google Gemini AI</td>
                          <td className="py-2">Temporary photo processing (Scanning)</td>
                          <td className="py-2">US</td>
                       </tr>
                    </tbody>
                 </table>
              </div>
              <p className="text-xs mt-2 text-slate-500">
                 * When using the AI scanner, your photo is sent to Google Cloud. This photo is <strong>not</strong> permanently stored or used to train AI models; it is only processed to return the extracted text.
              </p>
           </section>

           <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                 <Shield size={18} className="text-blue-500"/> 5. Your Rights (GDPR)
              </h3>
              <p className="mb-2">You have the following rights regarding your personal data:</p>
              <ul className="list-disc pl-5 space-y-2">
                 <li><strong>Right of Access & Portability:</strong> You can download a full backup of your data in JSON format via settings.</li>
                 <li><strong>Right to Rectification:</strong> You can modify all your data yourself within the app.</li>
                 <li><strong>Right to Erasure (Right to be Forgotten):</strong> You can request account deletion. Once requested, all your data will be permanently purged from our database within 48 hours.</li>
                 <li><strong>Right to Object:</strong> You have the right to lodge a complaint with your local Data Protection Authority.</li>
              </ul>
           </section>

           <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                 <Globe size={18} className="text-slate-500"/> 6. Contact
              </h3>
              <p>
                 Do you have questions about this statement or want to exercise your rights? Please contact us at:
              </p>
              <a 
                 href="mailto:info@filamentmanager.nl"
                 className="mt-2 font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded inline-block text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors border border-transparent hover:border-blue-200 dark:hover:border-blue-800"
              >
                 info@filamentmanager.nl
              </a>
           </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/50 flex justify-end rounded-b-2xl">
           <button 
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
           >
              I Understand
           </button>
        </div>
      </div>
    </div>
  );
};
