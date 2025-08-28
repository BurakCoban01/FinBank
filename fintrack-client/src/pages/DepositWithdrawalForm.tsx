import React, { useState, useEffect, FormEvent, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { accountService } from '../services/account.service';
import { transactionService } from '../services/transaction.service';
import { Account } from '../types/account';
import { CreateDepositWithdrawalRequest } from '../types/transaction';
import {
    Container, Typography, Paper, TextField, Button, CircularProgress, Alert, Box, Stack,
    FormControl, InputLabel, Select, MenuItem, FormHelperText, ToggleButtonGroup, ToggleButton
} from '@mui/material';
import { Save, ArrowBack, AccountBalanceWallet, AttachMoney } from '@mui/icons-material';

type OperationType = 'deposit' | 'withdraw';

const DepositWithdrawalForm: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation(); // state üzerinden accountId ve operationType almak için

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<number | ''>(location.state?.accountId || '');
    const [amount, setAmount] = useState<number | string>('');
    const [description, setDescription] = useState('');
    const [operation, setOperation] = useState<OperationType>(location.state?.operationType || 'deposit');

    const [submitLoading, setSubmitLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    const fetchAccounts = useCallback(async () => {
        setPageLoading(true);
        try {
            const activeAccounts = (await accountService.getAccounts()).filter(acc => acc.isActive);
            setAccounts(activeAccounts);
            if (!selectedAccountId && activeAccounts.length > 0 && !location.state?.accountId) {
                setSelectedAccountId(activeAccounts[0].id);
            } else if (location.state?.accountId && !activeAccounts.find(a=>a.id === location.state?.accountId)){
                setError("Seçilen hesap aktif değil veya bulunamadı.");
                setSelectedAccountId(''); // Geçersiz hesabı temizle
            }
        } catch (err: any) {
            setError("Hesaplar yüklenirken bir hata oluştu.");
        } finally {
            setPageLoading(false);
        }
    }, [selectedAccountId, location.state?.accountId]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const validateForm = () => {
        const errors: { [key: string]: string } = {};
        if (selectedAccountId === '') errors.selectedAccountId = "Hesap seçimi zorunludur.";
        if (amount === '' || isNaN(Number(amount))) errors.amount = "Tutar geçerli bir sayı olmalıdır.";
        else if (Number(amount) <= 0) errors.amount = "Tutar pozitif bir değer olmalıdır.";
        if (description.length > 255) errors.description = "Açıklama en fazla 255 karakter olabilir.";
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!validateForm()) return;

        setSubmitLoading(true);
        setError(null);

        const payload: CreateDepositWithdrawalRequest = {
            accountId: Number(selectedAccountId),
            amount: Number(amount),
            description: description || (operation === 'deposit' ? 'Para Yatırma' : 'Para Çekme'),
        };

        try {
            if (operation === 'deposit') {
                await transactionService.deposit(payload);
            } else {
                const selectedAcc = accounts.find(acc => acc.id === selectedAccountId);
                if (selectedAcc && selectedAcc.balance < Number(amount)) {
                    setFormErrors(prev => ({...prev, amount: "Yetersiz bakiye."}));
                    throw new Error("Yetersiz bakiye."); // Backend de kontrol edecek ama frontend'de de edelim
                }
                await transactionService.withdraw(payload);
            }
            navigate(`/accounts/${selectedAccountId}`); // İşlem sonrası hesap detayına git
        } catch (err: any) {
            console.error(`Error during ${operation}:`, err);
            const apiErrorMessage = err.response?.data?.message || `${operation === 'deposit' ? 'Yatırma' : 'Çekme'} işlemi başarısız oldu.`;
             if (err.message === "Yetersiz bakiye.") { // Frontend kontrolünden gelen hata
                // Zaten yukarıda formErrors'a eklendi
            } else if (err.response?.data?.errors) {
                // ... (backend validation error handling) ...
            }
            setError(apiErrorMessage);
        } finally {
            setSubmitLoading(false);
        }
    };

    const handleOperationChange = (
        event: React.MouseEvent<HTMLElement>,
        newOperation: OperationType | null,
    ) => {
        if (newOperation !== null) {
            setOperation(newOperation);
        }
    };


    if (pageLoading) {
        return <Container sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Container>;
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4, mb: 4 }}>
             <Button startIcon={<ArrowBack />} onClick={() => navigate(selectedAccountId ? `/accounts/${selectedAccountId}` : '/accounts')} sx={{ mb: 2 }}>
                {selectedAccountId ? 'Hesap Detayına Geri Dön' : 'Hesaplara Geri Dön'}
            </Button>
            <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 } }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center' }}>
                    Para Yatırma / Çekme
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Stack spacing={2.5}>
                        <ToggleButtonGroup
                            color="primary"
                            value={operation}
                            exclusive
                            onChange={handleOperationChange}
                            aria-label="işlem türü"
                            fullWidth
                            sx={{ mb: 1 }}
                        >
                            <ToggleButton value="deposit" aria-label="para yatır" sx={{flexGrow:1}}>
                                <AttachMoney sx={{mr:1}}/> Para Yatır
                            </ToggleButton>
                            <ToggleButton value="withdraw" aria-label="para çek" sx={{flexGrow:1}}>
                                <AccountBalanceWallet sx={{mr:1}}/> Para Çek
                            </ToggleButton>
                        </ToggleButtonGroup>

                        <FormControl fullWidth required error={!!formErrors.selectedAccountId}>
                            <InputLabel id="account-select-label">Hesap</InputLabel>
                            <Select
                                labelId="account-select-label"
                                value={selectedAccountId}
                                label="Hesap"
                                onChange={(e) => setSelectedAccountId(e.target.value as number)}
                                disabled={submitLoading || accounts.length === 0}
                            >
                                {accounts.length === 0 && <MenuItem value="" disabled>Aktif hesap bulunamadı.</MenuItem>}
                                {accounts.map((acc) => (
                                    <MenuItem key={acc.id} value={acc.id}>
                                        {acc.name} ({acc.balance.toLocaleString('tr-TR', { style: 'currency', currency: acc.currency })})
                                    </MenuItem>
                                ))}
                            </Select>
                            {formErrors.selectedAccountId && <FormHelperText error>{formErrors.selectedAccountId}</FormHelperText>}
                        </FormControl>

                        <TextField
                            label="Tutar"
                            type="number"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            inputProps={{ step: "0.01", lang: "tr-TR" }}
                            fullWidth
                            required
                            error={!!formErrors.amount}
                            helperText={formErrors.amount}
                            disabled={submitLoading}
                        />
                        <TextField
                            label="Açıklama (İsteğe Bağlı)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            fullWidth
                            multiline
                            rows={2}
                            error={!!formErrors.description}
                            helperText={formErrors.description}
                            disabled={submitLoading}
                        />
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<Save />}
                            disabled={submitLoading || pageLoading || !selectedAccountId}
                            sx={{ height: '48px' }}
                        >
                            {submitLoading ? <CircularProgress size={24} color="inherit"/> : 'İşlemi Onayla'}
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
};

export default DepositWithdrawalForm;