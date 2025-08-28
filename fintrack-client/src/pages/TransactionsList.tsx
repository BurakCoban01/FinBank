import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { transactionService } from '../services/transaction.service';
import { Transaction, TransactionType } from '../types/transaction';
import {
    Container, Typography, Paper, Button, CircularProgress, Alert, Box,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton,
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Chip, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { format, parseISO } from 'date-fns';

const TransactionsList: React.FC = () => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();
    const location = useLocation();

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [transactionToDelete, setTransactionToDelete] = useState<Transaction | null>(null);

    const filterAccountId = location.state?.filterAccountId;

    const fetchTransactions = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            let data = await transactionService.getTransactions();
            if (filterAccountId) {
                data = data.filter(tx => tx.accountId === filterAccountId);
            }
            data.sort((a, b) => parseISO(b.transactionDate).getTime() - parseISO(a.transactionDate).getTime());
            setTransactions(data);
        } catch (err: any) {
            console.error("Error fetching transactions:", err);
            if (err.response && err.response.status === 401) {
                navigate('/login');
            } else {
                setError(err.response?.data?.message || "İşlemler yüklenirken bir hata oluştu.");
            }
        } finally {
            setLoading(false);
        }
    }, [navigate, filterAccountId]);

    useEffect(() => {
        fetchTransactions();
    }, [fetchTransactions]);

    const handleDeleteClick = (transaction: Transaction) => {
        setTransactionToDelete(transaction);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!transactionToDelete) return;
        setLoading(true);
        try {
            await transactionService.deleteTransaction(transactionToDelete.id);
            setTransactions(prev => prev.filter(tx => tx.id !== transactionToDelete.id));
        } catch (err: any) {
            console.error("Error deleting transaction:", err);
            setError(err.response?.data?.message || "İşlem silinirken bir hata oluştu.");
        } finally {
            setOpenDeleteDialog(false);
            setTransactionToDelete(null);
            setLoading(false);
        }
    };

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

    const getAmountDisplay = (tx: Transaction) => {
        let symbol = tx.amount > 0 ? '+' : '-';
        let color = tx.amount > 0 ? 'success.main' : 'error.main';

        // Yatırım işlemlerinde mantığı tersine çevir
        if (tx.type === TransactionType.YatirimAlim) {
            symbol = '-';
            color = 'error.main';
        }
        if (tx.type === TransactionType.YatirimSatim) {
            symbol = '+';
            color = 'success.main';
        }

        const formattedAmount = `${symbol}${Math.abs(tx.amount).toLocaleString('tr-TR', { style: 'currency', currency: tx.accountCurrency || 'TRY' })}`;
        
        return { text: formattedAmount, color };
    };


    if (loading && transactions.length === 0) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" component="h1">
                        {filterAccountId ? `Hesap İşlemleri` : `Tüm İşlemlerim`}
                    </Typography>
                     <Box>
                        <IconButton onClick={fetchTransactions} color="primary" disabled={loading} sx={{mr:1}}>
                            <Refresh />
                        </IconButton>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<Add />}
                            onClick={() => navigate('/transactions/new')}
                            disabled={loading}
                        >
                            Yeni İşlem Ekle
                        </Button>
                    </Box>
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                {loading && transactions.length > 0 && <CircularProgress size={20} sx={{mb:1}}/>}

                {transactions.length === 0 && !loading && !error && (
                    <Typography sx={{ textAlign: 'center', my: 3 }}>Henüz bir işlem kaydetmediniz.</Typography>
                )}

                {transactions.length > 0 && (
                    <TableContainer component={Paper} sx={{ maxHeight: '70vh', border: '1px solid rgba(224, 224, 224, 1)' }}>
                        <Table stickyHeader aria-label="işlemler tablosu">
                            <TableHead>
                                <TableRow>
                                    <TableCell sx={{fontWeight: 'bold'}}>Tarih</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Hesap</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Kategori</TableCell>
                                    <TableCell sx={{fontWeight: 'bold'}}>Açıklama</TableCell>
                                    <TableCell align="right" sx={{fontWeight: 'bold'}}>Tutar</TableCell>
                                    <TableCell align="center" sx={{fontWeight: 'bold'}}>Tür</TableCell>
                                    <TableCell align="center" sx={{fontWeight: 'bold'}}>Eylemler</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {transactions.map((tx) => {
                                    const amountDisplay = getAmountDisplay(tx);
                                    return (
                                    <TableRow hover key={tx.id}>
                                        <TableCell>
                                            {format(parseISO(tx.transactionDate), 'dd.MM.yy HH:mm')}
                                        </TableCell>
                                        <TableCell>{tx.accountName}</TableCell>
                                        <TableCell>
                                            {getCategoryDisplay(tx)}
                                        </TableCell>
                                        <TableCell sx={{maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>
                                            <Tooltip title={tx.description || ''}>
                                                <span>{tx.description || '-'}</span>
                                            </Tooltip>
                                        </TableCell>
                                        <TableCell align="right" sx={{ color: amountDisplay.color, fontWeight: 500 }}>
                                            {amountDisplay.text}
                                        </TableCell>
                                        <TableCell align="center">{getTransactionChip(tx.type)}</TableCell>
                                        <TableCell align="center">
                                            <IconButton size="small" onClick={() => navigate(`/transactions/edit/${tx.id}`)} disabled={loading}>
                                                <Edit fontSize="small" />
                                            </IconButton>
                                            <IconButton size="small" onClick={() => handleDeleteClick(tx)} disabled={loading}>
                                                <Delete fontSize="small" />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                )})}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </Paper>
            <Dialog
                open={openDeleteDialog}
                onClose={() => {if(!loading) setOpenDeleteDialog(false)}}
            >
                <DialogTitle>İşlemi Sil</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Bu işlemi silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                        <br/>
                        (Açıklama: "{transactionToDelete?.description || 'Belirtilmemiş'}", Tutar: {transactionToDelete?.amount})
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} disabled={loading}>İptal</Button>
                    <Button onClick={handleDeleteConfirm} color="error" disabled={loading}>
                        {loading ? <CircularProgress size={20}/> : "Sil"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default TransactionsList;
