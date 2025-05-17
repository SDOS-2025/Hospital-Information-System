import { Routes, Route, Navigate } from 'react-router-dom';
import { Box } from '@mui/material';
import { ThesisList } from '../components/ThesisList';
import { ThesisDetail } from '../components/ThesisDetail';
import { NewThesis } from '../components/NewThesis';

export const Thesis = () => {
  return (
    <Box sx={{ width: '100%' }}>
      <Routes>
        <Route index element={<ThesisList />} />
        <Route path="new" element={<NewThesis />} />
        <Route path=":id" element={<ThesisDetail />} />
        <Route path="*" element={<Navigate to="/thesis" replace />} />
      </Routes>
    </Box>
  );
};