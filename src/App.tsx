import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Activity,
  Server,
  FileText,
  AlertTriangle,
  Globe,
  MapPin,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

// --- Types ---
interface TrustEvent {
  score: number;
  action: 'none' | 'warn' | 'ack_required' | 'block';
  reasons: string[];
}

interface DeviceStatus {
  id: string;
  name: string;
  isSecure: boolean;
  lastCheck: string;
  issues: string[];
}

// --- Colors ---
const COLORS = {
  safe: '#10B981',    // Emerald 500
  warning: '#F59E0B', // Amber 500
  risk: '#EF4444',    // Red 500
  neutral: '#374151'  // Gray 700
};

function App() {
  // --- State ---
  const [trustScore, setTrustScore] = useState<number>(0); // 0.0 to 1.0 (Risk Score)
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus>({
    id: 'DEV-8821-X',
    name: 'Current Browser Session',
    isSecure: true,
    lastCheck: 'Just now',
    issues: []
  });
  const [isAccessGranted, setIsAccessGranted] = useState<boolean>(true);
  const [complianceLogs, setComplianceLogs] = useState<{ time: string, message: string, type: 'info' | 'alert' }[]>([]);
  const [jurisdiction, setJurisdiction] = useState<string>('Detecting...');

  // --- Effect: Listen for Extension Events ---
  useEffect(() => {
    const handleTrustUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<TrustEvent>;
      const { score, reasons } = customEvent.detail;

      // Update basic state
      setTrustScore(score);

      // Update Device Status Logic
      const isSecure = score < 0.7; // 0.7 is the block threshold
      setDeviceStatus(prev => ({
        ...prev,
        isSecure,
        lastCheck: new Date().toLocaleTimeString(),
        issues: reasons
      }));

      // Gated Access Logic
      setIsAccessGranted(isSecure);

      // Logging
      if (reasons.length > 0) {
        setComplianceLogs(prev => [
          {
            time: new Date().toLocaleTimeString(),
            message: `Risk detected: ${reasons[0]}`,
            type: 'alert'
          },
          ...prev.slice(0, 4) // Keep last 5
        ]);
      }
    };

    // Listen for the custom event dispatched by our Content Script
    window.addEventListener('TrustUpdate', handleTrustUpdate);

    // Mock Jurisdiction (Simulated Compliance Layer)
    setJurisdiction(Intl.DateTimeFormat().resolvedOptions().timeZone);

    return () => {
      window.removeEventListener('TrustUpdate', handleTrustUpdate);
    };
  }, []);

  // --- Visualization Data ---
  // Recharts expects data for the pie
  // If score is 0.2 (low risk), we want a mostly green chart.
  // Actually, let's visualize "Trust Integrity" which is (1 - Risk).
  const integrity = Math.max(0, 1 - trustScore);
  const data = [
    { name: 'Trust', value: integrity },
    { name: 'Risk', value: trustScore }
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-gray-800 tracking-tight">
            Enterprise Trust Architecture
          </h1>
        </div>
        <div className="flex items-center gap-6 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span>Jurisdiction: <span className="font-medium text-gray-900">{jurisdiction}</span></span>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            <span>Status: <span className="font-medium text-green-600">Monitoring Active</span></span>
          </div>
          <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
            GK
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-8 grid grid-cols-12 gap-8">

        {/* LEFT COLUMN: TRUST ENGINE (Dashboard) */}
        <div className="col-span-4 space-y-6">

          {/* 1. Device Trust Checker */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <Server className="w-5 h-5 text-indigo-600" />
              Device Trust Checker
            </h2>

            <div className={`p-4 rounded-lg border flex items-start gap-4 ${deviceStatus.isSecure ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              {deviceStatus.isSecure ? (
                <CheckCircle className="w-6 h-6 text-green-600 shrink-0" />
              ) : (
                <XCircle className="w-6 h-6 text-red-600 shrink-0" />
              )}
              <div>
                <h3 className={`font-semibold ${deviceStatus.isSecure ? 'text-green-800' : 'text-red-800'}`}>
                  {deviceStatus.isSecure ? 'Device Verified' : 'Untrusted Device'}
                </h3>
                <p className="text-sm text-gray-600 mt-1">{deviceStatus.name}</p>
                <div className="text-xs text-gray-500 mt-2">Last verified: {deviceStatus.lastCheck}</div>

                {!deviceStatus.isSecure && (
                  <div className="mt-3 text-sm text-red-700 bg-red-100 p-2 rounded">
                    <strong>Violations:</strong>
                    <ul className="list-disc pl-4 mt-1 space-y-0.5">
                      {deviceStatus.issues.length > 0 ? (
                        deviceStatus.issues.map((issue, idx) => <li key={idx}>{issue}</li>)
                      ) : (
                        <li>High behavioral risk detected</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Trust Score Generator */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2 w-full mb-2">
              <Activity className="w-5 h-5 text-indigo-600" />
              Trust Score Generator
            </h2>

            <div className="w-48 h-48 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    startAngle={180}
                    endAngle={0}
                  >
                    <Cell fill={integrity > 0.7 ? COLORS.safe : (integrity > 0.4 ? COLORS.warning : COLORS.risk)} />
                    <Cell fill="#e5e7eb" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-2/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                <div className="text-3xl font-bold text-gray-900">{Math.round(integrity * 100)}%</div>
                <div className="text-xs text-gray-500 uppercase tracking-wider">Integrity</div>
              </div>
            </div>

            <div className="w-full text-center mt-[-40px]">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${integrity > 0.7 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {integrity > 0.7 ? 'Trust Established' : 'Risk Threshold Exceeded'}
              </span>
            </div>
          </div>

          {/* 3. Compliance Engine */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold flex items-center gap-2 mb-4">
              <FileText className="w-5 h-5 text-indigo-600" />
              Compliance Engine
            </h2>
            <div className="space-y-3">
              {complianceLogs.length === 0 ? (
                <div className="text-sm text-gray-500 italic text-center py-4">
                  No compliance violations detected.
                </div>
              ) : (
                complianceLogs.map((log, idx) => (
                  <div key={idx} className="flex gap-3 items-start p-3 bg-red-50 rounded-lg border border-red-100">
                    <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-red-400 mb-0.5">{log.time}</div>
                      <div className="text-sm text-red-800 font-medium">{log.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ENTERPRISE SYSTEMS (Gated Content) */}
        <div className="col-span-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-full flex flex-col">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <Server className="w-6 h-6 text-gray-500" />
                SAP Enterprise Portal
              </h2>
              <div className="flex items-center gap-2 text-sm">
                {isAccessGranted ? (
                  <span className="flex items-center gap-1.5 text-green-600 font-medium bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                    <Unlock className="w-4 h-4" />
                    Access Granted
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-red-600 font-medium bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                    <Lock className="w-4 h-4" />
                    Access Restricted
                  </span>
                )}
              </div>
            </div>

            <div className="flex-1 p-8 relative">
              {/* CONTENT LAYER */}
              <div className={`transition-all duration-500 ${isAccessGranted ? 'opacity-100 filter-none' : 'opacity-20 blur-sm pointer-events-none select-none'}`}>
                <div className="grid grid-cols-2 gap-6 mb-8">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-32 bg-gray-50 rounded-lg border border-gray-200 p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  ))}
                </div>

                <h3 className="text-lg font-semibold text-gray-700 mb-4">Financial Data Stream (Confidential)</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-sm text-gray-600">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 font-medium">Transaction ID</th>
                        <th className="px-6 py-3 font-medium">Region</th>
                        <th className="px-6 py-3 font-medium">Amount</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[1, 2, 3, 4, 5].map(i => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="px-6 py-3 font-mono">TXN-8821-{i}</td>
                          <td className="px-6 py-3">APAC-IN</td>
                          <td className="px-6 py-3">$14,200.00</td>
                          <td className="px-6 py-3 text-green-600">Verified</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* OVERLAY LAYER - ONLY VISIBLE WHEN BLOCKED */}
              {!isAccessGranted && (
                <div className="absolute inset-0 z-10 flex items-center justify-center p-8">
                  <div className="bg-white rounded-2xl shadow-xl border border-red-100 p-8 text-center max-w-md animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <ShieldAlert className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Verification Failed
                    </h3>
                    <p className="text-gray-600 mb-6 leading-relaxed">
                      The Environment Trust Engine has detected specific anomalies in your session. To protect sensitive enterprise data, access is temporarily suspended.
                    </p>

                    <div className="bg-red-50 rounded-lg p-4 text-left text-sm text-red-800 mb-6">
                      <strong>Policy Violated:</strong>
                      <ul className="list-disc pl-5 mt-1">
                        {deviceStatus.issues.map((issue, i) => <li key={i}>{issue}</li>)}
                      </ul>
                    </div>

                    <button
                      onClick={() => window.location.reload()}
                      className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-black transition-colors"
                    >
                      Re-verify Device Integrity
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
