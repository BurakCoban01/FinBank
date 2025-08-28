import React, { useState } from 'react'; 
import { useNavigate, Link, useLocation } from 'react-router-dom';
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

const LoginSchema = Yup.object().shape({
    email: Yup.string()
        .email('Geçersiz e-posta')
        .required('Zorunlu alan'),
    password: Yup.string()
        .required('Zorunlu alan')
});

const Login: React.FC = () => {
    const { login } = useAuth(); // useAuth'dan login alındı
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const location = useLocation(); // Login öncesi sayfaya yönlendirme için

    const from = location.state?.from?.pathname || '/dashboard'; // login sonrası gidilecek yer

    const formik = useFormik({
        initialValues: {
            email: '',
            password: ''
        },
        validationSchema: LoginSchema,
        onSubmit: async (values, { setSubmitting }) => { // setSubmitting eklendi
            setError(null); // Hata mesajını temizle
            try {
                await login(values);
                navigate(from, { replace: true }); // Başarılı login sonrası yönlendirme
            } catch (err: any) {
                console.error('Login page caught error:', err);
                setError(err.response?.data?.message || 'Giriş başarısız oldu. Lütfen bilgilerinizi kontrol edin.');
            } finally {
                setSubmitting(false); // Formun tekrar gönderilebilir olması için
            }
        }
    });

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
                        FinBank'a Giriş Yap
                    </Typography>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2, width: '100%' }}> 
                            {error}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={formik.handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}> {/* noValidate ve width eklendi */}
                        <TextField
                            variant="outlined" 
                            margin="normal"
                            required 
                            fullWidth
                            id="email"
                            label="E-posta Adresi"
                            name="email"
                            autoComplete="email"
                            autoFocus
                            value={formik.values.email}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur} 
                            error={formik.touched.email && Boolean(formik.errors.email)}
                            helperText={formik.touched.email && formik.errors.email}
                        />
                        <TextField
                            variant="outlined" 
                            margin="normal"
                            required 
                            fullWidth
                            name="password"
                            label="Şifre"
                            type="password"
                            id="password"
                            autoComplete="current-password"
                            value={formik.values.password}
                            onChange={formik.handleChange}
                            onBlur={formik.handleBlur} 
                            error={formik.touched.password && Boolean(formik.errors.password)}
                            helperText={formik.touched.password && formik.errors.password}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2 }}
                            disabled={formik.isSubmitting} 
                        >
                            Giriş Yap
                        </Button>
                        {/* Grid container justifyContent="flex-end" yerine Box */}
                        <Box display="flex" justifyContent="flex-end">
                            {/* Grid item yerine doğrudan Link veya Link'i içeren bir Box */}
                            <Box>
                                <Link to="/register" style={{ textDecoration: 'none' }}>
                                    <Typography component="span" color="primary"> {/* MUI Link görünümü için */}
                                        {"Hesabınız yok mu? Kayıt olun"}
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

export default Login;