import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { categoryService } from '../services/category.service';
import { CategoryDto as Category } from '../types';
import {
    Container, Typography, Paper, CircularProgress, Alert, Box,
    List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Tooltip
} from '@mui/material';
import {
    Category as CategoryIcon,
    Work as WorkIcon,
    Restaurant as RestaurantIcon,
    DirectionsCar as DirectionsCarIcon,
    Movie as MovieIcon,
    ShoppingCart as ShoppingCartIcon,
    Receipt as ReceiptIcon,
    Home as HomeIcon,
    LocalHospital as LocalHospitalIcon,
    TrendingUp as TrendingUpIcon,
    MoreHoriz as MoreHorizIcon,
    HelpOutline as DefaultCategoryIcon // Varsayılan ikon
} from '@mui/icons-material';

// İkonları backend'den gelen iconName ile eşleştirmek için bir map
const iconMap: { [key: string]: React.ElementType } = {
    work: WorkIcon,
    restaurant: RestaurantIcon,
    directions_car: DirectionsCarIcon,
    movie: MovieIcon,
    shopping_cart: ShoppingCartIcon,
    receipt: ReceiptIcon,
    home: HomeIcon,
    local_hospital: LocalHospitalIcon,
    trending_up: TrendingUpIcon,
    more_horiz: MoreHorizIcon,
    default: DefaultCategoryIcon,
};


const CategoriesList: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await categoryService.getCategories();
            setCategories(data);
        } catch (err: any) {
            console.error("Error fetching categories:", err);
            if (err.response && err.response.status === 401) {
                navigate('/login'); // Normalde kategoriler public ama önlem olarak
            } else {
                setError(err.response?.data?.message || "Kategoriler yüklenirken bir hata oluştu.");
            }
        } finally {
            setLoading(false);
        }
    }, [navigate]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const getCategoryIcon = (iconName?: string) => {
        const IconComponent = iconName ? iconMap[iconName.toLowerCase()] : null;
        return IconComponent ? <IconComponent /> : <DefaultCategoryIcon />;
    };


    if (loading) {
        return (
            <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <CircularProgress />
            </Container>
        );
    }

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper elevation={2} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="h4" component="h1">
                        Harcama ve Gelir Kategorileri
                    </Typography>
                    {/* Kategoriler backend'den seed ediliyor, frontend'den eksta ekleme/düzenleme yok */}
                </Box>

                {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>{error}</Alert>}
                
                {categories.length === 0 && !loading && !error && (
                    <Typography sx={{ textAlign: 'center', my: 3 }}>Kategori bulunamadı.</Typography>
                )}

                <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                    {categories.map((category, index) => (
                        <React.Fragment key={category.id}>
                            <ListItem alignItems="flex-start">
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: category.color || 'primary.main', color: 'white' }}>
                                        {getCategoryIcon(category.iconName)}
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={category.name}
                                    secondary={
                                        <Tooltip title={category.description || "Açıklama yok"} placement="top-start">
                                            <Typography
                                                sx={{ display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                                                component="span"
                                                variant="body2"
                                                color="text.secondary"
                                            >
                                                {category.description || "Açıklama yok"}
                                            </Typography>
                                        </Tooltip>
                                    }
                                />
                                 <Box sx={{width: 20, height: 20, borderRadius: '50%', backgroundColor: category.color || 'transparent', border: '1px solid lightgrey', ml: 2, alignSelf: 'center' }}/>
                            </ListItem>
                            {index < categories.length - 1 && <Divider variant="inset" component="li" />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </Container>
    );
};

export default CategoriesList;
