// Konum: fintrack-client/src/pages/LoanPage.tsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Container, Typography, Paper, Box, Button, CircularProgress, Alert, Stack, TextField, Select, MenuItem, FormControl, InputLabel, Divider, List, ListItem, ListItemText, Chip, FormHelperText, Dialog, DialogActions, DialogContent, TablePagination, TableContainer, Table, TableBody, TableRow, TableCell, TableHead, DialogTitle } from '@mui/material';
import { Add as AddIcon, MonetizationOn as MonetizationOnIcon, Visibility as VisibilityIcon } from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { accountService } from '../services/account.service';
import { loanService } from '../services/loan.service';
import { calculationService } from '../services/calculation.service';
import { Loan, LoanCalculationResponse } from '../types/loan';
import { Account } from '../types/account';
import { format, addMonths } from 'date-fns';

// Kredi türüne göre vade seçeneklerini tutan sabit
const loanTermOptions: { [key: string]: number[] } = {
    'İhtiyaç Kredisi': [12, 24, 36],
    'Taşıt Kredisi': [12, 24, 36, 48],
    'Konut Kredisi': [60, 84, 120],
};

// Ödeme planı için diyalog bileşeni
const PaymentScheduleDialog = ({ open, onClose, loan }: { open: boolean, onClose: () => void, loan: Loan | null }) => {
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(6);

    const paymentSchedule = useMemo(() => {
        if (!loan) return [];
        const schedule = [];
        let remainingPrincipal = loan.principalAmount;
        for (let i = 1; i <= loan.termInMonths; i++) {
            const interestPayment = remainingPrincipal * (loan.interestRate / 100 / 12);
            const principalPayment = loan.monthlyPayment - interestPayment;
            remainingPrincipal -= principalPayment;
            schedule.push({
                month: i,
                paymentDate: format(addMonths(new Date(loan.startDate), i), 'dd.MM.yyyy'),
                principal: principalPayment,
                interest: interestPayment,
                remaining: remainingPrincipal > 0 ? remainingPrincipal : 0
            });
        }
        return schedule;
    }, [loan]);

    if (!loan) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Ödeme Planı: {loan.loanType}</DialogTitle>
            <DialogContent>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell>Taksit No</TableCell>
                                <TableCell>Tarih</TableCell>
                                <TableCell align="right">Ödenecek Miktar</TableCell>
                                <TableCell align="right">Ö. Anapara</TableCell>
                                <TableCell align="right">Ö. Faiz</TableCell>
                                <TableCell align="right">Kalan Anapara</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paymentSchedule.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(p => (
                                <TableRow key={p.month}>
                                    <TableCell>{p.month}</TableCell>
                                    <TableCell>{p.paymentDate}</TableCell>
                                    {/* Bu değer, her ay sabit olan taksit tutarıdır. */}
                                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                                        {loan.monthlyPayment.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}
                                    </TableCell>
                                    <TableCell align="right">{p.principal.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</TableCell>
                                    <TableCell align="right">{p.interest.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</TableCell>
                                    <TableCell align="right">{p.remaining.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    rowsPerPageOptions={[6, 12, 24]}
                    component="div"
                    count={loan.termInMonths}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                />
            </DialogContent>
            <DialogActions><Button onClick={onClose}>Kapat</Button></DialogActions>
        </Dialog>
    );
};


const LoanPage: React.FC = () => {
    const [loans, setLoans] = useState<Loan[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [scheduleLoan, setScheduleLoan] = useState<Loan | null>(null);
    const [paymentInfo, setPaymentInfo] = useState<LoanCalculationResponse | null>(null);
    const [calculating, setCalculating] = useState(false);


    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [loansData, accountsData] = await Promise.all([
                loanService.getMyLoans(),
                accountService.getAccounts()
            ]);
            setLoans(loansData);
            setAccounts(accountsData.filter(acc => acc.isActive));
        } catch (err: any) {
            setError(err.response?.data?.message || "Veriler yüklenemedi.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const formik = useFormik({
        initialValues: {
            targetAccountId: '',
            loanType: 'İhtiyaç Kredisi',
            amount: '10000',
            termInMonths: 12,   // başlangıç vadesi 
        },
        validationSchema: Yup.object({
            targetAccountId: Yup.number().required('Hedef hesap seçimi zorunludur.'),
            loanType: Yup.string().required('Kredi türü zorunludur.'),
            amount: Yup.number().min(1000, 'Minimum 1000 TL').required('Tutar zorunludur.'),
            termInMonths: Yup.number().integer().min(3, 'Minimum 3 ay vade').required('Vade zorunludur.'),
        }),
        onSubmit: async (values, { setSubmitting, resetForm }) => {
            setError(null);
            try {
                await loanService.createLoan({
                    targetAccountId: Number(values.targetAccountId),
                    loanType: values.loanType,
                    amount: Number(values.amount),
                    termInMonths: values.termInMonths,
                });
                resetForm();
                fetchData(); // Listeyi ve hesap bakiyelerini yenile
            } catch (err: any) {
                setError(err.response?.data?.message || 'Kredi oluşturulamadı.');
            } finally {
                setSubmitting(false);
            }
        },
    });


    // Bu useEffect, kredi türü değiştiğinde vadeyi sıfırlar
    useEffect(() => {
        const selectedLoanType = formik.values.loanType;
        const validTerms = loanTermOptions[selectedLoanType] || [];
        const currentTerm = formik.values.termInMonths;

        // Eğer mevcut seçili vade, yeni kredi türü için geçerli değilse,
        // vadeyi o tür için geçerli olan ilk seçeneğe ayarla
        if (!validTerms.includes(currentTerm)) {
            formik.setFieldValue('termInMonths', validTerms[0] || 12);
        }
    }, [formik.values.loanType, formik.setFieldValue]);

    useEffect(() => {
        const { amount, termInMonths, loanType } = formik.values;
        const principal = Number(amount);
        const term = Number(termInMonths);

        if (principal > 0 && term > 0 && !formik.errors.amount && !formik.errors.termInMonths) {
            setCalculating(true);
            const request = {
                amount: principal,
                termInMonths: term,
                loanType: loanType,
            };
            calculationService.calculateLoan(request)
                .then(setPaymentInfo)
                .catch(() => setPaymentInfo(null))
                .finally(() => setCalculating(false));
        } else {
            setPaymentInfo(null);
        }
    }, [formik.values, formik.errors]);
    
    // Seçili kredi türü için geçerli vadeleri al
    const currentValidTerms = loanTermOptions[formik.values.loanType] || [];

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Paper sx={{ p: 3, mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>Yeni Kredi Başvurusu</Typography>
                <Box component="form" onSubmit={formik.handleSubmit} noValidate>
                    <Stack spacing={2.5}>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2.5 }}>
                            <FormControl fullWidth>
                                <InputLabel id="loantype-label">Kredi Türü</InputLabel>
                                <Select labelId="loantype-label" label="Kredi Türü" {...formik.getFieldProps('loanType')}>
                                    <MenuItem value="İhtiyaç Kredisi">İhtiyaç Kredisi</MenuItem>
                                    <MenuItem value="Taşıt Kredisi">Taşıt Kredisi</MenuItem>
                                    <MenuItem value="Konut Kredisi">Konut Kredisi</MenuItem>
                                </Select>
                            </FormControl>
                            <FormControl fullWidth>
                                <InputLabel id="term-label">Vade (Ay)</InputLabel>
                                <Select labelId="term-label" label="Vade (Ay)" {...formik.getFieldProps('termInMonths')}>
                                    {currentValidTerms.map(term => (
                                        <MenuItem key={term} value={term}>{term} Ay</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Box>
                        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2.5 }}>
                           <FormControl fullWidth error={formik.touched.targetAccountId && Boolean(formik.errors.targetAccountId)}>
                                <InputLabel id="target-account-label">Aktarılacak Hesap</InputLabel>
                                <Select labelId="target-account-label" label="Aktarılacak Hesap" {...formik.getFieldProps('targetAccountId')}>
                                    {accounts.map(acc => <MenuItem key={acc.id} value={acc.id}>{`${acc.name} (${acc.balance.toLocaleString('tr-TR')} ${acc.currency})`}</MenuItem>)}
                                </Select>
                                {formik.touched.targetAccountId && <FormHelperText error>{formik.errors.targetAccountId}</FormHelperText>}
                            </FormControl>
                            <TextField fullWidth label="Kredi Tutarı (TL)" type="number" {...formik.getFieldProps('amount')} error={formik.touched.amount && Boolean(formik.errors.amount)} helperText={formik.touched.amount && formik.errors.amount} />
                        </Box>

                        <Paper variant="outlined" sx={{ p: 2, mt: 2, position: 'relative' }}>
                             <Typography align="center" variant="subtitle1" gutterBottom>Ödeme Planı Özeti (Yıllık Faiz: ~%{paymentInfo?.annualInterestRate.toFixed(2) ?? '...'})</Typography>
                             {calculating && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', mt: '-12px', ml: '-12px' }} />}
                             <Box sx={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', mt: 1, textAlign: 'center', filter: calculating ? 'blur(2px)' : 'none' }}>
                                <Box><Typography variant="body2">Aylık Taksit:</Typography><Typography variant="h6">{paymentInfo?.monthlyPayment.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) ?? '...'}</Typography></Box>
                                <Box><Typography variant="body2">Toplam Geri Ödeme:</Typography><Typography variant="h6">{paymentInfo?.totalRepayment.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' }) ?? '...'}</Typography></Box>
                            </Box>
                        </Paper>
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                        <Button type="submit" variant="contained" startIcon={<AddIcon />} sx={{ mt: 2, height: '48px' }} disabled={formik.isSubmitting}>{formik.isSubmitting ? <CircularProgress size={24} /> : "Krediyi Çek"}</Button>
                    </Stack>
                </Box>
            </Paper>

            <Typography variant="h4" component="h2" gutterBottom>Mevcut Kredilerim</Typography>
            {loading ? <CircularProgress /> : (
                <List>
                    {loans.map(loan => (
                        <Paper key={loan.id} sx={{ p: 2, mb: 2 }}>
                             <ListItem disableGutters secondaryAction={<Button size="small" variant="text" startIcon={<VisibilityIcon />} onClick={() => setScheduleLoan(loan)}>Planı Gör</Button>}>
                                <MonetizationOnIcon color="secondary" sx={{mr: 2, fontSize: 32}}/>
                                <ListItemText 
                                    primary={`${loan.loanType}: ${loan.principalAmount.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})} - Yıllık Faiz: %${loan.interestRate.toFixed(2)}`}
                                    secondary={`Taksit: ${loan.monthlyPayment.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})} x ${loan.termInMonths} Ay | Hedef: ${loan.targetAccountName}`}
                                />
                                <Box textAlign="right" sx={{mr: 2}}><Typography variant="h6" color="error.main">{loan.totalRepayment.toLocaleString('tr-TR', {style: 'currency', currency: 'TRY'})}</Typography><Chip label={loan.isActive ? "Ödeniyor" : "Kapandı"} color={loan.isActive ? "warning" : "default"} size="small"/></Box>
                            </ListItem>
                        </Paper>
                    ))}
                    {loans.length === 0 && <Typography>Aktif krediniz bulunmamaktadır.</Typography>}
                </List>
            )}
            <PaymentScheduleDialog open={!!scheduleLoan} onClose={() => setScheduleLoan(null)} loan={scheduleLoan} />
        </Container>
    );
};


export default LoanPage;