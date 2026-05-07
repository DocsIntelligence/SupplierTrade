import {
  logoutThunk,
  selectUser,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { Link, Outlet, useNavigate } from 'react-router-dom';

export function MainLayout() {
  const user = useAppSelector(selectUser);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const onLogout = async () => {
    await dispatch(logoutThunk());
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/dashboard" className="font-semibold">
            @org/app
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600">{user?.email}</span>
            <button
              type="button"
              onClick={onLogout}
              className="text-red-600 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
