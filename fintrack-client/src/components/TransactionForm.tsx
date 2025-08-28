import React, { useState, useEffect, useMemo } from 'react';
import { Box, TextField, Button, Tabs, Tab, CircularProgress, Alert, Typography, FormControl, InputLabel, Select, MenuItem, FormHelperText } from '@mui/material';
import { MarketAsset, AssetPriceInfo } from '../types/market';
import { transactionService, CreateInvestmentTransactionDto } from '../services/transaction.service';
import { accountService } from '../services/account.service';
import { Account } from '../types/account';


interface TransactionFormProps {
    accounts: Account[]; // Değişiklik: Hesap listesi artık prop olarak geliyor
    selectedAsset: MarketAsset | null;
    priceInfo: AssetPriceInfo | null;
    onTransactionSuccess: () => void;
    currencyRates: AssetPriceInfo[]; // Tüm kur listesini al
}

const TransactionForm: React.FC<TransactionFormProps> = ({ accounts, selectedAsset, priceInfo, onTransactionSuccess, currencyRates }) => {
    const [transactionType, setTransactionType] = useState<'Buy' | 'Sell'>('Buy');
    const [quantity, setQuantity] = useState<number | string>('');
    const [totalAmount, setTotalAmount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    // const [accounts, setAccounts] = useState<Account[]>([]);  // artık buna gerek kalmadı, prop olarak alınıyor 
    const [selectedAccountId, setSelectedAccountId] = useState<number | string>('');

    // Değişiklik: Bileşen içindeki hesap çekme useEffect'i kaldırıldı
    // Hesaplar artık prop'tan geliyor. Prop'tan gelen hesaplar değiştiğinde veya ilk geldiğinde, seçili hesabı ayarlanmakta
    useEffect(() => {
        if (accounts.length > 0) {
            // Eğer önceden seçili bir hesap varsa ve hala listedeyse, onu koru
            const isSelectedAccountStillAvailable = accounts.some(acc => acc.id === selectedAccountId);
            if (!isSelectedAccountStillAvailable) {
                 setSelectedAccountId(accounts[0].id);
            }
        } else {
            setSelectedAccountId('');
        }
    }, [accounts, selectedAccountId]);

    useEffect(() => {
        if (priceInfo && typeof quantity === 'number') {
            setTotalAmount(priceInfo.price * quantity);
        } else {
            setTotalAmount(0);
        }
    }, [quantity, priceInfo]);

    useEffect(() => {
        setQuantity('');
        setError(null);
        setSuccess(null);
    }, [selectedAsset]);

    const handleTransaction = async () => {
        if (!selectedAsset || !priceInfo || typeof quantity !== 'number' || quantity <= 0) {
            setError("Lütfen geçerli bir miktar girin.");
            return;
        }
        if (!selectedAccountId) {
            setError("Lütfen bir hesap seçin.");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccess(null);

        const dto: CreateInvestmentTransactionDto = {
            accountId: Number(selectedAccountId),
            marketAssetId: selectedAsset.id,
            quantity: quantity,
            price: priceInfo.price,
            priceCurrency: priceInfo.currency, 
            transactionDate: new Date(),
            transactionType: transactionType,
        };

        try {
            await transactionService.createInvestmentTransaction(dto);
            setSuccess(`İşlem başarılı: ${quantity} adet ${selectedAsset.symbol} ${transactionType === 'Buy' ? 'alındı' : 'satıldı'}.`);
            setQuantity('');
            onTransactionSuccess();     // bu fonksiyon artık InvestmentsPage'de hem portföyü hem de hesapları yenileyecek
        } catch (err: any) {
            const errorMessage = err.response?.data?.message || err.response?.data || "İşlem sırasında bir hata oluştu.";
            setError(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };
    
    const estimatedTryValue = useMemo(() => {
        if (!priceInfo || priceInfo.currency === 'TRY' || !currencyRates) return null;
        
        const conversionRate = currencyRates.find(rate => rate.symbol === `${priceInfo.currency}/TRY`);
        if (conversionRate) {
            return totalAmount * conversionRate.price;
        }
        return null;
    }, [totalAmount, priceInfo, currencyRates]);


    const selectedAccount = useMemo(() => accounts.find(acc => acc.id === selectedAccountId), [accounts, selectedAccountId]);

    if (!selectedAsset || !priceInfo) {
        return <Alert severity="info">Alım-satım yapmak için lütfen bir varlık seçin.</Alert>;
    }

    return (
        <Box>
            <Tabs value={transactionType} onChange={(e, newValue) => setTransactionType(newValue)} centered>
                <Tab label="Alış" value="Buy" />
                <Tab label="Satış" value="Sell" />
            </Tabs>
            <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="h6" textAlign="center">{selectedAsset.name} ({selectedAsset.symbol})</Typography>
                <FormControl fullWidth error={!selectedAccountId && error?.includes('hesap')}>
                    <InputLabel id="account-select-label">İşlem Hesabı</InputLabel>
                    <Select
                        labelId="account-select-label"
                        label="İşlem Hesabı"
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value as number)}
                    >
                        {accounts.map((account) => (
                            <MenuItem key={account.id} value={account.id}>
                                {`${account.name} (${account.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })})`}
                            </MenuItem>
                        ))}
                    </Select>
                    {/* Hata mesajı için yer tutucu */}
                    {!selectedAccountId && <FormHelperText error>{error?.includes('hesap') ? error : ''}</FormHelperText>}
                </FormControl>
                
                {/* GÜNCEL BAKİYE GÖSTERGESİ */}
                {selectedAccount && (
                    <Typography variant="caption" display="block" textAlign="right" sx={{ mt: -1, mb: 1, color: 'text.secondary' }}>
                        Hesap Bakiyesi: {selectedAccount.balance.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </Typography>
                )}

                <TextField
                    label="Miktar"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    fullWidth
                    InputProps={{ inputProps: { min: 0 } }}
                />
                <Typography variant="body2" textAlign="center">
                    Tahmini Toplam: {totalAmount.toLocaleString('tr-TR', { style: 'currency', currency: priceInfo.currency || 'USD', minimumFractionDigits: 2, maximumFractionDigits: 6 })}
                    {estimatedTryValue !== null && (
                        <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                            (≈ {estimatedTryValue.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })})
                        </Typography>
                    )}
                </Typography>
                <Button
                    variant="contained"
                    color={transactionType === 'Buy' ? 'success' : 'error'}
                    onClick={handleTransaction}
                    disabled={isLoading || typeof quantity !== 'number' || quantity <= 0}
                    startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {transactionType === 'Buy' ? 'Satın Al' : 'Satış Yap'}
                </Button>
                {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ mt: 1 }}>{success}</Alert>}
            </Box>
        </Box>
    );
};

export default TransactionForm;
