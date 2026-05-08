interface IUser {
	id: number;
	username: string;
	email: string;
	role: string;
	isActive: boolean;
}

interface IUserState {
	users: IUser[];
	loading: boolean;
	error: string | null;
}