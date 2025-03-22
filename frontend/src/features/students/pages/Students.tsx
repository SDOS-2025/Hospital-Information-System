import { Routes, Route } from 'react-router-dom';
import { StudentList } from '../components/StudentList';

export const Students = () => {
  return (
    <Routes>
      <Route index element={<StudentList />} />
      {/* Add other student routes here:
          - /students/new
          - /students/:id
          - /students/:id/edit
      */}
    </Routes>
  );
};