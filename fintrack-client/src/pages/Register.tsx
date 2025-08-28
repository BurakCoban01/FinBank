import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Container,
    Typography,
    TextField,
    Button,
    Paper,
    Box,
    Alert
} from '@mui/material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { useAuth } from '../hooks/useAuth';

// Helper function for spacing (MUI spacing unit is 8px)
const spacingToPx = (spacingValue: number): number => spacingValue * 8;
const halfSpacing = (spacingValue: number): string => `${spacingValue * 8 / 2}px`; // returns string like "8px"

const RegisterSchema = Yup.object().shape({
    username: Yup.string()
        .min(3, 'Too Short!')
        .max(50, 'Too Long!')
        .required('Required'),
    email: Yup.string()
        .email('Invalid email')
        .required('Required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Required'),
    firstName: Yup.string()
        .max(50, 'Too Long!'),
    lastName: Yup.string()
        .max(50, 'Too Long!')
});

const Register: React.FC = () => {
    const { register } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const formik = useFormik({
        initialValues: {
            username: '',
            email: '',
            password: '',
            firstName: '',
            lastName: ''
        },
        validationSchema: RegisterSchema,
        onSubmit: async (values, { setSubmitting }) => {
            setError(null); // Clear previous errors
            try {
                await register({     // register fonksiyonu obje bekliyor
                    username: values.username,
                    email: values.email,
                    password: values.password,
                    firstName: values.firstName || undefined,
                    lastName: values.lastName || undefined
                });
                navigate('/dashboard');
            } catch (err: any) {
                console.error('Register page caught error:', err);
                setError(err.response?.data?.message || 'Registration failed');
            } finally {
                setSubmitting(false); // Formun tekrar gönderilebilir olması için
            }
        }
    });

    const formRowSpacing = 2; // Original Grid container spacing={2}

    return (
        <Container component="main" maxWidth="xs">
            <Box
                sx={{
                    marginTop: 8,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                }}
            >
                <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
                    <Typography component="h1" variant="h5" align="center" gutterBottom>
                    FinBank Hesabı Oluştur
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={formik.handleSubmit} sx={{ mt: 1 }}>
                        <TextField
                            margin="normal"
                            fullWidth
                            id="username"
                            label="Username"
                            name="username"
                            autoComplete="username"
                            autoFocus
                            value={formik.values.username}
                            onChange={formik.handleChange}
                            error={formik.touched.username && Boolean(formik.errors.username)}
                            helperText={formik.touched.username && formik.errors.username}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            id="email"
                            label="Email Adresi"
                            name="email"
                            autoComplete="email"
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                        />
                        <TextField
                            margin="normal"
                            fullWidth
                            name="password"
                            label="Şifre"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            error={formik.touched.password && Boolean(formik.errors.password)}
                            helperText={formik.touched.password && formik.errors.password}
                        />
                        <Box
                            display="flex"
                            flexWrap="wrap"
                            sx={{
                                // Negatif margin, child Box'lardaki padding ile spacing etkisi yaratmak için
                                mx: `-${halfSpacing(formRowSpacing)}`,
                                // TextField'ların margin="normal" (genelde 16px top/bottom) olduğundan,
                                // bu Box'a ek dikey margin gerekebilir veya TextField'lardan margin kaldırılabilir
                                // Şimdilik TextField margin'leri kalıyor
                            }}
                        >
                            {/* Grid item xs={12} sm={6} yerine Box */}
                            <Box sx={{
                                padding: halfSpacing(formRowSpacing),
                                width: { xs: '100%', sm: '50%' }
                            }}>
                                <TextField
                                    margin="normal" // Bu margin, Box padding'i ile birlikte değerlendirilmeli
                                    fullWidth
                                    id="firstName"
                                    label="Ad"
                                    name="firstName"
                                    autoComplete="given-name"
                                    value={formik.values.firstName}
                                    onChange={formik.handleChange}
                                    error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                                    helperText={formik.touched.firstName && formik.errors.firstName}
                                />
                            </Box>
                            {/* Grid item xs={12} sm={6} yerine Box */}
                            <Box sx={{
                                padding: halfSpacing(formRowSpacing),
                                width: { xs: '100%', sm: '50%' }
                            }}>
                                <TextField
                                    margin="normal" 
                                    fullWidth
                                    id="lastName"
                                    label="Soyad"
                                    name="lastName"
                                    autoComplete="family-name"
                                    value={formik.values.lastName}
                                    onChange={formik.handleChange}
                                    error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                                    helperText={formik.touched.lastName && formik.errors.lastName}
                                />
                            </Box>
                        </Box>
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={formik.isSubmitting}
                        >
                            Kayıt Ol
                        </Button>
                        {/* Grid container justifyContent="flex-end" yerine Box */}
                        <Box display="flex" justifyContent="flex-end">
                            {/* Grid item yerine doğrudan Link veya Link'i içeren bir Box */}
                            <Box>
                                <Link to="/login" style={{ textDecoration: 'none' }}>
                                    <Typography component="span" color="primary"> {/* MUI Link görünümü için */}
                                        {"Zaten bir hesabınız var mı? Giriş yap"}
                                    </Typography>
                                </Link>
                            </Box>
                        </Box>
                    </Box>
                </Paper>
            </Box>
        </Container>
    );
};

export default Register;