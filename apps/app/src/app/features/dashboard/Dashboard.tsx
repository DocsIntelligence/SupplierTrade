import { selectUser, useAppSelector } from '@org/store';
import { UserAvatar as Avatar, Card } from '@org/ui';

export function Dashboard() {
  const user = useAppSelector(selectUser);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Welcome back, {user?.name}</p>
      </div>

      <Card className="rounded-xl p-8">
        <div className="flex items-center gap-4">
          <Avatar name={user?.name} size="lg" />
          <div>
            <p className="font-medium text-gray-900">{user?.name}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
              {user?.role}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Dashboard;
