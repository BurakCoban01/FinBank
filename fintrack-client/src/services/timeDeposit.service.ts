// Konum: fintrack-client/src/services/timeDeposit.service.ts
import { api } from './api';
import { TimeDeposit, CreateTimeDepositRequest } from '../types/timeDeposit';

export const timeDepositService = {
    getMyDeposits: async (): Promise<TimeDeposit[]> => {
        const response = await api.get<TimeDeposit[]>('/timedeposits');
        return response.data;
    },
    createDeposit: async (request: CreateTimeDepositRequest): Promise<TimeDeposit> => {
        const response = await api.post<TimeDeposit>('/timedeposits', request);
        return response.data;
    },

    closeDepositEarly: async (depositId: number): Promise<void> => {
        // Backend'deki endpoint'e POST isteği atıyoruz.
        await api.post(`/timedeposits/${depositId}/close-early`);
    },

    getDepositRates: async (): Promise<any[]> => {
        const response = await api.get<any[]>('/timedeposits/rates');
        return response.data;
    },
};