import React, { useEffect, useState, FormEvent, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { transactionService } from '../services/transaction.service';
import { accountService } from '../services/account.service';
import { categoryService } from '../services/category.service';
import { transferService } from '../services/transfer.service';
import {
    Transaction, CreateTransactionRequest, UpdateTransactionRequest, TransactionType,
} from '../types/transaction';
import { Account } from '../types/account';
import { Category } from '../types/category'; 
import {
    Container, Typography, Paper, TextField, Button, CircularProgress, Alert, Box, Stack,
    FormControl, InputLabel, Select, MenuItem, FormHelperText
} from '@mui/material';
import { Save, ArrowBack } from '@mui/icons-material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { tr } from 'date-fns/locale';
import { parseISO } from 'date-fns';


const TransactionForm: React.FC = () => {
    const { transactionId } = useParams<{ transactionId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const isEditMode = Boolean(transactionId);

    const [accounts, setAccounts] = useState<Account[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [selectedAccountId, setSelectedAccountId] = useState<number | ''>('');
    const [selectedCategoryId, setSelectedCategoryId] = useState<number | ''>('');
    const [amount, setAmount] = useState<number | string>('');
    const [description, setDescription] = useState('');
    const [transactionDate, setTransactionDate] = useState<Date | null>(new Date());
    const [transactionType, setTransactionType] = useState<TransactionType>(TransactionType.Expense);
    const [targetAccountId, setTargetAccountId] = useState<number | ''>(''); // Transfer için hedef hesap

    const [submitLoading, setSubmitLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

    const defaultAccountIdFromState = location.state?.defaultAccountId;

    const fetchData = useCallback(async () => {
        setPageLoading(true);
        setError(null);
        setFormErrors({});
        try {
            const [accResponse, catResponse] = await Promise.all([
                accountService.getAccounts(),
                categoryService.getCategories()
            ]);
            const activeAccounts = accResponse.filter(acc => acc.isActive);
            setAccounts(activeAccounts);
            setCategories(catResponse);

            if (isEditMode && transactionId) {
                const tx = await transactionService.getTransactionById(parseInt(transactionId, 10));
                setSelectedAccountId(tx.accountId);
                setSelectedCategoryId(tx.categoryId || '');
                setAmount(Math.abs(tx.amount)); // Tutar her zaman pozitif gösterilir
                setDescription(tx.description || '');
                setTransactionDate(tx.transactionDate ? parseISO(tx.transactionDate) : null);
                setTransactionType(tx.type);

                // Düzenleme modunda transfer işlemleri için hedef hesabı ayarla
                if ([TransactionType.GidenTransfer, TransactionType.GelenTransfer].includes(tx.type)) {
                    // Bu kısım, targetAccountId'nin backend'den ayrı bir alan olarak gelmesiyle daha güvenilir hale getirilebilir.
                    // Şimdilik description'dan parse edilerek gerçekleştiriliyor
                    const matches = tx.description?.match(/Hesap ID: (\d+)/);
                    if (matches && matches[1]) {
                        setTargetAccountId(parseInt(matches[1], 10));
                    }
                }
            } else {
                if (defaultAccountIdFromState && activeAccounts.find(acc => acc.id === defaultAccountIdFromState)) {
                    setSelectedAccountId(defaultAccountIdFromState);
                } else if (activeAccounts.length > 0) {
                    setSelectedAccountId(activeAccounts[0].id);
                } else {
                    setSelectedAccountId(''); // Aktif hesap yoksa boş bırak
                }
                setTransactionDate(new Date());
                setTransactionType(TransactionType.Expense);
                setAmount('');
                setDescription('');
                setSelectedCategoryId('');
            }
        } catch (err: any) {
            console.error("Error fetching data for transaction form:", err);
            if (err.response && err.response.status === 401) navigate('/login');
            else setError(err.response?.data?.message || "Form için gerekli veriler yüklenemedi.");
        } finally {
            setPageLoading(false);
        }
    }, [transactionId, isEditMode, navigate, defaultAccountIdFromState]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const validateForm = () => {
        const errors: { [key: string]: string } = {};
        if (selectedAccountId === '') errors.selectedAccountId = "Hesap seçimi zorunludur.";
        if (amount === '' || isNaN(Number(amount))) errors.amount = "Tutar geçerli bir sayı olmalıdır.";
        else if (Number(amount) <= 0) errors.amount = "Tutar pozitif bir değer olmalıdır.";
        if (!transactionDate) errors.transactionDate = "İşlem tarihi zorunludur.";
        if (description.length > 255) errors.description = "Açıklama en fazla 255 karakter olabilir.";

        // Transfer işlemleri için ek doğrulama
        if ([TransactionType.GidenTransfer, TransactionType.GelenTransfer].includes(transactionType)) {
            if (targetAccountId === '') errors.targetAccountId = "Hedef hesap seçimi zorunludur.";
            if (selectedAccountId === targetAccountId) errors.targetAccountId = "Kaynak ve hedef hesap aynı olamaz.";
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!validateForm()) return;

        setSubmitLoading(true);
        setError(null);

        try {
            if (isEditMode && transactionId) {
                // DÜZENLEME MODU
                if ([TransactionType.GidenTransfer, TransactionType.GelenTransfer].includes(transactionType)) {
                    // Transfer güncelleme (varsa)
                    // await transferService.updateTransfer(parseInt(transactionId, 10), { ... });
                    alert("Transfer işlemlerinin güncellenmesi henüz desteklenmiyor.");
                } else {
                    const transactionDataPayload = {
                        accountId: Number(selectedAccountId),
                        categoryId: selectedCategoryId === '' ? null : Number(selectedCategoryId),
                        amount: Number(amount),
                        description,
                        transactionDate: transactionDate ? transactionDate.toISOString() : new Date().toISOString(),
                        type: transactionType,
                    };
                    await transactionService.updateTransaction(parseInt(transactionId, 10), transactionDataPayload as UpdateTransactionRequest);
                }
            } else {
                // YENİ OLUŞTURMA MODU
                if ([TransactionType.GidenTransfer, TransactionType.GelenTransfer].includes(transactionType)) {
                    await transferService.transferBetweenOwnAccounts({
                        fromAccountId: Number(selectedAccountId),
                        toAccountId: Number(targetAccountId),
                        amount: Number(amount),
                        description: description
                    });
                } else {
                    const transactionDataPayload = {
                        accountId: Number(selectedAccountId),
                        categoryId: selectedCategoryId === '' ? null : Number(selectedCategoryId),
                        amount: Number(amount),
                        description,
                        transactionDate: transactionDate ? transactionDate.toISOString() : new Date().toISOString(),
                        type: transactionType,
                    };
                    await transactionService.createTransaction(transactionDataPayload as CreateTransactionRequest);
                }
            }
            navigate('/transactions');
        } catch (err: any) {
            console.error("Error saving transaction:", err);
            const apiErrorMessage = err.response?.data?.message || "İşlem kaydedilirken bir hata oluştu.";
            if (err.response?.data?.errors) {
                const backendErrors = err.response.data.errors;
                const newFormErrors = { ...formErrors };
                 for (const key in backendErrors) {
                    const formKey = key.charAt(0).toLowerCase() + key.slice(1);
                    if (formKey === "accountId") newFormErrors["selectedAccountId"] = backendErrors[key].join(', ');
                    else if (formKey === "categoryId") newFormErrors["selectedCategoryId"] = backendErrors[key].join(', ');
                    else if (formKey === "targetAccountId") newFormErrors["targetAccountId"] = backendErrors[key].join(', ');
                    else newFormErrors[formKey] = backendErrors[key].join(', ');
                }
                setFormErrors(newFormErrors);
            } else {
                 if (typeof apiErrorMessage === 'string' && !apiErrorMessage.toLowerCase().includes("validation")) {
                     setError(apiErrorMessage);
                } else if (typeof apiErrorMessage === 'object') {
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
        <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={tr}>
            <Container maxWidth="sm" sx={{ mt: 4 }}>
                <Button startIcon={<ArrowBack />} onClick={() => navigate('/transactions')} sx={{ mb: 2 }}>
                    İşlemlere Geri Dön
                </Button>
                <Paper elevation={2} sx={{ p: 3 }}>
                    <Typography variant="h4" component="h1" gutterBottom>
                        {isEditMode ? 'İşlemi Düzenle' : 'Yeni İşlem Ekle'}
                    </Typography>

                    {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}

                    <Box component="form" onSubmit={handleSubmit} noValidate>
                        <Stack spacing={2.5}>
                            <FormControl fullWidth required error={!!formErrors.selectedAccountId}>
                                <InputLabel id="account-select-label">Hesap</InputLabel>
                                <Select
                                    labelId="account-select-label"
                                    value={selectedAccountId}
                                    label="Hesap"
                                    onChange={(e) => setSelectedAccountId(e.target.value as number)}
                                    disabled={submitLoading || accounts.length === 0}
                                >
                                    {accounts.length === 0 && <MenuItem value="" disabled><em>Aktif hesap bulunamadı.</em></MenuItem>}
                                    {accounts.map((acc) => (
                                        <MenuItem key={acc.id} value={acc.id}>
                                            {acc.name} ({acc.balance.toLocaleString('tr-TR', { style: 'currency', currency: acc.currency })})
                                        </MenuItem>
                                    ))}
                                </Select>
                                {formErrors.selectedAccountId && <FormHelperText error>{formErrors.selectedAccountId}</FormHelperText>}
                            </FormControl>

                            {/* Tutar ve İşlem Türü yan yana */}
                            <Box sx={{ display: 'flex', gap: 2 }}>
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
                                    sx={{ flex: 2 }}
                                />
                                <FormControl fullWidth required error={!!formErrors.type} sx={{ flex: 1.5 }}>
                                    <InputLabel id="type-select-label">İşlem Türü</InputLabel>
                                    <Select
                                        labelId="type-select-label"
                                        value={transactionType}
                                        label="İşlem Türü"
                                        onChange={(e) => setTransactionType(e.target.value as TransactionType)}
                                        disabled={submitLoading}
                                    >
                                        <MenuItem value={TransactionType.Income}>Gelir</MenuItem>
                                        <MenuItem value={TransactionType.Expense}>Gider</MenuItem>
                                        <MenuItem value={TransactionType.GidenTransfer}>Giden Transfer</MenuItem>
                                        <MenuItem value={TransactionType.GelenTransfer}>Gelen Transfer</MenuItem>
                                        <MenuItem value={TransactionType.EFTGonderim}>EFT Gönderim</MenuItem>
                                        <MenuItem value={TransactionType.EFTAlim}>EFT Alım</MenuItem>
                                        <MenuItem value={TransactionType.YatirimAlim}>Yatırım Alış</MenuItem>
                                        <MenuItem value={TransactionType.YatirimSatim}>Yatırım Satış</MenuItem>
                                        <MenuItem value={TransactionType.NakitYatirma}>Nakit Yatırma</MenuItem>
                                        <MenuItem value={TransactionType.NakitCekme}>Nakit Çekme</MenuItem>
                                    </Select>
                                    {formErrors.type && <FormHelperText error>{formErrors.type}</FormHelperText>}
                                </FormControl>
                            </Box>

                            {[TransactionType.GidenTransfer, TransactionType.GelenTransfer].includes(transactionType) && (
                                <FormControl fullWidth required error={!!formErrors.targetAccountId}>
                                    <InputLabel id="target-account-select-label">Hedef Hesap</InputLabel>
                                    <Select
                                        labelId="target-account-select-label"
                                        value={targetAccountId}
                                        label="Hedef Hesap"
                                        onChange={(e) => setTargetAccountId(e.target.value as number)}
                                        disabled={submitLoading}
                                    >
                                        {accounts.filter(acc => acc.id !== selectedAccountId).map((acc) => (
                                            <MenuItem key={acc.id} value={acc.id}>
                                                {acc.name} ({acc.balance.toLocaleString('tr-TR', { style: 'currency', currency: acc.currency })})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {formErrors.targetAccountId && <FormHelperText error>{formErrors.targetAccountId}</FormHelperText>}
                                </FormControl>
                            )}

                            {[TransactionType.Income, TransactionType.Expense].includes(transactionType) && (
                                <FormControl fullWidth error={!!formErrors.selectedCategoryId}>
                                    <InputLabel id="category-select-label">Kategori (İsteğe Bağlı)</InputLabel>
                                    <Select
                                        labelId="category-select-label"
                                        value={selectedCategoryId}
                                        label="Kategori (İsteğe Bağlı)"
                                        onChange={(e) => setSelectedCategoryId(e.target.value as number)}
                                        disabled={submitLoading}
                                    >
                                        <MenuItem value=""><em>Kategori Seçmeyin</em></MenuItem>
                                        {categories.map((cat) => (
                                            <MenuItem key={cat.id} value={cat.id} sx={{ color: cat.color || 'inherit' }}>
                                                {cat.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                    {formErrors.selectedCategoryId && <FormHelperText error>{formErrors.selectedCategoryId}</FormHelperText>}
                                </FormControl>
                            )}

                            <DateTimePicker
                                label="İşlem Tarihi ve Saati"
                                value={transactionDate}
                                onChange={(newValue) => setTransactionDate(newValue)}
                                sx={{ width: '100%' }}
                                disabled={submitLoading}
                                slotProps={{
                                    textField: {
                                        required: true,
                                        error: !!formErrors.transactionDate,
                                        helperText: formErrors.transactionDate,
                                    },
                                }}
                                ampm={false} // 24 saat formatı
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
                                disabled={submitLoading || pageLoading} 
                            >
                                {submitLoading ? <CircularProgress size={24} color="inherit"/> : (isEditMode ? 'Güncelle' : 'Kaydet')}
                            </Button>
                        </Stack>
                    </Box>
                </Paper>
            </Container>
        </LocalizationProvider>
    );
};

export default TransactionForm;