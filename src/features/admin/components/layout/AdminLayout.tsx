import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export const AdminLayout = () => {
  return (
    <div className="flex min-h-screen bg-brand-light font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col">
        <AdminHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-brand-light p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
