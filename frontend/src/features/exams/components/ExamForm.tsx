import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  ArrowBack as BackIcon,
  Save as SaveIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { examService, ExamType, ExamCreateDto } from '../../../services/api/exam.service';
import { useMutation } from '@tanstack/react-query';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { add, isBefore, isAfter } from 'date-fns';

// Faculty options for demo purposes
const FACULTY_OPTIONS = [
  { id: 1, name: 'Dr. Robert Chen', department: 'Cardiology', email: 'r.chen@example.com' },
  { id: 2, name: 'Dr. Sarah Lee', department: 'Immunology', email: 's.lee@example.com' },
  { id: 3, name: 'Dr. James Wilson', department: 'Public Health', email: 'j.wilson@example.com' },
  { id: 4, name: 'Dr. David Garcia', department: 'Surgery', email: 'd.garcia@example.com' },
  { id: 5, name: 'Dr. Lisa Patel', department: 'Psychiatry', email: 'l.patel@example.com' },
];

// The form component for creating a new exam
export const ExamForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<ExamCreateDto>({
    title: '',
    courseCode: '',
    type: 'internal' as ExamType,
    startTime: add(new Date(), { days: 7, hours: 9 }), // Default to next week, 9 AM
    endTime: add(new Date(), { days: 7, hours: 11 }), // Default to next week, 11 AM
    venue: '',
    semester: 1,
    facultyInChargeId: FACULTY_OPTIONS[0].id,
    maxMarks: 100,
    passingMarks: 40,
    instructions: '',
  });
  
  // Mutation for creating a new exam
  const createMutation = useMutation({
    mutationFn: (examData: ExamCreateDto) => examService.createExam(examData),
    onSuccess: (data) => {
      navigate(`/exams/${data.id}`);
    },
    onError: (err: Error) => {
      setError(err.message || 'Failed to create exam. Please try again.');
    }
  });
  
  // Handle text field changes
  const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error for this field if exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle select field changes
  const handleSelectChange = (event: React.ChangeEvent<{ name?: string; value: unknown }>) => {
    const name = event.target.name as keyof ExamCreateDto;
    const value = event.target.value;
    
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
    
    // Clear error for this field if exists
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle start time change
  const handleStartTimeChange = (date: Date | null) => {
    if (!date) return;
    
    setFormData(prevData => ({
      ...prevData,
      startTime: date,
      // Auto-adjust end time if it's before the new start time
      endTime: isBefore(prevData.endTime, date) ? add(date, { hours: 2 }) : prevData.endTime
    }));
    
    if (formErrors.startTime || formErrors.endTime) {
      setFormErrors(prev => ({
        ...prev,
        startTime: '',
        endTime: ''
      }));
    }
  };
  
  // Handle end time change
  const handleEndTimeChange = (date: Date | null) => {
    if (!date) return;
    
    setFormData(prevData => ({
      ...prevData,
      endTime: date
    }));
    
    if (formErrors.endTime) {
      setFormErrors(prev => ({
        ...prev,
        endTime: ''
      }));
    }
  };
  
  // Handle number field changes
  const handleNumberFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const numberValue = value === '' ? undefined : Number(value);
    
    setFormData(prevData => ({
      ...prevData,
      [name]: numberValue
    }));
    
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Validate form before submission
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Required fields
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.courseCode.trim()) {
      errors.courseCode = 'Course code is required';
    }
    
    if (!formData.venue.trim()) {
      errors.venue = 'Venue is required';
    }
    
    // Time validation
    if (isBefore(formData.startTime, new Date())) {
      errors.startTime = 'Start time cannot be in the past';
    }
    
    if (isBefore(formData.endTime, formData.startTime)) {
      errors.endTime = 'End time must be after start time';
    }
    
    // Marks validation
    if (formData.maxMarks !== undefined && formData.maxMarks <= 0) {
      errors.maxMarks = 'Maximum marks must be greater than 0';
    }
    
    if (
      formData.passingMarks !== undefined &&
      formData.maxMarks !== undefined &&
      formData.passingMarks > formData.maxMarks
    ) {
      newErrors.courseCode = 'Course code is required';
    }
    
    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }
    
    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    } else if (formData.startTime && formData.endTime <= formData.startTime) {
      newErrors.endTime = 'End time must be after start time';
    }
    
    if (!formData.venue.trim()) {
      newErrors.venue = 'Venue is required';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    // Submit the form
    createMutation.mutate(formData);
  };
  
  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button 
            startIcon={<BackIcon />} 
            onClick={() => navigate('/exams')}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
          <Typography variant="h4" component="h1">
            Schedule New Exam
          </Typography>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 4 }} />
      
      {/* Form */}
      <Paper sx={{ p: 3 }} component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Basic exam information */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Basic Information
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={8}>
            <TextField
              label="Exam Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.title}
              helperText={errors.title}
            />
          </Grid>
          
          <Grid item xs={12} md={4}>
            <TextField
              label="Course Code"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.courseCode}
              helperText={errors.courseCode}
            />
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="type-label">Exam Type</InputLabel>
              <Select
                labelId="type-label"
                name="type"
                value={formData.type}
                onChange={handleChange}
                label="Exam Type"
              >
                {Object.values(ExamType).map(type => (
                  <MenuItem key={type} value={type}>
                    {type.replace(/_/g, ' ').replace(
                      /\w\S*/g,
                      txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
                    )}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel id="semester-label">Semester</InputLabel>
              <Select
                labelId="semester-label"
                name="semester"
                value={formData.semester}
                onChange={handleChange}
                label="Semester"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(sem => (
                  <MenuItem key={sem} value={sem}>
                    Semester {sem}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          {/* Schedule and venue */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
              Schedule & Venue
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="Start Time"
                value={formData.startTime}
                onChange={(date) => handleDateChange('startTime', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.startTime,
                    helperText: errors.startTime
                  }
                }}
                disablePast
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DateTimePicker
                label="End Time"
                value={formData.endTime}
                onChange={(date) => handleDateChange('endTime', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    error: !!errors.endTime,
                    helperText: errors.endTime
                  }
                }}
                disablePast
              />
            </LocalizationProvider>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Venue"
              name="venue"
              value={formData.venue}
              onChange={handleChange}
              fullWidth
              required
              error={!!errors.venue}
              helperText={errors.venue}
              placeholder="Enter exam venue (e.g., Room 101, Building A)"
            />
          </Grid>
          
          {/* Marks */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
              Marks & Assessment
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Maximum Marks"
              name="maxMarks"
              type="number"
              value={formData.maxMarks || ''}
              onChange={handleChange}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              label="Passing Marks"
              name="passingMarks"
              type="number"
              value={formData.passingMarks || ''}
              onChange={handleChange}
              fullWidth
              inputProps={{ min: 0 }}
            />
          </Grid>
          
          {/* Instructions */}
          <Grid item xs={12}>
            <Typography variant="h6" sx={{ mb: 2, mt: 2 }}>
              Additional Information
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Instructions"
              name="instructions"
              value={formData.instructions || ''}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              placeholder="Enter exam instructions for students"
            />
          </Grid>
          
          {/* Proctors */}
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Proctors
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TextField
                size="small"
                label="Add proctor"
                value={proctorInput}
                onChange={handleProctorInputChange}
                onKeyPress={handleKeyPress}
                sx={{ flexGrow: 1, mr: 1 }}
                placeholder="Enter proctor name"
              />
              <Button 
                variant="outlined" 
                onClick={handleAddProctor}
                disabled={!proctorInput.trim()}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            
            <Box sx={{ mt: 1 }}>
              {formData.proctors?.map((proctor, index) => (
                <Chip
                  key={index}
                  label={proctor}
                  onDelete={() => handleRemoveProctor(index)}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
              
              {!formData.proctors?.length && (
                <Typography variant="body2" color="text.secondary">
                  No proctors assigned yet
                </Typography>
              )}
            </Box>
          </Grid>
          
          {/* Form actions */}
          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={() => navigate('/exams')}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                startIcon={createMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Creating...' : 'Schedule Exam'}
              </Button>
            </Stack>
          </Grid>
        </Grid>
      </Paper>
      
      {/* Success/Error feedback */}
      <Snackbar
        open={feedback.open}
        autoHideDuration={6000}
        onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
      >
        <Alert 
          severity={feedback.type}
          onClose={() => setFeedback(prev => ({ ...prev, open: false }))}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};