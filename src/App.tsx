import { useState, type ComponentType } from 'react';
import './App.css';
import ProtectedCampaignManager from './components/ProtectedCampaignManager';
import ProtectedEmailCampaign from './components/ProtectedEmailCampaign';
import ProtectedWhatsAppCampaign from './components/ProtectedWhatsAppCampaign';
import ProtectedAnalyticsDashboard from './components/ProtectedAnalyticsDashboard';
import ProtectedUnifiedDataView from './components/ProtectedUnifiedDataView';
import ProtectedWorkflows from './components/ProtectedWorkflows';
import { LayoutDashboard, Mail, MessageCircle, BarChart3, Megaphone, BarChart4, Database, ChevronLeft, ChevronRight, Workflow } from 'lucide-react';
import type { EmailPrefillPayload } from './types/emailPrefill';
import type { WhatsAppPrefillPayload } from './types/whatsappPrefill';

type Tab = 'campaigns' | 'emails' | 'whatsapp' | 'analytics' | 'data' | 'workflows';

const navItems: Array<{ icon: ComponentType<{ size?: number }>; label: string; tab?: Tab }> = [
  { icon: LayoutDashboard, label: 'Campaign Manager', tab: 'campaigns' },
  { icon: Mail, label: 'Email Campaigns', tab: 'emails' },
  { icon: MessageCircle, label: 'WhatsApp Campaigns', tab: 'whatsapp' },
  { icon: BarChart3, label: 'Analytics', tab: 'analytics' },
  { icon: Database, label: 'All Data', tab: 'data' },
  { icon: Workflow, label: 'Workflows', tab: 'workflows' },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('campaigns');
  const [emailPrefill, setEmailPrefill] = useState<EmailPrefillPayload | null>(null);
  const [whatsappPrefill, setWhatsappPrefill] = useState<WhatsAppPrefillPayload | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleOpenEmailCampaign = (payload: EmailPrefillPayload) => {
    setEmailPrefill(payload);
    setActiveTab('emails');
  };

  const handleOpenWhatsAppCampaign = (payload: WhatsAppPrefillPayload) => {
    setWhatsappPrefill(payload);
    setActiveTab('whatsapp');
  };

  return (
    <div className="h-screen flex bg-slate-100 overflow-hidden">
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`fixed md:relative z-50 bg-slate-900 text-white flex-col transition-all duration-300 ease-in-out ${
          sidebarOpen 
            ? 'translate-x-0 w-64 lg:w-72' 
            : '-translate-x-full md:translate-x-0 md:w-12'
        } h-screen flex`}
      >
        <div className="px-6 py-8 border-b border-white/10 md:px-3 md:py-4">
          <div className="flex items-center justify-between mb-4 md:justify-center">
            <div className={`flex-1 transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 md:hidden'}`}>
              <h1 className="text-2xl font-bold">Email Dashboard</h1>
              <p className="text-sm text-slate-200 mt-1">Marketing Automation</p>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-slate-300 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Toggle sidebar"
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
            </button>
          </div>
        </div>
        <nav className={`flex-1 px-4 py-6 space-y-1 overflow-y-auto ${sidebarOpen ? '' : 'md:hidden'}`}>
          {navItems.map(({ icon: Icon, label, tab }) => (
            <button
              key={label}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                tab && activeTab === tab
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-slate-200 hover:text-white hover:bg-white/10'
              }`}
              type="button"
              onClick={() => tab && setActiveTab(tab)}
            >
              <Icon size={18} />
              {label}
            </button>
          ))}
        </nav>
        <div className={`px-6 py-5 border-t border-white/10 text-xs text-slate-200 ${sidebarOpen ? '' : 'md:hidden'}`}>
          © {new Date().getFullYear()} Email Dashboard v1.0.0
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-slate-200 flex-shrink-0">
          <div className="w-full px-4 sm:px-6 lg:px-10 py-4">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
              <div className="flex items-center gap-4">
                <div>
                <p className="text-sm uppercase tracking-wider text-slate-500 font-semibold mb-1">
                  Send template emails using SendGrid
                </p>
                <h2 className="text-2xl font-bold text-slate-900">Email Marketing</h2>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'campaigns'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  type="button"
                >
                  <Megaphone size={18} />
                  Campaign Manager
                </button>
                <button
                  onClick={() => setActiveTab('emails')}
                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'emails'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  type="button"
                >
                  <Mail size={18} />
                  Email Campaigns
                </button>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'analytics'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  type="button"
                >
                  <BarChart4 size={18} />
                  Analytics
                </button>
                <button
                  onClick={() => setActiveTab('data')}
                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
                    activeTab === 'data'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  type="button"
                >
                  <Database size={18} />
                  All Data
                </button>
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto w-full">
          <div className="w-full h-full">
            {activeTab === 'campaigns' && <ProtectedCampaignManager />}
            {activeTab === 'emails' && (
              <ProtectedEmailCampaign
                prefill={emailPrefill}
                onPrefillConsumed={() => setEmailPrefill(null)}
              />
            )}
            {activeTab === 'whatsapp' && (
              <ProtectedWhatsAppCampaign
                prefill={whatsappPrefill}
                onPrefillConsumed={() => setWhatsappPrefill(null)}
              />
            )}
            {activeTab === 'analytics' && <ProtectedAnalyticsDashboard onOpenEmailCampaign={handleOpenEmailCampaign} />}
            {activeTab === 'data' && (
              <ProtectedUnifiedDataView
                onOpenEmailCampaign={handleOpenEmailCampaign}
                onOpenWhatsAppCampaign={handleOpenWhatsAppCampaign}
              />
            )}
            {activeTab === 'workflows' && <ProtectedWorkflows />}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;

