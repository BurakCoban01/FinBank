// FinTrack.API/fintrack-client/src/services/market.service.ts
import { api } from './api';
import { MarketAsset, AssetPriceInfo } from '../types/market';

export const marketService = {
    /*
     * Backend'den varsayılan ve kullanıcının takip ettiği varlıkların listesini alır
     * Bu liste, Takip Listesini doldurmak için kullanılır
     */
    getTrackedAndDefaultAssets: async (): Promise<MarketAsset[]> => {
        const response = await api.get<MarketAsset[]>('/marketdata/assets');
        return response.data;
    },

    /*
     * Bir varlığın fiyatını almak için merkezi ve tek fonksiyondur
     * Backend, sembole göre doğru API kaynağını (Finnhub/TwelveData) kendisi seçecektir
     * symbol: Fiyatı istenen varlığın sembolü (örn: "AAPL", "BTC/USD", "EUR/USD")
     */
    getAssetPrice: async (symbol: string): Promise<AssetPriceInfo> => {
        // Sembol, slash ('/') gibi özel karakterler içerebileceğinden URL'de güvenli olması için encode edilmelidir
        const encodedSymbol = encodeURIComponent(symbol);
        const response = await api.get<AssetPriceInfo>(`/marketdata/price/${encodedSymbol}`);
        return response.data;
    },

    /**
     * Belirtilen baz para birimine göre döviz kurlarını getirir
     * Varsayılan olarak TRY bazlı kurları (TCMB) getirir
     */
    getCurrencyRates: async (baseCurrency: string = "TRY"): Promise<AssetPriceInfo[]> => {
        const response = await api.get<AssetPriceInfo[]>(`/marketdata/currency/rates/${baseCurrency}`);
        return response.data;
    },

    /*
     * Kullanıcının girdiği metne göre varlıkları arar
     * query: Aranacak metin (örn: "Apple", "bitcoin")
     */
    searchAssets: async (query: string): Promise<MarketAsset[]> => {
        const response = await api.get<MarketAsset[]>('/marketdata/search', { params: { query } });
        return response.data;
    },
};

