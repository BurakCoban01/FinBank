import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { accountService } from '../services/account.service';
import { Account, CreateAccountRequest, UpdateAccountRequest } from '../types/account';
import {
    Container, Typography, Paper, TextField, Button, CircularProgress, Alert, Box,
    FormControlLabel, Switch, Stack, FormControl, InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';

const AccountForm: React.FC = () => {
    const { accountId } = useParams<{ accountId?: string }>();
    const navigate = useNavigate();
    const isEditMode = Boolean(accountId);

    const [name, setName] = useState('');
    const [accountType, setAccountType] = useState('');
    const [balance, setBalance] = useState<number | string>('');
    const [currency, setCurrency] = useState('TRY');
    const [isActive, setIsActive] = useState(true);

    const [submitLoading, setSubmitLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(isEditMode);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});


    const fetchAccount = useCallback(async () => {
        if (isEditMode && accountId) {
            setError(null);
            setPageLoading(true);
            try {
                const id = parseInt(accountId, 10);
                const acc = await accountService.getAccountById(id);
                setName(acc.name);
                setAccountType(acc.accountType);
                setBalance(acc.balance);
                setCurrency(acc.currency);
                setIsActive(acc.isActive);
            } catch (err: any) {
                console.error("Error fetching account:", err);
                if (err.response && err.response.status === 401) navigate('/login');
                else setError(err.response?.data?.message || "Hesap bilgileri yüklenemedi.");
            } finally {
                setPageLoading(false);
            }
        } else {
            // Yeni hesap için varsayılanları sıfırla veya ayarla
            setName('');
            setAccountType(''); // Başlangıçta boş olsun
            setBalance('');
            setCurrency('TRY');
            setIsActive(true);
            setFormErrors({});
            setPageLoading(false);
        }
    }, [accountId, isEditMode, navigate]);

    useEffect(() => {
        fetchAccount();
    }, [fetchAccount]);

    const validateForm = () => {
        const errors: { [key: string]: string } = {};
        if (!name.trim()) errors.name = "Hesap adı boş bırakılamaz.";
        if (name.trim().length > 100) errors.name = "Hesap adı en fazla 100 karakter olabilir.";
        if (!accountType.trim()) errors.accountType = "Hesap türü seçimi zorunludur.";
        if (balance === '' || isNaN(Number(balance))) errors.balance = "Bakiye geçerli bir sayı olmalıdır.";
        if (!currency.trim()) errors.currency = "Para birimi boş bırakılamaz.";
        if (currency.trim().length !== 3) errors.currency = "Para birimi 3 karakter olmalıdır (örn: TRY).";
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!validateForm()) return;

        setSubmitLoading(true);
        setError(null);

        const commonData = { name, accountType, balance: Number(balance), currency: currency.toUpperCase() };

        try {
            if (isEditMode && accountId) {
                const updateData: UpdateAccountRequest = { ...commonData, isActive };
                await accountService.updateAccount(parseInt(accountId, 10), updateData);
            } else {
                const createData: CreateAccountRequest = commonData;
                await accountService.createAccount(createData);
            }
            navigate('/accounts');
        } catch (err: any) {
            console.error("Error saving account:", err);
            const apiErrorMessage = err.response?.data?.message || "Hesap kaydedilirken bir hata oluştu.";
            if (err.response?.data?.errors) {
                const backendErrors = err.response.data.errors;
                const newFormErrors = { ...formErrors };
                for (const key in backendErrors) {
                    const formKey = key.charAt(0).toLowerCase() + key.slice(1);
                    newFormErrors[formKey] = backendErrors[key].join(', ');
                }
                setFormErrors(newFormErrors);
            } else { // Genel hata mesajını göster
                 // Gelen hata mesajında "errors" yoksa direkt mesajı set et
                if (typeof apiErrorMessage === 'string' && !apiErrorMessage.toLowerCase().includes("validation")) {
                     setError(apiErrorMessage); // Sadece genel hata mesajı varsa göster
                } else if (typeof apiErrorMessage === 'object') { // Bazen hata objesi dönebilir
                    setError("Bilinmeyen bir sunucu hatası oluştu.");
                }
            }
        } finally {
            setSubmitLoading(false);
        }
    };

    if (pageLoading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/accounts')} sx={{ mb: 2 }}>
                Hesaplara Geri Dön
            </Button>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    {isEditMode ? 'Hesabı Düzenle' : 'Yeni Hesap Ekle'}
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Stack spacing={2.5}> {/* TextField'lar arası dikey boşluk */}
                        <TextField
                            label="Hesap Adı"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            fullWidth
                            required
                            error={!!formErrors.name}
                            helperText={formErrors.name}
                            disabled={submitLoading}
                        />
                        <FormControl fullWidth required error={!!formErrors.accountType} disabled={submitLoading}>
                            <InputLabel id="account-type-label">Hesap Türü</InputLabel>
                            <Select
                                labelId="account-type-label"
                                label="Hesap Türü"
                                value={accountType}
                                onChange={(e) => setAccountType(e.target.value as string)}
                            >
                                <MenuItem value={"Banka Hesabı"}>Banka Hesabı</MenuItem>
                                <MenuItem value={"Kredi Kartı"}>Kredi Kartı</MenuItem>
                                <MenuItem value={"Yatırım Hesabı"}>Yatırım Hesabı</MenuItem>
                                <MenuItem value={"Nakit"}>Nakit</MenuItem>
                                <MenuItem value={"Diğer"}>Diğer</MenuItem>
                            </Select>
                            {formErrors.accountType && <FormHelperText error>{formErrors.accountType}</FormHelperText>}
                        </FormControl>
                        {/* Bakiye ve Para Birimi için Box ile yan yana düzenleme */}
                        <Box sx={{ display: 'flex', gap: 2 }}>
                            <TextField
                                label="Bakiye"
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                inputProps={{ step: "0.01", lang: "tr-TR" }} // Ondalık ve lokalizasyon
                                fullWidth
                                required
                                error={!!formErrors.balance}
                                helperText={formErrors.balance}
                                disabled={submitLoading}
                                sx={{ flex: 2 }} // Bakiye alanı daha geniş
                            />
                            <TextField
                                label="Para Birimi"
                                value={currency}
                                onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                                fullWidth
                                required
                                inputProps={{ maxLength: 3, style: { textTransform: 'uppercase' } }}
                                error={!!formErrors.currency}
                                helperText={formErrors.currency || "Örn: TRY"}
                                disabled={submitLoading}
                                sx={{ flex: 1 }} // Para birimi alanı daha dar
                            />
                        </Box>
                        {isEditMode && (
                            <FormControlLabel
                                control={
                                    <Switch
                                        checked={isActive}
                                        onChange={(e) => setIsActive(e.target.checked)}
                                        name="isActive"
                                        color="primary"
                                        disabled={submitLoading}
                                    />
                                }
                                label="Hesap Aktif"
                            />
                        )}
                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            startIcon={<Save />}
                            disabled={submitLoading || pageLoading} // pageLoading de eklendi
                            sx={{ mt: 1 }} // Stack spacing ile uyumlu
                        >
                            {submitLoading ? <CircularProgress size={24} color="inherit" /> : (isEditMode ? 'Güncelle' : 'Kaydet')}
                        </Button>
                    </Stack>
                </Box>
            </Paper>
        </Container>
    );
};

export default AccountForm;
