import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Grid, CircularProgress } from '@mui/material';
import { Student } from '../../../types/api.types';
import { useState, useEffect } from 'react';

type CreateStudentDto = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (student: CreateStudentDto) => void;
  student: Student | null;
  isLoading?: boolean;
}

export const StudentDialog = ({ open, onClose, onSave, student, isLoading = false }: Props) => {
  const [form, setForm] = useState<CreateStudentDto>({
    name: '',
    email: '',
    enrollmentNumber: '',
    department: '',
    semester: 1,
    program: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CreateStudentDto, string>>>({});

  useEffect(() => {
    if (student) {
      const { id, createdAt, updatedAt, ...rest } = student;
      setForm(rest);
      setErrors({});
    } else {
      setForm({
        name: '',
        email: '',
        enrollmentNumber: '',
        department: '',
        semester: 1,
        program: '',
      });
      setErrors({});
    }
  }, [student]);

  const validateForm = () => {
    const newErrors: Partial<Record<keyof CreateStudentDto, string>> = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!form.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(form.email)) {
      newErrors.email = 'Invalid email address';
    }
    
    if (!form.enrollmentNumber.trim()) {
      newErrors.enrollmentNumber = 'Enrollment number is required';
    }
    
    if (!form.department.trim()) {
      newErrors.department = 'Department is required';
    }
    
    if (!form.semester || form.semester < 1 || form.semester > 8) {
      newErrors.semester = 'Semester must be between 1 and 8';
    }
    
    if (!form.program.trim()) {
      newErrors.program = 'Program is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(form);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      aria-labelledby="student-dialog-title"
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
        role: 'form',
        'aria-label': `${student ? 'Edit' : 'Add'} student form`
      }}
    >
      <DialogTitle id="student-dialog-title">
        {student ? 'Edit Student' : 'Add Student'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Name"
              value={form.name}
              onChange={(e) => {
                setForm({ ...form, name: e.target.value });
                if (errors.name) {
                  setErrors({ ...errors, name: undefined });
                }
              }}
              error={!!errors.name}
              helperText={errors.name}
              required
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Student name',
                'aria-describedby': errors.name ? 'name-error' : undefined
              }}
              id="student-name"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => {
                setForm({ ...form, email: e.target.value });
                if (errors.email) {
                  setErrors({ ...errors, email: undefined });
                }
              }}
              error={!!errors.email}
              helperText={errors.email}
              required
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Student email',
                'aria-describedby': errors.email ? 'email-error' : undefined
              }}
              id="student-email"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Enrollment Number"
              value={form.enrollmentNumber}
              onChange={(e) => {
                setForm({ ...form, enrollmentNumber: e.target.value });
                if (errors.enrollmentNumber) {
                  setErrors({ ...errors, enrollmentNumber: undefined });
                }
              }}
              error={!!errors.enrollmentNumber}
              helperText={errors.enrollmentNumber}
              required
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Student enrollment number',
                'aria-describedby': errors.enrollmentNumber ? 'enrollment-error' : undefined
              }}
              id="student-enrollment"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Department"
              value={form.department}
              onChange={(e) => {
                setForm({ ...form, department: e.target.value });
                if (errors.department) {
                  setErrors({ ...errors, department: undefined });
                }
              }}
              error={!!errors.department}
              helperText={errors.department}
              required
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Student department',
                'aria-describedby': errors.department ? 'department-error' : undefined
              }}
              id="student-department"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Semester"
              type="number"
              inputProps={{
                min: 1,
                max: 8,
                'aria-label': 'Student semester',
                'aria-describedby': errors.semester ? 'semester-error' : undefined
              }}
              value={form.semester}
              onChange={(e) => {
                setForm({ ...form, semester: parseInt(e.target.value) });
                if (errors.semester) {
                  setErrors({ ...errors, semester: undefined });
                }
              }}
              error={!!errors.semester}
              helperText={errors.semester}
              required
              disabled={isLoading}
              id="student-semester"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Program"
              value={form.program}
              onChange={(e) => {
                setForm({ ...form, program: e.target.value });
                if (errors.program) {
                  setErrors({ ...errors, program: undefined });
                }
              }}
              error={!!errors.program}
              helperText={errors.program}
              required
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Student program',
                'aria-describedby': errors.program ? 'program-error' : undefined
              }}
              id="student-program"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={onClose} 
          disabled={isLoading}
          aria-label="Cancel"
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained" 
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
          aria-label={isLoading ? 'Saving student information' : 'Save student information'}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};