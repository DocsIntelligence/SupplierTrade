import { selectUser, useAppSelector } from '@org/store';

export function Dashboard() {
  const user = useAppSelector(selectUser);
  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-semibold">Welcome, {user?.name}</h2>
      <p className="text-gray-600">
        You are signed in as <strong>{user?.email}</strong> ({user?.role}).
      </p>
    </section>
  );
}

export default Dashboard;
