// Konum: fintrack-client/src/types/portfolio.ts
import { FrontendAssetType } from './market';

/*
 * Kullanıcının sahip olduğu tek bir varlığın pozisyon detayları
 * Backend'deki AssetPositionDto'ya karşılık gelir
 */
export interface AssetPosition {
    marketAssetId: number;
    symbol: string;
    name: string;
    type: FrontendAssetType;
    quantity: number;
    averageCost: number;
    totalCost: number;
    currentPrice: number;
    currentValue: number;
    profitLoss: number;
    profitLossPercentage: number;
}

/*
 * Kullanıcının tüm yatırım portföyünün özeti
 * Backend'deki PortfolioSummaryDto'ya karşılık gelir
 */
export interface PortfolioSummary {
    totalValue: number;
    totalCost: number;
    totalProfitLoss: number;
    totalProfitLossPercentage: number;
    positions: AssetPosition[];
}
