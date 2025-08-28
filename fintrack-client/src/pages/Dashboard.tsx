// src/pages/Dashboard.tsx
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, Card, CardContent, CardActions, Button, List,
    ListItem, ListItemText, Divider, Chip, CircularProgress, Alert,
    IconButton, Stack, ListItemIcon,
    Avatar, LinearProgress, Skeleton
} from '@mui/material';
import {
    Add as AddIcon,
    TrendingUp as IncomeIcon,
    TrendingDown as ExpenseIcon,
    AccountBalanceWallet as AccountBalanceWalletIcon,
    Savings as NetSavingsIcon,
    ViewList as ViewListIcon,
    Refresh as RefreshIcon,
    CreditScore as CreditScoreIcon,
    Send as SendIcon,
    ShowChart,
    Savings as SavingsIcon,
    Receipt as TransactionIcon,
    AttachMoney as DollarIcon,
    Euro as EuroIcon,
    CurrencyPound as PoundIcon,
    ArrowUpward as ArrowUpwardIcon,
    ArrowDownward as ArrowDownwardIcon,
    OpenInNew as OpenInNewIcon
} from '@mui/icons-material';
import { format, parseISO, subDays } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer, Tooltip,
    BarChart,
    Bar,
    Cell
} from 'recharts';
import { accountService } from '../services/account.service';
import { transactionService } from '../services/transaction.service';
import { loanService } from '../services/loan.service';
import { timeDepositService } from '../services/timeDeposit.service';
import { marketService } from '../services/market.service';
import { userAssetService } from '../services/userAsset.service';
import { Account } from '../types/account';
import { Transaction, TransactionSummary, TransactionType } from '../types/transaction';
import { Loan } from '../types/loan';
import { TimeDeposit } from '../types/timeDeposit';
import { MarketAsset } from '../types/market'; 


const spacing = (factor: number) => `${8 * factor}px`;
/**
 * Dashboard.tsx - Geliştirilmiş ana sayfa
 * - Sağ üstte canlı döviz kutuları (USD/EUR/GBP)
 * - 14 günlük işlem akışı grafiği (Gelir/Gider + diğer tipler, stacked bar)
 * - Daha zengin Hesap kartları ve Son İşlemler listesi
 * - Modern, dikkat çekici hızlı eylem butonları
 *
 * Yapılan düzeltmeler:
 *  - 14 günlük trend AreaChart -> BarChart (stacked), tüm TransactionType serileri eklendi
 *  - Mevduat oranları çubukları max orana göre göreli ölçeklendi
 *  - getTransactionIcon ve getTransactionAmountStyle tüm tipleri kapsayacak şekilde genişletildi
 */

const Dashboard: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
    const [loans, setLoans] = useState<Loan[]>([]);
    const [deposits, setDeposits] = useState<TimeDeposit[]>([]);
    const [trackedAssets, setTrackedAssets] = useState<MarketAsset[]>([]); // State tipi düzeltildi
    const [currencyRates, setCurrencyRates] = useState<any[]>([]);
    const [depositRates, setDepositRates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchDashboardData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [accountsData, transactionsData, loansData, depositsData, trackedAssetsData, currencyRatesData, depositRatesData] = await Promise.all([
                accountService.getAccounts(),
                transactionService.getTransactions(),
                loanService.getMyLoans(),
                timeDepositService.getMyDeposits(),
                userAssetService.getTrackedAssets(),
                marketService.getCurrencyRates('TRY'),
                timeDepositService.getDepositRates(),
            ]);

            const activeAccounts = accountsData.filter((acc: Account) => acc.isActive);
            setAccounts(activeAccounts);

            const sortedTransactions = transactionsData
                .sort((a: Transaction, b: Transaction) => parseISO(b.transactionDate).getTime() - parseISO(a.transactionDate).getTime());

            setAllTransactions(sortedTransactions);
            setRecentTransactions(sortedTransactions.slice(0, 10));

            setLoans(loansData);
            setDeposits(depositsData);
            setTrackedAssets(trackedAssetsData.slice(0, 5));
            setCurrencyRates(currencyRatesData || []);
            setDepositRates(depositRatesData || []);

        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
             if (err.response && err.response.status === 401) {
                navigate('/login');
            } else {
                setError(err.response?.data?.message || 'Dashboard verileri yüklenirken bir hata oluştu.');
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const totalBalance = accounts.reduce((sum, account) => sum + (account.balance ?? 0), 0);
    const totalLoanAmount = loans.reduce((sum, loan) => sum + (loan.principalAmount ?? 0), 0);
    const totalDepositAmount = deposits.reduce((sum, deposit) => sum + (deposit.principalAmount ?? 0), 0);
    const netWorth = totalBalance + totalDepositAmount - totalLoanAmount;

    // Mevduat oranlarında en yükseğe göre ölçekleme
    const maxDepositRate = useMemo(() => {
        const rates = (depositRates || []).map((r: any) => Number(r.rate)).filter((n: number) => !isNaN(n) && n > 0);
        return rates.length ? Math.max(...rates) : 0;
    }, [depositRates]);

    // 14 günlük trend
    const CHART_DAYS = 14;

    const biweeklyChartData = useMemo(() => {
        const SERIES_KEYS = [
            'Gelir', 'Gider',
            'EFT Alım', 'EFT Gönderim',
            'Gelen Transfer', 'Giden Transfer',
            'Yatırım Alış', 'Yatırım Satış',
            'Nakit Yatırma', 'Nakit Çekme'
        ] as const;

        type SeriesKey = typeof SERIES_KEYS[number];

        const days = Array.from({ length: CHART_DAYS }).map((_, idx) => {
            const date = subDays(new Date(), CHART_DAYS - 1 - idx);
            const key = format(date, 'yyyy-MM-dd');
            const label = format(date, 'dd.MM');
            const base: Record<string, any> = { key, date, label };
            SERIES_KEYS.forEach(k => { base[k] = 0; });
            return base;
        });

        const getSeriesKey = (type: TransactionType, amount: number): SeriesKey => {
            switch (type) {
                case TransactionType.Income: return 'Gelir';
                case TransactionType.Expense: return 'Gider';
                case TransactionType.EFTAlim: return 'EFT Alım';
                case TransactionType.EFTGonderim: return 'EFT Gönderim';
                case TransactionType.GelenTransfer: return 'Gelen Transfer';
                case TransactionType.GidenTransfer: return 'Giden Transfer';
                case TransactionType.YatirimAlim: return 'Yatırım Alış';
                case TransactionType.YatirimSatim: return 'Yatırım Satış';
                case TransactionType.NakitYatirma: return 'Nakit Yatırma';
                case TransactionType.NakitCekme: return 'Nakit Çekme';
                default:
                    return amount >= 0 ? 'Gelir' : 'Gider';
            }
        };

        allTransactions.forEach(tx => {
            const txKey = format(parseISO(tx.transactionDate), 'yyyy-MM-dd');
            const slot = days.find(d => d.key === txKey);
            if (!slot) return;
            const seriesKey = getSeriesKey(tx.type, tx.amount);
            slot[seriesKey] += Math.abs(tx.amount || 0);
        });

        return days.map(d => {
            const out: Record<string, any> = { name: d.label };
            SERIES_KEYS.forEach(k => {
                out[k] = Math.round((d[k] || 0) * 100) / 100;
            });
            return out;
        });
    }, [allTransactions]);

    const getIconByCurrency = (symbol: string) => {
        if (symbol.startsWith('USD')) return <DollarIcon color="primary" />;
        if (symbol.startsWith('EUR')) return <EuroIcon color="primary" />;
        if (symbol.startsWith('GBP')) return <PoundIcon color="primary" />;
        return null;
    };

    const getTransactionIcon = (type: TransactionType) => {
        switch (type) {
            case TransactionType.Income: return <IncomeIcon color="success" />;
            case TransactionType.Expense: return <ExpenseIcon color="error" />;
            case TransactionType.GidenTransfer: return <SendIcon color="action" />;
            case TransactionType.GelenTransfer: return <SendIcon color="primary" />;
            case TransactionType.EFTGonderim: return <SendIcon color="error" />;
            case TransactionType.EFTAlim: return <SendIcon color="success" />;
            case TransactionType.YatirimAlim: return <ShowChart color="warning" />;
            case TransactionType.YatirimSatim: return <ShowChart color="info" />;
            case TransactionType.NakitYatirma: return <AccountBalanceWalletIcon color="success" />;
            case TransactionType.NakitCekme: return <AccountBalanceWalletIcon color="error" />;
            default: return <TransactionIcon color="disabled" />;
        }
    };

    const getTransactionAmountStyle = (tx: Transaction) => {
        const inbound = new Set<TransactionType>([
            TransactionType.Income,
            TransactionType.EFTAlim,
            TransactionType.GelenTransfer,
            TransactionType.YatirimSatim,
            TransactionType.NakitYatirma,
        ]);
        const outbound = new Set<TransactionType>([
            TransactionType.Expense,
            TransactionType.EFTGonderim,
            TransactionType.GidenTransfer,
            TransactionType.YatirimAlim,
            TransactionType.NakitCekme,
        ]);

        if (inbound.has(tx.type)) {
            return { color: 'success.main', symbol: '+' };
        }
        if (outbound.has(tx.type)) {
            return { color: 'error.main', symbol: '-' };
        }
        return tx.amount >= 0
            ? { color: 'success.main', symbol: '+' }
            : { color: 'error.main', symbol: '-' };
    };

    const formatCurrency = (value: number, currency = 'TRY') => {
        try {
            return value.toLocaleString('tr-TR', { style: 'currency', currency });
        } catch {
            return `${value.toFixed(2)} ${currency}`;
        }
    };

    const maskAccount = (acc: Account) => {
        // Güvenli fallback: tip tanımınız değişik alanlar içerebilir, bu yüzden any ile kontrol ediyoruz
        const acctNum = (acc as any).accountNumber || (acc as any).iban || (acc as any).number || (acc as any).accountNo || acc.id || acc.name;
        if (!acctNum) return acc.name || '';
        const s = String(acctNum);
        return s.length > 4 ? `**** ${s.slice(-4)}` : s;
    };

    const getCurrencyRate = (symbolPrefix: string) => {
        const found = currencyRates.find((r: any) => r.symbol && r.symbol.startsWith(symbolPrefix));
        return found || null;
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress size={50} />
            </Box>
        );
    }
    if (error) {
        return <Box sx={{p: spacing(2)}}><Alert severity="error" onClose={() => setError(null)}>{error}</Alert></Box>;
    }

    return (
        <Box sx={{ p: { xs: 1, sm: 2, md: 3 }, backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
            <Stack spacing={3}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Box>
                        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', color: '#1A237E' }}>
                            Genel Bakış
                        </Typography>
                        <Typography variant="body2" color="text.secondary">Hesaplarınız, işlemleriniz ve yatırım özetiniz</Typography>
                    </Box>

                    {/* Sağ üst - Döviz kutuları ve refresh */}
                    <Stack direction="row" spacing={1} alignItems="center">
                        <Stack direction="row" spacing={1} alignItems="center" sx={{ mr: 1 }}>
                            {(['USD', 'EUR', 'GBP'] as const).map(sym => {
                                const r = getCurrencyRate(sym);
                                const priceText = r ? (Number(r.price).toLocaleString('tr-TR', { maximumFractionDigits: 4 })) : <Skeleton variant="text" width={60} />;
                                const change = r?.change ?? r?.diff ?? 0;
                                const isUp = Number(change) > 0;
                                return (
                                    <Chip
                                        key={sym}
                                        label={
                                            <Stack direction="row" spacing={1} alignItems="center" sx={{ pl: 0.5, pr: 0.5 }}>
                                                {getIconByCurrency(`${sym}/TRY`)}
                                                <Box sx={{ textAlign: 'left' }}>
                                                    <Typography variant="caption" sx={{ display: 'block', lineHeight: 1 }}>{sym}/TRY</Typography>
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>{priceText}</Typography>
                                                </Box>
                                                <Box>
                                                    {Number(change) !== 0 ? (
                                                        <Stack direction="row" spacing={0.2} alignItems="center">
                                                            {isUp ? <ArrowUpwardIcon sx={{ fontSize: 16, color: 'success.main' }} /> : <ArrowDownwardIcon sx={{ fontSize: 16, color: 'error.main' }} />}
                                                            <Typography variant="caption" sx={{ color: isUp ? 'success.main' : 'error.main' }}>{Math.abs(Number(change)).toFixed(4)}</Typography>
                                                        </Stack>
                                                    ) : <Typography variant="caption" color="text.secondary">--</Typography>}
                                                </Box>
                                            </Stack>
                                        }
                                        variant="outlined"
                                        size="medium"
                                        sx={{
                                            borderRadius: 2,
                                            bgcolor: 'background.paper',
                                            px: 1.25,
                                            py: 0.5,
                                            minHeight: 50,
                                            minWidth: 180
                                        }}
                                    />
                                );
                            })}
                        </Stack>

                        <IconButton onClick={fetchDashboardData} color="primary" disabled={loading} aria-label="refresh dashboard">
                            <RefreshIcon />
                        </IconButton>
                    </Stack>
                </Box>

                {/* Key Metric Cards */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Paper elevation={3} sx={{ p: 2, flexGrow: 1, flexBasis: 240, borderRadius: 2, background: 'linear-gradient(180deg,#fff,#f7f9ff)' }}>
                        <Typography variant="subtitle2" color="text.secondary">Toplam Varlıklar</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1A237E' }}>{formatCurrency(totalBalance, 'TRY')}</Typography>
                        <Typography variant="caption" color="text.secondary">Hesap bakiyeleri + mevduatlar</Typography>
                    </Paper>

                    <Paper elevation={3} sx={{ p: 2, flexGrow: 1, flexBasis: 240, borderRadius: 2, background: 'linear-gradient(180deg,#fff,#fff8f0)' }}>
                        <Typography variant="subtitle2" color="text.secondary">Toplam Mevduat</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatCurrency(totalDepositAmount, 'TRY')}</Typography>
                        <Typography variant="caption" color="text.secondary">Vade ve anapara toplamı</Typography>
                    </Paper>

                    <Paper elevation={3} sx={{ p: 2, flexGrow: 1, flexBasis: 240, borderRadius: 2, background: 'linear-gradient(180deg,#fff,#fff6f6)' }}>
                        <Typography variant="subtitle2" color="text.secondary">Toplam Borçlar</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main' }}>{formatCurrency(totalLoanAmount, 'TRY')}</Typography>
                        <Typography variant="caption" color="text.secondary">Kredi bakiye toplamı</Typography>
                    </Paper>

                    <Paper elevation={3} sx={{ p: 2, flexGrow: 1, flexBasis: 240, borderRadius: 2, background: 'linear-gradient(180deg,#fff,#f6fff7)' }}>
                        <Typography variant="subtitle2" color="text.secondary">Net Değer</Typography>
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>{formatCurrency(netWorth, 'TRY')}</Typography>
                        <Typography variant="caption" color="text.secondary">Varlıklar - Borçlar</Typography>
                    </Paper>
                </Box>

                {/* Döviz & Mevduat */}
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, flexGrow: 1, minWidth: 320 }}>
                        <Typography variant="h6" gutterBottom>Döviz Kurları</Typography>
                        <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', py: 1 }}>
                            {currencyRates.filter((rate: any) => ['USD/TRY', 'EUR/TRY', 'GBP/TRY'].includes(rate.symbol)).map((rate: any) => (
                                <Paper key={rate.symbol} elevation={1} sx={{ p: 1, borderRadius: 1, minWidth: 140 }}>
                                    <Stack direction="row" spacing={1} alignItems="center">
                                        {getIconByCurrency(rate.symbol)}
                                        <Box>
                                            <Typography variant="subtitle2">{rate.symbol}</Typography>
                                            <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{Number(rate.price).toLocaleString('tr-TR', { maximumFractionDigits: 4 })}</Typography>
                                        </Box>
                                        <Box sx={{ ml: 'auto' }}>
                                            {Number(rate.change) > 0 ? <ArrowUpwardIcon sx={{ color: 'success.main' }} /> : <ArrowDownwardIcon sx={{ color: 'error.main' }} />}
                                        </Box>
                                    </Stack>
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>

                    <Paper elevation={2} sx={{ p: 2, borderRadius: 2, flexGrow: 1, minWidth: 320 }}>
                        <Typography variant="h6" gutterBottom>Mevduat Oranları (Aylık)</Typography>
                        <Stack spacing={1}>
                            {depositRates.length === 0 && <Typography variant="body2" color="text.secondary">Mevduat oranı verisi yok.</Typography>}
                            {depositRates.map((rate: any) => (
                                <Box key={rate.duration} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ width: 96 }}>
                                        <Typography variant="subtitle2">{rate.duration} Ay</Typography>
                                    </Box>
                                    <Box sx={{ flexGrow: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={maxDepositRate > 0 ? Math.min((Number(rate.rate) / maxDepositRate) * 100, 100) : 0}
                                            sx={{ height: 10, borderRadius: 2 }}
                                        />
                                    </Box>
                                    <Typography variant="body2" sx={{ width: 64, textAlign: 'right' }}>%{Number(rate.rate).toFixed(2)}</Typography>
                                </Box>
                            ))}
                        </Stack>
                    </Paper>
                </Box>

                {/* 14 Günlük Nakit Akışı / Trend Grafiği */}
                <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Typography variant="h6" gutterBottom>Son 14 Gün - İşlem Trendleri</Typography>
                    <Box sx={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={biweeklyChartData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                                <Tooltip formatter={(value: any, name: any) => [formatCurrency(Number(value), 'TRY'), name]} />
                                <Legend />
                                {/* Para girişi (yeşil tonları) */}
                                <Bar dataKey="Gelir" name="Gelir" stackId="total" fill="#43a047" />
                                <Bar dataKey="EFT Alım" name="EFT Alım" stackId="total" fill="#2e7d32" />
                                <Bar dataKey="Gelen Transfer" name="Gelen Transfer" stackId="total" fill="#66bb6a" />
                                <Bar dataKey="Yatırım Satış" name="Yatırım Satış" stackId="total" fill="#26a69a" />
                                <Bar dataKey="Nakit Yatırma" name="Nakit Yatırma" stackId="total" fill="#81c784" />
                                {/* Para çıkışı (kırmızı tonları) */}
                                <Bar dataKey="Gider" name="Gider" stackId="total" fill="#e53935" />
                                <Bar dataKey="EFT Gönderim" name="EFT Gönderim" stackId="total" fill="#c62828" />
                                <Bar dataKey="Giden Transfer" name="Giden Transfer" stackId="total" fill="#ef5350" />
                                <Bar dataKey="Yatırım Alış" name="Yatırım Alış" stackId="total" fill="#f4511e" />
                                <Bar dataKey="Nakit Çekme" name="Nakit Çekme" stackId="total" fill="#b71c1c" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Box>
                </Paper>

                {/* Quick Actions */}
                <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                    <Stack direction="row" spacing={2} sx={{ overflowX: 'auto', py: 1 }}>
                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            onClick={() => navigate('/user-transfer')}
                            sx={{
                                flexShrink: 0,
                                px: 3, py: 1.2,
                                borderRadius: 2,
                                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                                background: 'linear-gradient(90deg,#1a73e8,#4facfe)'
                            }}
                        >
                            Para Gönder
                        </Button>

                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => navigate('/transactions/new')}
                            sx={{
                                flexShrink: 0,
                                px: 3, py: 1.2,
                                borderRadius: 2,
                                boxShadow: '0 6px 18px rgba(0,0,0,0.08)',
                                background: 'linear-gradient(90deg,#ff7a18,#ffb199)'
                            }}
                        >
                            İşlem Gerçekleştir
                        </Button>

                        <Button variant="outlined" startIcon={<CreditScoreIcon />} onClick={() => navigate('/loans')} sx={{ flexShrink: 0, borderRadius: 2 }}>Kredilerim</Button>
                        <Button variant="outlined" startIcon={<SavingsIcon />} onClick={() => navigate('/deposits')} sx={{ flexShrink: 0, borderRadius: 2 }}>Mevduatlarım</Button>
                        <Button variant="outlined" startIcon={<ShowChart />} onClick={() => navigate('/investments')} sx={{ flexShrink: 0, borderRadius: 2 }}>Yatırımlarım</Button>
                    </Stack>
                </Paper>

                {/* Main Content Area */}
                <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
                    {/* Left Column */}
                    <Stack spacing={3} sx={{ flex: 1 }}>
                        {/* Accounts */}
                        <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>Hesaplarım</Typography>

                            <Stack spacing={1}>
                                {accounts.length === 0 && <Typography variant="body2" color="text.secondary">Kayıtlı hesap bulunamadı.</Typography>}
                                {accounts.slice(0, 6).map((acc: Account) => (
                                    <Card key={acc.id} variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 1, borderRadius: 2 }}>
                                        <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{acc.name?.charAt(0)}</Avatar>
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{acc.name}</Typography>
                                            <Typography variant="caption" color="text.secondary">{acc.accountType} • {maskAccount(acc)}</Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right', minWidth: 160 }}>
                                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>{formatCurrency(acc.balance ?? 0, acc.currency || 'TRY')}</Typography>
                                            <Typography variant="caption" color="text.secondary">Bakiye</Typography>
                                        </Box>
                                        <CardActions>
                                            <Button size="small" onClick={() => navigate('/user-transfer', { state: { fromAccount: acc } })}>Gönder</Button>
                                            <Button size="small" component={RouterLink} to="/accounts">Detay</Button>
                                        </CardActions>
                                    </Card>
                                ))}
                            </Stack>

                            <Button component={RouterLink} to="/accounts" sx={{ mt: 1 }}>Tüm Hesapları Gör</Button>
                        </Paper>

                        {/* Watchlist */}
                        <Paper elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                            <Typography variant="h6" gutterBottom>Takip Listem</Typography>
                            <List dense>
                                {trackedAssets.map(asset => (
                                    <ListItem key={asset.symbol} disablePadding secondaryAction={
                                        <Button size="small" onClick={() => navigate('/investments', { state: { selectedSymbol: asset.symbol } })}>Al / Sat</Button>
                                    }>
                                        <ListItemIcon sx={{ minWidth: 36 }}>
                                            <Avatar>{asset.symbol?.charAt(0)}</Avatar>
                                        </ListItemIcon>
                                        <ListItemText primary={asset.name} secondary={asset.symbol} />
                                    </ListItem>
                                ))}
                            </List>
                            <Button component={RouterLink} to="/investments" sx={{ mt: 1 }}>Tüm Portföyü Gör</Button>
                        </Paper>
                    </Stack>
                    </Box>

                    {/* Right Column - Recent Transactions */}
                <Paper elevation={2} sx={{ p: 2, flex: 2, borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6">Son İşlemler</Typography>
                        <Button size="small" component={RouterLink} to="/transactions">Tüm İşlemleri Gör</Button>
                    </Box>

                    <List dense>
                        {recentTransactions.length === 0 && <Typography variant="body2" color="text.secondary">İşlem kaydı bulunamadı.</Typography>}
                        {recentTransactions.map(tx => {
                            const { color, symbol } = getTransactionAmountStyle(tx);
                            return (
                                <ListItem key={tx.id} disablePadding sx={{ py: 1 }}>
                                    <ListItemIcon sx={{ minWidth: 44 }}>
                                        <Avatar sx={{ bgcolor: color, width: 40, height: 40 }}>
                                            {getTransactionIcon(tx.type)}
                                        </Avatar>
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={<Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>{tx.description}</Typography>}
                                        secondary={<Typography variant="caption" color="text.secondary">{format(parseISO(tx.transactionDate), 'dd.MM.yyyy')} • {tx.accountName || tx.accountId}</Typography>}
                                    />
                                    <Box sx={{ textAlign: 'right', minWidth: 140 }}>
                                        <Typography variant="body2" sx={{ fontWeight: 'bold', color }}>{symbol} {Math.abs(tx.amount).toLocaleString('tr-TR', { style: 'currency', currency: tx.accountCurrency || 'TRY' })}</Typography>
                                        <Typography variant="caption" color="text.secondary">{(tx as any).categoryName || (tx as any).category || (tx as any).categoryId || '--'}</Typography>  {/* tx.category yerine güvenli fallback */}
                                    </Box>
                                    <IconButton edge="end" aria-label="details"><OpenInNewIcon /></IconButton>
                                </ListItem>
                            );
                        })}
                    </List>
                </Paper>
            </Stack>
        </Box>
    );
}

export default Dashboard;