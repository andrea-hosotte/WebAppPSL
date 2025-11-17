// src/pages/Home.jsx (MUI version)
import { motion } from "framer-motion";
import { useState } from "react";
import Lottie from "lottie-react";
import shoppingAnimation from "../assets/animation/shopping.json";
import loadingAnimation from "../assets/animation/loading.json";
import chartsAnimation from "../assets/animation/charts.json";
import { AuthPanel } from "../components/AuthPanel.jsx";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import {
  Container,
  Grid,
  Paper,
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import Search from "@mui/icons-material/Search";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};
const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};

export function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const onSearchSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) navigate(`/produits?q=${encodeURIComponent(q)}`);
    else navigate('/produits');
  };
  return (
    <Container maxWidth={false} disableGutters sx={{ pt: 10, pb: 0, width: '100%', mx: 0 }}>
      {/* FULL-WIDTH WRAPPER instead of nested Grid */}
      <Box sx={{ width: '100%' }}>
        {/* HERO full width */}
        <Paper
          elevation={4}
          sx={{
            p: { xs: 3, md: 4 },
            flex: 1,
            borderRadius: '10px',
            color: '#fff',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(120deg, #7c3aed, #2563eb, #14b8a6)',
            backgroundSize: '200% 200%',
            width: { xs: '100%', md: '70%' },
            mx: 'auto',
          }}
          component={motion.div}
          initial={{ backgroundPosition: '0% 50%', opacity: 0 }}
          animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'], opacity: 1 }}
          transition={{ duration: 4, ease: 'easeInOut' }}
        >
          <Box component={motion.div} variants={container} initial="hidden" animate="show" sx={{ width: '100%' }}>
            <Typography component={motion.h1} variants={fadeUp} sx={{ width: '100%', fontSize: { xs: 28, md: 42 }, fontWeight: 800, mb: 1 }}>
              Bienvenue sur Marketplace-PSL
            </Typography>
            <Typography component={motion.h2} variants={fadeUp} sx={{ width: '100%', fontSize: { xs: 14, md: 18 }, opacity: .95, mb: 2 }}>
              Des produits triés sur le volet, un panier clair et rapide.
            </Typography>
            <Stack component={motion.div} variants={fadeUp} spacing={3} sx={{ width: '100%' }}>
              <Box component="form" onSubmit={onSearchSubmit} noValidate>
                <TextField
                  fullWidth
                  placeholder="Rechercher un produit…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  variant="outlined"
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: 1,
                    input: { color: '#000' },
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: '#ddd' },
                      '&.Mui-focused fieldset': { borderColor: '#2563eb' },
                    },
                  }}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton type="submit" aria-label="rechercher">
                          <Search />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
              <Button
                component={RouterLink}
                to="/produits"
                color="inherit"
                variant="outlined"
                sx={{
                  alignSelf: 'center',
                  borderRadius: '50px',
                  px: 4,
                  py: 1.5,
                  fontSize: { xs: '1rem', md: '1.1rem' },
                  fontWeight: 600,
                  textTransform: 'none',
                  borderColor: 'rgba(255,255,255,.6)',
                  color: '#fff',
                  backdropFilter: 'blur(6px)',
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: '#fff',
                    backgroundColor: 'rgba(255,255,255,0.25)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Voir tous les produits
              </Button>
            </Stack>
          </Box>
        </Paper>

        {/* FEATURES full width grid */}
        <Grid container spacing={3} columns={{ xs: 12, sm: 12, md: 12 }} sx={{ mt: 6, width: '70%', mx: 'auto', justifyContent: 'center', alignItems: 'stretch' }}>
          {[{
            title: 'Catalogue soigné',
            text: 'Une sélection claire pour décider vite.',
            anim: shoppingAnimation,
          }, {
            title: 'Ajout instantané',
            text: 'Le panier se met à jour en temps réel.',
            anim: loadingAnimation,
          }, {
            title: 'Navigation rapide',
            text: 'Une interface fluide et moderne.',
            anim: chartsAnimation,
          }].map((f, i) => (
            <Grid item xs={12} sm={6} md={4} key={i} sx={{ minWidth: 0 }}>
              <Paper
                elevation={2}
                sx={{
                  minWidth: 0,
                  width: '100%',
                  height: '100%',
                  minHeight: 260,
                  p: 3,
                  borderRadius: 2,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  textAlign: 'center',
                  boxSizing: 'border-box',
                }}
                component={motion.article}
                variants={fadeUp}
                initial="hidden"
                animate="show"
              >
                <Stack spacing={1} sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ m: 0 }}>{f.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{f.text}</Typography>
                </Stack>
                <Box sx={{ width: 120, height: 120, mt: 2 }}>
                  <Lottie animationData={f.anim} loop autoplay />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
}
