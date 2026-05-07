import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow border border-gray-100">
        <h1 className="text-xl font-semibold mb-6">@org/app</h1>
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
