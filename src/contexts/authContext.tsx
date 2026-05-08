import React, {
	createContext,
	FC,
	ReactNode,
	useContext,
	useEffect,
	useState,
} from 'react';
import { loginUser } from '../common/api/login';

interface IUser {
	username?: string;
	role?: string;
	passwordChanged: boolean;
	token: string;
}

export interface IAuthContextProps {
	user: IUser | null;
	loading: boolean;
	login: (email: string, password: string) => Promise<boolean>;
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

export const AuthContextProvider: FC<IAuthContextProviderProps> = ({
	children,
}) => {
	const [user, setUser] = useState<IUser | null>(null);
	const [loading, setLoading] = useState(true);

	// Restore login after refresh
	useEffect(() => {
		const storedUser = localStorage.getItem('user');

		if (storedUser) {
			setUser(JSON.parse(storedUser));
		}

		setLoading(false);
	}, []);

	// REAL API LOGIN
	const login = async (email: string, password: string): Promise<boolean> => {
		try {
			const response = await loginUser({
				email,
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

			localStorage.setItem('user', JSON.stringify(loggedInUser));
			localStorage.setItem('token', response.token);

			return true;
		} catch (error) {
			console.error('Login failed:', error);
			return false;
		}
	};

	const logout = () => {
		setUser(null);

		localStorage.removeItem('user');
		localStorage.removeItem('token');
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