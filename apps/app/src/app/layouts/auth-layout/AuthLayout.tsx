import { Outlet } from 'react-router-dom';
import { Card } from '@org/ui';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">@org/app</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back</p>
        </div>
        <Card className="rounded-xl p-8">
          <Outlet />
        </Card>
      </div>
    </div>
  );
}

export default AuthLayout;
