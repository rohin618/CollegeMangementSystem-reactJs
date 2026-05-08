import { createSlice } from '@reduxjs/toolkit';
import {
	fetchUsers,
	createSingleUserThunk,
	createBulkUsersThunk,
	updateUserThunk,
	deleteUserThunk,
} from './userThunk';

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

const initialState: IUserState = {
	users: [],
	loading: false,
	error: null,
};

const userSlice = createSlice({
	name: 'users',
	initialState,
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchUsers.pending, (state) => {
				state.loading = true;
				state.error = null;
			})

			.addCase(fetchUsers.fulfilled, (state, action) => {
				state.loading = false;
				state.users = action.payload;
			})

			.addCase(fetchUsers.rejected, (state, action) => {
				state.loading = false;
				state.error = action.payload as string;
			})

			.addCase(createSingleUserThunk.fulfilled, (state, action) => {
				state.users.push(action.payload);
			})

			.addCase(createBulkUsersThunk.fulfilled, (state, action) => {
				state.users.push(...action.payload);
			})

			.addCase(updateUserThunk.fulfilled, (state, action) => {
				const index = state.users.findIndex(
					(u) => u.id === action.payload.id,
				);

				if (index !== -1) {
					state.users[index] = action.payload;
				}
			})

			.addCase(deleteUserThunk.fulfilled, (state, action) => {
				state.users = state.users.filter(
					(u) => u.id !== action.payload,
				);
			});
	},
});

export default userSlice.reducer;