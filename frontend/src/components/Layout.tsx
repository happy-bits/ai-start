import { Outlet } from 'react-router-dom';

import TopNav from './TopNav';

export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen">
      <header role="banner">
        <TopNav />
      </header>
      <main className="flex-1 overflow-auto" role="main">
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

