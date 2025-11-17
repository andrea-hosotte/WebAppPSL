import { createTheme, responsiveFontSizes } from '@mui/material/styles';

let theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#4f46e5' },
    secondary: { main: '#14b8a6' },
    background: { default: '#f7f7fb', paper: '#ffffff' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Roboto', system-ui, -apple-system, Segoe UI, Arial, sans-serif",
  },
  components: {
    MuiButton: {
      defaultProps: { variant: 'contained' },
      styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 10 } },
    },
    MuiAppBar: {
      styleOverrides: { root: { boxShadow: '0 4px 16px rgba(0,0,0,.06)' } },
    },
  },
});
theme = responsiveFontSizes(theme);
export default theme;