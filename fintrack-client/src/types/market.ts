export enum FrontendAssetType {
    Stock = 0,
    Currency = 1,
    Crypto = 2,
    Index = 3,
    Fund = 4
}
export interface MarketAsset {
    id: number;
    symbol: string; // Kullanıcının gördüğü genel sembol (EUR/USD)
    name: string;
    type: FrontendAssetType;
    exchange?: string;
    currency?: string;
    sourceApi?: string; // "Finnhub", "TwelveData"
    apiSymbol?: string; // API'nin beklediği sembol (OANDA:EUR_USD)
}

export interface AssetPriceInfo {
    symbol: string;
    price: number;
    currency: string; // Fiyatın para birimi
    lastUpdated: string; // ISO Date String
    change?: number;
    changePercent?: number;
}