// Konum: fintrack-client/src/services/calculation.service.ts
import { api } from './api';
import { LoanCalculationRequest, LoanCalculationResponse } from '../types/loan';
import { DepositCalculationRequest, DepositCalculationResponse } from '../types/timeDeposit';

const calculateLoan = async (request: LoanCalculationRequest): Promise<LoanCalculationResponse> => {
    const response = await api.post<LoanCalculationResponse>('/calculations/loan', request);
    return response.data;
};

const calculateDeposit = async (request: DepositCalculationRequest): Promise<DepositCalculationResponse> => {
    const response = await api.post<DepositCalculationResponse>('/calculations/deposit', request);
    return response.data;
};

export const calculationService = {
    calculateLoan,
    calculateDeposit,
};
