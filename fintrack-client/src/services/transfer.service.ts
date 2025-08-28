// src/services/transfer.service.ts
import api from './api';
import { UserTransferRequestDto, InternalTransferDto } from '../types/transfer';
import { Transaction } from '../types/transaction';

const API_URL = '/transfers';

const verifyIban = async (iban: string): Promise<{ name: string }> => {
    const response = await api.get<{ name: string }>(`${API_URL}/verify-iban/${iban}`);
    return response.data;
};

const transferToAnotherUser = async (data: UserTransferRequestDto): Promise<Transaction> => {
    const response = await api.post<Transaction>(`${API_URL}/user-to-user`, data);
    return response.data;
};

const transferBetweenOwnAccounts = async (data: InternalTransferDto): Promise<Transaction> => {
    const response = await api.post<Transaction>(`${API_URL}/internal`, data);
    return response.data;
};

export const transferService = {
    verifyIban,
    transferToAnotherUser,
    transferBetweenOwnAccounts,
};
