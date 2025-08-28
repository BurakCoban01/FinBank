import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountService } from '../services/account.service';
import { transactionService } from '../services/transaction.service';
import { Account } from '../types/account';
import { Transaction, TransactionType } from '../types/transaction';
import {
    Container, Typography, Paper, CircularProgress, Alert, Box, Button,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Divider
} from '@mui/material';
import { ArrowBack, Edit, Add as AddTransactionIcon } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

const AccountDetails: React.FC = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const navigate = useNavigate();
    const [account, setAccount] = useState<Account | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccountDetails = useCallback(async () => {
        if (!accountId) {
            setError("Hesap ID bulunamadı.");
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const id = parseInt(accountId, 10);
            const [accountData, allTransactionsData] = await Promise.all([
                accountService.getAccountById(id),
                transactionService.getTransactions()
            ]);
            setAccount(accountData);

            const accountTransactions = allTransactionsData
                .filter((tx: Transaction) => tx.accountId === id)
                .sort((a: Transaction, b: Transaction) => parseISO(b.transactionDate).getTime() - parseISO(a.transactionDate).getTime());
            setTransactions(accountTransactions);

        } catch (err: any) {
            console.error("Error fetching account details:", err);
            if (err.response && err.response.status === 401) {
                navigate('/login');
            } else {
                setError(err.response?.data?.message || "Hesap detayları yüklenirken bir hata oluştu.");
            }
        } finally {
            setLoading(false);
        }
    }, [accountId, navigate]);

    useEffect(() => {
        fetchAccountDetails();
    }, [fetchAccountDetails]);

    const getTransactionChip = (type: TransactionType) => {
        const chipStyles = { color: 'white', fontWeight: 'bold' };
        switch (type) {
            case TransactionType.Income: return <Chip label="Gelir" size="small" sx={{ ...chipStyles, backgroundColor: 'success.main' }} />;
            case TransactionType.Expense: return <Chip label="Gider" size="small" sx={{ ...chipStyles, backgroundColor: 'error.main' }} />;
            case TransactionType.EFTGonderim: return <Chip label="EFT Gönderim" size="small" sx={{ ...chipStyles, backgroundColor: '#B71C1C' }} />;
            case TransactionType.EFTAlim: return <Chip label="EFT Alım" size="small" sx={{ ...chipStyles, backgroundColor: '#1B5E20' }} />;
            case TransactionType.GidenTransfer: return <Chip label="Giden Transfer" size="small" sx={{ ...chipStyles, backgroundColor: '#424242' }} />;
            case TransactionType.GelenTransfer: return <Chip label="Gelen Transfer" size="small" sx={{ ...chipStyles, backgroundColor: '#757575' }} />;
            case TransactionType.YatirimAlim: return <Chip label="Yatırım Alış" size="small" color="warning" />;
            case TransactionType.YatirimSatim: return <Chip label="Yatırım Satış" size="small" color="info" />;
            case TransactionType.NakitYatirma: return <Chip label="Nakit Yatırma" size="small" color="primary" />;
            case TransactionType.NakitCekme: return <Chip label="Nakit Çekme" size="small" color="secondary" />;
            default: return <Chip label={`Bilinmiyor (${type})`} size="small" />;
        }
    };

    const getCategoryDisplay = (tx: Transaction) => {
        if (tx.categoryName) {
            return <Chip label={tx.categoryName} size="small" sx={{backgroundColor: tx.categoryColor || '#E0E0E0'}} />;
        }
        switch (tx.type) {
            case TransactionType.EFTGonderim:
            case TransactionType.EFTAlim:
                return <Chip label="EFT/Havale" size="small" sx={{backgroundColor: '#E3F2FD'}} />;
            case TransactionType.GidenTransfer:
            case TransactionType.GelenTransfer:
                return <Chip label="Hesaplar Arası Transfer" size="small" sx={{backgroundColor: '#FCE4EC'}} />;
            case TransactionType.YatirimAlim:
            case TransactionType.YatirimSatim:
                return <Chip label="Yatırım" size="small" sx={{backgroundColor: '#FFF3E0'}} />;
            default:
                return '-';
        }
    };

    const getAmountColor = (tx: Transaction) => {
        // Yatırım işlemlerinde mantığı tersine çevir
        if (tx.type === TransactionType.YatirimAlim) return 'error.main';
        if (tx.type === TransactionType.YatirimSatim) return 'success.main';
        // Diğer işlemler için standart mantık
        return tx.amount > 0 ? 'success.main' : 'error.main';
    };

    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return <Container><Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>{error}</Alert></Container>;
    }

    if (!account) {
        return <Container><Alert severity="info" sx={{ mt: 2 }}>Hesap bulunamadı.</Alert></Container>;
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/accounts')} sx={{ mb: 2 }}>
                Hesaplara Geri Dön
            </Button>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" component="h1">
                        {account.name}
                        {!account.isActive && <Typography component="span" variant="h6" color="error" sx={{ ml: 1 }}>(Pasif)</Typography>}
                    </Typography>
                    <Button
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={() => navigate(`/accounts/edit/${account.id}`)}
                    >
                        Hesabı Düzenle
                    </Button>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
                    <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="subtitle1"><strong>Hesap Türü:</strong> {account.accountType}</Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="subtitle1">
                            <strong>Bakiye:</strong> {account.balance.toLocaleString('tr-TR', { style: 'currency', currency: account.currency || 'TRY' })}
                        </Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="subtitle1"><strong>Para Birimi:</strong> {account.currency}</Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="subtitle1"><strong>Durum:</strong> {account.isActive ? 'Aktif' : 'Pasif'}</Typography>
                    </Box>
                    <Box sx={{ flex: '1 1 200px' }}>
                        <Typography variant="subtitle1"><strong>Oluşturulma:</strong> {format(parseISO(account.createdAt), 'dd.MM.yyyy')}</Typography>
                    </Box>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 4, mb: 2 }}>
                    <Typography variant="h5" component="h2">
                        Bu Hesaba Ait Son İşlemler
                    </Typography>
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<AddTransactionIcon />}
                        onClick={() => navigate('/transactions/new', { state: { defaultAccountId: account.id } })}
                    >
                        Yeni İşlem Ekle
                    </Button>
                </Box>
                {transactions.length > 0 ? (
                    <TableContainer component={Paper} sx={{ maxHeight: 400, border: '1px solid rgba(224, 224, 224, 1)' }}>
                        <Table stickyHeader aria-label="hesap işlemleri tablosu">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Tarih</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Açıklama</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Kategori</TableCell>
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Tutar</TableCell>
                                    <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tür</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.slice(0, 10).map((tx) => (
                                    <TableRow hover key={tx.id} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/transactions/edit/${tx.id}`)}>
                                        <TableCell>{format(parseISO(tx.transactionDate), 'dd.MM.yy HH:mm')}</TableCell>
                                        <TableCell>{tx.description || '-'}</TableCell>
                                        <TableCell>{getCategoryDisplay(tx)}</TableCell>
                                        <TableCell align="right" sx={{ color: getAmountColor(tx), fontWeight: '500' }}>
                                            {tx.amount > 0 ? '+' : '-'}{Math.abs(tx.amount).toLocaleString('tr-TR', { style: 'currency', currency: account.currency || tx.accountCurrency || 'TRY' })}
                                        </TableCell>
                                        <TableCell align="center">{getTransactionChip(tx.type)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                ) : (
                    <Typography sx={{ textAlign: 'center', my: 3 }}>Bu hesap için henüz işlem bulunmamaktadır.</Typography>
                )}
                {transactions.length > 10 && (
                    <Button onClick={() => navigate('/transactions', { state: { filterAccountId: account.id } })} sx={{ mt: 2 }}>
                        Tüm İşlemleri Gör ({transactions.length})
                    </Button>
                )}
            </Paper>
        </Container>
    );
};

export default AccountDetails;
