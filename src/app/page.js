'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  KeyRound, 
  Cpu, 
  Zap, 
  ArrowRight, 
  Terminal, 
  CheckCircle2, 
  Layers, 
  Copy, 
  Check, 
  Server,
  Activity
} from 'lucide-react';

export default function HomePage() {
  const [stats, setStats] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeCodeTab, setActiveCodeTab] = useState('cpp');

  useEffect(() => {
    fetch('/api/stats')
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {});
  }, []);

  const copyCode = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sampleCppCode = `// Autentikasi License Key via AUTH-X-BOY di C++
#include <windows.h>
#include <winhttp.h>
#include "json.hpp" // nlohmann/json

bool ActivateLicense(const std::string& key, const std::string& hwid) {
    std::string endpoint = "https://your-domain.vercel.app/api/license/activate";
    nlohmann::json payload = {
        {"license_key", key},
        {"hwid", hwid}
    };
    // Kirim HTTP POST ke endpoint...
    // Server akan mengembalikan { "success": true, "status": "active" }
    return true;
}`;

  const sampleCurlCode = `curl -X POST "https://your-domain.vercel.app/api/license/activate" \\
  -H "Content-Type: application/json" \\
  -d '{
    "license_key": "CAXS-CQXM-VBQ4-2WV3",
    "hwid": "HWID-USER-MACHINE-ID-1234"
  }'`;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <header style={{
        borderBottom: '1px solid var(--border-subtle)',
        background: 'rgba(7, 9, 14, 0.8)',
        backdropFilter: 'blur(12px)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        padding: '16px 24px'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36,
              height: 36,
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
              <span style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em' }}>AUTH-X-BOY</span>
              <span style={{ 
                marginLeft: 8, 
                fontSize: '0.7rem', 
                padding: '2px 6px', 
                borderRadius: 4, 
                background: 'rgba(56, 189, 248, 0.15)', 
                color: 'var(--accent-blue)', 
                border: '1px solid rgba(56, 189, 248, 0.3)',
                fontWeight: 700
              }}>NEXT.JS + SUPABASE</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <span className="pulse-dot"></span>
              <span>Supabase Cloud Online</span>
            </div>
            <Link href="/login" className="btn btn-primary btn-sm">
              Dashboard Admin <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ flex: 1, maxWidth: 1200, margin: '0 auto', padding: '60px 24px', width: '100%' }}>
        <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 60px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 'var(--radius-full)',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.2)',
            fontSize: '0.85rem',
            color: 'var(--accent-blue)',
            marginBottom: 20
          }}>
            <Zap size={14} />
            <span>High Performance Serverless License Authentication</span>
          </div>

          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', lineHeight: 1.1, marginBottom: 20, fontWeight: 800 }}>
            Sistem Autentikasi <span className="gradient-text">License & HWID</span> Modern
          </h1>

          <p style={{ fontSize: '1.15rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
            Solusi keamanan software & game panel berbasis <strong>Next.js 16</strong> dan <strong>Supabase PostgreSQL</strong>.
            Mendukung proteksi HWID lock anti-sharing, bulk generator lisensi, dan integrasi instan untuk C++, C#, serta Python Loader.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              Masuk ke Control Panel <ArrowRight size={16} />
            </Link>
            <Link href="/login" className="btn btn-secondary" style={{ padding: '12px 24px', fontSize: '1rem' }}>
              Login Akun Admin
            </Link>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 20,
          marginBottom: 60
        }}>
          <div className="glass-card stat-card">
            <div className="stat-header">
              <span className="stat-title">Total Lisensi</span>
              <div className="stat-icon"><KeyRound size={20} /></div>
            </div>
            <div className="stat-value">{stats?.licenses ?? '...'}</div>
            <div className="stat-subtitle">Kunci terdaftar di Supabase</div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-header">
              <span className="stat-title">User Aktif</span>
              <div className="stat-icon" style={{ color: '#10b981', background: 'rgba(16, 185, 129, 0.1)' }}>
                <Activity size={20} />
              </div>
            </div>
            <div className="stat-value" style={{ color: '#34d399' }}>{stats?.activeUsers ?? '...'}</div>
            <div className="stat-subtitle">Lisensi status aktif</div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-header">
              <span className="stat-title">Produk & Aplikasi</span>
              <div className="stat-icon" style={{ color: '#818cf8', background: 'rgba(129, 140, 248, 0.1)' }}>
                <Layers size={20} />
              </div>
            </div>
            <div className="stat-value">{stats?.applications ?? '...'}</div>
            <div className="stat-subtitle">Software panel terintegrasi</div>
          </div>

          <div className="glass-card stat-card">
            <div className="stat-header">
              <span className="stat-title">Kecepatan Respon</span>
              <div className="stat-icon" style={{ color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)' }}>
                <Zap size={20} />
              </div>
            </div>
            <div className="stat-value">&lt; 45ms</div>
            <div className="stat-subtitle">Global Serverless Edge</div>
          </div>
        </div>

        {/* Features Highlights */}
        <div style={{ marginBottom: 60 }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <h2 style={{ fontSize: '2rem', marginBottom: 10 }}>Fitur Utama Keamanan</h2>
            <p style={{ color: 'var(--text-muted)' }}>Dirancang untuk mencegah bypass, crack, dan penyalahgunaan kunci lisensi.</p>
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
              <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>HWID Lock Anti-Sharing</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Setiap lisensi otomatis mengikat Machine GUID pengguna pada aktivasi pertama. Membatasi login dari PC lain dengan opsi 1-klik Reset HWID dari dashboard.
              </p>
            </div>

            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(16, 185, 129, 0.12)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <Server size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>Supabase Cloud Database</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Didukung database PostgreSQL berkelas enterprise dengan Row Level Security (RLS) dan backup otomatis gratis tanpa perlu me-maintain server VPS lokal.
              </p>
            </div>

            <div className="glass-card" style={{ padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(192, 132, 252, 0.12)', color: '#c084fc', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                <KeyRound size={24} />
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: 10 }}>Bulk Generator Instan</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                Buat hingga 100 lisensi sekaligus dalam 1 klik dengan prefix kustom (contoh: <code>XBOY-XXXX-XXXX-XXXX</code>), durasi hari fleksibel, atau lisensi Lifetime.
              </p>
            </div>
          </div>
        </div>

        {/* Integration Preview */}
        <div className="glass-card-glow" style={{ padding: 32, marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: 10 }}>
                <Terminal size={20} color="var(--accent-blue)" />
                Contoh Integrasi C++ & API Client
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Kompatibel langsung dengan Loader C++ dan skrip Anda.</p>
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button 
                onClick={() => setActiveCodeTab('cpp')} 
                className={`btn btn-sm ${activeCodeTab === 'cpp' ? 'btn-primary' : 'btn-outline'}`}
              >
                C++ (Loader Auth)
              </button>
              <button 
                onClick={() => setActiveCodeTab('curl')} 
                className={`btn btn-sm ${activeCodeTab === 'curl' ? 'btn-primary' : 'btn-outline'}`}
              >
                cURL HTTP API
              </button>
              <button 
                onClick={() => copyCode(activeCodeTab === 'cpp' ? sampleCppCode : sampleCurlCode)} 
                className="btn btn-secondary btn-sm"
              >
                {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                {copied ? 'Tersalin' : 'Salin Kode'}
              </button>
            </div>
          </div>

          <pre className="code-box" style={{ maxHeight: 260 }}>
            <code>{activeCodeTab === 'cpp' ? sampleCppCode : sampleCurlCode}</code>
          </pre>
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
        AUTH-X-BOY Authentication Platform &copy; 2026. Built with Next.js 16 & Supabase PostgreSQL.
      </footer>
    </div>
  );
}
