// Konum: src/components/TransferForm.tsx
import React, { useState, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import {
    Box,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    CircularProgress,
    Alert,
    Typography,
    Stack
} from '@mui/material';
import { Account } from '../types/account';
import { transactionService, CreateTransferDto } from '../services/transaction.service';
import { accountService } from '../services/account.service';

interface TransferFormProps {
    onTransferSuccess: () => void; // Transfer başarılı olduğunda çağrılacak fonksiyon
}

const TransferForm: React.FC<TransferFormProps> = ({ onTransferSuccess }) => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const userAccounts = await accountService.getAccounts();
                setAccounts(userAccounts.filter(acc => acc.isActive));
            } catch (err) {
                setError("Hesaplar yüklenemedi.");
            }
        };
        fetchAccounts();
    }, []);

    const formik = useFormik({
        initialValues: {
            fromAccountId: '',
            toAccountId: '',
            amount: '',
            description: ''
        },
        validationSchema: Yup.object({
            fromAccountId: Yup.number().required('Kaynak hesap seçimi zorunludur.'),
            toAccountId: Yup.number()
                .required('Hedef hesap seçimi zorunludur.')
                .notOneOf([Yup.ref('fromAccountId')], 'Hedef hesap, kaynak hesaptan farklı olmalıdır.'),
            amount: Yup.number()
                .positive('Tutar pozitif bir değer olmalıdır.')
                .required('Tutar zorunludur.')
                .test(
                    'is-less-than-balance',
                    'Yetersiz bakiye.',
                    function (value) {
                        const fromAccount = accounts.find(acc => acc.id === Number(this.parent.fromAccountId));
                        return fromAccount ? (value || 0) <= fromAccount.balance : true;
                    }
                ),
            description: Yup.string().max(100, 'Açıklama en fazla 100 karakter olabilir.')
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            setError(null);
            setSuccess(null);
            try {
                const transferDto: CreateTransferDto = {
                    fromAccountId: Number(values.fromAccountId),
                    toAccountId: Number(values.toAccountId),
                    amount: Number(values.amount),
                    description: values.description
                };
                await transactionService.createTransfer(transferDto);
                setSuccess('Transfer başarıyla gerçekleştirildi.');
                resetForm();
                onTransferSuccess(); // Hesap listesini ve bakiyeleri yenilemek için
            } catch (err: any) {
                setError(err.response?.data?.message || "Transfer sırasında bir hata oluştu.");
            } finally {
                setSubmitting(false);
            }
        }
    });

    return (
        <Box component="form" onSubmit={formik.handleSubmit} noValidate>
            <Stack spacing={2.5}>
                <Typography variant="h6">Hesaplar Arası Transfer</Typography>
                <FormControl fullWidth error={formik.touched.fromAccountId && Boolean(formik.errors.fromAccountId)}>
                    <InputLabel id="from-account-label">Kaynak Hesap</InputLabel>
                    <Select
                        labelId="from-account-label"
                        label="Kaynak Hesap"
                        {...formik.getFieldProps('fromAccountId')}
                    >
                        {accounts.map(acc => (
                            <MenuItem key={acc.id} value={acc.id}>
                                {`${acc.name} (${acc.balance.toLocaleString('tr-TR', { style: 'currency', currency: acc.currency })} - ${acc.currency})`}
                            </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>{formik.touched.fromAccountId && formik.errors.fromAccountId}</FormHelperText>
                </FormControl>

                <FormControl fullWidth error={formik.touched.toAccountId && Boolean(formik.errors.toAccountId)}>
                    <InputLabel id="to-account-label">Hedef Hesap</InputLabel>
                    <Select
                        labelId="to-account-label"
                        label="Hedef Hesap"
                        {...formik.getFieldProps('toAccountId')}
                    >
                        {accounts.map(acc => (
                            <MenuItem key={acc.id} value={acc.id}>
                                {`${acc.name} (${acc.balance.toLocaleString('tr-TR', { style: 'currency', currency: acc.currency })} - ${acc.currency})`}
                            </MenuItem>
                        ))}
                    </Select>
                    <FormHelperText>{formik.touched.toAccountId && formik.errors.toAccountId}</FormHelperText>
                </FormControl>

                <TextField
                    fullWidth
                    label="Tutar"
                    type="number"
                    {...formik.getFieldProps('amount')}
                    error={formik.touched.amount && Boolean(formik.errors.amount)}
                    helperText={formik.touched.amount && formik.errors.amount}
                />

                <TextField
                    fullWidth
                    label="Açıklama (İsteğe Bağlı)"
                    {...formik.getFieldProps('description')}
                    error={formik.touched.description && Boolean(formik.errors.description)}
                    helperText={formik.touched.description && formik.errors.description}
                />

                {error && <Alert severity="error">{error}</Alert>}
                {success && <Alert severity="success">{success}</Alert>}

                <Button
                    type="submit"
                    variant="contained"
                    disabled={formik.isSubmitting}
                    startIcon={formik.isSubmitting ? <CircularProgress size={20} /> : null}
                >
                    Transferi Gerçekleştir
                </Button>
            </Stack>
        </Box>
    );
};

export default TransferForm;
