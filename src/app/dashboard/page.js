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
  Users,
  Crown,
  Shield,
  Lock,
  UserPlus,
  Monitor,
  Laptop,
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

  // Operation Loading States for responsive animations
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCreatingApp, setIsCreatingApp] = useState(false);
  const [isRenamingApp, setIsRenamingApp] = useState(false);
  const [isPausingApp, setIsPausingApp] = useState(false);
  const [isRefreshingSecret, setIsRefreshingSecret] = useState(false);
  const [isRefreshingSellerKey, setIsRefreshingSellerKey] = useState(false);
  const [isDeletingApp, setIsDeletingApp] = useState(false);
  const [selectingAppId, setSelectingAppId] = useState(null);
  const [loadingHwidId, setLoadingHwidId] = useState(null);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const [deletingLicenseId, setDeletingLicenseId] = useState(null);
  const [isExtending, setIsExtending] = useState(false);
  const [isClearingLogs, setIsClearingLogs] = useState(false);

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

  // Users & Monitoring State
  const [systemUsers, setSystemUsers] = useState([]);
  const [monitoredDevices, setMonitoredDevices] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingUser, setIsUpdatingUser] = useState(false);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [resettingDeviceId, setResettingDeviceId] = useState(null);

  // User Modals & Forms
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUserToEdit, setSelectedUserToEdit] = useState(null);
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('admin');
  const [editUserRole, setEditUserRole] = useState('admin');
  const [editUserPassword, setEditUserPassword] = useState('');

  // Device Monitoring Filters
  const [deviceSearch, setDeviceSearch] = useState('');
  const [deviceProductFilter, setDeviceProductFilter] = useState('');

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

  // Generator Form state (KeyAuth Photo 2 format)
  const [genAmount, setGenAmount] = useState(1);
  const [genMask, setGenMask] = useState('caxs-******');
  const [genLowercase, setGenLowercase] = useState(true);
  const [genCapital, setGenCapital] = useState(true);
  const [genLevel, setGenLevel] = useState('1 (default)');
  const [genNote, setGenNote] = useState('');
  const [genExpiryUnit, setGenExpiryUnit] = useState('Days');
  const [genDuration, setGenDuration] = useState(1);
  const [genProduct, setGenProduct] = useState('');

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
      let activePid = '';
      try {
        const prodRes = await fetch('/api/admin/products');
        const prodData = await prodRes.json();
        if (prodData.success && prodData.products?.length > 0) {
          setProducts(prodData.products);
          const savedAppId = typeof window !== 'undefined' ? localStorage.getItem('authcaxs_selected_app') : null;
          const targetApp = prodData.products.find((p) => p.id === savedAppId) || prodData.products[0];
          activePid = targetApp.id;
          setSelectedAppId(targetApp.id);
          setGenProduct(targetApp.id);
          setProductFilter(targetApp.id);
        }
      } catch (e) {}

      await Promise.all([loadStats(), loadLicenses(activePid), loadLogs(), loadUsersData()]);
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

  const loadLicenses = async (overrideProductId, overrideSearch, overrideStatus) => {
    setLoadingLicenses(true);
    try {
      const pid = overrideProductId !== undefined ? overrideProductId : productFilter;
      const srch = overrideSearch !== undefined ? overrideSearch : searchKey;
      const st = overrideStatus !== undefined ? overrideStatus : statusFilter;

      let url = '/api/admin/licenses?limit=100';
      if (srch) url += `&search=${encodeURIComponent(srch)}`;
      if (st) url += `&status=${encodeURIComponent(st)}`;
      if (pid) url += `&product_id=${encodeURIComponent(pid)}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) setLicenses(data.licenses || []);
    } catch (e) {
    } finally {
      setLoadingLicenses(false);
    }
  };

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/admin/products');
      const data = await res.json();
      if (data.success && data.products) {
        setProducts(data.products);
        if (data.products.length > 0) {
          const savedAppId = typeof window !== 'undefined' ? localStorage.getItem('authcaxs_selected_app') : null;
          setSelectedAppId((prev) => {
            const exists = data.products.some((p) => p.id === prev);
            if (exists) return prev;
            const savedExists = data.products.some((p) => p.id === savedAppId);
            return savedExists ? savedAppId : data.products[0].id;
          });
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

  const loadUsersData = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      if (data.success) {
        setSystemUsers(data.users || []);
        setMonitoredDevices(data.devices || []);
      }
    } catch (e) {
    } finally {
      setLoadingUsers(false);
    }
  };

  // Header refresh with spin animation
  const handleHeaderRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([loadStats(), loadProducts(), loadLicenses(), loadLogs(), loadUsersData()]);
      showToast('Data berhasil diperbarui!');
    } catch {
      showToast('Gagal memuat ulang data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Select App: Scope licenses and switch tab to licenses!
  const handleSelectApp = async (product) => {
    setSelectingAppId(product.id);
    setSelectedAppId(product.id);
    setProductFilter(product.id);
    setGenProduct(product.id);
    if (typeof window !== 'undefined') {
      localStorage.setItem('authcaxs_selected_app', product.id);
    }
    await loadLicenses(product.id);
    setActiveTab('licenses');
    setSelectingAppId(null);
    showToast(`Beralih ke aplikasi: ${product.name}`);
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
  const currentApp = products.find((p) => p.id === selectedAppId) || (products.length > 0 ? products[0] : null);
  const activeApp = currentApp || {
    id: '',
    name: 'Belum Ada Aplikasi',
    secret: '',
    seller_key: '',
    paused: false,
    version: '1.0'
  };

  const serverUrl = typeof window !== 'undefined' ? window.location.origin : 'https://authcaxs.vercel.app';

  // 12 Languages Code Snippets
  const languageSnippets = {
    csharp: {
      name: 'C#',
      code: `public static api LicenseAuthApp = new api(
    name: "${activeApp.name}",
    ownerid: "${activeApp.id}",
    secret: "${activeApp.secret}",
    version: "${activeApp.version || '1.0'}",
    url: "${serverUrl}"
    //path: "Your Path Here" // (OPTIONAL) if you use token validation, example: Token.txt
);`,
      github: 'https://github.com/KeyAuth/KeyAuth-CSHARP-Example'
    },
    cpp: {
      name: 'C++',
      code: `std::string name = "${activeApp.name}";
std::string ownerid = "${activeApp.id}";
std::string secret = "${activeApp.secret}";
std::string version = "${activeApp.version || '1.0'}";
std::string url = "${serverUrl}"; // Server URL

KeyAuth::api LicenseAuthApp(name, ownerid, secret, version, url);`,
      github: 'https://github.com/KeyAuth/KeyAuth-CPP-Example'
    },
    python: {
      name: 'Python',
      code: `keyauthapp = api(
    name = "${activeApp.name}",
    ownerid = "${activeApp.id}",
    secret = "${activeApp.secret}",
    version = "${activeApp.version || '1.0'}",
    url = "${serverUrl}"
)`,
      github: 'https://github.com/KeyAuth/KeyAuth-Python-Example'
    },
    php: {
      name: 'PHP',
      code: `$name = "${activeApp.name}";
$ownerid = "${activeApp.id}";
$secret = "${activeApp.secret}";
$version = "${activeApp.version || '1.0'}";
$url = "${serverUrl}";`,
      github: 'https://github.com/KeyAuth/KeyAuth-PHP-Example'
    },
    javascript: {
      name: 'JavaScript',
      code: `const LicenseAuthApp = new KeyAuth(
    "${activeApp.name}",
    "${activeApp.id}",
    "${activeApp.secret}",
    "${activeApp.version || '1.0'}",
    "${serverUrl}"
);`,
      github: 'https://github.com/mazkdevf/KeyAuth-JS-Example'
    },
    java: {
      name: 'Java',
      code: `private static String appname = "${activeApp.name}";
private static String ownerid = "${activeApp.id}";
private static String secret = "${activeApp.secret}";
private static String version = "${activeApp.version || '1.0'}";
private static String url = "${serverUrl}";`,
      github: 'https://github.com/KeyAuth-Archive/KeyAuth-JAVA-api'
    },
    vb: {
      name: 'VB.Net',
      code: `Private Shared name As String = "${activeApp.name}"
Private Shared ownerid As String = "${activeApp.id}"
Private Shared secret As String = "${activeApp.secret}"
Private Shared version As String = "${activeApp.version || '1.0'}"
Private Shared url As String = "${serverUrl}"`,
      github: 'https://github.com/KeyAuth/KeyAuth-VB-Example'
    },
    rust: {
      name: 'Rust',
      code: `let mut keyauthapp = keyauth::KeyauthApi::new(
    "${activeApp.name}",
    "${activeApp.id}",
    "${activeApp.secret}",
    "${activeApp.version || '1.0'}",
    "${serverUrl}",
);`,
      github: 'https://github.com/mazkdevf/KeyAuth-Rust-Example'
    },
    go: {
      name: 'Go',
      code: `app := keyauth.New(
    "${activeApp.name}",
    "${activeApp.id}",
    "${activeApp.secret}",
    "${activeApp.version || '1.0'}",
    "${serverUrl}",
)`,
      github: 'https://github.com/mazkdevf/KeyAuth-Go-Example'
    },
    lua: {
      name: 'Lua',
      code: `local KeyAuthApp = KeyAuth:new(
    "${activeApp.name}",
    "${activeApp.id}",
    "${activeApp.secret}",
    "${activeApp.version || '1.0'}",
    "${serverUrl}"
)`,
      github: 'https://github.com/mazkdevf/KeyAuth-Lua-Example'
    },
    ruby: {
      name: 'Ruby',
      code: `keyauthapp = KeyAuth::Api.new(
    "${activeApp.name}",
    "${activeApp.id}",
    "${activeApp.secret}",
    "${activeApp.version || '1.0'}",
    "${serverUrl}"
)`,
      github: 'https://github.com/mazkdevf/KeyAuth-Ruby-Example'
    },
    perl: {
      name: 'Perl',
      code: `my $keyauth = KeyAuth->new(
    "${activeApp.name}",
    "${activeApp.id}",
    "${activeApp.secret}",
    "${activeApp.version || '1.0'}",
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
    setIsCreatingApp(true);
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
        setProductFilter(id);
        setGenProduct(id);
        if (typeof window !== 'undefined') {
          localStorage.setItem('authcaxs_selected_app', id);
        }
        await loadLicenses(id);
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal membuat aplikasi', 'error');
    } finally {
      setIsCreatingApp(false);
    }
  };

  // 2. Rename App
  const handleRenameApp = async (e) => {
    e.preventDefault();
    if (!renameAppName.trim()) {
      showToast('Masukkan nama baru!', 'error');
      return;
    }
    setIsRenamingApp(true);
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
    } finally {
      setIsRenamingApp(false);
    }
  };

  // 3. Pause / Unpause App
  const handleTogglePauseApp = async () => {
    setIsPausingApp(true);
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
    } finally {
      setIsPausingApp(false);
    }
  };

  // 4. Refresh App Secret
  const handleRefreshAppSecret = async () => {
    setIsRefreshingSecret(true);
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
    } finally {
      setIsRefreshingSecret(false);
    }
  };

  // 5. Delete App (Super Admin Only)
  const handleDeleteApp = async () => {
    if (adminUser?.role !== 'super_admin') {
      showToast('Akses Ditolak: Hanya Super Admin yang berhak menghapus aplikasi!', 'error');
      setShowDeleteAppModal(false);
      return;
    }
    setIsDeletingApp(true);
    try {
      const res = await fetch(`/api/admin/products?id=${encodeURIComponent(currentApp.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast('Aplikasi berhasil dihapus!');
        setShowDeleteAppModal(false);
        await loadProducts();
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authcaxs_selected_app');
        }
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal menghapus aplikasi', 'error');
    } finally {
      setIsDeletingApp(false);
    }
  };

  // 6. Refresh Seller Key
  const handleRefreshSellerKey = async () => {
    setIsRefreshingSellerKey(true);
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
    } finally {
      setIsRefreshingSellerKey(false);
    }
  };

  // USER & DEVICE ACTIONS
  // 1. Create User (Super Admin Only)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUsername.trim() || !newUserPassword.trim()) {
      showToast('Username dan password wajib diisi!', 'error');
      return;
    }
    setIsCreatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newUsername.trim(),
          password: newUserPassword,
          role: newUserRole,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowAddUserModal(false);
        setNewUsername('');
        setNewUserPassword('');
        setNewUserRole('admin');
        await loadUsersData();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal membuat user baru', 'error');
    } finally {
      setIsCreatingUser(false);
    }
  };

  // 2. Edit User (Super Admin Only)
  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUserToEdit) return;
    setIsUpdatingUser(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedUserToEdit.id,
          role: editUserRole,
          new_password: editUserPassword || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        setShowEditUserModal(false);
        setSelectedUserToEdit(null);
        setEditUserPassword('');
        await loadUsersData();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal memperbarui user', 'error');
    } finally {
      setIsUpdatingUser(false);
    }
  };

  // 3. Delete User (Super Admin Only)
  const handleDeleteUser = async (user) => {
    if (adminUser?.role !== 'super_admin') {
      showToast('Akses Ditolak: Hanya Super Admin yang berhak menghapus user!', 'error');
      return;
    }
    if (user.username.toLowerCase() === 'admin') {
      showToast('Akun root "admin" dilindungi dan tidak boleh dihapus!', 'error');
      return;
    }
    if (user.id === adminUser.id || user.username.toLowerCase() === adminUser.username.toLowerCase()) {
      showToast('Anda tidak dapat menghapus akun Anda sendiri!', 'error');
      return;
    }
    if (!confirm(`Yakin ingin menghapus user "${user.username}" (${user.role}) secara permanen?`)) return;

    setDeletingUserId(user.id);
    try {
      const res = await fetch(`/api/admin/users?id=${encodeURIComponent(user.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await loadUsersData();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal menghapus user', 'error');
    } finally {
      setDeletingUserId(null);
    }
  };

  // 4. Reset Device HWID
  const handleResetDevice = async (device) => {
    if (!confirm(`Reset HWID perangkat (${device.hwid.slice(0, 16)}...)? Perangkat ini akan dilepaskan dari lisensi.`)) return;
    setResettingDeviceId(device.id);
    try {
      const res = await fetch('/api/license/reset-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: device.id, hwid: device.hwid }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message);
        await loadUsersData();
        await loadLicenses();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal me-reset perangkat', 'error');
    } finally {
      setResettingDeviceId(null);
    }
  };

  // LICENSE ACTIONS
  const handleGenerateLicenses = async (e) => {
    e.preventDefault();
    setIsGenerating(true);
    const targetProductId = genProduct || currentApp.id;
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: genAmount,
          mask: genMask || 'caxs-******',
          lowercase: genLowercase,
          capital: genCapital,
          level: genLevel,
          note: genNote,
          expiry_unit: genExpiryUnit,
          duration: genDuration,
          product_id: targetProductId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setGeneratedResult(data.licenses);
        showToast(data.message);
        await loadLicenses(targetProductId);
        loadStats();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal generate lisensi', 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpdateLicenseStatus = async (id, newStatus) => {
    setUpdatingStatusId(id);
    try {
      const res = await fetch('/api/admin/licenses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Status lisensi diubah ke ${newStatus.toUpperCase()}`);
        await loadLicenses();
        loadStats();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal update status', 'error');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleResetHWID = async (licenseKey, licId) => {
    setLoadingHwidId(licId);
    try {
      const res = await fetch('/api/license/reset-hwid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ license_key: licenseKey }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('HWID berhasil direset!');
        await loadLicenses();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal reset HWID', 'error');
    } finally {
      setLoadingHwidId(null);
    }
  };

  const handleDeleteLicense = async (id) => {
    if (!confirm('Yakin ingin menghapus lisensi ini secara permanen?')) return;
    setDeletingLicenseId(id);
    try {
      const res = await fetch(`/api/admin/licenses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showToast('Lisensi berhasil dihapus!');
        await loadLicenses();
        loadStats();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal menghapus lisensi', 'error');
    } finally {
      setDeletingLicenseId(null);
    }
  };

  const handleExtendSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLicense) return;
    setIsExtending(true);
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
        await loadLicenses();
      } else {
        showToast(data.message, 'error');
      }
    } catch {
      showToast('Gagal memperpanjang lisensi', 'error');
    } finally {
      setIsExtending(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Apakah Anda yakin ingin mengosongkan riwayat log?')) return;
    setIsClearingLogs(true);
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
    } finally {
      setIsClearingLogs(false);
    }
  };


  // Seller link formatted
  const sellerApiUrl = currentApp
    ? `${serverUrl}/api/seller?sellerkey=${currentApp.seller_key}&type=add&expiry=1&mask=******-******-******-******-******-******&level=1&amount=1&character=1&format=json`
    : '';

  const isSuperAdmin = adminUser?.role === 'super_admin';

  // Filtered devices for monitoring search & product filter
  const filteredDevices = monitoredDevices.filter((dev) => {
    const q = deviceSearch.trim().toLowerCase();
    const matchesSearch = !q ||
      (dev.hwid && dev.hwid.toLowerCase().includes(q)) ||
      (dev.ip_address && dev.ip_address.toLowerCase().includes(q)) ||
      (dev.license_key && dev.license_key.toLowerCase().includes(q)) ||
      (dev.product_name && dev.product_name.toLowerCase().includes(q));
    const matchesProduct = !deviceProductFilter || dev.product_id === deviceProductFilter;
    return matchesSearch && matchesProduct;
  });

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
              background: isSuperAdmin ? 'rgba(234, 179, 8, 0.12)' : 'rgba(59, 130, 246, 0.12)',
              border: isSuperAdmin ? '1px solid rgba(234, 179, 8, 0.35)' : '1px solid rgba(59, 130, 246, 0.3)',
              fontSize: '0.85rem'
            }}>
              {isSuperAdmin ? (
                <Crown size={15} style={{ color: '#facc15' }} />
              ) : (
                <Shield size={15} style={{ color: '#60a5fa' }} />
              )}
              <span style={{ color: isSuperAdmin ? '#facc15' : 'var(--text-muted)', fontWeight: 600 }}>
                {isSuperAdmin ? 'Super Admin:' : 'Admin:'}
              </span>
              <strong style={{ color: '#fff' }}>{adminUser.username}</strong>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 'var(--radius-full)',
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              fontSize: '0.85rem'
            }}>
              <Layers size={14} style={{ color: '#38bdf8' }} />
              <span style={{ color: 'var(--text-muted)' }}>App:</span>
              <strong style={{ color: '#38bdf8' }}>{currentApp ? currentApp.name : '0 Aplikasi'}</strong>
            </div>

            <button
              onClick={handleHeaderRefresh}
              disabled={isRefreshing}
              className="btn btn-secondary btn-sm"
              title="Refresh Data"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
              <span>{isRefreshing ? 'Memuat...' : 'Refresh'}</span>
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
            { id: 'users', label: `Kelola User & Monitor (${systemUsers.length})`, icon: Users },
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
            {products.length === 0 ? (
              <div style={{
                background: '#09090d',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '44px 24px',
                textAlign: 'center',
                marginBottom: 24
              }}>
                <div style={{
                  width: 54,
                  height: 54,
                  borderRadius: 12,
                  background: 'rgba(56, 189, 248, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px auto',
                  border: '1px solid rgba(56, 189, 248, 0.2)'
                }}>
                  <Layers size={26} style={{ color: '#38bdf8' }} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  Belum Ada Aplikasi Terdaftar
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 480, margin: '0 auto 20px auto', lineHeight: 1.5 }}>
                  Akun Anda belum memiliki aplikasi. Klik tombol di bawah untuk membuat aplikasi pertama Anda.
                </p>
                <button
                  onClick={() => setShowCreateAppModal(true)}
                  className="btn btn-blue"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, margin: '0 auto' }}
                >
                  <Plus size={16} /> Create New App
                </button>
              </div>
            ) : (
              <>
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
                      if (!currentApp) return;
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
                    {currentApp?.paused ? <Play size={15} /> : <Pause size={15} />}
                    {currentApp?.paused ? 'Unpause App & Users' : 'Pause App & Users'}
                  </button>

                  <button
                    onClick={handleRefreshAppSecret}
                    disabled={isRefreshingSecret}
                    className="btn btn-green btn-sm"
                  >
                    <RefreshCw size={15} className={isRefreshingSecret ? "animate-spin" : ""} />
                    <span>{isRefreshingSecret ? 'Merefresh Secret...' : 'Refresh App Secret'}</span>
                  </button>

                  {isSuperAdmin ? (
                    <button
                      onClick={() => setShowDeleteAppModal(true)}
                      className="btn btn-red btn-sm"
                    >
                      <Trash2 size={15} /> Delete App
                    </button>
                  ) : (
                    <button
                      disabled
                      className="btn btn-secondary btn-sm"
                      style={{ opacity: 0.5, cursor: 'not-allowed', color: '#f87171' }}
                      title="Hanya Super Admin yang berhak menghapus aplikasi"
                    >
                      <Lock size={14} /> Delete App (Super Admin Only)
                    </button>
                  )}
                </div>
              </>
            )}

            {/* Table "All Application" */}
            <div style={{
              background: '#09090d',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: 20
            }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', marginBottom: 16 }}>
                All Application ({products.length})
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
                    {products.length === 0 ? (
                      <tr>
                        <td colSpan={3} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748b' }}>
                          Belum ada aplikasi yang terdaftar untuk akun Anda. Klik tombol "Create New App" di atas.
                        </td>
                      </tr>
                    ) : (
                      products.map((p) => {
                        const isSelected = currentApp && p.id === currentApp.id;
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
                                onClick={() => handleSelectApp(p)}
                                disabled={selectingAppId === p.id}
                                className="btn-select"
                              >
                                {selectingAppId === p.id ? (
                                  <>
                                    <RefreshCw size={12} className="animate-spin" />
                                    <span>Membuka...</span>
                                  </>
                                ) : (
                                  <>
                                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }}></span>
                                    <span>Select</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
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
            {products.length === 0 ? (
              <div style={{
                background: '#09090d',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '44px 24px',
                textAlign: 'center',
                marginBottom: 24
              }}>
                <Bot size={40} style={{ color: '#64748b', margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  Belum Ada Aplikasi Terdaftar
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 20px auto' }}>
                  Seller Key terhubung ke aplikasi spesifik. Buat aplikasi terlebih dahulu untuk mendapatkan Seller Key dan API seller.
                </p>
                <button
                  onClick={() => setShowCreateAppModal(true)}
                  className="btn btn-blue"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
                >
                  <Plus size={16} /> Buat Aplikasi Baru
                </button>
              </div>
            ) : (
              <>
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
                      <h4 style={{ fontSize: '1rem', color: '#fff' }}>Aplikasi: <span style={{ color: '#38bdf8' }}>{activeApp.name}</span></h4>
                      <p style={{ fontSize: '0.8rem', color: '#64748b' }}>Kunci dan tautan di bawah ini terhubung ke aplikasi yang sedang dipilih.</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Ganti Aplikasi:</span>
                      <select
                        className="select"
                        style={{ width: 'auto', minWidth: 180, height: 38 }}
                        value={activeApp.id}
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
                        value={activeApp.seller_key}
                        style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', letterSpacing: '0.05em' }}
                      />
                      <button
                        onClick={() => copyText(activeApp.seller_key, 'Seller Key')}
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
              </>
            )}
          </div>
        )}

        {/* ===================== TAB: LICENSES ===================== */}
        {activeTab === 'licenses' && (
          <div>
            {products.length === 0 ? (
              <div style={{
                background: '#09090d',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 12,
                padding: '44px 24px',
                textAlign: 'center',
                marginBottom: 24
              }}>
                <KeyRound size={40} style={{ color: '#64748b', margin: '0 auto 12px auto' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', marginBottom: 8 }}>
                  Belum Ada Aplikasi Terdaftar
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: 460, margin: '0 auto 20px auto' }}>
                  Lisensi harus terikat pada suatu aplikasi. Silakan buat aplikasi terlebih dahulu untuk mulai membuat dan mengelola lisensi.
                </p>
                <button
                  onClick={() => setShowCreateAppModal(true)}
                  className="btn btn-blue"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, margin: '0 auto' }}
                >
                  <Plus size={16} /> Buat Aplikasi Baru
                </button>
              </div>
            ) : (
              <>
                {/* Application Scope Header Card */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 14,
                  padding: '14px 20px',
                  background: '#090d16',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 12,
                  marginBottom: 20
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 42,
                      height: 42,
                      borderRadius: 10,
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Layers size={22} style={{ color: '#38bdf8' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                        Aplikasi Aktif (Terpilih)
                      </div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span>{activeApp.name}</span>
                        <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: 9999, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontWeight: 600 }}>
                          {licenses.length} Lisensi
                        </span>
                      </div>
                    </div>
                  </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Ganti Scope Aplikasi:</span>
                <select
                  className="select"
                  style={{ height: 38, width: 'auto', minWidth: 200 }}
                  value={productFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProductFilter(val);
                    if (val) {
                      setSelectedAppId(val);
                      setGenProduct(val);
                      if (typeof window !== 'undefined') localStorage.setItem('authcaxs_selected_app', val);
                    }
                    loadLicenses(val);
                  }}
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.id === selectedAppId ? '★ (Aktif)' : ''}
                    </option>
                  ))}
                  <option value="">Semua Aplikasi (Tampilkan Semua)</option>
                </select>
              </div>
            </div>

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

                <button
                  onClick={() => loadLicenses()}
                  disabled={loadingLicenses}
                  className="btn btn-secondary"
                  style={{ height: 40, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Filter size={15} className={loadingLicenses ? "animate-spin" : ""} />
                  <span>{loadingLicenses ? 'Memuat...' : 'Terapkan Filter'}</span>
                </button>
              </div>

              {/* Generate Key Button */}
              <button
                onClick={() => {
                  if (!currentApp) {
                    showToast('Harap buat aplikasi terlebih dahulu!', 'error');
                    return;
                  }
                  setGenProduct(currentApp.id);
                  setShowGenerateModal(true);
                }}
                disabled={!currentApp}
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
                  {loadingLicenses ? (
                    <tr>
                      <td colSpan={7}>
                        <div className="table-loading-container">
                          <div className="table-loading-spinner"></div>
                          <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Memuat lisensi aplikasi...</span>
                        </div>
                      </td>
                    </tr>
                  ) : licenses.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: 48, color: '#64748b' }}>
                        Belum ada lisensi untuk aplikasi ini. Silakan klik tombol <strong>"Generate Lisensi Baru"</strong> di atas.
                      </td>
                    </tr>
                  ) : (
                    licenses.map((lic) => {
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
                            {lic.duration_display || (lic.duration_days > 0 ? `${lic.duration_days} Hari` : 'Lifetime')}
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: lic.devicesCount > 0 ? '#10b981' : 'var(--text-dim)' }}>
                              {lic.devicesCount} Perangkat
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            {lic.expires_at ? new Date(lic.expires_at).toLocaleString('id-ID') : '-'}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              {/* Ban / Unban Toggle */}
                              {lic.status === 'banned' ? (
                                <button
                                  onClick={() => handleUpdateLicenseStatus(lic.id, 'active')}
                                  disabled={updatingStatusId === lic.id}
                                  className="btn btn-secondary btn-sm"
                                  title="Unban Lisensi"
                                  style={{ color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <Play size={13} className={updatingStatusId === lic.id ? "animate-spin" : ""} />
                                  <span>{updatingStatusId === lic.id ? 'Memproses...' : 'Unban'}</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateLicenseStatus(lic.id, 'banned')}
                                  disabled={updatingStatusId === lic.id}
                                  className="btn btn-danger btn-sm"
                                  title="Stop / Ban Lisensi"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <Ban size={13} className={updatingStatusId === lic.id ? "animate-spin" : ""} />
                                  <span>{updatingStatusId === lic.id ? 'Memproses...' : 'Stop'}</span>
                                </button>
                              )}

                              {/* Reset HWID */}
                              {lic.status === 'expired' || (lic.expires_at && new Date(lic.expires_at) < new Date()) ? (
                                <button
                                  disabled
                                  className="btn btn-secondary btn-sm"
                                  title="Lisensi sudah kedaluwarsa (Expired)! Tambah hari untuk mengaktifkan kembali."
                                  style={{ opacity: 0.45, cursor: 'not-allowed' }}
                                >
                                  <RotateCcw size={13} />
                                  <span>Expired</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleResetHWID(lic.license_key, lic.id)}
                                  disabled={loadingHwidId === lic.id}
                                  className="btn btn-secondary btn-sm"
                                  title="Reset HWID Perangkat"
                                  style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                >
                                  <RotateCcw size={13} className={loadingHwidId === lic.id ? "animate-spin" : ""} />
                                  <span>{loadingHwidId === lic.id ? 'Resetting...' : 'Reset HWID'}</span>
                                </button>
                              )}

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
                                disabled={deletingLicenseId === lic.id}
                                className="btn btn-secondary btn-sm"
                                style={{ color: '#ef4444' }}
                                title="Hapus Lisensi"
                              >
                                {deletingLicenseId === lic.id ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
              </>
            )}
          </div>
        )}

        {/* ===================== TAB: KELOLA USER & MONITORING ===================== */}
        {activeTab === 'users' && (
          <div>
            {/* Header Banner */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.6) 100%)',
              border: '1px solid rgba(59, 130, 246, 0.2)',
              borderRadius: 14,
              padding: '20px 24px',
              marginBottom: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <Users size={22} style={{ color: '#60a5fa' }} />
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                    Manajemen User & Monitoring Perangkat
                  </h2>
                  <span style={{
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: isSuperAdmin ? 'rgba(234, 179, 8, 0.2)' : 'rgba(59, 130, 246, 0.2)',
                    color: isSuperAdmin ? '#facc15' : '#93c5fd',
                    fontWeight: 700,
                    border: isSuperAdmin ? '1px solid rgba(234, 179, 8, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)'
                  }}>
                    {isSuperAdmin ? '👑 Role: Super Admin (Full Privilege)' : '🛡️ Role: Admin (Standard)'}
                  </span>
                </div>
                <p style={{ color: '#94a3b8', fontSize: '0.875rem', margin: 0 }}>
                  Kelola akun administrator, atur peran dan hak akses, serta pantau seluruh perangkat client & loader yang aktif secara real-time.
                </p>
              </div>

              {/* Action: Tambah User (Hanya Super Admin) */}
              {isSuperAdmin ? (
                <button
                  onClick={() => setShowAddUserModal(true)}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 8, height: 42, boxShadow: '0 0 15px rgba(37, 99, 235, 0.3)' }}
                >
                  <UserPlus size={16} />
                  <span>+ Tambah User Baru</span>
                </button>
              ) : (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 14px',
                  borderRadius: 8,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  fontSize: '0.8rem',
                  color: '#94a3b8'
                }}>
                  <Lock size={14} style={{ color: '#f59e0b' }} />
                  <span>Hanya Super Admin yang dapat menambah/menghapus user</span>
                </div>
              )}
            </div>

            {/* Quick Stat Cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 28
            }}>
              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Total User Admin</span>
                  <div className="stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                    <Users size={18} />
                  </div>
                </div>
                <div className="stat-value">{systemUsers.length}</div>
                <div className="stat-subtitle">Pengelola sistem terdaftar</div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Super Admin</span>
                  <div className="stat-icon" style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#facc15' }}>
                    <Crown size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: '#facc15' }}>
                  {systemUsers.filter(u => u.role === 'super_admin').length}
                </div>
                <div className="stat-subtitle">Akses hapus user & app</div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Admin Biasa</span>
                  <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                    <Shield size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: '#34d399' }}>
                  {systemUsers.filter(u => u.role === 'admin').length}
                </div>
                <div className="stat-subtitle">Akses operasional lisensi</div>
              </div>

              <div className="glass-card stat-card">
                <div className="stat-header">
                  <span className="stat-title">Client / Perangkat Aktif</span>
                  <div className="stat-icon" style={{ background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6' }}>
                    <Monitor size={18} />
                  </div>
                </div>
                <div className="stat-value" style={{ color: '#a78bfa' }}>{monitoredDevices.length}</div>
                <div className="stat-subtitle">HWID loader terpantau</div>
              </div>
            </div>

            {/* SECTION 1: DAFTAR USER & HAK AKSES */}
            <div style={{
              background: '#09090d',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: 20,
              marginBottom: 32
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 16
              }}>
                <div>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Daftar User Pengelola (Admin & Super Admin)
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
                    Daftar akun yang memiliki akses ke dashboard AUTH-X-BOY. Super admin memiliki hak istimewa menghapus user biasa dan menghapus aplikasi.
                  </p>
                </div>
                <button
                  onClick={loadUsersData}
                  disabled={loadingUsers}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <RefreshCw size={13} className={loadingUsers ? "animate-spin" : ""} />
                  <span>{loadingUsers ? 'Memuat...' : 'Refresh User'}</span>
                </button>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ color: '#3b82f6', fontWeight: 700 }}>Username & Akun</th>
                      <th style={{ color: '#3b82f6', fontWeight: 700 }}>Peran (Role)</th>
                      <th style={{ color: '#3b82f6', fontWeight: 700 }}>Hak Istimewa</th>
                      <th style={{ color: '#3b82f6', fontWeight: 700 }}>Dibuat Pada</th>
                      <th style={{ color: '#3b82f6', fontWeight: 700 }}>Login Terakhir</th>
                      <th style={{ color: '#3b82f6', fontWeight: 700, textAlign: 'right' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="table-loading-container">
                            <div className="table-loading-spinner"></div>
                            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Memuat daftar user pengelola...</span>
                          </div>
                        </td>
                      </tr>
                    ) : systemUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: 36, color: '#64748b' }}>
                          Tidak ada data user.
                        </td>
                      </tr>
                    ) : (
                      systemUsers.map((u) => {
                        const isThisUserSuper = u.role === 'super_admin';
                        const isSelf = u.id === adminUser.id || u.username.toLowerCase() === adminUser.username.toLowerCase();
                        return (
                          <tr key={u.id}>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: 8,
                                  background: isThisUserSuper ? 'rgba(234, 179, 8, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                                  border: isThisUserSuper ? '1px solid rgba(234, 179, 8, 0.3)' : '1px solid rgba(59, 130, 246, 0.3)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}>
                                  {isThisUserSuper ? <Crown size={16} color="#facc15" /> : <Shield size={16} color="#60a5fa" />}
                                </div>
                                <div>
                                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span>{u.username}</span>
                                    {isSelf && (
                                      <span style={{
                                        fontSize: '0.65rem',
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        background: 'rgba(16, 185, 129, 0.2)',
                                        color: '#34d399',
                                        fontWeight: 600
                                      }}>Anda</span>
                                    )}
                                    {u.isRoot && (
                                      <span style={{
                                        fontSize: '0.65rem',
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                        background: 'rgba(234, 179, 8, 0.2)',
                                        color: '#facc15',
                                        fontWeight: 600
                                      }}>Root</span>
                                    )}
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>
                                    ID: {u.id.slice(0, 8)}...
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>
                              {isThisUserSuper ? (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  fontSize: '0.75rem',
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  background: 'rgba(234, 179, 8, 0.15)',
                                  color: '#facc15',
                                  border: '1px solid rgba(234, 179, 8, 0.3)',
                                  fontWeight: 700
                                }}>
                                  <Crown size={12} /> SUPER ADMIN
                                </span>
                              ) : (
                                <span style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  fontSize: '0.75rem',
                                  padding: '4px 10px',
                                  borderRadius: 6,
                                  background: 'rgba(59, 130, 246, 0.15)',
                                  color: '#93c5fd',
                                  border: '1px solid rgba(59, 130, 246, 0.3)',
                                  fontWeight: 700
                                }}>
                                  <Shield size={12} /> ADMIN BIASA
                                </span>
                              )}
                            </td>
                            <td>
                              <div style={{ fontSize: '0.8rem', color: isThisUserSuper ? '#fef08a' : '#cbd5e1' }}>
                                {isThisUserSuper
                                  ? '✨ Hapus App, Hapus User, Kelola Lisensi & Monitor Penuh'
                                  : '⚙️ Kelola Lisensi, Buat/Pause App, Monitor Perangkat'}
                              </div>
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '-'}
                            </td>
                            <td style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                              {u.last_login_at ? new Date(u.last_login_at).toLocaleString('id-ID') : 'Belum pernah'}
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                                {/* Edit / Change Password */}
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => {
                                      setSelectedUserToEdit(u);
                                      setEditUserRole(u.role);
                                      setEditUserPassword('');
                                      setShowEditUserModal(true);
                                    }}
                                    className="btn btn-secondary btn-sm"
                                    style={{ height: 30, padding: '0 8px' }}
                                    title="Ubah Role atau Ganti Password"
                                  >
                                    <Edit2 size={13} /> Edit
                                  </button>
                                )}

                                {/* Delete User (Super Admin only & cannot delete root or self) */}
                                {isSuperAdmin ? (
                                  !u.isRoot && !isSelf ? (
                                    <button
                                      onClick={() => handleDeleteUser(u)}
                                      disabled={deletingUserId === u.id}
                                      className="btn btn-secondary btn-sm"
                                      style={{ height: 30, padding: '0 8px', color: '#ef4444' }}
                                      title="Hapus User Pengelola"
                                    >
                                      {deletingUserId === u.id ? <RefreshCw size={13} className="animate-spin" /> : <Trash2 size={13} />}
                                      <span>Hapus</span>
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: '0.72rem', color: '#64748b', fontStyle: 'italic', paddingRight: 6 }}>
                                      {u.isRoot ? 'Terkunci (Root)' : 'Akun Aktif'}
                                    </span>
                                  )
                                ) : (
                                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                                    Super Admin Only
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SECTION 2: MONITORING USER PERANGKAT / LOADER CLIENT */}
            <div style={{
              background: '#09090d',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 12,
              padding: 20
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
                marginBottom: 16
              }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Monitor size={18} style={{ color: '#a78bfa' }} />
                    <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                      Live Monitoring Perangkat Client & Loader ({filteredDevices.length})
                    </h3>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '4px 0 0' }}>
                    Pelacakan instan HWID perangkat pengguna yang terhubung, IP Address, lisensi terkait, dan opsi Reset HWID mandiri.
                  </p>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', width: 220 }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Cari HWID / IP / Key..."
                      value={deviceSearch}
                      onChange={(e) => setDeviceSearch(e.target.value)}
                      style={{ height: 36, paddingLeft: 32, fontSize: '0.82rem' }}
                    />
                    <Search size={14} style={{ position: 'absolute', left: 10, top: 11, color: '#64748b' }} />
                  </div>

                  <select
                    className="select"
                    value={deviceProductFilter}
                    onChange={(e) => setDeviceProductFilter(e.target.value)}
                    style={{ height: 36, minWidth: 150, fontSize: '0.82rem' }}
                  >
                    <option value="">Semua Aplikasi</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>

                  <button
                    onClick={loadUsersData}
                    disabled={loadingUsers}
                    className="btn btn-secondary btn-sm"
                    style={{ height: 36 }}
                    title="Refresh Data Perangkat"
                  >
                    <RefreshCw size={13} className={loadingUsers ? "animate-spin" : ""} />
                  </button>
                </div>
              </div>

              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th style={{ color: '#a78bfa', fontWeight: 700 }}>Perangkat (HWID)</th>
                      <th style={{ color: '#a78bfa', fontWeight: 700 }}>IP Address</th>
                      <th style={{ color: '#a78bfa', fontWeight: 700 }}>Aplikasi</th>
                      <th style={{ color: '#a78bfa', fontWeight: 700 }}>License Key Terikat</th>
                      <th style={{ color: '#a78bfa', fontWeight: 700 }}>Status Lisensi</th>
                      <th style={{ color: '#a78bfa', fontWeight: 700 }}>Terakhir Aktif</th>
                      <th style={{ color: '#a78bfa', fontWeight: 700, textAlign: 'right' }}>Aksi Monitoring</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingUsers ? (
                      <tr>
                        <td colSpan={7}>
                          <div className="table-loading-container">
                            <div className="table-loading-spinner"></div>
                            <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Memuat live sessions perangkat...</span>
                          </div>
                        </td>
                      </tr>
                    ) : filteredDevices.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center', padding: 40, color: '#64748b' }}>
                          {monitoredDevices.length === 0
                            ? 'Belum ada perangkat client / loader yang terhubung atau melakukan aktivasi.'
                            : 'Tidak ada perangkat yang cocok dengan filter pencarian.'}
                        </td>
                      </tr>
                    ) : (
                      filteredDevices.map((dev) => (
                        <tr key={dev.id}>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <Laptop size={15} style={{ color: '#a78bfa', flexShrink: 0 }} />
                              <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                color: '#f1f5f9'
                              }}>
                                {dev.hwid}
                              </span>
                              <button
                                onClick={() => copyText(dev.hwid, 'HWID')}
                                className="btn btn-secondary btn-icon"
                                style={{ width: 24, height: 24 }}
                                title="Salin HWID"
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: '#94a3b8' }}>
                              {dev.ip_address}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: 600 }}>
                              {dev.product_name}
                            </span>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: '#cbd5e1' }}>
                                {dev.license_key}
                              </span>
                              <button
                                onClick={() => copyText(dev.license_key, 'License Key')}
                                className="btn btn-secondary btn-icon"
                                style={{ width: 24, height: 24 }}
                                title="Salin Key"
                              >
                                <Copy size={11} />
                              </button>
                            </div>
                          </td>
                          <td>
                            <span className={`badge badge-${dev.license_status}`}>
                              {dev.license_status}
                            </span>
                          </td>
                          <td>
                            <div style={{ fontSize: '0.82rem', color: '#cbd5e1' }}>
                              {dev.last_used_at ? new Date(dev.last_used_at).toLocaleString('id-ID') : '-'}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Aktif: {dev.first_used_at ? new Date(dev.first_used_at).toLocaleDateString('id-ID') : '-'}
                            </div>
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                              {dev.license_status === 'expired' || (dev.expires_at && new Date(dev.expires_at) < new Date()) ? (
                                <span style={{ fontSize: '0.75rem', color: '#ef4444', fontStyle: 'italic', paddingRight: 6 }}>
                                  Expired (Masa Habis)
                                </span>
                              ) : (
                                <button
                                  onClick={() => handleResetDevice(dev)}
                                  disabled={resettingDeviceId === dev.id}
                                  className="btn btn-secondary btn-sm"
                                  style={{ height: 30, padding: '0 8px', color: '#38bdf8', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                  title="Reset HWID perangkat ini agar lisensi bisa dipindah ke PC lain"
                                >
                                  <RotateCcw size={13} className={resettingDeviceId === dev.id ? "animate-spin" : ""} />
                                  <span>{resettingDeviceId === dev.id ? 'Mereset...' : 'Reset HWID'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
              <button
                onClick={handleClearLogs}
                disabled={isClearingLogs}
                className="btn btn-danger btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {isClearingLogs ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                <span>{isClearingLogs ? 'Membersihkan...' : 'Kosongkan Log'}</span>
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
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16
          }}
        >
          <div className="glass-card modal-content" style={{ maxWidth: 480, margin: 'auto' }}>
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
                <button type="submit" disabled={isCreatingApp} className="btn btn-blue" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {isCreatingApp ? <><RefreshCw size={14} className="animate-spin" /> Membuat...</> : 'Create App'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Rename App Modal */}
      {showRenameAppModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16
          }}
        >
          <div className="glass-card modal-content" style={{ maxWidth: 480, margin: 'auto' }}>
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
                <button type="submit" disabled={isRenamingApp} className="btn btn-cyan" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {isRenamingApp ? <><RefreshCw size={14} className="animate-spin" /> Menyimpan...</> : 'Rename Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Pause / Unpause App Modal */}
      {showPauseAppModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16
          }}
        >
          <div className="glass-card modal-content" style={{ maxWidth: 480, margin: 'auto' }}>
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
                disabled={isPausingApp}
                className="btn btn-orange"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {isPausingApp ? <><RefreshCw size={14} className="animate-spin" /> Memproses...</> : "Yes, I'm sure"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Delete App Modal */}
      {showDeleteAppModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16
          }}
        >
          <div className="glass-card modal-content" style={{ maxWidth: 480, margin: 'auto' }}>
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
                disabled={isDeletingApp}
                className="btn btn-red"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                {isDeletingApp ? <><RefreshCw size={14} className="animate-spin" /> Menghapus...</> : 'Hapus Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Add Licenses Modal (Exact 1:1 Replica Photo 2) */}
      {showGenerateModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16,
            margin: 0
          }}
        >
          <div
            className="modal-content"
            style={{
              width: '100%',
              maxWidth: 460,
              background: '#13161f',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: 12,
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.9)',
              overflow: 'hidden',
              margin: 'auto'
            }}
          >
            <div className="modal-header" style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', margin: 0 }}>Add Licenses</h3>
              <button
                type="button"
                onClick={() => { setShowGenerateModal(false); setGeneratedResult(null); }}
                className="btn-icon"
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {!generatedResult ? (
              <form onSubmit={handleGenerateLicenses}>
                <div className="modal-body" style={{ padding: '20px 24px' }}>
                  {/* Target Application Indicator */}
                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ color: '#94a3b8', fontSize: '0.8rem', marginBottom: 4, display: 'block' }}>
                      Target Application:
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1c202c', border: '1px solid #282f42', padding: '8px 12px', borderRadius: 6 }}>
                      <Layers size={14} style={{ color: '#38bdf8' }} />
                      <span style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem' }}>{currentApp.name}</span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>({currentApp.id})</span>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                      Amount:
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      required
                      className="input"
                      value={genAmount}
                      onChange={(e) => setGenAmount(parseInt(e.target.value) || 1)}
                      style={{ background: '#1c202c', border: '1px solid #282f42', color: '#fff' }}
                    />
                  </div>

                  {/* Key Mask */}
                  <div className="form-group" style={{ marginBottom: 10 }}>
                    <label className="form-label" style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                      Key Mask:
                    </label>
                    <input
                      type="text"
                      required
                      className="input"
                      placeholder="Using * will assign a random character."
                      value={genMask}
                      onChange={(e) => setGenMask(e.target.value)}
                      style={{ background: '#1c202c', border: '1px solid #282f42', color: '#fff', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  {/* Checkboxes Row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 24, margin: '12px 0 16px 0' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#fff' }}>
                      <input
                        type="checkbox"
                        checked={genLowercase}
                        onChange={(e) => setGenLowercase(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#2563eb', cursor: 'pointer' }}
                      />
                      <span>Lowercase Letters</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.875rem', color: '#fff' }}>
                      <input
                        type="checkbox"
                        checked={genCapital}
                        onChange={(e) => setGenCapital(e.target.checked)}
                        style={{ width: 16, height: 16, accentColor: '#2563eb', cursor: 'pointer' }}
                      />
                      <span>Capital Letters</span>
                    </label>
                  </div>

                  {/* License Level */}
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                      License Level:
                    </label>
                    <input
                      type="text"
                      className="input"
                      value={genLevel}
                      onChange={(e) => setGenLevel(e.target.value)}
                      style={{ background: '#1c202c', border: '1px solid #282f42', color: '#fff' }}
                    />
                  </div>

                  {/* License Note */}
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                      License Note:
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Optional, e.g. this license was for Joe"
                      value={genNote}
                      onChange={(e) => setGenNote(e.target.value)}
                      style={{ background: '#1c202c', border: '1px solid #282f42', color: '#fff' }}
                    />
                  </div>

                  {/* License Expiry Unit */}
                  <div className="form-group" style={{ marginBottom: 14 }}>
                    <label className="form-label" style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                      License Expiry Unit:
                    </label>
                    <select
                      className="select"
                      value={genExpiryUnit}
                      onChange={(e) => {
                        const val = e.target.value;
                        setGenExpiryUnit(val);
                        if (val === 'Lifetime') {
                          setGenDuration(0);
                        } else if (genDuration <= 0) {
                          setGenDuration(1);
                        }
                      }}
                      style={{ background: '#1c202c', border: '1px solid #282f42', color: '#fff' }}
                    >
                      <option value="Days">Days (Hari)</option>
                      <option value="Seconds">Seconds (Detik)</option>
                      <option value="Minutes">Minutes (Menit)</option>
                      <option value="Hours">Hours (Jam)</option>
                      <option value="Weeks">Weeks (Minggu)</option>
                      <option value="Months">Months (Bulan)</option>
                      <option value="Years">Years (Tahun)</option>
                      <option value="Lifetime">Lifetime (Selamanya)</option>
                    </select>
                  </div>

                  {/* License Duration */}
                  {genExpiryUnit !== 'Lifetime' && (
                    <div className="form-group" style={{ marginBottom: 8 }}>
                      <label className="form-label" style={{ color: '#fff', fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>
                        License Duration ({genExpiryUnit}):
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        className="input"
                        value={genDuration}
                        onChange={(e) => setGenDuration(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        style={{ background: '#1c202c', border: '1px solid #282f42', color: '#fff' }}
                      />
                    </div>
                  )}
                </div>

                <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => setShowGenerateModal(false)}
                    className="btn-close-modal"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={isGenerating}
                    className="btn-add-modal"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw size={15} className="animate-spin" />
                        <span>Adding...</span>
                      </>
                    ) : (
                      'Add'
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div>
                <div className="modal-body" style={{ padding: '20px 24px' }}>
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
                          type="button"
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
                <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      const allKeys = generatedResult.map((k) => k.license_key).join('\n');
                      copyText(allKeys, 'Semua Kunci');
                    }}
                    className="btn btn-secondary"
                  >
                    <Copy size={14} /> Salin Semua Kunci
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowGenerateModal(false); setGeneratedResult(null); }}
                    className="btn-close-modal"
                  >
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
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16
          }}
        >
          <div className="glass-card modal-content" style={{ maxWidth: 440, margin: 'auto' }}>
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
                <button type="submit" disabled={isExtending} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {isExtending ? <><RefreshCw size={14} className="animate-spin" /> Menyimpan...</> : 'Tambah Hari'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. Bot Setup Modals (Discord, Telegram, Shop) */}
      {showBotModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: 16
          }}
        >
          <div className="glass-card modal-content" style={{ maxWidth: 540, margin: 'auto' }}>
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

      {/* 8. Add User Modal (Super Admin Only) */}
      {showAddUserModal && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddUserModal(false);
          }}
        >
          <div className="glass-card" style={{ maxWidth: 480, width: '100%', padding: 28, borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(37, 99, 235, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#60a5fa'
                }}>
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>Tambah User Baru</h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Buat akun pengelola untuk dashboard AUTH-X-BOY</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddUserModal(false)}
                className="btn btn-secondary btn-icon"
                style={{ width: 32, height: 32 }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser}>
              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Username</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Contoh: moderator1, cs_support"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Hanya huruf, angka, garis bawah, dan strip (min. 3 karakter).</span>
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  className="input"
                  placeholder="Masukkan password akun..."
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Peran & Hak Akses (Role)</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div
                    onClick={() => setNewUserRole('admin')}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: newUserRole === 'admin' ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: newUserRole === 'admin' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: '0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#93c5fd', fontSize: '0.9rem', marginBottom: 4 }}>
                      <Shield size={16} /> Admin Biasa
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                      Kelola lisensi, tambah/pause app, lihat monitoring. Tidak bisa hapus user atau hapus app.
                    </p>
                  </div>

                  <div
                    onClick={() => setNewUserRole('super_admin')}
                    style={{
                      padding: 14,
                      borderRadius: 10,
                      border: newUserRole === 'super_admin' ? '2px solid #facc15' : '1px solid rgba(255, 255, 255, 0.08)',
                      background: newUserRole === 'super_admin' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      cursor: 'pointer',
                      transition: '0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#facc15', fontSize: '0.9rem', marginBottom: 4 }}>
                      <Crown size={16} /> Super Admin
                    </div>
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                      Akses penuh: Berhak menghapus user biasa, menghapus aplikasi, dan monitoring lengkap.
                    </p>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowAddUserModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingUser}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Plus size={16} className={isCreatingUser ? "animate-spin" : ""} />
                  <span>{isCreatingUser ? 'Menyimpan...' : 'Simpan User'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 9. Edit User Modal */}
      {showEditUserModal && selectedUserToEdit && (
        <div
          className="modal-backdrop"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 16
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEditUserModal(false);
          }}
        >
          <div className="glass-card" style={{ maxWidth: 480, width: '100%', padding: 28, borderRadius: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'rgba(56, 189, 248, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#38bdf8'
                }}>
                  <Edit2 size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                    Edit User: {selectedUserToEdit.username}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>Perbarui peran atau atur ulang kata sandi</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditUserModal(false)}
                className="btn btn-secondary btn-icon"
                style={{ width: 32, height: 32 }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleEditUser}>
              {/* Role Selection (Only if not root admin) */}
              {!selectedUserToEdit.isRoot ? (
                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label className="form-label">Ubah Role Pengguna</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div
                      onClick={() => setEditUserRole('admin')}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: editUserRole === 'admin' ? '2px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: editUserRole === 'admin' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#93c5fd', fontSize: '0.88rem' }}>
                        <Shield size={15} /> Admin Biasa
                      </div>
                    </div>

                    <div
                      onClick={() => setEditUserRole('super_admin')}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        border: editUserRole === 'super_admin' ? '2px solid #facc15' : '1px solid rgba(255, 255, 255, 0.08)',
                        background: editUserRole === 'super_admin' ? 'rgba(234, 179, 8, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                        cursor: 'pointer'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, color: '#facc15', fontSize: '0.88rem' }}>
                        <Crown size={15} /> Super Admin
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(234, 179, 8, 0.1)',
                  border: '1px solid rgba(234, 179, 8, 0.25)',
                  marginBottom: 18,
                  fontSize: '0.82rem',
                  color: '#fef08a'
                }}>
                  Akun root &quot;admin&quot; permanen memiliki peran Super Admin.
                </div>
              )}

              {/* Password Reset Input */}
              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Ganti Password (Kosongkan jika tidak ingin diubah)</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Masukkan password baru..."
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowEditUserModal(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingUser}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Check size={16} className={isUpdatingUser ? "animate-spin" : ""} />
                  <span>{isUpdatingUser ? 'Memperbarui...' : 'Simpan Perubahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
