import { api } from './api';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../types/account';

export const accountService = {
    getAccounts: async (): Promise<Account[]> => {
        const response = await api.get<Account[]>('/accounts');
        return response.data;
    },

    getAccountById: async (id: number): Promise<Account> => {
        const response = await api.get<Account>(`/accounts/${id}`);
        return response.data;
    },

    createAccount: async (account: CreateAccountRequest): Promise<Account> => {
        const response = await api.post<Account>('/accounts', account);
        return response.data;
    },

    updateAccount: async (id: number, account: UpdateAccountRequest): Promise<void> => {
        await api.put(`/accounts/${id}`, account);
    },

    deleteAccount: async (id: number): Promise<void> => {
        await api.delete(`/accounts/${id}`);
    }
};