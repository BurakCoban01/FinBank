// Konum: fintrack-client/src/pages/TimeDepositPage.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Typography, Paper, Box, Button, CircularProgress, Alert, Stack, TextField, Select, MenuItem, FormControl, InputLabel, Divider, List, ListItem, ListItemText, Chip, FormHelperText, RadioGroup, FormControlLabel, Radio, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, ListItemButton } from '@mui/material';
import { Add as AddIcon, CalendarTodayOutlined, ErrorOutline, InfoOutlined, LockClockOutlined, PublishedWithChangesOutlined, Savings as SavingsIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { accountService } from '../services/account.service';
import { timeDepositService } from '../services/timeDeposit.service';
import { calculationService } from '../services/calculation.service';
import { TimeDeposit, CreateTimeDepositRequest, MaturityAction, DepositCalculationResponse } from '../types/timeDeposit';
import { Account } from '../types/account';
import { format, addMonths, differenceInDays } from 'date-fns';

const maturityActionText: { [key in MaturityAction]: string } = {
    [MaturityAction.CloseAndTransfer]: 'Vade Sonunda Kapat (Vadesize Aktar)',
    [MaturityAction.RenewPrincipal]: 'Anaparayı Aynı Vadede Yenile',
    [MaturityAction.RenewAll]: 'Tamamını Aynı Vadede Yenile'
};

const TimeDepositPage: React.FC = () => {
    const [deposits, setDeposits] = useState<TimeDeposit[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedDeposit, setSelectedDeposit] = useState<TimeDeposit | null>(null);
    const [isCloseDialogOpen, setCloseDialogOpen] = useState(false);
    const [isSubmittingClose, setSubmittingClose] = useState(false);
    const [depositInfo, setDepositInfo] = useState<DepositCalculationResponse | null>(null);
    const [calculating, setCalculating] = useState(false);

    const [depositRates, setDepositRates] = useState<{ duration: number; rate: number }[]>([]);

    // Sayfa yüklendiğinde TCMB mevduat oranlarının çekilmesi
    useEffect(() => {
     timeDepositService.getDepositRates()
       .then(rates => setDepositRates(rates))
       .catch(() => setDepositRates([]));
    }, []);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [depositsData, accountsData] = await Promise.all([
                timeDepositService.getMyDeposits(),
                accountService.getAccounts()
            ]);
            setDeposits(depositsData);
            setAccounts(accountsData.filter(acc => acc.isActive));

            if (selectedDeposit) {
                const updatedSelected = depositsData.find(d => d.id === selectedDeposit.id);
                setSelectedDeposit(updatedSelected || null);
            }

        } catch (err: any) {
            setError(err.response?.data?.message || "Veriler yüklenemedi.");
        } finally {
            setLoading(false);
        }
    }, [selectedDeposit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formik = useFormik({
        initialValues: {
            sourceAccountId: '',
            amount: '10000',
            termInMonths: 3,
            maturityAction: MaturityAction.CloseAndTransfer.toString()
        },
        validationSchema: Yup.object({
            sourceAccountId: Yup.number().required('Kaynak hesap seçimi zorunludur.'),
            amount: Yup.number().positive('Tutar pozitif olmalıdır.').required('Tutar zorunludur.'),
            termInMonths: Yup.number().integer().min(1).required('Vade zorunludur.'),
            maturityAction: Yup.string().required('Vade sonu seçeneği zorunludur.')
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            setError(null);
            if (!depositInfo) {
                setError("Hesaplama sonucu olmadan işlem yapılamaz.");
                return;
            }
            try {
                await timeDepositService.createDeposit({
                    sourceAccountId: Number(values.sourceAccountId),
                    amount: Number(values.amount),
                    termInMonths: values.termInMonths,
                    annualInterestRate: depositInfo.annualInterestRate / 100,
                    maturityAction: Number(values.maturityAction) as MaturityAction,

                } as CreateTimeDepositRequest);
                resetForm();
                fetchData(); // Listeyi yenile
            } catch (err: any) {
                setError(err.response?.data?.message || 'Mevduat oluşturulamadı.');
            } finally {
                setSubmitting(false);
            }
        },
    });


    const handleCloseEarly = async () => {
        if (!selectedDeposit) return;
        setSubmittingClose(true);
        setError(null);

        try {
            await timeDepositService.closeDepositEarly(selectedDeposit.id);
            setCloseDialogOpen(false);
            fetchData();
        } catch (err: any) { setError(err.response?.data?.message || "Hesap kapatılırken bir hata oluştu."); } 
        finally { setSubmittingClose(false); }
    };

    useEffect(() => {
        const { amount, termInMonths } = formik.values;
        const principal = Number(amount);
        const term = Number(termInMonths);

        if (principal > 0 && term > 0 && !formik.errors.amount && !formik.errors.termInMonths) {
            setCalculating(true);
            calculationService.calculateDeposit({ amount: principal, termInMonths: term })
                .then(setDepositInfo)
                .catch(() => setDepositInfo(null))
                .finally(() => setCalculating(false));
        } else {
            setDepositInfo(null);
        }
    }, [formik.values, formik.errors]);
    

    const DepositDetailsCard = ({ deposit }: { deposit: TimeDeposit | null }) => {
        if (!deposit) {
            return (
                <Paper sx={{ p: 3, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '2px dashed', borderColor: 'grey.300' }}>
                    <InfoOutlined sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">Detayları görmek için listeden bir mevduat hesabı seçin.</Typography>
                </Paper>
            );
        }

        const daysRemaining = differenceInDays(new Date(deposit.endDate), new Date());

        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Typography variant="h5" gutterBottom>Mevduat Detayları</Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                    <Box><Typography variant="body2"><CalendarTodayOutlined fontSize="small" sx={{verticalAlign: 'bottom', mr: 1}}/> Başlangıç Tarihi: <strong>{format(new Date(deposit.startDate), 'dd.MM.yyyy')}</strong></Typography></Box>
                    <Box><Typography variant="body2"><LockClockOutlined fontSize="small" sx={{verticalAlign: 'bottom', mr: 1}}/> Vade Bitiş Tarihi: <strong>{format(new Date(deposit.endDate), 'dd.MM.yyyy')}</strong></Typography></Box>
                    <Divider />
                    <Box><Typography variant="body2">Anapara: <strong>{deposit.principalAmount.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</strong></Typography></Box>
                    <Box><Typography variant="body2">Vade Sonu Tutar: <strong>{deposit.maturityAmount.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</strong></Typography></Box>
                    <Box><Typography variant="body2">Net Getiri: <strong style={{color: '#4caf50'}}>{(deposit.maturityAmount - deposit.principalAmount).toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</strong></Typography></Box>
                    <Box><Typography variant="body2">Yıllık Faiz Oranı: <strong>%{deposit.interestRate.toFixed(2)}</strong></Typography></Box>
                    <Divider />
                    <Box><Typography variant="body2"><PublishedWithChangesOutlined fontSize="small" sx={{verticalAlign: 'bottom', mr: 1}}/> Vade Sonu Talimatı: <strong>{maturityActionText[deposit.maturityAction]}</strong></Typography></Box>
                    <Box><Typography variant="body2">Kaynak Hesap: <strong>{deposit.sourceAccountName}</strong></Typography></Box>
                    <Box><Typography variant="body2" color={daysRemaining > 0 ? "text.primary" : "success.main"}>Vade Sonuna Kalan: <strong>{daysRemaining > 0 ? `${daysRemaining} gün` : "Vade Doldu"}</strong></Typography></Box>
                </Stack>
                {deposit.isActive && (
                     <Button fullWidth variant="contained" color="error" sx={{mt: 3}} onClick={() => setCloseDialogOpen(true)} startIcon={<ErrorOutline/>}>
                        Hesabı Erken Kapat
                     </Button>
                )}
            </Paper>
        );
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>Yeni Vadeli Mevduat Oluştur</Typography>
                <Box component="form" onSubmit={formik.handleSubmit} noValidate>
                    <Stack spacing={2.5}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2.5 }}>

                            <FormControl fullWidth error={formik.touched.sourceAccountId && Boolean(formik.errors.sourceAccountId)}>
                                <InputLabel id="source-account-label">Kaynak Hesap</InputLabel>
                                <Select labelId="source-account-label" label="Kaynak Hesap" {...formik.getFieldProps('sourceAccountId')}>
                                    {accounts.map(acc => <MenuItem key={acc.id} value={acc.id}>{`${acc.name} (${acc.balance.toLocaleString('tr-TR')} ${acc.currency})`}</MenuItem>)}
                                </Select>
                                {formik.touched.sourceAccountId && <FormHelperText error>{formik.errors.sourceAccountId}</FormHelperText>}
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel id="term-deposit-label">Vade (Ay)</InputLabel>
                                <Select labelId="term-deposit-label" label="Vade (Ay)" {...formik.getFieldProps('termInMonths')}>
                                    {depositRates.map(dr => (
                                        <MenuItem key={dr.duration} value={dr.duration}>
                                            {dr.duration} Ay (%{dr.rate.toFixed(2)})
                                        </MenuItem>
                                        ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <TextField fullWidth label="Yatırılacak Tutar (TRY)" type="number" {...formik.getFieldProps('amount')} error={formik.touched.amount && Boolean(formik.errors.amount)} helperText={formik.touched.amount && formik.errors.amount} />
                        
                        <FormControl component="fieldset">
                           <Typography variant="subtitle2" sx={{mb: 1}}>Vade Sonunda</Typography>
                           <RadioGroup row {...formik.getFieldProps('maturityAction')}>
                               <FormControlLabel value={MaturityAction.CloseAndTransfer.toString()} control={<Radio />} label="Hesabı Kapat" />
                               <FormControlLabel value={MaturityAction.RenewPrincipal.toString()} control={<Radio />} label="Anaparayı Yenile" />
                               <FormControlLabel value={MaturityAction.RenewAll.toString()} control={<Radio />} label="Tümünü Yenile" />
                           </RadioGroup>
                        </FormControl>

                        <Paper variant="outlined" sx={{ p: 2, mt: 2, textAlign: 'center', position: 'relative' }}>
                           <Typography variant="h6">Getiri Özeti</Typography>
                           {calculating && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-12px' }} />}
                           <Box sx={{ filter: calculating ? 'blur(2px)' : 'none' }}>
                               <Typography variant="subtitle1" gutterBottom>(Yıllık Faiz: %{depositInfo?.annualInterestRate.toFixed(2) ?? '...'})</Typography>
                               <Box sx={{ display: 'flex', justifyContent: 'space-around', mt: 1 }}>
                                   <Box><Typography variant="body2">Vade Sonu Tarihi:</Typography><Typography variant="h6">{depositInfo ? format(new Date(depositInfo.endDate), 'dd.MM.yyyy') : '...'}</Typography></Box>
                                   <Box><Typography variant="body2">Vade Sonu Net Tutar:</Typography><Typography variant="h6">{depositInfo?.maturityAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) ?? '...'}</Typography></Box>
                               </Box>
                           </Box>
                        </Paper>
                        
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={{ mt: 2, height: '48px' }} disabled={formik.isSubmitting}>{formik.isSubmitting ? <CircularProgress size={24} /> : "Mevduat Hesabını Oluştur"}</Button>
                    </Stack>
                </Box>
            </Paper>

            <Typography variant="h4" component="h2" gutterBottom>Mevcut Vadeli Hesaplarım</Typography>
            {loading ? <CircularProgress /> : (
                <List>
                    {deposits.map(deposit => (
                        <Paper key={deposit.id} sx={{ p: 2, mb: 2 }}>
                             <ListItem disableGutters>
                                <SavingsIcon color="primary" sx={{mr: 2, fontSize: 32}}/>
                                <ListItemText 
                                    primary={`Anapara: ${deposit.principalAmount.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})} - Yıllık Faiz: %${deposit.interestRate.toFixed(2)}`}
                                    secondary={`Vade: ${format(new Date(deposit.startDate), 'dd.MM.yy')} - ${format(new Date(deposit.endDate), 'dd.MM.yy')} | Kaynak: ${deposit.sourceAccountName}`}
                                />
                                <Box textAlign="right">
                                    <Typography variant="h6" color="success.main">{deposit.maturityAmount.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</Typography>
                                    <Chip label={maturityActionText[deposit.maturityAction as MaturityAction]} size="small" variant="outlined" sx={{mt: 0.5}} />
                                </Box>
                            </ListItem>
                        </Paper>
                    ))}
                    {deposits.length === 0 && <Typography>Aktif vadeli mevduat hesabınız bulunmamaktadır.</Typography>}
                </List>
            )}
        </Container>
    );
};

export default TimeDepositPage;