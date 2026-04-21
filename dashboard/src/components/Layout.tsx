import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import AICopilot from './AICopilot';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-surface">
        <div className="mx-auto max-w-7xl px-6 py-8">
          <Outlet />
        </div>
      </main>
      <AICopilot />
    </div>
  );
}
