import React, { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Button,
  useMediaQuery,
  useTheme,
  CircularProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as AccountIcon,
  Receipt as TransactionIcon,
  Category as CategoryIcon,
  Logout as LogoutIcon,
  Savings as SavingsIcon,
  CreditScore as CreditScoreIcon,
  ShowChart,
  Send as SendIcon, // Eklendi
  KeyboardDoubleArrowLeft as CollapseIcon,
  KeyboardDoubleArrowRight as ExpandIcon
} from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  // collapsible drawer state (kullanıcı sol menüyü daraltıp genişletebilir)
  const [collapsed, setCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed(prev => !prev);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const drawer = (
    <div>
      <Toolbar sx={{ display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
        <Typography variant="h6" noWrap component="div" sx={{ display: collapsed ? 'none' : 'block' }}>
          FinTrack
        </Typography>
        <IconButton onClick={handleCollapseToggle} size="small" aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}>
          {collapsed ? <ExpandIcon /> : <CollapseIcon />}
        </IconButton>
      </Toolbar>
      <Divider />
      <List>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton onClick={() => handleNavigation('/dashboard')} sx={{ justifyContent: collapsed ? 'center' : 'initial', px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 3, justifyContent: 'center' }}>
              <DashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Ana Sayfam" sx={{ opacity: collapsed ? 0 : 1 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton onClick={() => handleNavigation('/accounts')} sx={{ justifyContent: collapsed ? 'center' : 'initial', px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 3, justifyContent: 'center' }}>
              <AccountIcon />
            </ListItemIcon>
            <ListItemText primary="Hesaplarım" sx={{ opacity: collapsed ? 0 : 1 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton onClick={() => handleNavigation('/transactions')} sx={{ justifyContent: collapsed ? 'center' : 'initial', px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 3, justifyContent: 'center' }}>
              <TransactionIcon />
            </ListItemIcon>
            <ListItemText primary="İşlemlerim" sx={{ opacity: collapsed ? 0 : 1 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton onClick={() => handleNavigation('/user-transfer')} sx={{ justifyContent: collapsed ? 'center' : 'initial', px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 3, justifyContent: 'center' }}>
              <SendIcon />
            </ListItemIcon>
            <ListItemText primary="EFT/Havale" sx={{ opacity: collapsed ? 0 : 1 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton onClick={() => handleNavigation('/categories')} sx={{ justifyContent: collapsed ? 'center' : 'initial', px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 3, justifyContent: 'center' }}>
              <CategoryIcon />
            </ListItemIcon>
            <ListItemText primary="Kategoriler" sx={{ opacity: collapsed ? 0 : 1 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton onClick={() => handleNavigation('/loans')} sx={{ justifyContent: collapsed ? 'center' : 'initial', px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 3, justifyContent: 'center' }}>
              <CreditScoreIcon />
            </ListItemIcon>
            <ListItemText primary="Krediler" sx={{ opacity: collapsed ? 0 : 1 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton onClick={() => handleNavigation('/deposits')} sx={{ justifyContent: collapsed ? 'center' : 'initial', px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 3, justifyContent: 'center' }}>
              <SavingsIcon />
            </ListItemIcon>
            <ListItemText primary="Mevduat" sx={{ opacity: collapsed ? 0 : 1 }} />
          </ListItemButton>
        </ListItem>
      </List>
      <Divider />

      <List>
        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton onClick={() => handleNavigation('/investments')} sx={{ justifyContent: collapsed ? 'center' : 'initial', px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 3, justifyContent: 'center' }}>
              <ShowChart />
            </ListItemIcon>
            <ListItemText primary="Yatırımlar" sx={{ opacity: collapsed ? 0 : 1 }} />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding sx={{ display: 'block' }}>
          <ListItemButton onClick={handleLogout} sx={{ justifyContent: collapsed ? 'center' : 'initial', px: 2.5 }}>
            <ListItemIcon sx={{ minWidth: 0, mr: collapsed ? 0 : 3, justifyContent: 'center' }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Çıkış Yap" sx={{ opacity: collapsed ? 0 : 1 }} />
          </ListItemButton>
        </ListItem>
      </List>
    </div>
  );

  // Eğer loading ise veya authenticated değilse (ve user da yoksa) Outlet'i direkt göster
  // Bu, login/register sayfalarının Layout dışında kalmasını sağlar.
  // PrivateRoute zaten Layout içindeki Outlet'e gelen componentleri koruyor.
  if (loading) { // İlk yükleme sırasında boş ekran veya spinner gösterilebilir
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
  }

  if (!user) {
    return <Outlet />;
  }

  // drawer genişliğini collapsed durumuna göre ayarla
  const currentDrawerWidth = collapsed ? 72 : drawerWidth;

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
          ml: { sm: `${currentDrawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {user.firstName ? `${user.firstName}'s Finance Account` : 'My Finance Account'}
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box
        component="nav"
        sx={{ width: { sm: currentDrawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation"
      >
        <Drawer
          container={window.document.body}
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: currentDrawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: currentDrawerWidth, transition: 'width 200ms' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${currentDrawerWidth}px)` },
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default Layout;
