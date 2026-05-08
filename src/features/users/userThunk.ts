import { createAsyncThunk } from '@reduxjs/toolkit';

import {
    getAllUsers,
    createUser,
    createBulkUsers,
    updateUser,
    deleteUserById
} from '../../common/api/userManagement';

export const fetchUsers = createAsyncThunk(
    'users/fetchUsers',
    async (_, thunkAPI) => {
        try {
            return await getAllUsers();
        } catch (error) {
            return thunkAPI.rejectWithValue('Failed to fetch users');
        }
    },
);

export const createSingleUserThunk = createAsyncThunk(
    'users/createSingle',
    async (body: any, thunkAPI) => {
        try {
            return await createUser(body);
        } catch {
            return thunkAPI.rejectWithValue('Create failed');
        }
    },
);

export const createBulkUsersThunk = createAsyncThunk(
    'users/createBulk',
    async (users: any[], thunkAPI) => {
        try {
            return await createBulkUsers(users);
        } catch {
            return thunkAPI.rejectWithValue('Bulk create failed');
        }
    },
);

export const updateUserThunk = createAsyncThunk(
    'users/update',
    async ({ id, body }: any, thunkAPI) => {
        try {
            return await updateUser(id, body);
        } catch {
            return thunkAPI.rejectWithValue('Update failed');
        }
    },
);

export const deleteUserThunk = createAsyncThunk(
    'users/delete',
    async (id: number, thunkAPI) => {
        try {
            await deleteUserById(id);
            return id;
        } catch {
            return thunkAPI.rejectWithValue('Delete failed');
        }
    },
);