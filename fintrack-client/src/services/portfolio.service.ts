// Konum: fintrack-client/src/services/portfolio.service.ts
import { PortfolioSummary } from '../types/portfolio';
import api from './api';

const getPortfolioSummary = async (): Promise<PortfolioSummary> => {
    const response = await api.get<PortfolioSummary>('/portfolio/summary');
    return response.data;
};

export const portfolioService = {
    getPortfolioSummary,
};
