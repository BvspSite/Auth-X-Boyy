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
  Code2
} from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();

  // Authentication & State
  const [adminUser, setAdminUser] = useState(null);
  const [activeTab, setActiveTab] = useState('licenses');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Data states
  const [stats, setStats] = useState(null);
  const [licenses, setLicenses] = useState([]);
  const [products, setProducts] = useState([]);
  const [logs, setLogs] = useState([]);

  // Examples language and app state
  const [selectedLang, setSelectedLang] = useState('csharp');
  const [selectedExampleApp, setSelectedExampleApp] = useState('');

  // Filters
  const [searchKey, setSearchKey] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [productFilter, setProductFilter] = useState('');

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState(null);
  const [generatedResult, setGeneratedResult] = useState(null);

  // Generator Form state
  const [genCount, setGenCount] = useState(1);
  const [genPrefix, setGenPrefix] = useState('XBOY');
  const [genDuration, setGenDuration] = useState(30);
  const [genMaxDevices, setGenMaxDevices] = useState(1);
  const [genProduct, setGenProduct] = useState('');
  const [genNote, setGenNote] = useState('');

  // Product Form state
  const [newProdId, setNewProdId] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');

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
      if (data.success) {
        setProducts(data.products || []);
        if (data.products && data.products.length > 0) {
          if (!genProduct) setGenProduct(data.products[0].id);
          if (!selectedExampleApp) setSelectedExampleApp(data.products[0].id);
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

  // Trigger search on filter change
  useEffect(() => {
    if (adminUser) {
      loadLicenses();
    }
  }, [searchKey, statusFilter, productFilter, adminUser]);

  // Copy helper
  const copyToClipboard = (text, label = 'Teks') => {
    navigator.clipboard.writeText(text);
    showToast(`${label} disalin ke clipboard!`);
  };

  // Logout
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  // Generate Licenses
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
          product_id: genProduct || products[0]?.id || 'panel-aimbot-xboy',
          note: genNote,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Gagal generate');

      setGeneratedResult(data.licenses);
      showToast(`Berhasil generate ${data.createdCount} lisensi!`);
      loadLicenses();
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Reset HWID
  const handleResetHwid = async (licenseId, licenseKey) => {
    if (!confirm(`Reset HWID untuk lisensi ${licenseKey}?\nSemua perangkat terikat akan dilepas sehingga pengguna dapat login di PC baru.`)) return;

    try {
      const res = await fetch('/api/license/reset-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_id: licenseId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast(`HWID ${licenseKey} berhasil di-reset!`);
      loadLicenses();
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Toggle Ban / Unban
  const handleToggleBan = async (license) => {
    const newStatus = license.status === 'banned' ? 'active' : 'banned';
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: license.id, status: newStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast(`Status lisensi diubah ke: ${newStatus}`);
      loadLicenses();
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete License
  const handleDeleteLicense = async (licenseId, licenseKey) => {
    if (!confirm(`Hapus permanen lisensi ${licenseKey}?`)) return;

    try {
      const res = await fetch(`/api/admin/licenses?id=${licenseId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast(`Lisensi ${licenseKey} berhasil dihapus.`);
      loadLicenses();
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Extend Days
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
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast(`Durasi lisensi diperpanjang +${extendDays} hari.`);
      setShowExtendModal(false);
      loadLicenses();
      loadStats();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Create Product
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newProdId, name: newProdName, description: newProdDesc }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast('Produk baru berhasil ditambahkan!');
      setShowProductModal(false);
      setNewProdId('');
      setNewProdName('');
      setNewProdDesc('');
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Delete Product
  const handleDeleteProduct = async (prodId, prodName) => {
    if (!confirm(`Hapus produk "${prodName}" (${prodId})?`)) return;

    try {
      const res = await fetch(`/api/admin/products?id=${prodId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast(`Produk "${prodName}" berhasil dihapus.`);
      loadProducts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Clear Logs
  const handleClearLogs = async () => {
    if (!confirm('Apakah Anda yakin ingin mengosongkan riwayat audit log?')) return;

    try {
      const res = await fetch('/api/admin/logs', { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast('Semua audit log berhasil dibersihkan.');
      loadLogs();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (!adminUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--accent-blue)', margin: '0 auto 12px' }} />
          <p style={{ color: 'var(--text-muted)' }}>Memuat sesi admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Toast Notification */}
      {toast && (
        <div className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
          {toast.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header Navbar */}
      <header style={{
        background: 'rgba(11, 15, 25, 0.85)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        padding: '14px 24px'
      }}>
        <div style={{ maxWidth: 1380, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                background: 'var(--grad-cyber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#07090e'
              }}>
                <ShieldCheck size={22} strokeWidth={2.5} />
              </div>
              <div>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em', color: '#fff' }}>
                  AUTH-X-BOY
                </span>
                <span style={{ marginLeft: 8, fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, background: 'rgba(56, 189, 248, 0.15)', color: 'var(--accent-blue)', border: '1px solid rgba(56, 189, 248, 0.3)', fontWeight: 700 }}>
                  PANEL
                </span>
              </div>
            </Link>
          </div>

          {/* User profile & actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
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
      <div style={{ maxWidth: 1380, margin: '0 auto', padding: '24px', flex: 1, width: '100%' }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          gap: 8,
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: 12,
          marginBottom: 24,
          overflowX: 'auto'
        }}>
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'licenses', label: `Lisensi (${licenses.length})`, icon: KeyRound },
            { id: 'products', label: `Manage App (${products.length})`, icon: Layers },
            { id: 'examples', label: 'Application Examples', icon: Code2 },
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

        {/* ===================== TAB 1: OVERVIEW ===================== */}
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
                <div className="stat-subtitle">Siap dijual/dibagikan</div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Perangkat (HWID)</span>
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
                  <button onClick={() => setShowProductModal(true)} className="btn btn-secondary" style={{ width: '100%' }}>
                    <Layers size={16} /> Tambah Produk Baru
                  </button>
                  <button onClick={() => setActiveTab('licenses')} className="btn btn-outline" style={{ width: '100%' }}>
                    <KeyRound size={16} /> Kelola Semua Lisensi
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

        {/* ===================== TAB 2: LICENSES ===================== */}
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

                {/* Status Filter */}
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

                {/* Product Filter */}
                <select
                  className="select"
                  style={{ width: 'auto', height: 40 }}
                  value={productFilter}
                  onChange={(e) => setProductFilter(e.target.value)}
                >
                  <option value="">Semua Produk</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <button onClick={() => { setGeneratedResult(null); setShowGenerateModal(true); }} className="btn btn-primary">
                <Plus size={16} /> Buat Lisensi Baru
              </button>
            </div>

            {/* Table */}
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>License Key</th>
                    <th>Produk</th>
                    <th>Status</th>
                    <th>Durasi / Expired</th>
                    <th>Perangkat (HWID)</th>
                    <th>Catatan</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {licenses.map((lic) => {
                    const isLifetime = lic.duration_days === 0;
                    return (
                      <tr key={lic.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <code style={{
                              fontFamily: 'var(--font-mono)',
                              fontWeight: 600,
                              color: 'var(--accent-blue)',
                              background: 'rgba(56, 189, 248, 0.08)',
                              padding: '3px 8px',
                              borderRadius: 4
                            }}>
                              {lic.license_key}
                            </code>
                            <button
                              onClick={() => copyToClipboard(lic.license_key, 'License Key')}
                              className="btn btn-secondary btn-icon"
                              style={{ width: 26, height: 26 }}
                              title="Salin Key"
                            >
                              <Copy size={13} />
                            </button>
                          </div>
                        </td>

                        <td>
                          <span style={{ fontWeight: 600 }}>{lic.products?.name || lic.product_id}</span>
                        </td>

                        <td>
                          <span className={`badge badge-${lic.status}`}>
                            {lic.status}
                          </span>
                        </td>

                        <td>
                          <div>
                            {isLifetime ? (
                              <span style={{ color: '#10b981', fontWeight: 600 }}>Lifetime</span>
                            ) : (
                              <span>{lic.duration_days} Hari</span>
                            )}
                            {lic.expires_at && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                Exp: {new Date(lic.expires_at).toLocaleDateString()}
                              </div>
                            )}
                          </div>
                        </td>

                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Cpu size={14} style={{ color: 'var(--text-dim)' }} />
                            <span>{lic.devicesCount} / {lic.max_devices || 1}</span>
                          </div>
                          {lic.devices && lic.devices.length > 0 && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={lic.devices[0].hwid}>
                              {lic.devices[0].hwid}
                            </div>
                          )}
                        </td>

                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {lic.note || '-'}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                            {/* Reset HWID Button */}
                            <button
                              onClick={() => handleResetHwid(lic.id, lic.license_key)}
                              className="btn btn-secondary btn-sm"
                              title="Reset HWID agar bisa login di PC baru"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <RotateCcw size={12} /> Reset HWID
                            </button>

                            {/* Extend Days */}
                            <button
                              onClick={() => { setSelectedLicense(lic); setShowExtendModal(true); }}
                              className="btn btn-outline btn-sm"
                              title="Perpanjang Hari"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              + Hari
                            </button>

                            {/* Ban / Unban */}
                            <button
                              onClick={() => handleToggleBan(lic)}
                              className={`btn btn-sm ${lic.status === 'banned' ? 'btn-secondary' : 'btn-danger'}`}
                              title={lic.status === 'banned' ? 'Buka Ban' : 'Ban Lisensi'}
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <Ban size={12} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteLicense(lic.id, lic.license_key)}
                              className="btn btn-danger btn-sm"
                              title="Hapus"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {licenses.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>
                        Tidak ada lisensi yang cocok dengan pencarian / filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== TAB 3: PRODUCTS ===================== */}
        {activeTab === 'products' && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: '1.2rem' }}>Daftar Produk / Software</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Aplikasi yang terhubung dengan sistem autentikasi.</p>
              </div>
              <button onClick={() => setShowProductModal(true)} className="btn btn-primary">
                <Plus size={16} /> Tambah Produk
              </button>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: 20
            }}>
              {products.map((prod) => (
                <div key={prod.id} className="glass-card" style={{ padding: 24, position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56, 189, 248, 0.1)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Layers size={18} />
                      </div>
                      <div>
                        <h4 style={{ fontSize: '1.1rem' }}>{prod.name}</h4>
                        <code style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{prod.id}</code>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteProduct(prod.id, prod.name)}
                      className="btn btn-danger btn-sm"
                      title="Hapus Produk"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 16 }}>
                    {prod.description || 'Tidak ada deskripsi produk.'}
                  </p>

                  <div style={{
                    paddingTop: 12,
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.85rem'
                  }}>
                    <span style={{ color: 'var(--text-dim)' }}>Jumlah Lisensi:</span>
                    <strong style={{ color: 'var(--accent-blue)' }}>{prod.licenseCount || 0} Key</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===================== TAB 4: AUDIT LOGS ===================== */}
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
                          background: log.action.includes('FAIL') || log.action.includes('MISMATCH') || log.action.includes('BANNED')
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(56, 189, 248, 0.12)',
                          color: log.action.includes('FAIL') || log.action.includes('MISMATCH') || log.action.includes('BANNED')
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

        {/* ===================== TAB 5: APPLICATION EXAMPLES ===================== */}
        {activeTab === 'examples' && (() => {
          const currentApp = products.find((p) => p.id === selectedExampleApp) || products[0] || {
            id: 'panel-aimbot-xboy',
            name: 'PANEL AIMBOT XBOY',
          };
          const appName = currentApp.name;
          const appId = currentApp.id;
          const appSecret = 'authcaxs-v1-secret';
          const appVersion = '1.0';
          const serverUrl = 'https://authcaxs.vercel.app';

          const languageSnippets = {
            csharp: {
              name: 'C#',
              code: `public static api KeyAuthApp = new api(
    name: "${appName}",
    ownerid: "${appId}",
    secret: "${appSecret}",
    version: "${appVersion}",
    url: "${serverUrl}"
);`,
              github: 'https://github.com/KeyAuth/KeyAuth-CSHARP-Example',
              unityGithub: 'https://github.com/KeyAuth/KeyAuth-Unity-Example',
            },
            cpp: {
              name: 'C++',
              code: `std::string name = "${appName}";
std::string ownerid = "${appId}";
std::string secret = "${appSecret}";
std::string version = "${appVersion}";
std::string url = "${serverUrl}"; // Server URL AUTH-X-BOY

KeyAuth::api KeyAuthApp(name, ownerid, secret, version, url);`,
              github: 'https://github.com/KeyAuth/KeyAuth-CPP-Example',
            },
            python: {
              name: 'Python',
              code: `keyauthapp = api(
    name = "${appName}",
    ownerid = "${appId}",
    secret = "${appSecret}",
    version = "${appVersion}",
    url = "${serverUrl}"
)`,
              github: 'https://github.com/KeyAuth/KeyAuth-Python-Example',
            },
            php: {
              name: 'PHP',
              code: `$name = "${appName}";
$ownerid = "${appId}";
$secret = "${appSecret}";
$version = "${appVersion}";
$url = "${serverUrl}";`,
              github: 'https://github.com/KeyAuth/KeyAuth-PHP-Example',
            },
            js: {
              name: 'JavaScript',
              code: `const KeyAuthApp = new KeyAuth(
    "${appName}",
    "${appId}",
    "${appSecret}",
    "${appVersion}",
    "${serverUrl}"
);`,
              github: 'https://github.com/mazkdevf/KeyAuth-JS-Example',
            },
            java: {
              name: 'Java',
              code: `private static String appname = "${appName}";
private static String ownerid = "${appId}";
private static String secret = "${appSecret}";
private static String version = "${appVersion}";
private static String url = "${serverUrl}";`,
              github: 'https://github.com/KeyAuth-Archive/KeyAuth-JAVA-api',
            },
            vb: {
              name: 'VB.Net',
              code: `Private Shared name As String = "${appName}"
Private Shared ownerid As String = "${appId}"
Private Shared secret As String = "${appSecret}"
Private Shared version As String = "${appVersion}"
Private Shared url As String = "${serverUrl}"`,
              github: 'https://github.com/KeyAuth/KeyAuth-VB-Example',
            },
            rust: {
              name: 'Rust',
              code: `let mut keyauthapp = keyauth::KeyauthApi::new(
    "${appName}",
    "${appId}",
    "${appSecret}",
    "${appVersion}",
    "${serverUrl}",
);`,
              github: 'https://github.com/KeyAuth/KeyAuth-Rust-Example',
            },
            go: {
              name: 'Go',
              code: `var KeyAuthApp = keyauth.New(
    "${appName}",
    "${appId}",
    "${appSecret}",
    "${appVersion}",
    "${serverUrl}",
)`,
              github: 'https://github.com/KeyAuth/KeyAuth-Go-Example',
            },
            lua: {
              name: 'Lua',
              code: `local KeyAuthApp = KeyAuth.new(
    "${appName}",
    "${appId}",
    "${appSecret}",
    "${appVersion}",
    "${serverUrl}"
)`,
              github: 'https://github.com/KeyAuth/KeyAuth-Lua-Example',
            },
            ruby: {
              name: 'Ruby',
              code: `keyauthapp = KeyAuth.new(
    "${appName}",
    "${appId}",
    "${appSecret}",
    "${appVersion}",
    "${serverUrl}"
)`,
              github: 'https://github.com/KeyAuth/KeyAuth-Ruby-Example',
            },
            perl: {
              name: 'Perl',
              code: `my $keyauth = KeyAuth->new(
    name => "${appName}",
    ownerid => "${appId}",
    secret => "${appSecret}",
    version => "${appVersion}",
    url => "${serverUrl}"
);`,
              github: 'https://github.com/KeyAuth/KeyAuth-Perl-Example',
            },
          };

          const activeSnippet = languageSnippets[selectedLang] || languageSnippets.csharp;

          return (
            <div>
              {/* Header & Product Switcher */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 16,
                marginBottom: 20
              }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Code2 size={22} color="var(--accent-blue)" /> Application Examples
                  </h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Pilih bahasa pemrograman dan salin kredensial inisialisasi aplikasi Anda.
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Pilih Aplikasi:</span>
                  <select
                    className="select"
                    style={{ width: 'auto', minWidth: 220 }}
                    value={selectedExampleApp}
                    onChange={(e) => setSelectedExampleApp(e.target.value)}
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Main Card */}
              <div className="glass-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 24 }}>
                {/* Language Tabs Pill Bar */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: '#0a0e1a',
                  borderBottom: '1px solid var(--border-subtle)',
                  padding: '8px 12px',
                  gap: 6,
                  overflowX: 'auto'
                }}>
                  {[
                    { id: 'csharp', label: 'C#' },
                    { id: 'cpp', label: 'C++' },
                    { id: 'python', label: 'Python' },
                    { id: 'php', label: 'PHP' },
                    { id: 'js', label: 'JavaScript' },
                    { id: 'java', label: 'Java' },
                    { id: 'vb', label: 'VB.Net' },
                    { id: 'rust', label: 'Rust' },
                    { id: 'go', label: 'Go' },
                    { id: 'lua', label: 'Lua' },
                    { id: 'ruby', label: 'Ruby' },
                    { id: 'perl', label: 'Perl' },
                  ].map((lang) => {
                    const isSelected = selectedLang === lang.id;
                    return (
                      <button
                        key={lang.id}
                        onClick={() => setSelectedLang(lang.id)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          fontSize: '0.85rem',
                          fontWeight: isSelected ? 700 : 500,
                          cursor: 'pointer',
                          border: isSelected ? '1px solid var(--accent-blue)' : '1px solid transparent',
                          background: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                          color: isSelected ? 'var(--accent-blue)' : 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>

                {/* Code Box Area */}
                <div style={{ padding: 24, background: '#070a12' }}>
                  <pre
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.9rem',
                      lineHeight: 1.6,
                      color: '#e2e8f0',
                      background: '#04060c',
                      padding: 20,
                      borderRadius: 10,
                      border: '1px solid var(--border-subtle)',
                      overflowX: 'auto',
                      marginBottom: 16
                    }}
                  >
                    <code>{activeSnippet.code}</code>
                  </pre>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                    <button
                      onClick={() => copyToClipboard(activeSnippet.code, `Kredensial ${activeSnippet.name}`)}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '8px 16px' }}
                    >
                      <Copy size={14} /> Copy Credentials
                    </button>

                    {activeSnippet.github && (
                      <a
                        href={activeSnippet.github}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '8px 16px' }}
                      >
                        <ExternalLink size={14} /> View {activeSnippet.name} Example
                      </a>
                    )}

                    {activeSnippet.unityGithub && (
                      <a
                        href={activeSnippet.unityGithub}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '8px 16px' }}
                      >
                        <ExternalLink size={14} /> View Unity Example
                      </a>
                    )}
                  </div>
                </div>

                {/* Yellow / Amber Notice Banner matching KeyAuth */}
                <div style={{
                  padding: '14px 20px',
                  background: 'rgba(245, 158, 11, 0.08)',
                  borderTop: '1px solid rgba(245, 158, 11, 0.25)',
                  fontSize: '0.85rem',
                  color: '#fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12
                }}>
                  <div>
                    <strong>Hosting Server URL:</strong>{' '}
                    <code style={{ background: 'rgba(0,0,0,0.4)', padding: '2px 6px', borderRadius: 4 }}>
                      {serverUrl}
                    </code>
                  </div>
                  <div>
                    <strong>GitHub Examples:</strong>{' '}
                    <a
                      href="https://github.com/KeyAuth"
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: '#fbbf24', textDecoration: 'underline' }}
                    >
                      https://github.com/KeyAuth
                    </a>
                  </div>
                </div>
              </div>

              {/* Loader Auth C++ Direct Guide */}
              <div className="glass-card" style={{ padding: 24 }}>
                <h4 style={{ fontSize: '1.1rem', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Terminal size={18} color="var(--accent-blue)" /> Penerapan di C++ Loader (Auth-X-Boy)
                </h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: 14 }}>
                  Untuk Loader Auth C++ Anda, pastikan file konfigurasi <code>auth_url.txt</code> di sebelah file <code>.exe</code> berisi:
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <code style={{
                    padding: '8px 16px',
                    borderRadius: 6,
                    background: '#04060c',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--accent-blue)',
                    fontSize: '0.9rem'
                  }}>
                    {serverUrl}
                  </code>
                  <button onClick={() => copyToClipboard(serverUrl, 'Server URL')} className="btn btn-secondary btn-sm">
                    <Copy size={13} /> Salin URL
                  </button>
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>
                  Loader akan otomatis mengirimkan POST request ke <code>{serverUrl}/api/license/activate</code> dengan parameter <code>license_key</code> dan <code>hwid</code>.
                </p>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ===================== MODAL: GENERATE LICENSES ===================== */}
      {showGenerateModal && (
        <div className="modal-overlay" onClick={() => setShowGenerateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <KeyRound size={20} color="var(--accent-blue)" /> Generate License Keys
              </h3>
              <button onClick={() => setShowGenerateModal(false)} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>

            {generatedResult ? (
              <div className="modal-body">
                <div style={{ textAlign: 'center', marginBottom: 18 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 50, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
                    <CheckCircle2 size={24} />
                  </div>
                  <h4 style={{ fontSize: '1.1rem' }}>{generatedResult.length} Lisensi Berhasil Dibuat!</h4>
                </div>

                <div style={{ maxHeight: 220, overflowY: 'auto', background: '#050811', padding: 12, borderRadius: 8, marginBottom: 16 }}>
                  {generatedResult.map((lic, i) => (
                    <div key={lic.id || i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
                      <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>{lic.license_key}</code>
                      <button onClick={() => copyToClipboard(lic.license_key, 'Key')} className="btn btn-secondary btn-sm" style={{ padding: '2px 8px' }}>
                        Salin
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => {
                    const allKeys = generatedResult.map((k) => k.license_key).join('\n');
                    copyToClipboard(allKeys, 'Semua Key');
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  <Copy size={16} /> Salin Semua Key Sekaligus
                </button>
              </div>
            ) : (
              <form onSubmit={handleGenerateLicenses}>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div className="form-group">
                      <label className="form-label">Jumlah Key (1 - 100)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="input"
                        value={genCount}
                        onChange={(e) => setGenCount(parseInt(e.target.value || '1', 10))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Prefix Key</label>
                      <input
                        type="text"
                        className="input"
                        value={genPrefix}
                        onChange={(e) => setGenPrefix(e.target.value.toUpperCase())}
                        placeholder="XBOY"
                        required
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
                        onChange={(e) => setGenDuration(parseInt(e.target.value || '0', 10))}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">Batas Perangkat (HWID)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        className="input"
                        value={genMaxDevices}
                        onChange={(e) => setGenMaxDevices(parseInt(e.target.value || '1', 10))}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pilih Produk</label>
                    <select
                      className="select"
                      value={genProduct}
                      onChange={(e) => setGenProduct(e.target.value)}
                    >
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>{p.name} ({p.id})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Catatan Admin (Opsional)</label>
                    <input
                      type="text"
                      className="input"
                      value={genNote}
                      onChange={(e) => setGenNote(e.target.value)}
                      placeholder="Contoh: Pembeli @discord_user"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" onClick={() => setShowGenerateModal(false)} className="btn btn-secondary">
                    Batal
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Generate Sekarang
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================== MODAL: CREATE PRODUCT ===================== */}
      {showProductModal && (
        <div className="modal-overlay" onClick={() => setShowProductModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers size={20} color="var(--accent-blue)" /> Tambah Produk Baru
              </h3>
              <button onClick={() => setShowProductModal(false)} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateProduct}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">ID Produk (slug unik, huruf kecil)</label>
                  <input
                    type="text"
                    className="input"
                    value={newProdId}
                    onChange={(e) => setNewProdId(e.target.value)}
                    placeholder="contoh: panel-aimbot-v2"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Tampilan Produk</label>
                  <input
                    type="text"
                    className="input"
                    value={newProdName}
                    onChange={(e) => setNewProdName(e.target.value)}
                    placeholder="contoh: PANEL AIMBOT V2 VIP"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Deskripsi</label>
                  <textarea
                    className="textarea"
                    rows={3}
                    value={newProdDesc}
                    onChange={(e) => setNewProdDesc(e.target.value)}
                    placeholder="Deskripsi singkat produk..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowProductModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODAL: EXTEND DAYS ===================== */}
      {showExtendModal && selectedLicense && (
        <div className="modal-overlay" onClick={() => setShowExtendModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={20} color="var(--accent-blue)" /> Perpanjang Masa Aktif
              </h3>
              <button onClick={() => setShowExtendModal(false)} className="btn btn-secondary btn-icon" style={{ width: 32, height: 32 }}>
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleExtendSubmit}>
              <div className="modal-body">
                <p style={{ color: 'var(--text-muted)', marginBottom: 14 }}>
                  Perpanjang durasi untuk lisensi: <br />
                  <code style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{selectedLicense.license_key}</code>
                </p>

                <div className="form-group">
                  <label className="form-label">Tambah Durasi (Hari)</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={extendDays}
                    onChange={(e) => setExtendDays(parseInt(e.target.value || '1', 10))}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={() => setShowExtendModal(false)} className="btn btn-secondary">
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Perpanjang Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
