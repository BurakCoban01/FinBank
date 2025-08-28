// src/pages/UserTransferPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container, Typography, Paper, Box, TextField, Button,
    CircularProgress, Alert, Select, MenuItem, FormControl, InputLabel, FormHelperText, InputAdornment
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { accountService } from '../services/account.service';
import { transferService } from '../services/transfer.service';
import { Account } from '../types/account';
import { UserTransferRequestDto } from '../types/transfer';

const UserTransferPage: React.FC = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [fromAccountId, setFromAccountId] = useState<string>('');
    const [recipientIban, setRecipientIban] = useState('');
    const [recipientName, setRecipientName] = useState('');
    const [verifiedName, setVerifiedName] = useState<string | null>(null);
    const [isVerifying, setIsVerifying] = useState(false);
    const [amount, setAmount] = useState<string>('');
    const [description, setDescription] = useState('');
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

    const selectedAccountCurrency = useMemo(() => {
        const account = accounts.find(acc => acc.id === parseInt(fromAccountId, 10));
        return account?.currency;
    }, [accounts, fromAccountId]);

    const fetchAccounts = useCallback(async () => {
        try {
            const userAccounts = await accountService.getAccounts();
            setAccounts(userAccounts.filter(acc => acc.isActive && acc.iban));
        } catch (err: any) {
            if (err.response && err.response.status === 401) navigate('/login');
            setError('Hesaplar yüklenemedi.');
        }
    }, [navigate]);

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    const handleIbanBlur = useCallback(async () => {
        const ibanPattern = /^TR\d{24}$/;
        if (!ibanPattern.test(recipientIban)) {
            setVerifiedName(null);
            return;
        }
        
        setIsVerifying(true);
        setVerifiedName(null);
        try {
            const response = await transferService.verifyIban(recipientIban);
            setVerifiedName(response.name);
        } catch (err) {
            setVerifiedName("Hesap bulunamadı.");
        } finally {
            setIsVerifying(false);
        }
    }, [recipientIban]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        const transferDto: UserTransferRequestDto = {
            fromAccountId: parseInt(fromAccountId, 10),
            recipientIban,
            recipientName,
            amount: parseFloat(amount),
            description,
        };

        try {
            await transferService.transferToAnotherUser(transferDto);
            setSuccess(`Transfer başarıyla gerçekleştirildi. ${recipientName} adlı alıcının hesabına ${amount} ${selectedAccountCurrency} gönderildi.`);
            setFromAccountId('');
            setRecipientIban('');
            setRecipientName('');
            setAmount('');
            setDescription('');
            setVerifiedName(null);
            fetchAccounts();
        } catch (err: any) {
            setError(err.response?.data?.message || 'Transfer sırasında bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper elevation={3} sx={{ p: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom sx={{ textAlign: 'center', mb: 3 }}>
                    Kullanıcılar Arası Transfer (EFT/Havale)
                </Typography>
                <Box component="form" onSubmit={handleSubmit}>
                    <FormControl fullWidth margin="normal" error={!fromAccountId}>
                        <InputLabel id="from-account-label">Gönderen Hesap</InputLabel>
                        <Select
                            labelId="from-account-label"
                            value={fromAccountId}
                            label="Gönderen Hesap"
                            onChange={(e) => setFromAccountId(e.target.value)}
                            required
                        >
                            {accounts.map((account) => (
                                <MenuItem key={account.id} value={account.id}>
                                    {`${account.name} - Bakiye: ${account.balance.toLocaleString('tr-TR')} ${account.currency}`}
                                </MenuItem>
                            ))}
                        </Select>
                        {!fromAccountId && <FormHelperText>Lütfen bir hesap seçin.</FormHelperText>}
                    </FormControl>

                    <TextField
                        label="Alıcı IBAN"
                        value={recipientIban}
                        onChange={(e) => setRecipientIban(e.target.value)}
                        onBlur={handleIbanBlur}
                        fullWidth
                        margin="normal"
                        required
                        placeholder="TR..."
                        inputProps={{ pattern: "^TR\\d{24}$" }}
                        helperText={isVerifying ? "Doğrulanıyor..." : (verifiedName || " ")}
                    />
                    
                    <TextField
                        label="Alıcı Adı Soyadı"
                        value={recipientName}
                        onChange={(e) => setRecipientName(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                    />

                    <TextField
                        label="Tutar"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        fullWidth
                        margin="normal"
                        required
                        InputProps={{
                            endAdornment: <InputAdornment position="end">{selectedAccountCurrency || ''}</InputAdornment>,
                        }}
                        inputProps={{ step: "0.01", min: "0.01" }}
                    />

                    <TextField
                        label="Açıklama (Opsiyonel)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                        margin="normal"
                        multiline
                        rows={3}
                    />

                    {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    {success && <Alert severity="success" sx={{ mt: 2 }}>{success}</Alert>}

                    <Box sx={{ mt: 3, position: 'relative' }}>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            size="large"
                            disabled={loading || !fromAccountId}
                            startIcon={<Send />}
                        >
                            Transferi Gerçekleştir
                        </Button>
                        {loading && (
                            <CircularProgress
                                size={24}
                                sx={{
                                    position: 'absolute',
                                    top: '50%',
                                    left: '50%',
                                    marginTop: '-12px',
                                    marginLeft: '-12px',
                                }}
                            />
                        )}
                    </Box>
                </Box>
            </Paper>
        </Container>
    );
};

export default UserTransferPage;

