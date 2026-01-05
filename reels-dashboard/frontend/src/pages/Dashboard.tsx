import { Routes, Route } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import Overview from './Overview';
import Approvals from './Approvals';
import Accounts from './Accounts';
import Analytics from './Analytics';
import Workflows from './Workflows';
import Logs from './Logs';
import Settings from './Settings';

export default function Dashboard() {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<Overview />} />
        <Route path="/approvals" element={<Approvals />} />
        <Route path="/accounts" element={<Accounts />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/workflows" element={<Workflows />} />
        <Route path="/logs" element={<Logs />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </DashboardLayout>
  );
}
