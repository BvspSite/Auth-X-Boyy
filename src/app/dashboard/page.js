'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  KeyRound,
  Layers,
  Cpu,
  Activity,
  LogOut,
  Plus,
  RefreshCw,
  Search,
  Filter,
  Copy,
  Check,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Ban,
  Clock,
  Terminal,
  User,
  CheckCircle2,
  X,
  ExternalLink,
  ChevronDown,
  Code2,
  Play,
  Pause,
  Edit2,
  Bot,
  Send,
  ShoppingBag,
  ExternalLink as LinkIcon
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // Authentication & State
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('manage_app');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Data states
  const [stats, setStats] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);

  // Selected Active Application State
  const [selectedAppId, setSelectedAppId] = useState('');
  const [selectedLang, setSelectedLang] = useState('csharp');

  // Filters
  const [searchKey, setSearchKey] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  // Modals state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showCreateAppModal, setShowCreateAppModal] = useState(false);
  const [showRenameAppModal, setShowRenameAppModal] = useState(false);
  const [showDeleteAppModal, setShowDeleteAppModal] = useState(false);
  const [showPauseAppModal, setShowPauseAppModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showBotModal, setShowBotModal] = useState(null); // 'discord' | 'telegram' | 'shop'
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [generatedResult, setGeneratedResult] = useState(null);

  // App Forms state
  const [newAppId, setNewAppId] = useState('');
  const [newAppName, setNewAppName] = useState('');
  const [renameAppName, setRenameAppName] = useState('');

  // Generator Form state
  const [genCount, setGenCount] = useState(1);
  const [genPrefix, setGenPrefix] = useState('XBOY');
  const [genDuration, setGenDuration] = useState(30);
  const [genMaxDevices, setGenMaxDevices] = useState(1);
  const [genProduct, setGenProduct] = useState('');
  const [genNote, setGenNote] = useState('');

  // Extend Form state
  const [extendDays, setExtendDays] = useState(30);

  // Show Toast Helper
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // 1. Check Authentication
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push('/login');
        } else {
          setAdminUser(data.user);
          loadAllData();
        }
      })
      .catch(() => router.push('/login'));
  }, [router]);

  // Load all dashboard data
  const loadAllData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([loadStats(), loadLicenses(), loadProducts(), loadLogs()]);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadStats = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      const data = await res.json();
      if (data.success) setStats(data.stats);
    } catch (e) {}
  };

  const loadLicenses = async () => {
    try {
      let url = '/api/admin/licenses?limit=100';
      if (searchKey) url += `&search=${encodeURIComponent(searchKey)}`;
      if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
      if (productFilter) url += `&product_id=${encodeURIComponent(productFilter)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setLicenses(data.licenses || []);
    } catch (e) {}
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
        if (data.products.length > 0) {
          setSelectedAppId((prev) => {
            const exists = data.products.some((p) => p.id === prev);
            return exists ? prev : data.products[0].id;
          });
          if (!genProduct) setGenProduct(data.products[0].id);
        }
      }
    } catch (e) {}
  };

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/admin/logs?limit=50');
      const data = await res.json();
      if (data.success) setLogs(data.logs || []);
    } catch (e) {}
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (e) {
      router.push('/login');
    }
  };

  // Currently Selected Application
  const currentApp = products.find((p) => p.id === selectedAppId) || products[0] || {
    id: 'panel-aimbot-xboy',
    name: 'PANEL AIMBOT XBOY',
    secret: 'c3723595dc621c4b20cf5e7edfb6a543f4135dea2fc09ad383eaae4762eece4de',
    seller_key: '77a543813a896c1e9e30cfc98bc59ff1',
    paused: false,
    version: '1.0'
  };

  const serverUrl = typeof window !== 'undefined' ? window.location.origin : 'https://authcaxs.vercel.app';

  // 12 Languages Code Snippets
  const languageSnippets = {
    csharp: {
      name: 'C#',
      code: `public static api LicenseAuthApp = new api(
    name: "${currentApp.name}",
    ownerid: "${currentApp.id}",
    secret: "${currentApp.secret}",
    version: "${currentApp.version || '1.0'}",
    url: "${serverUrl}"
    //path: "Your Path Here" // (OPTIONAL) if you use token validation, example: Token.txt
);`,
      github: 'https://github.com/KeyAuth/KeyAuth-CSHARP-Example'
    },
    cpp: {
      name: 'C++',
      code: `std::string name = "${currentApp.name}";
std::string ownerid = "${currentApp.id}";
std::string secret = "${currentApp.secret}";
std::string version = "${currentApp.version || '1.0'}";
std::string url = "${serverUrl}"; // Server URL

KeyAuth::api LicenseAuthApp(name, ownerid, secret, version, url);`,
      github: 'https://github.com/KeyAuth/KeyAuth-CPP-Example'
    },
    python: {
      name: 'Python',
      code: `keyauthapp = api(
    name = "${currentApp.name}",
    ownerid = "${currentApp.id}",
    secret = "${currentApp.secret}",
    version = "${currentApp.version || '1.0'}",
    url = "${serverUrl}"
)`,
      github: 'https://github.com/KeyAuth/KeyAuth-Python-Example'
    },
    php: {
      name: 'PHP',
      code: `$name = "${currentApp.name}";
$ownerid = "${currentApp.id}";
$secret = "${currentApp.secret}";
$version = "${currentApp.version || '1.0'}";
$url = "${serverUrl}";`,
      github: 'https://github.com/KeyAuth/KeyAuth-PHP-Example'
    },
    javascript: {
      name: 'JavaScript',
      code: `const LicenseAuthApp = new KeyAuth(
    "${currentApp.name}",
    "${currentApp.id}",
    "${currentApp.secret}",
    "${currentApp.version || '1.0'}",
    "${serverUrl}"
);`,
      github: 'https://github.com/mazkdevf/KeyAuth-JS-Example'
    },
    java: {
      name: 'Java',
      code: `private static String appname = "${currentApp.name}";
private static String ownerid = "${currentApp.id}";
private static String secret = "${currentApp.secret}";
private static String version = "${currentApp.version || '1.0'}";
private static String url = "${serverUrl}";`,
      github: 'https://github.com/KeyAuth-Archive/KeyAuth-JAVA-api'
    },
    vb: {
      name: 'VB.Net',
      code: `Private Shared name As String = "${currentApp.name}"
Private Shared ownerid As String = "${currentApp.id}"
Private Shared secret As String = "${currentApp.secret}"
Private Shared version As String = "${currentApp.version || '1.0'}"
Private Shared url As String = "${serverUrl}"`,
      github: 'https://github.com/KeyAuth/KeyAuth-VB-Example'
    },
    rust: {
      name: 'Rust',
      code: `let mut keyauthapp = keyauth::KeyauthApi::new(
    "${currentApp.name}",
    "${currentApp.id}",
    "${currentApp.secret}",
    "${currentApp.version || '1.0'}",
    "${serverUrl}",
);`,
      github: 'https://github.com/mazkdevf/KeyAuth-Rust-Example'
    },
    go: {
      name: 'Go',
      code: `app := keyauth.New(
    "${currentApp.name}",
    "${currentApp.id}",
    "${currentApp.secret}",
    "${currentApp.version || '1.0'}",
    "${serverUrl}",
)`,
      github: 'https://github.com/mazkdevf/KeyAuth-Go-Example'
    },
    lua: {
      name: 'Lua',
      code: `local KeyAuthApp = KeyAuth:new(
    "${currentApp.name}",
    "${currentApp.id}",
    "${currentApp.secret}",
    "${currentApp.version || '1.0'}",
    "${serverUrl}"
)`,
      github: 'https://github.com/mazkdevf/KeyAuth-Lua-Example'
    },
    ruby: {
      name: 'Ruby',
      code: `keyauthapp = KeyAuth::Api.new(
    "${currentApp.name}",
    "${currentApp.id}",
    "${currentApp.secret}",
    "${currentApp.version || '1.0'}",
    "${serverUrl}"
)`,
      github: 'https://github.com/mazkdevf/KeyAuth-Ruby-Example'
    },
    perl: {
      name: 'Perl',
      code: `my $keyauth = KeyAuth->new(
    "${currentApp.name}",
    "${currentApp.id}",
    "${currentApp.secret}",
    "${currentApp.version || '1.0'}",
    "${serverUrl}"
);`,
      github: 'https://github.com/mazkdevf/KeyAuth-Perl-Example'
    }
  };

  // Copy to clipboard helper
  const copyText = (text, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} disalin ke clipboard!`);
  };

  // APP ACTIONS
  // 1. Create App
  const handleCreateApp = async (e) => {
    e.preventDefault();
    if (!newAppName.trim()) {
      showToast('Masukkan nama aplikasi!', 'error');
      return;
    }
    const id = newAppId.trim() || newAppName.toLowerCase().replace(/[^a-z0-9_-]/g, '-');
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', id, name: newAppName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Aplikasi berhasil dibuat!');
        setShowCreateAppModal(false);
        setNewAppId('');
        setNewAppName('');
        await loadProducts();
        setSelectedAppId(id);
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal membuat aplikasi', 'error');
    }
  };

  // 2. Rename App
  const handleRenameApp = async (e) => {
    e.preventDefault();
    if (!renameAppName.trim()) {
      showToast('Masukkan nama baru!', 'error');
      return;
    }
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rename', id: currentApp.id, name: renameAppName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Aplikasi berhasil di-rename!');
        setShowRenameAppModal(false);
        setRenameAppName('');
        await loadProducts();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal mengubah nama aplikasi', 'error');
    }
  };

  // 3. Pause / Unpause App
  const handleTogglePauseApp = async () => {
    try {
      const newPausedState = !currentApp.paused;
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pause', id: currentApp.id, paused: newPausedState }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowPauseAppModal(false);
        await loadProducts();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal mengubah status pause aplikasi', 'error');
    }
  };

  // 4. Refresh App Secret
  const handleRefreshAppSecret = async () => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_secret', id: currentApp.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('App Secret berhasil diperbarui!');
        await loadProducts();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal me-refresh app secret', 'error');
    }
  };

  // 5. Delete App
  const handleDeleteApp = async () => {
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(currentApp.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Aplikasi berhasil dihapus!');
        setShowDeleteAppModal(false);
        await loadProducts();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal menghapus aplikasi', 'error');
    }
  };

  // 6. Refresh Seller Key
  const handleRefreshSellerKey = async () => {
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'refresh_seller_key', id: currentApp.id }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('Seller Key berhasil diperbarui!');
        await loadProducts();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal me-refresh seller key', 'error');
    }
  };

  // LICENSE ACTIONS
  const handleGenerateLicenses = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          count: genCount,
          prefix: genPrefix,
          duration_days: genDuration,
          max_devices: genMaxDevices,
          product_id: genProduct || currentApp.id,
          note: genNote,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedResult(data.licenses);
        showToast(data.message);
        loadLicenses();
        loadStats();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal generate lisensi', 'error');
    }
  };

  const handleUpdateLicenseStatus = async (id, newStatus) => {
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Status lisensi diubah ke ${newStatus.toUpperCase()}`);
        loadLicenses();
        loadStats();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal update status', 'error');
    }
  };

  const handleResetHWID = async (licenseKey) => {
    try {
      const res = await fetch('/api/license/reset-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: licenseKey }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('HWID berhasil direset!');
        loadLicenses();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal reset HWID', 'error');
    }
  };

  const handleDeleteLicense = async (id) => {
    if (!confirm('Yakin ingin menghapus lisensi ini secara permanen?')) return;
    try {
      const res = await fetch(`/api/admin/licenses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Lisensi berhasil dihapus!');
        loadLicenses();
        loadStats();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal menghapus lisensi', 'error');
    }
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLicense) return;
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selectedLicense.id, extend_days: extendDays }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Berhasil menambah ${extendDays} hari!`);
        setShowExtendModal(false);
        loadLicenses();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal memperpanjang lisensi', 'error');
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Apakah Anda yakin ingin mengosongkan riwayat log?')) return;
    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Semua log berhasil dibersihkan.');
        setLogs([]);
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal membersihkan log', 'error');
    }
  };

  // Seller link formatted
  const sellerApiUrl = `${serverUrl}/api/seller/?sellerkey=${currentApp.seller_key}&type=add&expiry=1&mask=******-******-******-******-******-******&level=1&amount=1&character=1&format=json`;

  if (!adminUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <RefreshCw className="spin" size={24} style={{ color: 'var(--accent-blue)' }} />
          <span>Memuat Antarmuka Admin AUTH-X-BOY...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Alert */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <Check size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header style={{
        background: 'rgba(9, 9, 13, 0.95)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '12px 24px'
      }}>
        <div style={{
          maxWidth: 1440,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}>
          {/* Logo & Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(37, 99, 235, 0.4)'
            }}>
              <ShieldCheck size={22} color="#fff" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 800, fontSize: '1.15rem', letterSpacing: '0.04em' }}>AUTH-X-BOY</span>
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#60a5fa',
                  fontWeight: 700,
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>PANEL</span>
              </div>
            </div>
          </div>

          {/* User info & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              fontSize: '0.85rem'
            }}>
              <span className="pulse-dot"></span>
              <span style={{ color: 'var(--text-muted)' }}>Admin:</span>
              <strong style={{ color: '#fff' }}>{adminUser.username}</strong>
            </div>

            <button onClick={loadAllData} className="btn btn-secondary btn-sm" title="Refresh Data">
              <RefreshCw size={14} /> Refresh
            </button>

            <button onClick={handleLogout} className="btn btn-danger btn-sm">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div style={{ maxWidth: 1440, margin: '0 auto', padding: '24px', flex: 1, width: '100%' }}>
        {/* Navigation Tabs Bar */}
        <div style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 14,
          marginBottom: 24,
          overflowX: 'auto'
        }}>
          {[
            { id: 'manage_app', label: `Manage App (${products.length})`, icon: Layers },
            { id: 'licenses', label: `Lisensi (${licenses.length})`, icon: KeyRound },
            { id: 'seller', label: 'Reseller Key', icon: Bot },
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'logs', label: 'Audit Logs', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`btn ${isActive ? 'btn-primary' : 'btn-outline'}`}
                style={{ padding: '8px 18px', fontSize: '0.875rem' }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ===================== TAB: MANAGE APP (EXACT REPLICA PHOTO 2) ===================== */}
        {activeTab === 'manage_app' && (
          <div>
            {/* Top Language Selector Tabs */}
            <div style={{
              display: 'flex',
              gap: 4,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              paddingBottom: 0,
              marginBottom: 16,
              overflowX: 'auto'
            }}>
              {Object.keys(languageSnippets).map((langKey) => {
                const lang = languageSnippets[langKey];
                const isSelected = selectedLang === langKey;
                return (
                  <button
                    key={langKey}
                    onClick={() => setSelectedLang(langKey)}
                    style={{
                      background: isSelected ? '#1e3a8a' : 'transparent',
                      color: isSelected ? '#ffffff' : '#94a3b8',
                      border: 'none',
                      borderBottom: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                      padding: '8px 16px',
                      fontSize: '0.85rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      borderRadius: '6px 6px 0 0',
                      transition: '0.15s ease'
                    }}
                  >
                    {lang.name}
                  </button>
                );
              })}
            </div>

            {/* Code Credentials Box */}
            <div style={{
              background: '#09090d',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 10,
              padding: 20,
              marginBottom: 20
            }}>
              <pre style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.875rem',
                color: '#e2e8f0',
                lineHeight: 1.6,
                margin: 0,
                overflowX: 'auto'
              }}>
                {languageSnippets[selectedLang]?.code}
              </pre>

              <div style={{
                marginTop: 18,
                paddingTop: 14,
                borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                fontSize: '0.8rem',
                color: '#94a3b8'
              }}>
                <div style={{ marginBottom: 4 }}>
                  <span style={{ color: '#64748b' }}>Example Files: </span>
                  <a href={languageSnippets[selectedLang]?.github} target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                    {languageSnippets[selectedLang]?.github}
                  </a>
                </div>
                <div>
                  <span style={{ color: '#64748b' }}>Videos: </span>
                  <a href="https://videos.licenseauth.help" target="_blank" rel="noreferrer" style={{ color: '#38bdf8', textDecoration: 'none' }}>
                    https://videos.licenseauth.help
                  </a>
                </div>
              </div>

              <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => copyText(languageSnippets[selectedLang]?.code, 'Credentials Code')}
                  className="btn btn-secondary btn-sm"
                  style={{ background: '#0f0f17', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                  <Copy size={14} /> Copy Credentials
                </button>
                <a
                  href={languageSnippets[selectedLang]?.github}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary btn-sm"
                  style={{ background: '#0f0f17', border: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                  <LinkIcon size={14} /> View {languageSnippets[selectedLang]?.name} Example
                </a>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div style={{
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              marginBottom: 24
            }}>
              <button
                onClick={() => setShowCreateAppModal(true)}
                className="btn btn-blue btn-sm"
              >
                <Plus size={15} /> Create New App
              </button>

              <button
                onClick={() => {
                  setRenameAppName(currentApp.name);
                  setShowRenameAppModal(true);
                }}
                className="btn btn-cyan btn-sm"
              >
                <Edit2 size={15} /> Rename App
              </button>

              <button
                onClick={() => setShowPauseAppModal(true)}
                className="btn btn-orange btn-sm"
              >
                {currentApp.paused ? <Play size={15} /> : <Pause size={15} />}
                {currentApp.paused ? 'Unpause App & Users' : 'Pause App & Users'}
              </button>

              <button
                onClick={handleRefreshAppSecret}
                className="btn btn-green btn-sm"
              >
                <RefreshCw size={15} /> Refresh App Secret
              </button>

              <button
                onClick={() => setShowDeleteAppModal(true)}
                className="btn btn-red btn-sm"
              >
                <Trash2 size={15} /> Delete App
              </button>
            </div>

            {/* Table "All Application" */}
            <div style={{
              background: '#09090d',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: 20
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>
                All Application
              </h3>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ color: '#3b82f6', fontWeight: 700 }}>Application Name</th>
                      <th style={{ color: '#3b82f6', fontWeight: 700 }}>App Status</th>
                      <th style={{ color: '#3b82f6', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => {
                      const isSelected = p.id === currentApp.id;
                      return (
                        <tr key={p.id}>
                          <td>
                            <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: '0.9rem' }}>
                              {p.name}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                              {p.id}
                            </div>
                          </td>
                          <td>
                            {p.paused ? (
                              <span className="badge badge-paused">Paused</span>
                            ) : (
                              <span className="badge badge-active">Active</span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isSelected ? (
                              <div className="btn-selected">
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', boxShadow: '0 0 6px #fff' }}></span>
                                <span>Selected</span>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedAppId(p.id);
                                  showToast(`Aplikasi aktif diganti ke: ${p.name}`);
                                }}
                                className="btn-select"
                              >
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span>
                                <span>Select</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: 36, color: '#64748b' }}>
                          Belum ada aplikasi yang terdaftar. Buat aplikasi baru di atas!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: RESELLER KEY (EXACT REPLICA PHOTO 3) ===================== */}
        {activeTab === 'seller' && (
          <div>
            {/* Dark Red Notice Banner */}
            <div className="banner-seller">
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: 4 }}>
                Manage your seller settings here
              </div>
              <div style={{ fontSize: '0.875rem' }}>
                Join Our Discord server <strong style={{ color: '#fff' }}>For Support</strong>
              </div>
            </div>

            {/* Current Application Selector for Reseller Settings */}
            <div style={{
              background: '#09090d',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: 24,
              marginBottom: 24
            }}>
              <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h4 style={{ fontSize: '1rem', color: '#fff' }}>Aplikasi: <span style={{ color: '#38bdf8' }}>{currentApp.name}</span></h4>
                  <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Kunci dan tautan di bawah ini terhubung ke aplikasi yang sedang dipilih.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Ganti Aplikasi:</span>
                  <select
                    className="select"
                    style={{ width: 'auto', minWidth: 180, height: 38 }}
                    value={currentApp.id}
                    onChange={(e) => setSelectedAppId(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Field 1: Seller Key */}
              <div className="form-group" style={{ marginBottom: 20 }}>
                <label className="form-label">Seller Key</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    readOnly
                    className="input"
                    value={currentApp.seller_key}
                    style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', letterSpacing: '0.05em' }}
                  />
                  <button
                    onClick={() => copyText(currentApp.seller_key, 'Seller Key')}
                    className="btn btn-secondary"
                  >
                    <Copy size={16} /> Copy
                  </button>
                </div>
              </div>

              {/* Field 2: Seller Link */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Seller Link</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <input
                    type="text"
                    readOnly
                    className="input"
                    value={sellerApiUrl}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#94a3b8' }}
                  />
                  <button
                    onClick={() => copyText(sellerApiUrl, 'Seller Link')}
                    className="btn btn-secondary"
                  >
                    <Copy size={16} /> Copy
                  </button>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowBotModal('discord')}
                  className="btn btn-navy btn-sm"
                >
                  <Bot size={15} /> Add Discord Bot
                </button>

                <button
                  onClick={() => setShowBotModal('telegram')}
                  className="btn btn-blue btn-sm"
                >
                  <Send size={15} /> Add Telegram Bot
                </button>

                <button
                  onClick={() => setShowBotModal('shop')}
                  className="btn btn-purple btn-sm"
                >
                  <ShoppingBag size={15} /> Add Discord Shop Bot
                </button>

                <button
                  onClick={handleRefreshSellerKey}
                  className="btn btn-orange btn-sm"
                >
                  <RefreshCw size={15} /> Refresh Seller Key
                </button>
              </div>
            </div>

            {/* API Documentation Accordion / Card */}
            <div style={{
              background: '#09090d',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: 24
            }}>
              <h4 style={{ fontSize: '1rem', color: '#fff', marginBottom: 12 }}>
                Panduan Integrasi Bot & Marketplace
              </h4>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6 }}>
                Endpoint <code style={{ color: '#38bdf8' }}>/api/seller/</code> sepenuhnya kompatibel dengan KeyAuth Seller API v1.2.
                Gunakan URL Seller Link di atas untuk mengotomasi pembuatan lisensi dari Discord Bot, Telegram Bot, Sellix, atau Shoppy saat pesanan selesai.
              </p>
              <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
                <a
                  href={sellerApiUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-outline btn-sm"
                >
                  <LinkIcon size={14} /> Test Seller API Link
                </a>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: LICENSES ===================== */}
        {activeTab === 'licenses' && (
          <div>
            {/* Action Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 14,
              marginBottom: 20
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', flex: 1 }}>
                {/* Search */}
                <div style={{ position: 'relative', minWidth: 260 }}>
                  <input
                    type="text"
                    className="input"
                    style={{ paddingLeft: 36, paddingRight: 12, height: 40 }}
                    placeholder="Cari kunci atau catatan..."
                    value={searchKey}
                    onChange={(e) => setSearchKey(e.target.value)}
                  />
                  <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
                </div>

                {/* Filter Status */}
                <select
                  className="select"
                  style={{ width: 'auto', height: 40 }}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="">Semua Status</option>
                  <option value="active">Active</option>
                  <option value="unused">Unused</option>
                  <option value="expired">Expired</option>
                  <option value="banned">Banned</option>
                </select>

                {/* Filter Product */}
                <select
                  className="select"
                  style={{ width: 'auto', height: 40 }}
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                >
                  <option value="">Semua Aplikasi</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>

                <button onClick={loadLicenses} className="btn btn-secondary" style={{ height: 40 }}>
                  <Filter size={15} /> Terapkan Filter
                </button>
              </div>

              {/* Generate Key Button */}
              <button
                onClick={() => {
                  setGenProduct(currentApp.id);
                  setShowGenerateModal(true);
                }}
                className="btn btn-primary"
                style={{ height: 40 }}
              >
                <Plus size={16} /> Generate Lisensi Baru
              </button>
            </div>

            {/* Table Licenses */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>License Key</th>
                    <th>Aplikasi</th>
                    <th>Status</th>
                    <th>Durasi</th>
                    <th>HWID Terikat</th>
                    <th>Kedaluwarsa</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((lic) => {
                    return (
                      <tr key={lic.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                              {lic.license_key}
                            </span>
                            <button
                              onClick={() => copyText(lic.license_key, 'License Key')}
                              className="btn btn-secondary btn-icon"
                              style={{ width: 26, height: 26 }}
                              title="Salin Kunci"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          {lic.note && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
                              {lic.note}
                            </div>
                          )}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                            {lic.products?.name || lic.product_id}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge-${lic.status}`}>{lic.status}</span>
                        </td>
                        <td>
                          {lic.duration_days > 0 ? `${lic.duration_days} Hari` : 'Lifetime'}
                        </td>
                        <td>
                          <span style={{ fontSize: '0.85rem', color: lic.devicesCount > 0 ? '#10b981' : 'var(--text-dim)' }}>
                            {lic.devicesCount} Perangkat
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {lic.expires_at ? new Date(lic.expires_at).toLocaleDateString('id-ID') : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            {/* Ban / Unban Toggle */}
                            {lic.status === 'banned' ? (
                              <button
                                onClick={() => handleUpdateLicenseStatus(lic.id, 'active')}
                                className="btn btn-secondary btn-sm"
                                title="Unban Lisensi"
                                style={{ color: '#10b981' }}
                              >
                                <Play size={14} /> Unban
                              </button>
                            ) : (
                              <button
                                onClick={() => handleUpdateLicenseStatus(lic.id, 'banned')}
                                className="btn btn-danger btn-sm"
                                title="Stop / Ban Lisensi"
                              >
                                <Ban size={14} /> Stop
                              </button>
                            )}

                            {/* Reset HWID */}
                            <button
                              onClick={() => handleResetHWID(lic.license_key)}
                              className="btn btn-secondary btn-sm"
                              title="Reset HWID Perangkat"
                            >
                              <RotateCcw size={14} /> Reset HWID
                            </button>

                            {/* Extend */}
                            <button
                              onClick={() => {
                                setSelectedLicense(lic);
                                setShowExtendModal(true);
                              }}
                              className="btn btn-secondary btn-sm"
                              title="Perpanjang Durasi"
                            >
                              <Clock size={14} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteLicense(lic.id)}
                              className="btn btn-secondary btn-sm"
                              style={{ color: '#ef4444' }}
                              title="Hapus Lisensi"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {licenses.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                        Tidak ada lisensi yang ditemukan. Silakan klik tombol "Generate Lisensi Baru".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB: OVERVIEW ===================== */}
        {activeTab === 'overview' && (
          <div>
            {/* Stat Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 18,
              marginBottom: 32
            }}>
              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Total Lisensi</span>
                  <div className="stat-icon"><KeyRound size={20} /></div>
                </div>
                <div className="stat-value">{stats?.totalLicenses ?? 0}</div>
                <div className="stat-subtitle">Kunci dalam database</div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Lisensi Aktif</span>
                  <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                    <CheckCircle2 size={20} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: '#34d399' }}>{stats?.activeLicenses ?? 0}</div>
                <div className="stat-subtitle">Digunakan oleh pengguna</div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Belum Digunakan</span>
                  <div className="stat-icon" style={{ color: '#06b6d4', background: 'rgba(6, 182, 212, 0.1)' }}>
                    <Clock size={20} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: '#38bdf8' }}>{stats?.unusedLicenses ?? 0}</div>
                <div className="stat-subtitle">Siap didistribusikan</div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Total Perangkat HWID</span>
                  <div className="stat-icon" style={{ color: '#8b5cf6', background: 'rgba(139, 92, 246, 0.1)' }}>
                    <Cpu size={20} />
                  </div>
                </div>
                <div className="stat-value">{stats?.totalDevices ?? 0}</div>
                <div className="stat-subtitle">Hardware ID terdaftar</div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Kedaluwarsa / Banned</span>
                  <div className="stat-icon" style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)' }}>
                    <Ban size={20} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: '#f87171' }}>
                  {(stats?.expiredLicenses ?? 0) + (stats?.bannedLicenses ?? 0)}
                </div>
                <div className="stat-subtitle">{stats?.bannedLicenses ?? 0} dibanned, {stats?.expiredLicenses ?? 0} expired</div>
              </div>
            </div>

            {/* Quick Actions & Recent Activity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, flexWrap: 'wrap' }}>
              <div className="glass-card" style={{ padding: 24 }}>
                <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Aksi Cepat</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button onClick={() => setShowGenerateModal(true)} className="btn btn-primary" style={{ width: '100%' }}>
                    <Plus size={16} /> Generate Lisensi Baru
                  </button>
                  <button onClick={() => setActiveTab('manage_app')} className="btn btn-secondary" style={{ width: '100%' }}>
                    <Layers size={16} /> Kelola Aplikasi
                  </button>
                  <button onClick={() => setActiveTab('seller')} className="btn btn-secondary" style={{ width: '100%' }}>
                    <Bot size={16} /> Reseller Settings
                  </button>
                </div>
              </div>

              <div className="glass-card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: '1.1rem' }}>Aktivitas Terbaru</h3>
                  <button onClick={() => setActiveTab('logs')} className="btn btn-outline btn-sm">Lihat Semua</button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {logs.slice(0, 5).map((log) => (
                    <div key={log.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-sm)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.85rem'
                    }}>
                      <div>
                        <strong style={{ color: 'var(--accent-blue)' }}>{log.action}</strong>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{log.description}</div>
                      </div>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                  {logs.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 20 }}>Belum ada log aktivitas.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================== TAB: AUDIT LOGS ===================== */}
        {activeTab === 'logs' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Audit Security Logs</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Pencatatan real-time aktivasi, login, HWID check, dan aksi admin.</p>
              </div>
              <button onClick={handleClearLogs} className="btn btn-danger btn-sm">
                <Trash2 size={14} /> Kosongkan Log
              </button>
            </div>

            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Waktu</th>
                    <th>Aksi</th>
                    <th>Deskripsi</th>
                    <th>IP Address</th>
                    <th>Detail Data</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                        {new Date(log.created_at).toLocaleString('id-ID')}
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          padding: '3px 8px',
                          borderRadius: 4,
                          background: log.action.includes('FAIL') || log.action.includes('MISMATCH') || log.action.includes('BANNED') || log.action.includes('PAUSED')
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(56, 189, 248, 0.12)',
                          color: log.action.includes('FAIL') || log.action.includes('MISMATCH') || log.action.includes('BANNED') || log.action.includes('PAUSED')
                            ? '#fca5a5'
                            : '#38bdf8'
                        }}>
                          {log.action}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>{log.description}</td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {log.ip_address || '-'}
                      </td>
                      <td>
                        <code style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          {log.details ? JSON.stringify(log.details) : '-'}
                        </code>
                      </td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={5} style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                        Belum ada catatan log.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ===================== MODALS ===================== */}

      {/* 1. Create App Modal */}
      {showCreateAppModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Create A New Application</h3>
              <button onClick={() => setShowCreateAppModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateApp}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Application Name</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Contoh: EXTERNAL AIMBOT XBOY"
                    value={newAppName}
                    onChange={(e) => setNewAppName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Application ID / Slug (Opsional)</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Contoh: external-aimbot"
                    value={newAppId}
                    onChange={(e) => setNewAppId(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    Jika dikosongkan, ID akan dibuat otomatis dari nama aplikasi.
                  </span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowCreateAppModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-blue">Create App</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Rename App Modal */}
      {showRenameAppModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Rename Application</h3>
              <button onClick={() => setShowRenameAppModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleRenameApp}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">New Application Name</label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={renameAppName}
                    onChange={(e) => setRenameAppName(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowRenameAppModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-cyan">Rename Application</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Pause / Unpause App Modal */}
      {showPauseAppModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>{currentApp.paused ? 'Unpause Application & Users' : 'Pause Application & Users'}</h3>
              <button onClick={() => setShowPauseAppModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(234, 88, 12, 0.15)',
                border: '1px solid rgba(234, 88, 12, 0.4)',
                borderRadius: 8,
                padding: 14,
                marginBottom: 16,
                color: '#fdba74',
                fontSize: '0.85rem'
              }}>
                {currentApp.paused ? (
                  <span>Notice! Anda akan mengaktifkan kembali aplikasi <strong>{currentApp.name}</strong> untuk semua pengguna.</span>
                ) : (
                  <span>Notice! Menghentikan (pause) aplikasi akan membuat semua client/loader tidak dapat login sampai Anda mengaktifkannya kembali.</span>
                )}
              </div>
              <p style={{ color: '#e2e8f0', fontSize: '0.95rem' }}>
                Apakah Anda yakin ingin {currentApp.paused ? 'mengaktifkan kembali (unpause)' : 'menghentikan (pause)'} aplikasi <strong>{currentApp.name}</strong>?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setShowPauseAppModal(false)} className="btn btn-secondary">Batal</button>
              <button
                type="button"
                onClick={handleTogglePauseApp}
                className="btn btn-orange"
              >
                Yes, I'm sure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete App Modal */}
      {showDeleteAppModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3 style={{ color: '#ef4444' }}>Delete Application</h3>
              <button onClick={() => setShowDeleteAppModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                borderRadius: 8,
                padding: 14,
                marginBottom: 16,
                color: '#fca5a5',
                fontSize: '0.85rem'
              }}>
                Warning! Menghapus aplikasi akan menghapus seluruh data kredensial dan lisensi yang terikat pada aplikasi ini.
              </div>
              <p style={{ color: '#e2e8f0' }}>
                Hapus aplikasi <strong>{currentApp.name}</strong> secara permanen?
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setShowDeleteAppModal(false)} className="btn btn-secondary">Batal</button>
              <button
                type="button"
                onClick={handleDeleteApp}
                className="btn btn-red"
              >
                Hapus Permanen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Generate License Modal */}
      {showGenerateModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>Generate License Key Baru</h3>
              <button onClick={() => { setShowGenerateModal(false); setGeneratedResult(null); }} className="btn-icon">
                <X size={18} />
              </button>
            </div>

            {!generatedResult ? (
              <form onSubmit={handleGenerateLicenses}>
                <div className="modal-body">
                  <div className="form-group">
                    <label className="form-label">Aplikasi / Produk</label>
                    <select
                      className="select"
                      value={genProduct}
                      onChange={(e) => setGenProduct(e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Jumlah Kunci (1-100)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="input"
                        value={genCount}
                        onChange={(e) => setGenCount(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Prefix Kunci</label>
                      <input
                        type="text"
                        className="input"
                        placeholder="XBOY"
                        value={genPrefix}
                        onChange={(e) => setGenPrefix(e.target.value.toUpperCase())}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Durasi (Hari, 0 = Lifetime)</label>
                      <input
                        type="number"
                        min="0"
                        className="input"
                        value={genDuration}
                        onChange={(e) => setGenDuration(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Maksimal Device (HWID)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="input"
                        value={genMaxDevices}
                        onChange={(e) => setGenMaxDevices(parseInt(e.target.value) || 1)}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Catatan Admin (Opsional)</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Contoh: Reseller Discord / VIP Client"
                      value={genNote}
                      onChange={(e) => setGenNote(e.target.value)}
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={() => setShowGenerateModal(false)} className="btn btn-secondary">Batal</button>
                  <button type="submit" className="btn btn-primary">Generate Sekarang</button>
                </div>
              </form>
            ) : (
              <div>
                <div className="modal-body">
                  <div style={{
                    padding: 14,
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '1px solid rgba(16, 185, 129, 0.3)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: 16,
                    color: '#34d399',
                    fontSize: '0.85rem'
                  }}>
                    Berhasil membuat {generatedResult.length} lisensi baru!
                  </div>

                  <div style={{ maxHeight: 220, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {generatedResult.map((lic) => (
                      <div key={lic.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        borderRadius: 6,
                        border: '1px solid var(--border-subtle)'
                      }}>
                        <code style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#fff' }}>
                          {lic.license_key}
                        </code>
                        <button
                          onClick={() => copyText(lic.license_key, 'License Key')}
                          className="btn btn-secondary btn-icon"
                          style={{ width: 28, height: 28 }}
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    onClick={() => {
                      const allKeys = generatedResult.map((k) => k.license_key).join('\n');
                      copyText(allKeys, 'Semua Kunci');
                    }}
                    className="btn btn-secondary"
                  >
                    <Copy size={14} /> Salin Semua Kunci
                  </button>
                  <button onClick={() => { setShowGenerateModal(false); setGeneratedResult(null); }} className="btn btn-primary">
                    Selesai
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Extend Duration Modal */}
      {showExtendModal && selectedLicense && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Perpanjang Durasi Lisensi</h3>
              <button onClick={() => setShowExtendModal(false)} className="btn-icon"><X size={18} /></button>
            </div>
            <form onSubmit={handleExtendSubmit}>
              <div className="modal-body">
                <div style={{ marginBottom: 16 }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Target Kunci:</span>
                  <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-blue)', fontSize: '0.95rem' }}>
                    {selectedLicense.license_key}
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Tambah Durasi (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    required
                    className="input"
                    value={extendDays}
                    onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setShowExtendModal(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary">Tambah Hari</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Bot Setup Modals (Discord, Telegram, Shop) */}
      {showBotModal && (
        <div className="modal-backdrop">
          <div className="glass-card modal-content" style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h3>
                {showBotModal === 'discord' && 'Integrasi Discord Bot'}
                {showBotModal === 'telegram' && 'Integrasi Telegram Bot'}
                {showBotModal === 'shop' && 'Integrasi Discord Shop / Shoppy Bot'}
              </h3>
              <button onClick={() => setShowBotModal(null)} className="btn-icon"><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 16 }}>
                Gunakan URL Seller API berikut di konfigurasi bot Anda untuk mengotomasi pembuatan lisensi dan reset HWID:
              </p>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Webhook / API Endpoint</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="text"
                    readOnly
                    className="input"
                    value={sellerApiUrl}
                    style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}
                  />
                  <button onClick={() => copyText(sellerApiUrl, 'API URL')} className="btn btn-secondary btn-sm">
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div style={{
                background: '#09090d',
                borderRadius: 8,
                padding: 14,
                border: '1px solid rgba(255, 255, 255, 0.08)',
                fontSize: '0.8rem',
                color: '#e2e8f0'
              }}>
                <strong style={{ color: '#38bdf8' }}>Parameter yang Didukung:</strong>
                <ul style={{ paddingLeft: 18, marginTop: 6, lineHeight: 1.6 }}>
                  <li><code>type=add</code> : Membuat lisensi baru</li>
                  <li><code>expiry=30</code> : Durasi dalam hari</li>
                  <li><code>mask=XBOY-******-******-******</code> : Pola lisensi</li>
                  <li><code>format=json</code> : Response dalam format JSON</li>
                  <li><code>type=resethwid&key=...</code> : Reset HWID pengguna</li>
                </ul>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowBotModal(null)} className="btn btn-primary">Mengerti</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
