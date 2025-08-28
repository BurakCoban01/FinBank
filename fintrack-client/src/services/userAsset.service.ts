// Konum: fintrack-client/src/services/userAsset.service.ts
import { api } from './api';
import { MarketAsset } from '../types/market';

export const userAssetService = {
    /*
     * Giriş yapmış kullanıcının veritabanında kayıtlı takip listesini getirir
     */
    getTrackedAssets: async (): Promise<MarketAsset[]> => {
        const response = await api.get<MarketAsset[]>('/user/assets');
        return response.data;
    },

    /*
     * Kullanıcının takip listesine yeni bir varlık ekler
     * symbol: Eklenecek varlığın sembolü (örn: "TSLA")
     */
    addAssetToWatchlist: async (symbol: string): Promise<MarketAsset> => {
        const encodedSymbol = encodeURIComponent(symbol);
        const response = await api.post<MarketAsset>(`/user/assets/${encodedSymbol}`);
        return response.data;
    },

    /*
     * Kullanıcının takip listesinden bir varlığı siler
     * symbol: Silinecek varlığın sembolü
     */
    removeAssetFromWatchlist: async (symbol: string): Promise<void> => {
        const encodedSymbol = encodeURIComponent(symbol);
        await api.delete(`/user/assets/${encodedSymbol}`);
    },
};