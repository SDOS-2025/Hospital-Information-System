import { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Grid, 
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import { ExamDetails, ExamCreateDto, ExamType } from '../../../services/api/exam.service';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (exam: ExamCreateDto | any) => void;
  exam: ExamDetails | null;
  isLoading?: boolean;
}

export const ExamDialog = ({ open, onClose, onSave, exam, isLoading = false }: Props) => {
  const [form, setForm] = useState<ExamCreateDto | any>({
    title: '',
    courseCode: '',
    type: 'internal' as ExamType,
    startTime: new Date(),
    endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000), // Default 2 hours later
    venue: '',
    semester: 1,
    facultyInChargeId: 1, // Default faculty ID, would be dynamic in real app
    maxMarks: 100,
    passingMarks: 40,
    instructions: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when exam prop changes
  useEffect(() => {
    if (exam) {
      const formData = {
        title: exam.title,
        courseCode: exam.courseCode,
        type: exam.type,
        startTime: new Date(exam.startTime),
        endTime: new Date(exam.endTime),
        venue: exam.venue,
        semester: exam.semester,
        facultyInChargeId: exam.facultyInChargeId,
        maxMarks: exam.maxMarks || 100,
        passingMarks: exam.passingMarks || 40,
        instructions: exam.instructions || '',
        status: exam.status,
        proctors: exam.proctors || [],
        remarks: exam.remarks || ''
      };

      setForm(formData);
      setErrors({});
    } else {
      // Reset form for creating a new exam
      setForm({
        title: '',
        courseCode: '',
        type: 'internal' as ExamType,
        startTime: new Date(),
        endTime: new Date(new Date().getTime() + 2 * 60 * 60 * 1000),
        venue: '',
        semester: 1,
        facultyInChargeId: 1,
        maxMarks: 100,
        passingMarks: 40,
        instructions: ''
      });
      setErrors({});
    }
  }, [exam]);

  // Form validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!form.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!form.courseCode.trim()) {
      newErrors.courseCode = 'Course code is required';
    }

    if (!form.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }

    if (form.startTime >= form.endTime) {
      newErrors.endTime = 'End time must be after start time';
    }

    if (form.maxMarks && form.passingMarks && form.passingMarks > form.maxMarks) {
      newErrors.passingMarks = 'Passing marks cannot exceed maximum marks';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // For existing exams, only send fields that should be updated
      if (exam) {
        const updateData = {
          title: form.title,
          startTime: form.startTime,
          endTime: form.endTime,
          venue: form.venue,
          maxMarks: form.maxMarks,
          passingMarks: form.passingMarks,
          status: form.status,
          instructions: form.instructions,
          proctors: form.proctors,
          remarks: form.remarks
        };
        onSave(updateData);
      } else {
        // For new exams, send all required fields
        onSave(form);
      }
    }
  };

  // Helper to remove a specific error
  const clearError = (field: string) => {
    const { [field]: _, ...restErrors } = errors;
    setErrors(restErrors);
  };

  const handleDateChange = (field: 'startTime' | 'endTime', date: Date | null) => {
    if (date) {
      setForm({ ...form, [field]: date });
      
      // Clear any related errors
      if (field === 'startTime' || field === 'endTime') {
        if (errors.startTime) clearError('startTime');
        if (errors.endTime) clearError('endTime');
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      aria-labelledby="exam-dialog-title"
      PaperProps={{
        component: 'form',
        onSubmit: handleSubmit,
        role: 'form',
        'aria-label': `${exam ? 'Edit' : 'Add'} exam form`
      }}
    >
      <DialogTitle id="exam-dialog-title">
        {exam ? 'Edit Exam' : 'Add Exam'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Title"
              value={form.title}
              onChange={(e) => {
                setForm({ ...form, title: e.target.value });
                if (errors.title) clearError('title');
              }}
              error={!!errors.title}
              helperText={errors.title}
              required
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Exam title',
                'aria-describedby': errors.title ? 'title-error' : undefined
              }}
              id="exam-title"
            />
          </Grid>

          {/* Course Code and Type */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Course Code"
              value={form.courseCode}
              onChange={(e) => {
                setForm({ ...form, courseCode: e.target.value });
                if (errors.courseCode) clearError('courseCode');
              }}
              error={!!errors.courseCode}
              helperText={errors.courseCode}
              required
              disabled={isLoading || !!exam} // Not editable for existing exams
              inputProps={{
                'aria-label': 'Course code',
                'aria-describedby': errors.courseCode ? 'course-code-error' : undefined
              }}
              id="exam-course-code"
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.type} required disabled={isLoading || !!exam}>
              <InputLabel id="exam-type-label">Exam Type</InputLabel>
              <Select
                labelId="exam-type-label"
                id="exam-type"
                value={form.type}
                label="Exam Type"
                onChange={(e) => {
                  setForm({ ...form, type: e.target.value });
                  if (errors.type) clearError('type');
                }}
                aria-label="Exam type"
              >
                <MenuItem value="internal">Internal</MenuItem>
                <MenuItem value="midterm">Midterm</MenuItem>
                <MenuItem value="fat">Final Assessment Test (FAT)</MenuItem>
                <MenuItem value="practical">Practical</MenuItem>
                <MenuItem value="viva">Viva</MenuItem>
              </Select>
              {errors.type && <FormHelperText>{errors.type}</FormHelperText>}
            </FormControl>
          </Grid>

          {/* Start and End Time */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Start Time"
              type="datetime-local"
              value={format(form.startTime)}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                handleDateChange('startTime', date);
              }}
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.startTime}
              helperText={errors.startTime}
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Start time',
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="End Time"
              type="datetime-local"
              value={format(form.endTime)}
              onChange={(e) => {
                const date = e.target.value ? new Date(e.target.value) : null;
                handleDateChange('endTime', date);
              }}
              InputLabelProps={{ shrink: true }}
              required
              error={!!errors.endTime}
              helperText={errors.endTime}
              disabled={isLoading}
              inputProps={{
                'aria-label': 'End time',
              }}
            />
          </Grid>

          {/* Venue */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Venue"
              value={form.venue}
              onChange={(e) => {
                setForm({ ...form, venue: e.target.value });
                if (errors.venue) clearError('venue');
              }}
              error={!!errors.venue}
              helperText={errors.venue}
              required
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Venue',
                'aria-describedby': errors.venue ? 'venue-error' : undefined
              }}
              id="exam-venue"
            />
          </Grid>

          {/* Semester */}
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth required disabled={isLoading || !!exam}>
              <InputLabel id="semester-label">Semester</InputLabel>
              <Select
                labelId="semester-label"
                id="semester"
                value={form.semester}
                label="Semester"
                onChange={(e) => setForm({ ...form, semester: Number(e.target.value) })}
                aria-label="Semester"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <MenuItem key={sem} value={sem}>{sem}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Max Marks and Passing Marks */}
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Maximum Marks"
              type="number"
              value={form.maxMarks}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : '';
                setForm({ ...form, maxMarks: value });
                if (errors.maxMarks) clearError('maxMarks');
                
                // Check if passing marks needs to be updated
                if (value && form.passingMarks > value) {
                  setErrors({
                    ...errors,
                    passingMarks: 'Passing marks cannot exceed maximum marks'
                  });
                }
              }}
              error={!!errors.maxMarks}
              helperText={errors.maxMarks}
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Maximum marks',
                min: 0,
                step: 1
              }}
              id="exam-max-marks"
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Passing Marks"
              type="number"
              value={form.passingMarks}
              onChange={(e) => {
                const value = e.target.value ? Number(e.target.value) : '';
                setForm({ ...form, passingMarks: value });
                
                // Validate passing marks
                if (form.maxMarks && value > form.maxMarks) {
                  setErrors({
                    ...errors,
                    passingMarks: 'Passing marks cannot exceed maximum marks'
                  });
                } else if (errors.passingMarks) {
                  clearError('passingMarks');
                }
              }}
              error={!!errors.passingMarks}
              helperText={errors.passingMarks}
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Passing marks',
                min: 0,
                step: 1
              }}
              id="exam-passing-marks"
            />
          </Grid>

          {/* Status - Only for editing existing exams */}
          {exam && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={isLoading}>
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  id="status"
                  value={form.status}
                  label="Status"
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  aria-label="Exam status"
                >
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="postponed">Postponed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Remarks - Only for editing existing exams */}
          {exam && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Remarks"
                multiline
                rows={2}
                value={form.remarks || ''}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                disabled={isLoading}
                inputProps={{
                  'aria-label': 'Remarks',
                }}
                id="exam-remarks"
              />
            </Grid>
          )}

          {/* Instructions */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Instructions"
              multiline
              rows={4}
              value={form.instructions || ''}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              disabled={isLoading}
              inputProps={{
                'aria-label': 'Instructions',
              }}
              id="exam-instructions"
              placeholder="Enter instructions for students (optional)"
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
          color="primary"
          disabled={isLoading}
          startIcon={isLoading ? <CircularProgress size={20} /> : null}
          aria-label={isLoading ? 'Saving exam information' : 'Save exam information'}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper function to format date for datetime-local input
function format(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}