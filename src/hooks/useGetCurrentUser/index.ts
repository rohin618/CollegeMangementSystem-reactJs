import { useState, useEffect } from 'react';
import { getStorage } from '../../helpers/helpers';
import { EXIST_SESSION_STORAGE_NAMES } from '../../common/constant';
import { useLocalStorageSubscribe } from '../useLocalStorageSubscribe';

export const useGetCurrentUser = () => {
  const [user, setUser] = useState<any>(null);


  const loadUser = () => {
    const storedUser = getStorage(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);
    if (storedUser) {
      setUser(storedUser);
    }
  };

  useLocalStorageSubscribe((event: any) => {
    if (event.key === EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO) {
      setUser(JSON.parse(event.newValue));
    }
  });

  useEffect(() => {
    loadUser()
  }, []);

  return user;
};
