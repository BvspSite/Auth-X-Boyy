'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  KeyRound, 
  Cpu, 
  Zap, 
  ArrowRight, 
  Layers, 
  Activity,
  Lock,
  Flame,
  Globe2
} from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(7, 9, 14, 0.85)',
        backdropFilter: 'blur(14px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 38,
              height: 38,
              borderRadius: 10,
              background: 'var(--grad-cyber)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#07090e',
              boxShadow: '0 0 16px rgba(56, 189, 248, 0.3)'
            }}>
              <ShieldCheck size={24} strokeWidth={2.5} />
            </div>
            <div>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>AUTH-X-BOY</span>
              <span style={{ 
                marginLeft: 8, 
                fontSize: '0.65rem', 
                padding: '2px 7px', 
                borderRadius: 4, 
                background: 'rgba(56, 189, 248, 0.15)', 
                color: 'var(--accent-blue)', 
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 700
              }}>SECURITY PANEL</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span className="pulse-dot"></span>
              <span>System: <strong style={{ color: '#10b981' }}>Operational</strong></span>
            </div>
            <Link href="/login" className="btn btn-primary btn-sm">
              Dashboard Admin <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', padding: '64px 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 64px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 16px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            fontSize: '0.85rem',
            color: 'var(--accent-blue)',
            marginBottom: 24
          }}>
            <Flame size={14} />
            <span>High Performance License &amp; HWID Anti-Tamper Security</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.2rem)', lineHeight: 1.15, marginBottom: 22, fontWeight: 800, letterSpacing: '-0.03em' }}>
            Sistem Autentikasi <span className="gradient-text">License &amp; HWID</span> Modern
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.65, marginBottom: 36, maxWidth: 720, margin: '0 auto 36px' }}>
            Solusi keamanan software &amp; game panel terpadu. Dilengkapi proteksi HWID lock anti-sharing,
            generator lisensi instan, sistem manajemen multi-aplikasi, dan integritas anti-tamper berkecepatan tinggi.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '1rem', fontWeight: 700 }}>
              Masuk ke Control Panel <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '12px 28px', fontSize: '1rem' }}>
              Login Akun Admin
            </Link>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 64
        }}>
          <div className="glass-card stat-card">
            <div className="stat-header">
              <span className="stat-title">Total Lisensi</span>
              <div className="stat-icon"><KeyRound size={20} /></div>
            </div>
            <div className="stat-value">{stats?.licenses ?? '...'}</div>
            <div className="stat-subtitle">Kunci terdaftar dalam sistem</div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-header">
              <span className="stat-title">User Aktif</span>
              <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                <Activity size={20} />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#34d399' }}>{stats?.activeUsers ?? '...'}</div>
            <div className="stat-subtitle">Lisensi berstatus aktif</div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-header">
              <span className="stat-title">Aplikasi Terkelola</span>
              <div className="stat-icon" style={{ color: '#818cf8', background: 'rgba(129, 140, 248, 0.1)' }}>
                <Layers size={20} />
              </div>
            </div>
            <div className="stat-value">{stats?.applications ?? '...'}</div>
            <div className="stat-subtitle">Panel aplikasi terintegrasi</div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-header">
              <span className="stat-title">Latency Autentikasi</span>
              <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                <Zap size={20} />
              </div>
            </div>
            <div className="stat-value">&lt; 40ms</div>
            <div className="stat-subtitle">Global High-Speed Gateway</div>
          </div>
        </div>

        {/* Features Highlights */}
        <div>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: '2rem', marginBottom: 10, fontWeight: 700 }}>Fitur Utama Keamanan</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Dirancang khusus untuk mencegah cracking, sharing ilegal, dan bypass autentikasi.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24
          }}>
            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(56, 189, 248, 0.12)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Cpu size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 10, fontWeight: 700 }}>HWID Lock Anti-Sharing</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Setiap lisensi otomatis mengikat Machine GUID perangkat pengguna pada aktivasi pertama. Mencegah pembagian akun ke pengguna lain dengan fitur 1-klik Reset HWID langsung dari panel.
              </p>
            </div>

            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Lock size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 10, fontWeight: 700 }}>Cloud Security &amp; Anti-Tamper</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Validasi sesi real-time dan enkripsi handshake terenkripsi memastikan proteksi maksimal terhadap memory patching, MITM injection, maupun reverse engineering loader.
              </p>
            </div>

            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(192, 132, 252, 0.12)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <KeyRound size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 10, fontWeight: 700 }}>Bulk Generator &amp; Key Masking</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Buat lisensi satuan atau massal (hingga 100 kunci) dengan format key masking dinamis (seperti <code>caxs-******</code>), penyesuaian huruf besar/kecil, serta pilihan durasi atau Lifetime.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.85rem'
      }}>
        AUTH-X-BOY Security Systems &copy; 2026. All rights reserved.
      </footer>
    </div>
  );
}
