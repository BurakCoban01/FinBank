
import React, { useState, useEffect, useCallback, KeyboardEvent } from 'react';
import { useLocation } from 'react-router-dom';
import {
    Container, Typography, Paper, CircularProgress, Alert, Box,
    Button, TextField, Divider, Chip, FormControl, InputLabel, Autocomplete, Stack,
    IconButton, Tooltip, Menu, MenuItem, 
    TableContainer,
    Table,
    TableHead,
    TableRow,
    TableCell,
    TableBody
} from '@mui/material';
import { marketService } from '../services/market.service';

import { userAssetService } from '../services/userAsset.service';

import { portfolioService } from '../services/portfolio.service';
import { PortfolioSummary, AssetPosition } from '../types/portfolio';

import { MarketAsset, AssetPriceInfo, FrontendAssetType } from '../types/market';
import {
    ShowChart, Search as SearchIcon, PriceChange, AttachMoney, CurrencyBitcoin,
    AddCircleOutline as AddAssetIcon,
    DeleteForever as DeleteIcon, // Daha belirgin silme ikonu
    MoreVert as MoreVertIcon, // Kaynak seçimi için
    TrendingUp as TrendingUpIcon,
    TrendingDown as TrendingDownIcon,
} from '@mui/icons-material';
import { format, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale'; // Türkçe lokalizasyon için (gerekirse)
import TransactionForm from '../components/TransactionForm';
import { accountService } from '../services/account.service';
import { Account } from '../types/account';
import PortfolioPieChart from '../components/PortfolioPieChart';

const InvestmentsPage: React.FC = () => {
    const location = useLocation();

    const [trackedAssets, setTrackedAssets] = useState<MarketAsset[]>([]);
    const [selectedAsset, setSelectedAsset] = useState<MarketAsset | null>(null);
    
    const [displayedPriceInfo, setDisplayedPriceInfo] = useState<AssetPriceInfo | null>(null);
    const [currencyRates, setCurrencyRates] = useState<AssetPriceInfo[]>([]);

    const [loadingInitial, setLoadingInitial] = useState(true); // Sadece ilk yükleme için
    const [loadingPrice, setLoadingPrice] = useState(false);
    const [error, setError] = useState<string | null>(null); // Genel sayfa hataları
    const [priceError, setPriceError] = useState<string | null>(null); // Fiyat alma hataları

    const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary | null>(null);
    const [loadingPortfolio, setLoadingPortfolio] = useState(true);

    const [searchQuery, setSearchQuery] = useState<string>("");
    const [searchResults, setSearchResults] = useState<MarketAsset[]>([]);
    const [loadingSearch, setLoadingSearch] = useState<boolean>(false);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [sourceMenuAsset, setSourceMenuAsset] = useState<MarketAsset | null>(null);
    const [accounts, setAccounts] = useState<Account[]>([]);

    // Hesapları çeken fonksiyon
    const fetchAccounts = useCallback(async () => {
        try {
            const userAccounts = await accountService.getAccounts();
            const activeAccounts = userAccounts.filter(acc => acc.isActive);

            // Hesapları sırala: Önce Banka, sonra Yatırım, sonra diğerleri alfabetik
            const typeOrder = (type: string) => {
                switch (type) {
                    case 'Banka': return 1;
                    case 'Yatırım': return 2;
                    default: return 3;
                }
            };

            const sortedAccounts = activeAccounts.sort((a, b) => {
                const orderA = typeOrder(a.accountType);
                const orderB = typeOrder(b.accountType);
                if (orderA !== orderB) {
                    return orderA - orderB;
                }
                return a.name.localeCompare(b.name); // Aynı türdekileri isme göre sırala
            });

            setAccounts(sortedAccounts);
        } catch (err) {
            setError("Hesaplar yüklenemedi.");
        }
    }, []);


    const getAssetIcon = (type: FrontendAssetType | undefined) => { // type undefined olabilir
        if (type === undefined) return <PriceChange fontSize="small" sx={{ color: 'action.active' }} />;
        switch (type) {
            case FrontendAssetType.Stock: return <ShowChart fontSize="small" sx={{ color: 'action.active' }} />;
            case FrontendAssetType.Currency: return <AttachMoney fontSize="small" sx={{ color: 'action.active' }} />;
            case FrontendAssetType.Crypto: return <CurrencyBitcoin fontSize="small" sx={{ color: 'action.active' }} />;
            default: return <PriceChange fontSize="small" sx={{ color: 'action.active' }} />;
        }
    };

    // Sayfa ilk yüklendiğinde çalışacak ana veri çekme fonksiyonu
    const fetchInitialData = useCallback(async () => {
        setLoadingInitial(true);
        setError(null);
        try {
            // Artık direkt backend'den kullanıcının kendi listesini çekiyoruz.
            const userAssets = await userAssetService.getTrackedAssets();
            setTrackedAssets(userAssets);

            const locationState = location.state as { selectedSymbol?: string };
            if (locationState?.selectedSymbol) {
                const assetToSelect = userAssets.find(asset => asset.symbol === locationState.selectedSymbol);
                if (assetToSelect) {
                    setSelectedAsset(assetToSelect);
                }
            } else if (userAssets.length > 0 && !selectedAsset) {
                setSelectedAsset(userAssets[0]);
            }
            
            // TRY kurlarını çek
            const tryRatesData = await marketService.getCurrencyRates("TRY");
            setCurrencyRates(tryRatesData);
            await fetchAccounts(); // hesapları çek
            //Portföy özetini de ilk yüklemede çek
            setLoadingPortfolio(true);
            try {
                const summary = await portfolioService.getPortfolioSummary();
                console.log("Portfolio Summary Received:", summary); // Gelen veriyi logla
                
                setPortfolioSummary(summary);
            } catch (err) {
                console.error("Error fetching portfolio summary:", err); // Hatayı logla
                setError("Portföy özeti ve hesaplar yüklenemedi.");
            } finally {
                setLoadingPortfolio(false);
            }

        } catch (err: any) {
            setError(err.response?.data?.message || "Başlangıç verileri yüklenemedi.");
        } finally {
            setLoadingInitial(false);
            setLoadingPortfolio(false);
        }
        
    }, [selectedAsset]); // selectedAsset'e bağımlılık kaldırıldı, sadece ilk yüklemede çalışmalı
    useEffect(() => {
        fetchInitialData();
    }, [fetchAccounts]); 

    
    /**
     * Seçili varlığın fiyatını getiren sadeleştirilmiş fonksiyon.
     * Artık varlığın türünü (hisse, kripto vs.) bilmesine gerek yok.
     */
    const fetchSelectedAssetPrice = useCallback(async () => {
        if (!selectedAsset) {
            setDisplayedPriceInfo(null);
            setPriceError(null);
            return;
        }
        setLoadingPrice(true);
        setPriceError(null);
        try {
            // Sadece tek bir genel endpoint'i çağırıyoruz. Backend gerisini hallediyor
            const data = await marketService.getAssetPrice(selectedAsset.symbol);
            setDisplayedPriceInfo(data);
        } catch (err: any) {
            console.error(`Error fetching price for ${selectedAsset.symbol}:`, err);
            const errorMessage = err.response?.data?.message || `Fiyat bilgisi (${selectedAsset.symbol}) alınamadı.`;
            setPriceError(errorMessage);
            setDisplayedPriceInfo(null);
        } finally {
            setLoadingPrice(false);
        }
    }, [selectedAsset]);

    // selectedAsset her değiştiğinde fiyatı yeniden çek
    useEffect(() => {
        fetchSelectedAssetPrice();
    }, [fetchSelectedAssetPrice]);


    const handleSearchAssets = useCallback(async () => {
        if (!searchQuery.trim() || searchQuery.trim().length < 2) {
            setSearchResults([]);
            return;
        }
        setLoadingSearch(true);
        try {
            const results = await marketService.searchAssets(searchQuery);


            const sortedResults = results.sort((a, b) => {
            // Önce enstrüman tipine göre (Kripto > Döviz > Hisse)
            const typeOrder = (type: FrontendAssetType | undefined) => {
                if (type === FrontendAssetType.Crypto) return 1;
                if (type === FrontendAssetType.Currency) return 2;
                if (type === FrontendAssetType.Stock) return 3;
                return 4;
            };
            if (typeOrder(a.type) !== typeOrder(b.type)) {
                return typeOrder(a.type) - typeOrder(b.type);
            }
            // Sonra popüler borsalara göre (örnek)
            const popularExchanges = ["NASDAQ", "NYSE", "BINANCE", "COINBASE PRO", "OANDA", "TCMB", "METAL"];
            const aIsPopular = popularExchanges.includes(a.exchange?.toUpperCase() || "");
            const bIsPopular = popularExchanges.includes(b.exchange?.toUpperCase() || "");
            if (aIsPopular !== bIsPopular) {
                return aIsPopular ? -1 : 1;
            }
            // Son olarak isme göre
            return (a.name || "").localeCompare(b.name || "");
        });
        setSearchResults(sortedResults.map(r => ({ ...r, id: r.id || Date.now() + Math.random() }))); // ID yoksa ata
            // Arama sonuçlarına geçici ID'ler atayalım (eğer backend ID vermiyorsa)

        } catch (err) {
            console.error("Error searching assets:", err);
            setSearchResults([]);
        } finally {
            setLoadingSearch(false);
        }
    }, [searchQuery]);

    const handleSearchInputKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key === 'Enter') {
            event.preventDefault(); // Form submit'i engelle (eğer Autocomplete bir form içindeyse)
            handleSearchAssets();
        }
    };

    const addAssetToTrackedList = async (assetToAdd: MarketAsset) => {
        const isAlreadyTracked = trackedAssets.some(a => a.symbol === assetToAdd.symbol);
       if (isAlreadyTracked) {
            setSelectedAsset(assetToAdd); // Zaten varsa sadece seçili yap
            return;
        }
        try {
            // Backend'e ekleme isteği gönder
            const newTrackedAsset = await userAssetService.addAssetToWatchlist(assetToAdd.symbol);
            // Başarılı olursa, state'i güncelle
            setTrackedAssets(prev => [...prev, newTrackedAsset]);  // artık yeni varlığı listenin sonuna ekliyoruz
            setSelectedAsset(newTrackedAsset); // Yeni ekleneni seç
        } catch (error: any) {
            setError(error.response?.data?.message || "Varlık takip listesine eklenemedi.");
        }
    };

    const removeAssetFromTrackedList = async (symbolToRemove: string) => {
        try {
            // Backend'e silme isteği gönder
            await userAssetService.removeAssetFromWatchlist(symbolToRemove);
            // Başarılı olursa state'i güncelle
            const newTrackedAssets = trackedAssets.filter(asset => asset.symbol !== symbolToRemove);
            setTrackedAssets(newTrackedAssets);
            if (selectedAsset?.symbol === symbolToRemove) {
                setSelectedAsset(newTrackedAssets.length > 0 ? newTrackedAssets[0] : null);
            }
        } catch (error: any) {
             setError(error.response?.data?.message || "Varlık takip listesinden silinemedi.");
        }
    };

    // Veri Kaynağı Seçimi (UI)
    const handleSourceMenuClick = (event: React.MouseEvent<HTMLElement>, asset: MarketAsset) => {
        setAnchorEl(event.currentTarget);
        setSourceMenuAsset(asset);
    };
    const handleSourceMenuClose = () => {
        setAnchorEl(null);
        setSourceMenuAsset(null);
    };
    const handleTransactionSuccess = useCallback(async () => {
        setLoadingPortfolio(true);
        try {
            const [summary] = await Promise.all([
                portfolioService.getPortfolioSummary(),
                fetchAccounts()
            ]);
            setPortfolioSummary(summary);
        } catch (err) {
            setError("Portföy ve hesaplar güncellenemedi.");
        } finally {
            setLoadingPortfolio(false);
        }
    }, [fetchAccounts]);

    const handleSourceSelect = (source: string) => {
        if (sourceMenuAsset) {
            // Kullanıcının seçtiği kaynağı sakla (örn: MarketAsset objesinde veya ayrı bir state'de)
            // ve fiyatı o kaynaktan çekmek için fetchSelectedAssetPrice'ı tetikle
            console.log(`Asset: ${sourceMenuAsset.symbol}, Selected Source: ${source}`);
            // Örnek: setTrackedAssets(prev => prev.map(a => a.symbol === sourceMenuAsset.symbol ? {...a, preferredSource: source } : a));
        }
        handleSourceMenuClose();
    };


    if (loadingInitial) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress size={50} /></Container>
    }

    return (
        <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                    <ShowChart sx={{ mr: 1, fontSize: '2.2rem' }} /> Yatırım Piyasaları
                </Typography>
                <Divider sx={{ my: 2 }} />

                {/* PORTFÖY ÖZETİ BÖLÜMÜ */}
                <Box mb={4}>
                    <Typography variant="h5" component="h2" gutterBottom>Portföy Özeti</Typography>
                    {loadingPortfolio ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>
                    ) : portfolioSummary && portfolioSummary.positions.length > 0 ? (
                <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 3,}}
                            >
                            <Box
                                sx={{
                                flexBasis: { xs: '100%', md: '58%' } /* ~7/12 */, }}
                            >
                                <Paper variant="outlined" sx={{ p: 2, display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" color="text.secondary">TOPLAM DEĞER</Typography>
                                        <Typography variant="h5" fontWeight="bold">{portfolioSummary.totalValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</Typography>
                                    </Box>
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" color="text.secondary">TOPLAM MALİYET</Typography>
                                        <Typography variant="h6">{portfolioSummary.totalCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</Typography>
                                    </Box>
                                    <Box textAlign="center">
                                        <Typography variant="subtitle2" color="text.secondary">TOPLAM K/Z</Typography>
                                        <Typography variant="h6" color={portfolioSummary.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}>
                                            {portfolioSummary.totalProfitLoss.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} ({portfolioSummary.totalProfitLossPercentage.toFixed(2)}%)
                                        </Typography>
                                    </Box>
                                </Paper>
                                <Typography variant="h6" component="h3" gutterBottom sx={{mt: 2}}>Varlıklarım</Typography>
                                <TableContainer component={Paper} variant="outlined">
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Varlık</TableCell>
                                                <TableCell align="right">Miktar</TableCell>
                                                <TableCell align="right">Ort. Maliyet (TRY)</TableCell>
                                                <TableCell align="right">Anlık Fiyat (TRY)</TableCell>
                                                <TableCell align="right">Anlık Değer (TRY)</TableCell>
                                                <TableCell align="right">K/Z (TRY)</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {portfolioSummary.positions.map((pos) => (
                                                <TableRow key={pos.symbol} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                                    <TableCell component="th" scope="row">
                                                        <Typography variant="subtitle2" fontWeight="bold">{pos.symbol}</Typography>
                                                        <Typography variant="caption" color="text.secondary">{pos.name}</Typography>
                                                    </TableCell>
                                                    <TableCell align="right">{pos.quantity.toLocaleString('tr-TR', { maximumFractionDigits: 6 })}</TableCell>
                                                    <TableCell align="right">{pos.averageCost.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</TableCell>
                                                    <TableCell align="right">{pos.currentPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</TableCell>
                                                    <TableCell align="right" sx={{fontWeight: 'bold'}}>{pos.currentValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}</TableCell>
                                                    <TableCell align="right" sx={{ color: pos.profitLoss >= 0 ? 'success.main' : 'error.main', fontWeight: 'medium' }}>
                                                        {pos.profitLoss.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })} ({pos.profitLossPercentage.toFixed(2)}%)
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Box>

                        <Box
                            sx={{
                                
                            flexBasis: { xs: '100%', md: '42%' } /* ~5/12 */,
                            minWidth: 0,
                            }}
                        >
                            <PortfolioPieChart portfolioSummary={portfolioSummary} />
                        </Box>
                        </Box>
                                ) : (
                                    <Alert severity="info">Portföyünüzde gösterilecek bir varlık bulunmuyor. Aşağıdan bir varlık alarak başlayabilirsiniz.</Alert>
                                )}
                            </Box>
                

                <Divider sx={{ my: 3 }}><Typography variant="overline">Piyasalar</Typography></Divider>

                {/* MEVCUT ARAMA VE FİYAT BÖLÜMÜ */}

                {/* Arama ve Takip Listesi Yan Yana */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 3, mb: 3 }}>
                    {/* Arama Bölümü */}
                    <Box sx={{ flex: 2 }}> {/* Arama daha fazla yer kaplasın */}
                        <Typography variant="h6" gutterBottom>Varlık Ara</Typography>
                        <Autocomplete
                            fullWidth
                            freeSolo
                            options={searchResults}
                            getOptionLabel={(option) => typeof option === 'string' ? option : `${option.name} (${option.symbol})`}
                            inputValue={searchQuery}
                            onInputChange={(event, newInputValue, reason) => {
                                if (reason === 'input') {
                                    setSearchQuery(newInputValue);
                                } else if (reason === 'clear') {
                                    setSearchQuery('');
                                    setSearchResults([]); // Arama sonuçlarını da temizle
                                }
                            }}


                            onChange={(event, newValue) => {
                                if (typeof newValue !== 'string' && newValue) {
                                    addAssetToTrackedList(newValue as MarketAsset);
                                    // Seçim yapıldıktan sonra arama kutusunu ve sonuçları temizle.
                                    setSearchQuery(""); 
                                    setSearchResults([]);
                                }
                            }}


                            loading={loadingSearch}
                            onKeyDown={handleSearchInputKeyDown} // Enter ile arama için
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    placeholder="AAPL, Bitcoin, EUR/USD, Altın..."
                                    variant="outlined"
                                    size="small"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingSearch ? <CircularProgress color="inherit" size={20} /> : null}
                                                <IconButton onClick={handleSearchAssets} size="small" disabled={!searchQuery.trim() || loadingSearch} aria-label="ara">
                                                    <SearchIcon />
                                                </IconButton>
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                            renderOption={(props, option) => (
                                <Box component="li" {...props} key={option.id ? option.id : option.symbol + option.name}>
                                    {getAssetIcon(option.type)}
                                    <Typography sx={{ ml: 1, flexGrow: 1 }}>{option.name} <Typography variant="caption" color="textSecondary">({option.symbol})</Typography></Typography>
                                    <Chip label={option.exchange || FrontendAssetType[option.type]} size="small" />
                                     <IconButton size="small" sx={{ml:1}} onClick={(e) => { e.stopPropagation(); addAssetToTrackedList(option); }} aria-label="takibe ekle">
                                        <AddAssetIcon fontSize="small" color="primary"/>
                                    </IconButton>
                                </Box>
                            )}
                            noOptionsText={loadingSearch ? "Aranıyor..." : (searchQuery.length > 1 ? "Sonuç bulunamadı" : "Aramak için en az 2 karakter girin")}
                        />
                    </Box>

                    {/* Takip Listesi */}
                    <Box sx={{ flex: 1, minWidth: 320 }}>
                        <Typography variant="h6" gutterBottom>Takip Listeniz ({trackedAssets.length})</Typography>
                        {trackedAssets.length === 0 && !loadingInitial ? (
                            <Alert severity="info" variant="outlined" sx={{p: 1.5}}>Henüz varlık eklemediniz.</Alert>
                        ) : (
                            <Paper variant="outlined" sx={{ maxHeight: 350, overflow: 'auto' }}>
                                {/* Drag-Drop yapısı olacaksa DragDropContext ve Droppable buraya eklenecek (ileride) */}
                                <Stack divider={<Divider />}>
                                    {/*  Droppable buraya eklenecek  */}
                                    {trackedAssets.map((asset, index) => (
                                        // Draggable buraya eklenecek (ileride)
                                        <Paper
                                            elevation={0} // İç içe Paper'da elevation olmasın
                                            square // Köşeleri kare
                                            // ref={provided.innerRef} {...provided.draggableProps} // dnd için
                                            key={asset.id || asset.symbol}
                                            sx={{
                                                p: 1.5,
                                                display: 'flex',
                                                alignItems: 'center',
                                                cursor: 'pointer',
                                                backgroundColor: selectedAsset?.id === asset.id ? 'action.selected' : 'transparent',
                                                '&:hover': { backgroundColor: 'action.hover' },
                                                gap: 1.5
                                            }}
                                            onClick={() => setSelectedAsset(asset)}
                                        >
                                            {/* <DragIndicator sx={{ cursor: 'grab', color: 'text.disabled', mr:0.5 }} />  İleride */}
                                            {getAssetIcon(asset.type)}
                                            <Box sx={{ flexGrow: 1, textAlign: 'left' }}>

                                                <Typography variant="subtitle1" fontWeight="medium" noWrap>{asset.name}</Typography>
                                                <Typography variant="body2" color="textSecondary" noWrap>{asset.symbol}</Typography>
                                                
                                            </Box>

                                            <Chip label={asset.exchange || FrontendAssetType[asset.type]} size="small" variant="outlined" />
                                            
                                            <Tooltip title="Listeden Kaldır">
                                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); removeAssetFromTrackedList(asset.symbol); }} aria-label="kaldır">
                                                    <DeleteIcon fontSize="small" color="error" />
                                                </IconButton>
                                            </Tooltip>
                                        </Paper>
                                        
                                    ))}
                                </Stack>
                            </Paper>
                        )}
                    </Box>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Fiyat Bilgisi Alanı */}
                <Box sx={{ minHeight: 200, p:1, backgroundColor: 'background.default', borderRadius:1 }}>
                    <Typography variant="h6" gutterBottom>Fiyat Bilgisi {selectedAsset ? `(${selectedAsset.symbol})` : ''}</Typography>
                    {priceError && <Alert severity="error" sx={{ my: 2 }} onClose={() => setPriceError(null)}>{priceError}</Alert>}
                    {loadingPrice && <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}><CircularProgress /></Box>}

                    {displayedPriceInfo && !loadingPrice && (
                        <Paper variant="outlined" sx={{ p: 2, backgroundColor: 'grey.100' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                {selectedAsset && getAssetIcon(selectedAsset.type)}
                                <Typography variant="h5" component="div" sx={{ ml: 1 }}>
                                    {displayedPriceInfo.symbol}
                                    {selectedAsset && selectedAsset.name !== displayedPriceInfo.symbol && ` - ${selectedAsset.name}`}
                                </Typography>
                            </Box>
                            <Typography variant="h3" sx={{ my: 1, color: 'primary.main', fontWeight: 'bold' }}>
                                {displayedPriceInfo.price.toLocaleString(undefined, {
                                    style: 'currency',
                                    currency: displayedPriceInfo.currency || (selectedAsset?.currency || 'USD'),
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: selectedAsset?.type === FrontendAssetType.Currency || selectedAsset?.type === FrontendAssetType.Crypto ? 4 : 2
                                })}
                            </Typography>
                            {displayedPriceInfo.change !== null && displayedPriceInfo.change !== undefined && displayedPriceInfo.changePercent !== null && displayedPriceInfo.changePercent !== undefined && (
                                <Chip
                                    icon={displayedPriceInfo.change >= 0 ? <TrendingUpIcon /> : <TrendingDownIcon />}
                                    label={`${displayedPriceInfo.change > 0 ? '+' : ''}${displayedPriceInfo.change.toFixed(2)} (${displayedPriceInfo.changePercent.toFixed(2)}%)`}
                                    color={displayedPriceInfo.change >= 0 ? 'success' : 'error'}
                                    sx={{ fontWeight: 'medium' }}
                                />
                            )}
                            <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                                Son Güncelleme: {displayedPriceInfo.lastUpdated ? format(parseISO(displayedPriceInfo.lastUpdated), 'dd.MM.yyyy HH:mm:ss') : "Bilinmiyor"}
                            </Typography>
                        </Paper>
                    )}
                    {selectedAsset && !displayedPriceInfo && !loadingPrice && !priceError &&
                        <Alert severity="info" variant="outlined">Seçili varlık ({selectedAsset.symbol}) için anlık fiyat bilgisi bekleniyor veya bulunamadı.</Alert>
                    }
                    {!selectedAsset && !loadingInitial &&
                        <Alert severity="info" variant="outlined">Fiyatını görmek için takip listenizden bir varlık seçin veya yukarıdan arayarak listenize ekleyin.</Alert>
                    }
                </Box>

                {/* Döviz Kurları (TRY Bazlı) */}
                {currencyRates.length > 0 && (
                     <Box mt={3}>
                        <Typography variant="subtitle1" gutterBottom>Döviz Kurları (TRY Bazlı - TCMB)</Typography>
                        <Box sx={{display: 'flex', flexWrap: 'wrap', gap: 1}}>
                            {currencyRates
                                .filter(rate => ["USD/TRY", "EUR/TRY", "GBP/TRY"].includes(rate.symbol))
                                .map(rate => (
                                <Paper
                                    key={rate.symbol}
                                    variant="outlined"
                                    sx={{
                                        p:1,
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        '&:hover': {backgroundColor: 'action.hover'},
                                        flexGrow: 1,
                                        minWidth: 90,
                                        backgroundColor: selectedAsset?.symbol === rate.symbol ? 'action.selected' : 'transparent'
                                    }}
                                    onClick={() => {
                                        const foundAsset = trackedAssets.find(a=>a.symbol === rate.symbol);
                                        if (foundAsset) setSelectedAsset(foundAsset);
                                        else { // Eğer takip listesinde yoksa, geçici olarak seçili yap ve fiyatını göster
                                            const tempAsset: MarketAsset = {id: Date.now(), symbol:rate.symbol, name:rate.symbol, type: FrontendAssetType.Currency, currency: rate.currency, exchange: "TCMB"};
                                            setSelectedAsset(tempAsset); // Bu, takip listesine eklemez, sadece fiyatı gösterir.
                                        }
                                    }}
                                >
                                    <Typography variant="caption" display="block">{rate.symbol.replace("/TRY","")}</Typography>
                                    <Typography variant="body2" fontWeight="bold">{rate.price.toLocaleString('tr-TR', {minimumFractionDigits: 4})}</Typography>
                                </Paper>
                            ))}
                        </Box>
                        <Divider sx={{my:2}}/>
                    </Box>
                )}

                <Divider sx={{ my: 3 }}><Typography variant="overline">Demo Alım / Satım</Typography></Divider>
                <Box sx={{ maxWidth: 500, mx: 'auto' }}>
                    <TransactionForm 
                        accounts={accounts}
                        selectedAsset={selectedAsset}
                        priceInfo={displayedPriceInfo}
                        onTransactionSuccess={handleTransactionSuccess}
                        currencyRates={currencyRates} // Tüm kur listesini gönder
                    />
                </Box>
            </Paper>
        </Container>
    );
};

export default InvestmentsPage;
