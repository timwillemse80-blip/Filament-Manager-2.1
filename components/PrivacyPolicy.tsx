
import React from 'react';
import { X, Shield, Lock, Eye, Server, FileText, Database, Globe } from 'lucide-react';

interface PrivacyPolicyProps {
  onClose: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl shadow-2xl relative flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-950/50 rounded-t-2xl sticky top-0 z-10 backdrop-blur-md">
           <div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                 <Shield size={24} className="text-blue-500" /> Privacyverklaring
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Conform Algemene Verordening Gegevensbescherming (AVG)</p>
           </div>
           <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
              <X size={24} />
           </button>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 overflow-y-auto text-slate-600 dark:text-slate-300 leading-relaxed space-y-8 text-sm md:text-base">
           
           <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-900/30 text-xs md:text-sm">
              <strong>Versie:</strong> 1.1<br/>
              <strong>Laatst gewijzigd:</strong> {new Date().toLocaleDateString('nl-NL')}<br/>
              Filament Manager ("de App") hecht grote waarde aan uw privacy. In deze verklaring leggen wij uit welke persoonsgegevens wij verzamelen, waarom wij dat doen en wat uw rechten zijn.
           </div>

           <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                 <Database size={18} className="text-blue-500"/> 1. Welke gegevens verzamelen wij?
              </h3>
              <p className="mb-2">Wij verwerken de volgende gegevens wanneer u de App gebruikt:</p>
              <ul className="list-disc pl-5 space-y-1 marker:text-blue-500">
                 <li><strong>Accountgegevens:</strong> E-mailadres en een versleuteld wachtwoord (via Supabase Auth).</li>
                 <li><strong>Gebruiksgegevens:</strong> De inventaris die u invoert (filamenten, printers, locaties, notities).</li>
                 <li><strong>Technische gegevens:</strong> IP-adres, apparaat type en browsergegevens (noodzakelijk voor beveiliging en functioneren van de server).</li>
                 <li><strong>Feedback:</strong> Berichten en beoordelingen die u vrijwillig via de app verstuurt.</li>
              </ul>
           </section>

           <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                 <FileText size={18} className="text-purple-500"/> 2. Doel en Grondslag
              </h3>
              <p className="mb-2">Wij verwerken uw gegevens op basis van <strong>uitvoering van de overeenkomst</strong> (u wilt de app gebruiken) en <strong>gerechtvaardigd belang</strong> (beveiliging en verbetering).</p>
              <ul className="list-disc pl-5 space-y-1">
                 <li>Het aanbieden van de functionaliteiten van de App (voorraadbeheer).</li>
                 <li>Het beveiligen van uw account.</li>
                 <li>Het verwerken van foto's via AI om tekst te herkennen (enkel op uw verzoek).</li>
              </ul>
           </section>

           <section className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-xl border border-amber-200 dark:border-amber-900/30">
              <h3 className="text-lg font-bold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-2">
                 <Eye size={18} /> 3. Deelbare Link (Showcase) & Privacy
              </h3>
              <p className="mb-3 text-sm">
                 De App bevat een optionele functie "Showcase". Indien u deze <strong>actief inschakelt</strong>, wordt een deel van uw data openbaar toegankelijk via een unieke URL.
              </p>
              <div className="grid md:grid-cols-2 gap-4 text-xs md:text-sm">
                 <div>
                    <strong className="text-green-600 dark:text-green-400 block mb-1">Wel openbaar:</strong>
                    <ul className="list-disc pl-4 space-y-1 opacity-80">
                       <li>Merk, Materiaal & Kleur</li>
                       <li>Geschat restgewicht (beschikbaarheid)</li>
                    </ul>
                 </div>
                 <div>
                    <strong className="text-red-600 dark:text-red-400 block mb-1">ALTIJD Privé:</strong>
                    <ul className="list-disc pl-4 space-y-1 opacity-80">
                       <li><Lock size={10} className="inline mr-1"/> Inkoopprijzen & Leveranciers</li>
                       <li><Lock size={10} className="inline mr-1"/> Specifieke opslaglocaties</li>
                       <li><Lock size={10} className="inline mr-1"/> Persoonlijke notities</li>
                       <li><Lock size={10} className="inline mr-1"/> Printgeschiedenis & E-mailadres</li>
                    </ul>
                 </div>
              </div>
              <p className="mt-3 text-xs italic opacity-70">
                 U kunt deze functie te allen tijde uitschakelen in de instellingen. De publieke link stopt dan direct met werken.
              </p>
           </section>

           <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                 <Server size={18} className="text-green-500"/> 4. Derde Partijen (Subverwerkers)
              </h3>
              <p className="mb-2">Wij delen uw gegevens niet met derden voor commerciële doeleinden. Wij maken gebruik van de volgende leveranciers voor de hosting en werking:</p>
              <div className="overflow-x-auto">
                 <table className="w-full text-left text-sm border-collapse">
                    <thead>
                       <tr className="border-b border-slate-200 dark:border-slate-700">
                          <th className="py-2 font-bold">Dienst</th>
                          <th className="py-2 font-bold">Doel</th>
                          <th className="py-2 font-bold">Locatie</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                       <tr>
                          <td className="py-2">Supabase</td>
                          <td className="py-2">Database & Authenticatie</td>
                          <td className="py-2">EU (Frankfurt) / VS</td>
                       </tr>
                       <tr>
                          <td className="py-2">Vercel</td>
                          <td className="py-2">Hosting van de applicatie</td>
                          <td className="py-2">Wereldwijd (CDN)</td>
                       </tr>
                       <tr>
                          <td className="py-2">Google Gemini AI</td>
                          <td className="py-2">Tijdelijke verwerking van foto's (Scanning)</td>
                          <td className="py-2">VS</td>
                       </tr>
                    </tbody>
                 </table>
              </div>
              <p className="text-xs mt-2 text-slate-500">
                 * Bij gebruik van de AI-scanner wordt de foto verstuurd naar Google Cloud. Deze foto wordt <strong>niet</strong> permanent opgeslagen of gebruikt om AI-modellen te trainen, maar enkel verwerkt om de tekst (etiket) terug te sturen.
              </p>
           </section>

           <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                 <Shield size={18} className="text-blue-500"/> 5. Uw Rechten (AVG)
              </h3>
              <p className="mb-2">U heeft de volgende rechten met betrekking tot uw persoonsgegevens:</p>
              <ul className="list-disc pl-5 space-y-2">
                 <li><strong>Recht op inzage en dataportabiliteit:</strong> U kunt via de instellingen ("Gegevensbeheer") een volledige backup van uw data downloaden in JSON-formaat.</li>
                 <li><strong>Recht op rectificatie:</strong> U kunt al uw gegevens zelf in de app aanpassen.</li>
                 <li><strong>Recht op vergetelheid (Account verwijderen):</strong> Als u uw account wilt verwijderen, kunt u contact opnemen. Wij zullen al uw gegevens binnen 48 uur permanent uit de database wissen.</li>
                 <li><strong>Klachtrecht:</strong> U heeft het recht om een klacht in te dienen bij de Autoriteit Persoonsgegevens als u vermoedt dat wij uw gegevens onrechtmatig verwerken.</li>
              </ul>
           </section>

           <section>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                 <Globe size={18} className="text-slate-500"/> 6. Contact
              </h3>
              <p>
                 Heeft u vragen over deze privacyverklaring of wilt u een beroep doen op uw rechten? Neem dan contact op via:
              </p>
              <p className="mt-2 font-mono bg-slate-100 dark:bg-slate-800 p-2 rounded inline-block text-blue-600 dark:text-blue-400">
                 info@filamentmanager.nl
              </p>
           </section>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex justify-end rounded-b-2xl">
           <button 
              onClick={onClose}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95"
           >
              Ik begrijp het
           </button>
        </div>
      </div>
    </div>
  );
};
