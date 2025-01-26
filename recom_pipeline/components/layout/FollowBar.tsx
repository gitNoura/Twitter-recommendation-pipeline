import { useEffect, useState } from 'react';
import useUsers from '@/hooks/useUsers';
import Avatar from '../Avatar';
import useCurrentUser from '@/hooks/useCurrentUser';

const FollowBar = () => {
  const { data: currentUser, isLoading } = useCurrentUser();
  const { data: users = [] } = useUsers();
  const [auth, setAuth] = useState(false);

  useEffect(() => {
    if (currentUser) {
      setAuth(true);
    }
  }, [currentUser]);

  if (!auth || isLoading || users.length === 0) {
    return null;
  }

  return (
    <div className="px-6 py-4 hidden lg:block">
      <div className="bg-neutral-800 rounded-xl p-4">
        <h2 className="text-white text-xl font-semibold">To follow for {currentUser.username}</h2>
        <div className="flex flex-col gap-6 mt-4">
          {users.map((user: Record<string, any>) => (
            <div key={user._id} className="flex flex-row gap-4">
              <Avatar userId={user._id} />
              <div className="flex flex-col">
                <p className="text-white font-semibold text-sm">{user.name}</p>
                <p className="text-neutral-400 text-sm">@{user.username}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FollowBar;
