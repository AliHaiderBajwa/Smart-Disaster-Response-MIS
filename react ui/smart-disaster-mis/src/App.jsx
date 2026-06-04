import React, { useEffect, useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';

const CHART_COLORS = ['#00d4aa', '#4db8ff', '#c084fc', '#ffb347', '#ff4d6d', '#4dffb4'];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip" style={{
        background: 'var(--surface2)',
        border: '1px solid var(--border2)',
        padding: '8px 12px',
        borderRadius: '8px',
        boxShadow: 'var(--shadow)'
      }}>
        <p className="label" style={{ margin: 0, fontWeight: 700, color: 'var(--ink)' }}>
          {`${label || payload[0].name} : ${payload[0].value}`}
        </p>
      </div>
    );
  }
  return null;
};

const API_BASE = import.meta.env?.VITE_API_BASE || (import.meta.env.MODE === 'development' ? 'http://localhost:5000' : '');

const ROLES = {
  1: 'Administrator',
  2: 'Emergency Operator',
  3: 'Field Officer',
  4: 'Warehouse Manager',
  5: 'Finance Officer'
};

const DEMO_USERS = [
  { email: 'suleiman@mis.pk', password: 'hash1', userID: 1, fullName: 'Sultan Suleiman', roleID: 1, role: 'Administrator' },
  { email: 'salahuddin@mis.pk', password: 'hash2', userID: 2, fullName: 'Salahuddin Ayyubi', roleID: 2, role: 'Emergency Operator' },
  { email: 'nuruddin@mis.pk', password: 'hash3', userID: 3, fullName: 'Nuruddin Zangi', roleID: 3, role: 'Field Officer' },
  { email: 'shahjahan@mis.pk', password: 'hash5', userID: 5, fullName: 'Shah Jahan', roleID: 4, role: 'Warehouse Manager' },
  { email: 'hamid@mis.pk', password: 'hash9', userID: 9, fullName: 'Abdul Hamid II', roleID: 5, role: 'Finance Officer' }
];

const initialData = {
  reports: [
    { ReportID: 1, Location: 'Lahore', DisasterType: 'Flood', SeverityLevel: 'High', Description: 'River overflow near Ravi belt', Status: 'Open', ReportedAt: new Date(Date.now() - 3600000).toISOString(), ReportedByName: 'Salahuddin Ayyubi' },
    { ReportID: 2, Location: 'Karachi', DisasterType: 'Fire', SeverityLevel: 'Medium', Description: 'Warehouse fire in SITE area', Status: 'InProgress', ReportedAt: new Date(Date.now() - 7200000).toISOString(), ReportedByName: 'Allama Iqbal' },
    { ReportID: 3, Location: 'Islamabad', DisasterType: 'Earthquake', SeverityLevel: 'Critical', Description: 'Severe tremors and collapsed buildings', Status: 'Open', ReportedAt: new Date(Date.now() - 10800000).toISOString(), ReportedByName: 'Salahuddin Ayyubi' },
    { ReportID: 4, Location: 'Peshawar', DisasterType: 'Flood', SeverityLevel: 'High', Description: 'Water entering residential streets', Status: 'Open', ReportedAt: new Date(Date.now() - 14400000).toISOString(), ReportedByName: 'Salahuddin Ayyubi' }
  ],
  teams: [
    { TeamID: 1, TeamName: 'Al-Fateh Unit', TeamType: 'Rescue', CurrentLocation: 'Lahore', Status: 'Available' },
    { TeamID: 2, TeamName: 'Zulfiqar Squad', TeamType: 'Fire', CurrentLocation: 'Karachi', Status: 'Busy', IncidentLocation: 'Karachi' },
    { TeamID: 3, TeamName: 'Ansar Brigade', TeamType: 'Medical', CurrentLocation: 'Islamabad', Status: 'Available' },
    { TeamID: 4, TeamName: 'Ghazi Unit', TeamType: 'Rescue', CurrentLocation: 'Peshawar', Status: 'Assigned', IncidentLocation: 'Peshawar' }
  ],
  resources: [
    { ResourceID: 1, ResourceType: 'Food', AvailableQuantity: 1000, Unit: 'Packets', ThresholdLevel: 200, WarehouseName: 'Central Supply Depot', StockStatus: 'SUFFICIENT' },
    { ResourceID: 2, ResourceType: 'Water', AvailableQuantity: 420, Unit: 'Liters', ThresholdLevel: 500, WarehouseName: 'Central Supply Depot', StockStatus: 'LOW STOCK' },
    { ResourceID: 3, ResourceType: 'Medicine', AvailableQuantity: 500, Unit: 'Boxes', ThresholdLevel: 100, WarehouseName: 'Karachi Storage Hub', StockStatus: 'SUFFICIENT' },
    { ResourceID: 4, ResourceType: 'Shelter', AvailableQuantity: 44, Unit: 'Units', ThresholdLevel: 50, WarehouseName: 'Islamabad Reserve Center', StockStatus: 'LOW STOCK' }
  ],
  allocations: [
    { AllocationID: 1, ResourceType: 'Food', ReportID: 1, Location: 'Lahore', QuantityAllocated: 120, TotalConsumed: 0, Status: 'Pending', AllocatedAt: new Date(Date.now() - 1800000).toISOString() }
  ],
  hospitals: [
    { HospitalID: 1, Name: 'Mayo Hospital', Location: 'Lahore', TotalBeds: 1200, AvailableBeds: 340, LoadPercentage: 71.6 },
    { HospitalID: 2, Name: 'JPMC', Location: 'Karachi', TotalBeds: 1500, AvailableBeds: 420, LoadPercentage: 72.0 },
    { HospitalID: 3, Name: 'PIMS', Location: 'Islamabad', TotalBeds: 900, AvailableBeds: 260, LoadPercentage: 71.1 },
    { HospitalID: 4, Name: 'Lady Reading Hospital', Location: 'Peshawar', TotalBeds: 1100, AvailableBeds: 180, LoadPercentage: 83.6 }
  ],
  patients: [
    { PatientID: 1, FullName: 'Amina Khan', Age: 34, Condition: 'Critical', Status: 'Admitted', HospitalName: 'Mayo Hospital', IncidentLocation: 'Lahore', AdmittedAt: new Date(Date.now() - 2200000).toISOString() }
  ],
  transactions: [
    { TransactionID: 1, Type: 'Donation', Amount: 1500000, Description: 'Corporate emergency relief fund', Location: 'Lahore', RecordedBy: 'Abdul Hamid II', Timestamp: new Date(Date.now() - 9000000).toISOString() },
    { TransactionID: 2, Type: 'Expense', Amount: 225000, Description: 'Food and water dispatch', Location: 'Lahore', RecordedBy: 'Abdul Hamid II', Timestamp: new Date(Date.now() - 7000000).toISOString() },
    { TransactionID: 3, Type: 'Procurement', Amount: 390000, Description: 'Medicine stock procurement', Location: 'Islamabad', RecordedBy: 'Faisal bin Abdulaziz', Timestamp: new Date(Date.now() - 5000000).toISOString() }
  ],
  budget: [
    { BudgetID: 1, DisasterType: 'Flood', FiscalYear: 2026, AllocatedAmount: 5000000, SpentAmount: 850000, RemainingAmount: 4150000 },
    { BudgetID: 2, DisasterType: 'Earthquake', FiscalYear: 2026, AllocatedAmount: 7000000, SpentAmount: 1250000, RemainingAmount: 5750000 },
    { BudgetID: 3, DisasterType: 'Fire', FiscalYear: 2026, AllocatedAmount: 2500000, SpentAmount: 420000, RemainingAmount: 2080000 }
  ],
  approvals: [
    { ApprovalID: 1, RequestType: 'ResourceAllocation', ReferenceType: 'ResourceAllocation', ReferenceID: 1, Status: 'Pending', RequestedByName: 'Salahuddin Ayyubi', RequestedAt: new Date(Date.now() - 1800000).toISOString() }
  ],
  audit: [
    { LogID: 1, ActionType: 'INSERT', TableAffected: 'FinancialTransaction', RecordID: 1, FullName: 'Abdul Hamid II', Timestamp: new Date(Date.now() - 9000000).toISOString() }
  ]
};

function can(roleID, feature) {
  const matrix = {
    report: [1, 2, 3],
    reportStatus: [1, 2],
    team: [1, 2, 3],
    resources: [1, 4],
    requestResource: [1, 2, 3, 4],
    hospital: [1, 2],
    finance: [1, 5],
    approvals: [1, 4, 5],
    audit: [1]
  };
  return matrix[feature]?.includes(roleID);
}

function money(value) {
  return new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR', maximumFractionDigits: 0 }).format(Number(value || 0));
}

function dateTime(value) {
  if (!value) return 'Pending';
  return new Date(value).toLocaleString();
}

function normalizeRow(row) {
  return Object.fromEntries(Object.entries(row || {}).map(([key, value]) => [key, value ?? '']));
}

async function request(path, options = {}) {
  const token = localStorage.getItem('mis_token');
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'Request failed');
  return data;
}

function StatCard({ label, value, detail }) {
  return (
    <section className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </section>
  );
}

function Pill({ value }) {
  const slug = String(value || '').toLowerCase().replace(/\s+/g, '-');
  return <span className={`pill pill-${slug}`}>{value || 'Unknown'}</span>;
}

function Bars({ title, rows, labelKey, valueKey }) {
  const max = Math.max(1, ...rows.map((row) => Number(row[valueKey] || 0)));
  return (
    <section className="panel chart-panel">
      <div className="panel-title">
        <h3>{title}</h3>
      </div>
      <div className="bars">
        {rows.map((row) => (
          <div className="bar-row" key={`${row[labelKey]}-${row[valueKey]}`}>
            <span>{row[labelKey]}</span>
            <div><i style={{ width: `${(Number(row[valueKey] || 0) / max) * 100}%` }} /></div>
            <b>{row[valueKey]}</b>
          </div>
        ))}
      </div>
    </section>
  );
}

function Login({ onLogin }) {
  const [email, setEmail] = useState(DEMO_USERS[0].email);
  const [password, setPassword] = useState(DEMO_USERS[0].password);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await request('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      localStorage.setItem('mis_token', data.token);
      localStorage.setItem('mis_user', JSON.stringify(data.user));
      onLogin(data.user, false);
    } catch (err) {
      const demo = DEMO_USERS.find((user) => user.email === email && user.password === password);
      if (!demo) {
        setError(err.message);
      } else {
        const user = { userID: demo.userID, fullName: demo.fullName, email: demo.email, roleID: demo.roleID, role: demo.role };
        localStorage.setItem('mis_token', 'demo-token');
        localStorage.setItem('mis_user', JSON.stringify(user));
        onLogin(user, true);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-hero">
        <p className="eyebrow">Enterprise database project</p>
        <h1>Smart Disaster Response MIS</h1>
        <p>Integrated emergency reporting, rescue coordination, inventory workflows, hospital capacity, financial control, approvals, audit trails, and MIS analytics.</p>
        <div className="hero-metrics">
          <span>RBAC</span>
          <span>ACID workflows</span>
          <span>Views and indexes</span>
        </div>
      </section>
      <form className="login-card" onSubmit={submit}>
        <h2>Sign in</h2>
        <label>Email<input value={email} onChange={(e) => setEmail(e.target.value)} /></label>
        <label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
        {error && <p className="error">{error}</p>}
        <button className="primary" disabled={loading}>{loading ? 'Checking...' : 'Enter command center'}</button>
        <div className="demo-users">
          {DEMO_USERS.map((user) => (
            <button type="button" key={user.email} onClick={() => { setEmail(user.email); setPassword(user.password); }}>
              {user.role}
            </button>
          ))}
        </div>
      </form>
    </main>
  );
}

function DataTable({ columns, rows, empty = 'No records found.' }) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>{columns.map((col) => <th key={col.key}>{col.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={columns.length} className="empty">{empty}</td></tr>
          )}
          {rows.map((raw, index) => {
            const row = normalizeRow(raw);
            return (
              <tr key={row[columns[0].key] || index}>
                {columns.map((col) => <td key={col.key}>{col.render ? col.render(row) : row[col.key]}</td>)}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, children }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function App() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mis_user')); } catch { return null; }
  });
  const [demoMode, setDemoMode] = useState(localStorage.getItem('mis_token') === 'demo-token');
  const [active, setActive] = useState('dashboard');
  const [data, setData] = useState(initialData);
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const roleID = user?.roleID;

  const stats = useMemo(() => {
    const totalReports = data.reports.length;
    const critical = data.reports.filter((r) => r.SeverityLevel === 'Critical').length;
    const open = data.reports.filter((r) => r.Status === 'Open').length;
    const lowStock = data.resources.filter((r) => (r.StockStatus || '').includes('LOW') || Number(r.AvailableQuantity) <= Number(r.ThresholdLevel)).length;
    const availableTeams = data.teams.filter((t) => t.Status === 'Available').length;
    const pendingApprovals = data.approvals.filter((a) => a.Status === 'Pending').length;
    const donations = data.transactions.filter((t) => t.Type === 'Donation').reduce((sum, t) => sum + Number(t.Amount || 0), 0);
    const spending = data.transactions.filter((t) => t.Type !== 'Donation').reduce((sum, t) => sum + Number(t.Amount || 0), 0);
    return { totalReports, critical, open, lowStock, availableTeams, pendingApprovals, donations, spending };
  }, [data]);

  async function refresh() {
    if (!user || demoMode) return;
    setLoading(true);
    try {
      const [reports, teams, resources, allocations, hospitals, patients, transactions, budget, approvals, audit] = await Promise.all([
        request('/api/reports'),
        request('/api/teams'),
        request('/api/resources/inventory').catch(() => ({ resources: [] })),
        request('/api/resources/allocations').catch(() => ({ allocations: [] })),
        request('/api/hospitals/capacity'),
        request('/api/hospitals/patients').catch(() => ({ patients: [] })),
        request('/api/financial/transactions').catch(() => ({ transactions: [] })),
        request('/api/financial/budget').catch(() => ({ budget: [] })),
        request('/api/approvals/history').catch(() => request('/api/approvals/pending')).catch(() => ({ approvals: [] })),
        request('/api/mis/audit').catch(() => ({ logs: [] }))
      ]);
      setData({
        reports: reports.reports || [],
        teams: teams.teams || [],
        resources: resources.resources || [],
        allocations: allocations.allocations || [],
        hospitals: hospitals.hospitals || [],
        patients: patients.patients || [],
        transactions: transactions.transactions || [],
        budget: budget.budget || [],
        approvals: approvals.approvals || [],
        audit: audit.logs || []
      });
      setNotice('Live data refreshed from backend.');
    } catch (err) {
      setDemoMode(true);
      setNotice(`Backend unavailable. Showing complete demo workspace: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { refresh(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  function logout() {
    localStorage.removeItem('mis_token');
    localStorage.removeItem('mis_user');
    setUser(null);
    setDemoMode(false);
  }

  async function save(path, payload, fallback) {
    try {
      if (demoMode) throw new Error('Demo mode');
      await request(path, { method: 'POST', body: JSON.stringify(payload) });
      setNotice('Saved to backend successfully.');
      await refresh();
    } catch (err) {
      fallback();
      setNotice(demoMode ? 'Demo workflow completed locally.' : `Saved locally for demo because backend rejected it: ${err.message}`);
    }
  }

  if (!user) {
    return <Login onLogin={(nextUser, isDemo) => { setUser(nextUser); setDemoMode(isDemo); }} />;
  }

  const nav = [
    ['dashboard', 'Dashboard', '🏠', true],
    ['reports', 'Emergency Reports', '🚨', true],
    ['teams', 'Rescue Teams', '🛡️', can(roleID, 'team')],
    ['resources', 'Resources', '📦', can(roleID, 'requestResource')],
    ['hospitals', 'Hospitals', '🏥', can(roleID, 'hospital') || roleID === 1],
    ['finance', 'Finance', '💰', can(roleID, 'finance')],
    ['approvals', 'Approvals', '✅', can(roleID, 'approvals')],
    ['mis', 'MIS Analytics', '📊', true],
    ['audit', 'Audit Log', '🔍', can(roleID, 'audit')]
  ].filter((item) => item[3]);

  const severityRows = ['Critical', 'High', 'Medium', 'Low'].map((level) => ({
    level,
    count: data.reports.filter((report) => report.SeverityLevel === level).length
  }));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <b>SDR-MIS</b>
          <span>Secure Response Console</span>
        </div>
        <nav>
          {nav.map(([key, label, icon]) => (
            <button key={key} className={active === key ? 'active' : ''} onClick={() => setActive(key)}>
              <span className="nav-icon">{icon}</span>{label}
            </button>
          ))}
        </nav>
        <div className="user-card">
          <strong>{user.fullName}</strong>
          <span>{ROLES[roleID] || user.role}</span>
          <button onClick={logout}>Logout</button>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <p className="eyebrow">{demoMode ? '⚡ Demo Mode' : '🟢 Live Backend'}</p>
            <h1>{nav.find(([key]) => key === active)?.[1]}</h1>
          </div>
          <button className="secondary" onClick={refresh} disabled={loading}>{loading ? '⏳ Refreshing…' : '↻ Refresh'}</button>
        </header>
        {notice && <div className="notice" onClick={() => setNotice('')}>{notice}</div>}

        {active === 'dashboard' && <Dashboard stats={stats} data={data} severityRows={severityRows} />}
        {active === 'reports' && <Reports data={data} setData={setData} save={save} roleID={roleID} />}
        {active === 'teams' && <Teams data={data} setData={setData} save={save} />}
        {active === 'resources' && <Resources data={data} setData={setData} save={save} roleID={roleID} />}
        {active === 'hospitals' && <Hospitals data={data} setData={setData} save={save} />}
        {active === 'finance' && <Finance data={data} setData={setData} save={save} />}
        {active === 'approvals' && <Approvals data={data} setData={setData} save={save} />}
        {active === 'mis' && <MISAnalytics data={data} />}
        {active === 'audit' && <Audit data={data} />}
      </main>
    </div>
  );
}

function Dashboard({ stats, data, severityRows }) {
  const resourceRows = data.resources.map((r) => ({ type: r.ResourceType, qty: r.AvailableQuantity }));
  return (
    <>
      <div className="stats-grid">
        <StatCard label="Total reports" value={stats.totalReports} detail={`${stats.open} open incidents`} />
        <StatCard label="Critical incidents" value={stats.critical} detail="Prioritized first" />
        <StatCard label="Available teams" value={stats.availableTeams} detail={`${data.teams.length} total teams`} />
        <StatCard label="Pending approvals" value={stats.pendingApprovals} detail="Resource and finance" />
        <StatCard label="Low stock warnings" value={stats.lowStock} detail="Threshold automation" />
        <StatCard label="Net funds" value={money(stats.donations - stats.spending)} detail={`${money(stats.donations)} donations`} />
      </div>
      <div className="two-col">
        <Bars title="Incident severity distribution" rows={severityRows} labelKey="level" valueKey="count" />
        <Bars title="Resource inventory snapshot" rows={resourceRows} labelKey="type" valueKey="qty" />
      </div>
      <section className="panel">
        <div className="panel-title"><h3>Live command queue</h3></div>
        <DataTable columns={[
          { key: 'ReportID', label: 'ID' },
          { key: 'Location', label: 'Location' },
          { key: 'DisasterType', label: 'Type' },
          { key: 'SeverityLevel', label: 'Severity', render: (r) => <Pill value={r.SeverityLevel} /> },
          { key: 'Status', label: 'Status', render: (r) => <Pill value={r.Status} /> }
        ]} rows={data.reports.slice(0, 6)} />
      </section>
    </>
  );
}

function Reports({ data, setData, save, roleID }) {
  const [form, setForm] = useState({ location: '', disasterType: 'Flood', severityLevel: 'High', description: '' });
  const [filter, setFilter] = useState('');

  function submit(event) {
    event.preventDefault();
    const payload = { ...form };
    save('/api/reports', payload, () => {
      setData((prev) => ({
        ...prev,
        reports: [{ ReportID: Date.now(), Location: form.location, DisasterType: form.disasterType, SeverityLevel: form.severityLevel, Description: form.description, Status: 'Open', ReportedAt: new Date().toISOString(), ReportedByName: 'Current User' }, ...prev.reports]
      }));
    });
    setForm({ location: '', disasterType: 'Flood', severityLevel: 'High', description: '' });
  }

  async function updateStatus(reportID, newStatus) {
    try {
      await request(`/api/reports/${reportID}/status`, { method: 'PUT', body: JSON.stringify({ newStatus }) });
    } catch {}
    setData((prev) => ({ ...prev, reports: prev.reports.map((r) => r.ReportID === reportID ? { ...r, Status: newStatus } : r) }));
  }

  const rows = data.reports.filter((r) => `${r.Location} ${r.DisasterType} ${r.SeverityLevel} ${r.Status}`.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="stack">
      {can(roleID, 'report') && (
        <form className="panel form-grid" onSubmit={submit}>
          <div className="panel-title wide"><h3>Submit emergency report</h3></div>
          <Field label="Location"><input required value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></Field>
          <Field label="Disaster type"><select value={form.disasterType} onChange={(e) => setForm({ ...form, disasterType: e.target.value })}>{['Flood','Earthquake','Fire','Heatwave','Cyclone','Landslide','Avalanche'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Severity"><select value={form.severityLevel} onChange={(e) => setForm({ ...form, severityLevel: e.target.value })}>{['Low','Medium','High','Critical'].map((x) => <option key={x}>{x}</option>)}</select></Field>
          <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
          <button className="primary">Create report</button>
        </form>
      )}
      <section className="panel">
        <div className="panel-title">
          <h3>Emergency reports</h3>
          <input className="search" placeholder="Filter reports" value={filter} onChange={(e) => setFilter(e.target.value)} />
        </div>
        <DataTable columns={[
          { key: 'ReportID', label: 'ID' },
          { key: 'Location', label: 'Location' },
          { key: 'DisasterType', label: 'Type' },
          { key: 'SeverityLevel', label: 'Severity', render: (r) => <Pill value={r.SeverityLevel} /> },
          { key: 'Status', label: 'Status', render: (r) => <Pill value={r.Status} /> },
          { key: 'ReportedAt', label: 'Reported', render: (r) => dateTime(r.ReportedAt) },
          { key: 'actions', label: 'Actions', render: (r) => can(roleID, 'reportStatus') ? <select value={r.Status} onChange={(e) => updateStatus(Number(r.ReportID), e.target.value)}>{['Open','InProgress','Resolved'].map((x) => <option key={x}>{x}</option>)}</select> : 'View only' }
        ]} rows={rows} />
      </section>
    </div>
  );
}

function Teams({ data, setData, save }) {
  const [form, setForm] = useState({ reportID: data.reports[0]?.ReportID || '', preferredTeamType: 'Rescue' });
  function submit(event) {
    event.preventDefault();
    save('/api/teams/assign', form, () => {
      setData((prev) => ({ ...prev, teams: prev.teams.map((team) => team.TeamType === form.preferredTeamType && team.Status === 'Available' ? { ...team, Status: 'Assigned', IncidentLocation: prev.reports.find((r) => r.ReportID === Number(form.reportID))?.Location } : team) }));
    });
  }
  return (
    <div className="stack">
      <form className="panel form-grid" onSubmit={submit}>
        <div className="panel-title wide"><h3>Dynamic team assignment</h3></div>
        <Field label="Incident"><select value={form.reportID} onChange={(e) => setForm({ ...form, reportID: e.target.value })}>{data.reports.map((r) => <option key={r.ReportID} value={r.ReportID}>{r.Location} - {r.SeverityLevel}</option>)}</select></Field>
        <Field label="Team type"><select value={form.preferredTeamType} onChange={(e) => setForm({ ...form, preferredTeamType: e.target.value })}>{['Medical','Fire','Rescue'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <button className="primary">Assign available team</button>
      </form>
      <section className="panel">
        <div className="panel-title"><h3>Rescue team status board</h3></div>
        <DataTable columns={[
          { key: 'TeamID', label: 'ID' },
          { key: 'TeamName', label: 'Team' },
          { key: 'TeamType', label: 'Type' },
          { key: 'CurrentLocation', label: 'Location' },
          { key: 'Status', label: 'Status', render: (r) => <Pill value={r.Status} /> },
          { key: 'IncidentLocation', label: 'Assigned incident' }
        ]} rows={data.teams} />
      </section>
    </div>
  );
}

function Resources({ data, setData, save, roleID }) {
  const [form, setForm] = useState({ resourceID: data.resources[0]?.ResourceID || '', reportID: data.reports[0]?.ReportID || '', quantity: 10 });
  function submit(event) {
    event.preventDefault();
    save('/api/resources/request', form, () => {
      const resource = data.resources.find((r) => r.ResourceID === Number(form.resourceID));
      const report = data.reports.find((r) => r.ReportID === Number(form.reportID));
      setData((prev) => ({ ...prev, approvals: [{ ApprovalID: Date.now(), RequestType: 'ResourceAllocation', ReferenceID: Date.now(), Status: 'Pending', RequestedByName: 'Current User', RequestedAt: new Date().toISOString() }, ...prev.approvals], allocations: [{ AllocationID: Date.now(), ResourceType: resource?.ResourceType, ReportID: form.reportID, Location: report?.Location, QuantityAllocated: form.quantity, TotalConsumed: 0, Status: 'Pending', AllocatedAt: new Date().toISOString() }, ...prev.allocations] }));
    });
  }
  return (
    <div className="stack">
      {can(roleID, 'requestResource') && (
        <form className="panel form-grid" onSubmit={submit}>
          <div className="panel-title wide"><h3>Resource allocation request</h3></div>
          <Field label="Resource"><select value={form.resourceID} onChange={(e) => setForm({ ...form, resourceID: e.target.value })}>{data.resources.map((r) => <option key={r.ResourceID} value={r.ResourceID}>{r.ResourceType} - {r.AvailableQuantity}</option>)}</select></Field>
          <Field label="Incident"><select value={form.reportID} onChange={(e) => setForm({ ...form, reportID: e.target.value })}>{data.reports.map((r) => <option key={r.ReportID} value={r.ReportID}>{r.Location} - {r.DisasterType}</option>)}</select></Field>
          <Field label="Quantity"><input type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} /></Field>
          <button className="primary">Send for approval</button>
        </form>
      )}
      <div className="two-col">
        <section className="panel">
          <div className="panel-title"><h3>Warehouse inventory</h3></div>
          <DataTable columns={[
            { key: 'ResourceType', label: 'Resource' },
            { key: 'WarehouseName', label: 'Warehouse' },
            { key: 'AvailableQuantity', label: 'Available' },
            { key: 'ThresholdLevel', label: 'Threshold' },
            { key: 'StockStatus', label: 'Stock', render: (r) => <Pill value={r.StockStatus || (Number(r.AvailableQuantity) <= Number(r.ThresholdLevel) ? 'LOW STOCK' : 'SUFFICIENT')} /> }
          ]} rows={data.resources} />
        </section>
        <section className="panel">
          <div className="panel-title"><h3>Allocation workflow</h3></div>
          <DataTable columns={[
            { key: 'AllocationID', label: 'ID' },
            { key: 'ResourceType', label: 'Resource' },
            { key: 'Location', label: 'Incident' },
            { key: 'QuantityAllocated', label: 'Qty' },
            { key: 'TotalConsumed', label: 'Consumed' },
            { key: 'Status', label: 'Status', render: (r) => <Pill value={r.Status} /> }
          ]} rows={data.allocations} />
        </section>
      </div>
    </div>
  );
}

function Hospitals({ data, setData, save }) {
  const [form, setForm] = useState({ fullName: '', age: 30, condition: 'Stable', reportID: data.reports[0]?.ReportID || '' });
  function submit(event) {
    event.preventDefault();
    save('/api/hospitals/admit', form, () => {
      const hospital = data.hospitals.sort((a, b) => b.AvailableBeds - a.AvailableBeds)[0];
      setData((prev) => ({
        ...prev,
        patients: [{ PatientID: Date.now(), ...form, FullName: form.fullName, Age: form.age, Condition: form.condition, Status: 'Admitted', HospitalName: hospital?.Name, IncidentLocation: prev.reports.find((r) => r.ReportID === Number(form.reportID))?.Location, AdmittedAt: new Date().toISOString() }, ...prev.patients],
        hospitals: prev.hospitals.map((h) => h.HospitalID === hospital?.HospitalID ? { ...h, AvailableBeds: h.AvailableBeds - 1, LoadPercentage: ((h.TotalBeds - h.AvailableBeds + 1) / h.TotalBeds) * 100 } : h)
      }));
    });
    setForm({ ...form, fullName: '' });
  }
  return (
    <div className="stack">
      <form className="panel form-grid" onSubmit={submit}>
        <div className="panel-title wide"><h3>Automated patient admission</h3></div>
        <Field label="Patient name"><input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
        <Field label="Age"><input type="number" min="1" value={form.age} onChange={(e) => setForm({ ...form, age: Number(e.target.value) })} /></Field>
        <Field label="Condition"><select value={form.condition} onChange={(e) => setForm({ ...form, condition: e.target.value })}>{['Stable','Critical','Deceased'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Incident"><select value={form.reportID} onChange={(e) => setForm({ ...form, reportID: e.target.value })}>{data.reports.map((r) => <option key={r.ReportID} value={r.ReportID}>{r.Location} - {r.DisasterType}</option>)}</select></Field>
        <button className="primary">Admit to best hospital</button>
      </form>
      <div className="two-col">
        <section className="panel">
          <div className="panel-title"><h3>Hospital load balancing</h3></div>
          <DataTable columns={[
            { key: 'Name', label: 'Hospital' },
            { key: 'Location', label: 'Location' },
            { key: 'AvailableBeds', label: 'Available' },
            { key: 'TotalBeds', label: 'Total' },
            { key: 'LoadPercentage', label: 'Load', render: (r) => `${Number(r.LoadPercentage || 0).toFixed(1)}%` }
          ]} rows={data.hospitals} />
        </section>
        <section className="panel">
          <div className="panel-title"><h3>Patient admissions</h3></div>
          <DataTable columns={[
            { key: 'FullName', label: 'Patient' },
            { key: 'Condition', label: 'Condition', render: (r) => <Pill value={r.Condition} /> },
            { key: 'Status', label: 'Status', render: (r) => <Pill value={r.Status} /> },
            { key: 'HospitalName', label: 'Hospital' },
            { key: 'AdmittedAt', label: 'Admitted', render: (r) => dateTime(r.AdmittedAt) }
          ]} rows={data.patients} />
        </section>
      </div>
    </div>
  );
}

function Finance({ data, setData, save }) {
  const [form, setForm] = useState({ type: 'Donation', amount: 10000, description: '', reportID: data.reports[0]?.ReportID || '' });
  function submit(event) {
    event.preventDefault();
    save('/api/financial/transactions', form, () => {
      const report = data.reports.find((r) => r.ReportID === Number(form.reportID));
      setData((prev) => ({
        ...prev,
        transactions: [{ TransactionID: Date.now(), Type: form.type, Amount: form.amount, Description: form.description, Location: report?.Location, RecordedBy: 'Current User', Timestamp: new Date().toISOString() }, ...prev.transactions],
        approvals: form.type === 'Expense' ? [{ ApprovalID: Date.now(), RequestType: 'Financial', ReferenceType: 'FinancialTransaction', ReferenceID: Date.now(), Status: 'Pending', RequestedByName: 'Current User', RequestedAt: new Date().toISOString() }, ...prev.approvals] : prev.approvals
      }));
    });
    setForm({ ...form, description: '' });
  }
  return (
    <div className="stack">
      <form className="panel form-grid" onSubmit={submit}>
        <div className="panel-title wide"><h3>Financial transaction entry</h3></div>
        <Field label="Type"><select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{['Donation','Expense','Procurement'].map((x) => <option key={x}>{x}</option>)}</select></Field>
        <Field label="Amount"><input type="number" min="1" value={form.amount} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} /></Field>
        <Field label="Incident"><select value={form.reportID} onChange={(e) => setForm({ ...form, reportID: e.target.value })}>{data.reports.map((r) => <option key={r.ReportID} value={r.ReportID}>{r.Location} - {r.DisasterType}</option>)}</select></Field>
        <Field label="Description"><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
        <button className="primary">Record transaction</button>
      </form>
      <div className="two-col">
        <section className="panel">
          <div className="panel-title"><h3>Financial ledger</h3></div>
          <DataTable columns={[
            { key: 'TransactionID', label: 'ID' },
            { key: 'Type', label: 'Type', render: (r) => <Pill value={r.Type} /> },
            { key: 'Amount', label: 'Amount', render: (r) => money(r.Amount) },
            { key: 'Location', label: 'Incident' },
            { key: 'Timestamp', label: 'Time', render: (r) => dateTime(r.Timestamp) }
          ]} rows={data.transactions} />
        </section>
        <section className="panel">
          <div className="panel-title"><h3>Budget tracking</h3></div>
          <DataTable columns={[
            { key: 'DisasterType', label: 'Disaster' },
            { key: 'FiscalYear', label: 'Year' },
            { key: 'AllocatedAmount', label: 'Allocated', render: (r) => money(r.AllocatedAmount) },
            { key: 'SpentAmount', label: 'Spent', render: (r) => money(r.SpentAmount) },
            { key: 'RemainingAmount', label: 'Remaining', render: (r) => money(r.RemainingAmount) }
          ]} rows={data.budget} />
        </section>
      </div>
    </div>
  );
}

function Approvals({ data, setData, save }) {
  function processApproval(row, action) {
    const budgetID = data.budget[0]?.BudgetID;
    save('/api/approvals/process', { approvalID: row.ApprovalID, action, remarks: `${action} from frontend`, budgetID }, () => {
      setData((prev) => ({ ...prev, approvals: prev.approvals.map((a) => a.ApprovalID === Number(row.ApprovalID) ? { ...a, Status: action === 'Approve' ? 'Approved' : 'Rejected', DecidedAt: new Date().toISOString() } : a) }));
    });
  }
  return (
    <section className="panel">
      <div className="panel-title"><h3>Approval workflow history</h3></div>
      <DataTable columns={[
        { key: 'ApprovalID', label: 'ID' },
        { key: 'RequestType', label: 'Type' },
        { key: 'ReferenceID', label: 'Reference' },
        { key: 'RequestedByName', label: 'Requested by' },
        { key: 'Status', label: 'Status', render: (r) => <Pill value={r.Status} /> },
        { key: 'RequestedAt', label: 'Requested', render: (r) => dateTime(r.RequestedAt) },
        { key: 'actions', label: 'Decision', render: (r) => r.Status === 'Pending' ? <div className="inline-actions"><button onClick={() => processApproval(r, 'Approve')}>Approve</button><button onClick={() => processApproval(r, 'Reject')}>Reject</button></div> : dateTime(r.DecidedAt) }
      ]} rows={data.approvals} />
    </section>
  );
}

function Audit({ data }) {
  return (
    <section className="panel">
      <div className="panel-title"><h3>🔍 Audit & Monitoring Logs</h3></div>
      <DataTable columns={[
        { key: 'LogID', label: 'Log ID' },
        { key: 'FullName', label: 'User' },
        { key: 'ActionType', label: 'Action' },
        { key: 'TableAffected', label: 'Table' },
        { key: 'RecordID', label: 'Record' },
        { key: 'Timestamp', label: 'Timestamp', render: (r) => dateTime(r.Timestamp) }
      ]} rows={data.audit} />
    </section>
  );
}

function MISAnalytics({ data }) {
  const byDisaster = ['Flood','Earthquake','Fire','Heatwave','Cyclone','Landslide','Avalanche'].map(type => ({
    label: type,
    value: data.reports.filter(r => r.DisasterType === type).length
  })).filter(x => x.value > 0);

  const bySeverity = ['Critical','High','Medium','Low'].map(level => ({
    label: level,
    value: data.reports.filter(r => r.SeverityLevel === level).length
  }));

  const byStatus = ['Open','InProgress','Resolved'].map(s => ({
    label: s,
    value: data.reports.filter(r => r.Status === s).length
  }));

  const totalDonations = data.transactions.filter(t => t.Type === 'Donation').reduce((s, t) => s + Number(t.Amount||0), 0);
  const totalExpenses  = data.transactions.filter(t => t.Type !== 'Donation').reduce((s, t) => s + Number(t.Amount||0), 0);
  const totalBeds = data.hospitals.reduce((s, h) => s + Number(h.TotalBeds||0), 0);
  const availBeds = data.hospitals.reduce((s, h) => s + Number(h.AvailableBeds||0), 0);
  const occupancy = totalBeds ? (((totalBeds - availBeds) / totalBeds) * 100).toFixed(1) : 0;
  const avgLoad = data.hospitals.length
    ? (data.hospitals.reduce((s,h) => s + Number(h.LoadPercentage||0), 0) / data.hospitals.length).toFixed(1)
    : 0;

  const resourceRows = data.resources.map(r => ({ label: r.ResourceType, value: r.AvailableQuantity }));

  return (
    <div className="stack">
      <div className="stats-grid">
        <section className="stat-card"><span>Total Incidents</span><strong>{data.reports.length}</strong><small>all time</small></section>
        <section className="stat-card"><span>Net Funds</span><strong style={{fontSize:'22px'}}>{money(totalDonations - totalExpenses)}</strong><small>PKR balance</small></section>
        <section className="stat-card"><span>Hospital Occupancy</span><strong>{occupancy}%</strong><small>avg {avgLoad}% load</small></section>
        <section className="stat-card"><span>Active Teams</span><strong>{data.teams.filter(t => t.Status !== 'Completed').length}</strong><small>of {data.teams.length} total</small></section>
        <section className="stat-card"><span>Pending Approvals</span><strong>{data.approvals.filter(a => a.Status === 'Pending').length}</strong><small>require action</small></section>
        <section className="stat-card"><span>Resources Tracked</span><strong>{data.resources.length}</strong><small>across warehouses</small></section>
      </div>

      <div className="two-col">
        <section className="panel chart-panel">
          <div className="panel-title"><h3>📍 Incidents by Disaster Type</h3></div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={byDisaster}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {byDisaster.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel chart-panel">
          <div className="panel-title"><h3>⚠️ Incidents by Severity</h3></div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={bySeverity}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  nameKey="label"
                >
                  {bySeverity.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="two-col">
        <section className="panel chart-panel">
          <div className="panel-title"><h3>📦 Resource Inventory</h3></div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={resourceRows} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="label" type="category" stroke="var(--muted)" fontSize={11} tickLine={false} axisLine={false} width={80} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {resourceRows.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="panel chart-panel">
          <div className="panel-title"><h3>📋 Reports by Status</h3></div>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={byStatus}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="value"
                  nameKey="label"
                  label={({ label, percent }) => `${label} ${(percent * 100).toFixed(0)}%`}
                >
                  {byStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 4) % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="two-col">
        <section className="panel">
          <div className="panel-title"><h3>💰 Financial Summary by Type</h3></div>
          <DataTable columns={[
            { key: 'DisasterType', label: 'Disaster' },
            { key: 'AllocatedAmount', label: 'Budget', render: r => money(r.AllocatedAmount) },
            { key: 'SpentAmount', label: 'Spent', render: r => money(r.SpentAmount) },
            { key: 'RemainingAmount', label: 'Remaining', render: r => money(r.RemainingAmount) }
          ]} rows={data.budget} />
        </section>
        <section className="panel">
          <div className="panel-title"><h3>🏥 Hospital Load Balancing</h3></div>
          <DataTable columns={[
            { key: 'Name', label: 'Hospital' },
            { key: 'AvailableBeds', label: 'Available' },
            { key: 'TotalBeds', label: 'Total' },
            { key: 'LoadPercentage', label: 'Load %', render: r => `${Number(r.LoadPercentage||0).toFixed(1)}%` }
          ]} rows={data.hospitals} />
        </section>
      </div>

      <section className="panel">
        <div className="panel-title"><h3>📜 Recent Financial Transactions</h3></div>
        <DataTable columns={[
          { key: 'TransactionID', label: 'ID' },
          { key: 'Type', label: 'Type', render: r => <Pill value={r.Type} /> },
          { key: 'Amount', label: 'Amount', render: r => money(r.Amount) },
          { key: 'Description', label: 'Description' },
          { key: 'Timestamp', label: 'Time', render: r => dateTime(r.Timestamp) }
        ]} rows={data.transactions} />
      </section>
    </div>
  );
}

export default App;
