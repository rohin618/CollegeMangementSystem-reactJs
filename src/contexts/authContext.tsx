import React, { createContext, FC, ReactNode, useContext, useEffect, useState } from 'react';
import { loginUser } from '../common/api/login';
import { EXIST_SESSION_STORAGE_NAMES } from '../common/constant';

interface IUser {
	username?: string;
	role?: string;
	passwordChanged: boolean;
	token: string;
}

export interface IAuthContextProps {
	user: IUser | null;
	loading: boolean;
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => void;
	isAuthenticated: boolean;
}

const AuthContext = createContext<IAuthContextProps>({
	user: null,
	loading: true,
	login: async () => false,
	logout: () => {},
	isAuthenticated: false,
});

export const useAuth = () => useContext(AuthContext);

interface IAuthContextProviderProps {
	children: ReactNode;
}

export const AuthContextProvider: FC<IAuthContextProviderProps> = ({ children }) => {
	const [user, setUser] = useState<IUser | null>(null);
	const [loading, setLoading] = useState(true);

	// Restore login after refresh
	useEffect(() => {
		const storedUser = localStorage.getItem(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);

		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}

		setLoading(false);
	}, []);

	// REAL API LOGIN
	const login = async (username: string, password: string): Promise<boolean> => {
		try {
			const response = await loginUser({
				username,
				password,
			});

			// adjust based on backend response structure
			const loggedInUser: IUser = {
				username: response.username,
				role: response.role,
				passwordChanged: response.passwordChanged,
				token: response.token,
			};

			setUser(loggedInUser);

			localStorage.setItem(
				EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO,
				JSON.stringify(loggedInUser),
			);
			localStorage.setItem(EXIST_SESSION_STORAGE_NAMES.AUTH_TOKEN_CMS, response.token);

			return true;
		} catch (error) {
			console.error('Login failed:', error);
			return false;
		}
	};

	const logout = () => {
		setUser(null);

		localStorage.removeItem(EXIST_SESSION_STORAGE_NAMES.CURRENT_USER_INFO);
		localStorage.removeItem(EXIST_SESSION_STORAGE_NAMES.AUTH_TOKEN_CMS);
		sessionStorage.clear();
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				login,
				logout,
				isAuthenticated: !!user,
			}}>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthContext;
