import { Routes, Route } from 'react-router-dom';
import { ExamList } from '../components/ExamList';
import { ExamDetails } from '../components/ExamDetails';

export const Exams = () => {
  return (
    <Routes>
      <Route index element={<ExamList />} />
      <Route path=":id" element={<ExamDetails />} />
    </Routes>
  );
};