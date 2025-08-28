import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountService } from '../services/account.service';
import { Account } from '../types/account';
import {
    Container, Typography, List, ListItem, ListItemText, ListItemSecondaryAction,
    IconButton, Button, CircularProgress, Alert, Paper, Dialog, DialogActions,
    DialogContent, DialogContentText, DialogTitle, Box, Divider, Pagination
} from '@mui/material';
import { Edit, Delete, Add, Refresh, SwapHoriz } from '@mui/icons-material';
import TransferForm from '../components/TransferForm';

const AccountsList: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [isTransferOpen, setIsTransferOpen] = useState(false);
    
    const [page, setPage] = useState(1);
    const rowsPerPage = 10;

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await accountService.getAccounts();
            setAccounts(data);
        } catch (err: any) {
            if (err.response && err.response.status === 401) navigate('/login');
            else setError(err.response?.data?.message || "Hesaplar yüklenirken bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const groupedAccounts = useMemo(() => {
        return accounts.reduce((acc, account) => {
            const key = account.accountType || 'Diğer';
            if (!acc[key]) acc[key] = [];
            acc[key].push(account);
            return acc;
        }, {} as Record<string, Account[]>);
    }, [accounts]);

    const paginatedItems = useMemo(() => {
        const items: (string | Account)[] = [];
        Object.entries(groupedAccounts).forEach(([type, accs]) => {
            items.push(type);
            items.push(...accs);
        });
        return items;
    }, [groupedAccounts]);

    const pageCount = Math.ceil(paginatedItems.length / rowsPerPage);
    const currentPagedItems = paginatedItems.slice((page - 1) * rowsPerPage, page * rowsPerPage);

    const handleDeleteClick = (account: Account) => {
        setAccountToDelete(account);
        setOpenDeleteDialog(true);
    };

    const handleDeleteConfirm = async () => {
        if (!accountToDelete) return;
        setLoading(true);
        try {
            await accountService.deleteAccount(accountToDelete.id);
            setAccounts(prev => prev.filter(acc => acc.id !== accountToDelete.id));
        } catch (err: any) {
            setError(err.response?.data?.message || "Hesap silinirken bir hata oluştu.");
        } finally {
            setOpenDeleteDialog(false);
            setAccountToDelete(null);
            setLoading(false);
        }
    };

    const handleTransferSuccess = () => {
        setIsTransferOpen(false);
        fetchAccounts();
    };

    if (loading && accounts.length === 0) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}><CircularProgress /></Container>;
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Typography variant="h4" component="h1">Hesaplarım</Typography>
                    <Box>
                        <IconButton onClick={fetchAccounts} color="primary" disabled={loading} sx={{ mr: 1 }}><Refresh /></IconButton>
                        <Button variant="contained" color="success" size="large" startIcon={<Add />} onClick={() => navigate('/accounts/new')} disabled={loading} sx={{ py: 1.2, px: 3, fontSize: '0.95rem' }}>
                            Yeni Hesap Ekle
                        </Button>
                    </Box>
                </Box>
                <Divider sx={{ my: 2 }} />

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                {loading && accounts.length > 0 && <CircularProgress size={20} sx={{ mb: 1 }} />}
                {accounts.length === 0 && !loading && !error && <Typography sx={{ textAlign: 'center', my: 3 }}>Henüz bir hesap eklemediniz.</Typography>}

                <List>
                    {currentPagedItems.map((item) => {
                        if (typeof item === 'string') {
                            return (
                                <Typography key={item} variant="h6" sx={{ mt: 2, mb: 1, fontWeight: 'bold' }}>
                                    {`${item} (${groupedAccounts[item].length})`}
                                </Typography>
                            );
                        }
                        const account = item;
                        return (
                            <ListItem key={account.id} divider sx={{ '&:hover': { backgroundColor: 'action.hover' }, opacity: !account.isActive ? 0.6 : 1 }}>
                                <ListItemText
                                    primary={account.name}
                                    secondary={<>Bakiye: {account.balance.toLocaleString('tr-TR', { style: 'currency', currency: account.currency || 'TRY' })} {!account.isActive && <Typography component="span" variant="caption" color="error" sx={{ ml: 1 }}>(Pasif)</Typography>}</>}
                                    onClick={() => navigate(`/accounts/${account.id}`)}
                                    sx={{ cursor: 'pointer' }}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton edge="end" aria-label="edit" onClick={() => navigate(`/accounts/edit/${account.id}`)} disabled={loading}><Edit /></IconButton>
                                    <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteClick(account)} disabled={loading}><Delete /></IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        );
                    })}
                </List>
                
                {pageCount > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                        <Pagination count={pageCount} page={page} onChange={(e, value) => setPage(value)} color="primary" />
                    </Box>
                )}

                <Divider sx={{ my: 3 }} />
                <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                    <Button variant="contained" startIcon={<SwapHoriz />} onClick={() => setIsTransferOpen(true)} disabled={loading} sx={{ py: 2, px: 5, fontSize: '1.2rem', backgroundColor: '#ffc107', color: 'black', '&:hover': { backgroundColor: '#ffb300' } }}>
                        Hesaplarım Arası Transfer
                    </Button>
                </Box>
            </Paper>

            <Dialog open={openDeleteDialog} onClose={() => { if (!loading) setOpenDeleteDialog(false) }}>
                <DialogTitle>Hesabı Sil</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        "{accountToDelete?.name}" adlı hesabı silmek (pasif hale getirmek) istediğinizden emin misiniz? Bu işlem hesabın artık kullanılmamasına neden olur ancak verileriniz kaybolmaz.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)} disabled={loading}>İptal</Button>
                    <Button onClick={handleDeleteConfirm} color="error" disabled={loading}>{loading ? <CircularProgress size={20} /> : "Sil (Pasif Et)"}</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={isTransferOpen} onClose={() => setIsTransferOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Hesaplar Arası Transfer</DialogTitle>
                <DialogContent><TransferForm onTransferSuccess={handleTransferSuccess} /></DialogContent>
                <DialogActions><Button onClick={() => setIsTransferOpen(false)}>Kapat</Button></DialogActions>
            </Dialog>
        </Container>
    );
};

export default AccountsList;

