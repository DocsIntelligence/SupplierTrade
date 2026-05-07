import {
  logoutThunk,
  selectUser,
  useAppDispatch,
  useAppSelector,
} from '@org/store';
import { UserAvatar as Avatar, Button } from '@org/ui';
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/dashboard" className="text-lg font-semibold text-gray-900">
            @org/app
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Avatar name={user?.name} size="sm" />
              <span className="text-sm text-gray-700 hidden sm:inline">
                {user?.email}
              </span>
            </div>
            <Link
              to="/settings"
              className="text-sm text-foreground/70 hover:text-foreground"
            >
              Settings
            </Link>
            <Button variant="ghost" size="sm" onClick={onLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

export default MainLayout;
