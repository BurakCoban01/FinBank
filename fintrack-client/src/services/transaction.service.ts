
import { api } from './api';
import {
    Transaction,
    CreateTransactionRequest,
    UpdateTransactionRequest,
    TransactionSummary,
    CreateDepositWithdrawalRequest
} from '../types/transaction';

// Yatırım işlemi için DTO
export interface CreateInvestmentTransactionDto {
    accountId: number;
    marketAssetId: number;
    quantity: number;
    price: number;
    priceCurrency: string; // Yeni:Fiyatın para birimini ekle
    transactionDate: Date;
    transactionType: 'Buy' | 'Sell';
}

// Transfer işlemi için DTO
export interface CreateTransferDto {
    fromAccountId: number;
    toAccountId: number;
    amount: number;
    description?: string;
}

export const transactionService = {
    getTransactions: async (params?: { accountId?: number }): Promise<Transaction[]> => {
        const response = await api.get<Transaction[]>('/transactions', { params });
        return response.data;
    },
    getTransactionById: async (id: number): Promise<Transaction> => {
        const response = await api.get<Transaction>(`/transactions/${id}`);
        return response.data;
    },
    getSummary: async (): Promise<TransactionSummary> => {
        const response = await api.get<TransactionSummary>('/transactions/summary');
        return response.data;
    },
    createTransaction: async (transaction: CreateTransactionRequest): Promise<Transaction> => {
        const response = await api.post<Transaction>('/transactions', transaction);
        return response.data;
    },
    createInvestmentTransaction: async (data: CreateInvestmentTransactionDto): Promise<Transaction> => {
        const response = await api.post<Transaction>('/transactions/investment', data);
        return response.data;
    },
    createTransfer: async (data: CreateTransferDto): Promise<{ fromTransaction: Transaction, toTransaction: Transaction }> => {
        const response = await api.post('/transactions/transfer', data);
        return response.data;
    },
    updateTransaction: async (id: number, transaction: UpdateTransactionRequest): Promise<void> => {
        await api.put(`/transactions/${id}`, transaction);
    },
    deleteTransaction: async (id: number): Promise<void> => {
        await api.delete(`/transactions/${id}`);
    },
    deposit: async (depositData: CreateDepositWithdrawalRequest): Promise<Transaction> => {
        const response = await api.post<Transaction>('/transactions/deposit', depositData);
        return response.data;
    },
    withdraw: async (withdrawalData: CreateDepositWithdrawalRequest): Promise<Transaction> => {
        const response = await api.post<Transaction>('/transactions/withdraw', withdrawalData);
        return response.data;
    }
};
