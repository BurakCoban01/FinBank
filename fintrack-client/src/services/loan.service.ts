// Konum: fintrack-client/src/services/loan.service.ts
import { api } from './api';
import { Loan, CreateLoanRequest } from '../types/loan';

export const loanService = {
    getMyLoans: async (): Promise<Loan[]> => {
        const response = await api.get<Loan[]>('/loans');
        return response.data;
    },
    createLoan: async (request: CreateLoanRequest): Promise<Loan> => {
        const response = await api.post<Loan>('/loans', request);
        return response.data;
    },
};