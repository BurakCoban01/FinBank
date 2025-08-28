import React from 'react';
import { Container, Typography, Button, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const NotFound: React.FC = () => {
    return (
        <Container component="main" maxWidth="sm" sx={{ textAlign: 'center', mt: 8 }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: 3,
                }}
            >
                <ErrorOutlineIcon sx={{ fontSize: 80, color: 'error.main', mb: 2 }} />
                <Typography variant="h3" component="h1" gutterBottom>
                    404 - Sayfa Bulunamadı
                </Typography>
                <Typography variant="h6" color="textSecondary" paragraph>
                    Aradığınız sayfa mevcut değil veya taşınmış olabilir.
                </Typography>
                <Button
                    variant="contained"
                    color="primary"
                    component={RouterLink}
                    to="/dashboard" 
                    sx={{ mt: 2 }}
                >
                    Ana Sayfaya Dön
                </Button>
            </Box>
        </Container>
    );
};

export default NotFound;