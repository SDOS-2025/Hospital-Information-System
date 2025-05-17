import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  Divider,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  FormHelperText
} from '@mui/material';
import {
  Save as SaveIcon,
  ArrowBack as BackIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useMutation, useQuery } from '@tanstack/react-query';
import { thesisService, ThesisCreateDto } from '../../../services/api/thesis.service';
import { useNavigate } from 'react-router-dom';

// Mock service for faculty list - in a real app this would come from an API
const getFacultyList = async () => {
  return [
    {
      id: 1,
      name: 'Dr. Robert Chen',
      department: 'Cardiology',
      designation: 'Professor'
    },
    {
      id: 2,
      name: 'Dr. Sarah Lee',
      department: 'Immunology',
      designation: 'Associate Professor'
    },
    {
      id: 3,
      name: 'Dr. James Wilson',
      department: 'Public Health',
      designation: 'Professor'
    },
    {
      id: 4,
      name: 'Dr. David Garcia',
      department: 'Orthopedics',
      designation: 'Assistant Professor'
    },
    {
      id: 5,
      name: 'Dr. Lisa Patel',
      department: 'Psychiatry',
      designation: 'Professor'
    }
  ];
};

// Mock function to get current student ID - in a real app this would come from auth context
const getCurrentStudentId = () => 1;

export const NewThesis = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ThesisCreateDto>({
    title: '',
    abstract: '',
    studentId: getCurrentStudentId(),
    supervisorId: 0,
    keywords: []
  });
  
  const [keywordInput, setKeywordInput] = useState('');
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    supervisorId?: string;
  }>({});
  
  // Query to fetch faculty list
  const { data: facultyList = [], isLoading: loadingFaculty } = useQuery({
    queryKey: ['faculty'],
    queryFn: getFacultyList
  });
  
  // Mutation for creating new thesis
  const createMutation = useMutation({
    mutationFn: (data: ThesisCreateDto) => thesisService.createThesis(data),
    onSuccess: (thesis) => {
      navigate(`/thesis/${thesis.id}`);
    }
  });
  
  // Form field change handler
  const handleChange = (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = event.target;
    if (!name) return;
    
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when field is updated
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };
  
  // Keyword input change handler
  const handleKeywordInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordInput(event.target.value);
  };
  
  // Add keyword handler
  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };
  
  // Remove keyword handler
  const handleRemoveKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter((_, i) => i !== index)
    }));
  };
  
  // Handle enter key on keyword input
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddKeyword();
    }
  };
  
  // Form submission handler
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form
    const errors: typeof formErrors = {};
    
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!formData.supervisorId) {
      errors.supervisorId = 'Supervisor is required';
    }
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    // Submit form
    createMutation.mutate(formData);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button
          startIcon={<BackIcon />}
          onClick={() => navigate('/thesis')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        <Typography variant="h4" component="h1">
          New Thesis Proposal
        </Typography>
      </Box>
      
      {createMutation.isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to create thesis. Please try again.
        </Alert>
      )}
      
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{ p: 3 }}
      >
        <Typography variant="h6" gutterBottom>
          Thesis Information
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              label="Thesis Title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              fullWidth
              variant="outlined"
              error={!!formErrors.title}
              helperText={formErrors.title}
            />
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              label="Abstract"
              name="abstract"
              value={formData.abstract}
              onChange={handleChange}
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              placeholder="Provide a brief summary of your thesis"
            />
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth error={!!formErrors.supervisorId}>
              <InputLabel id="supervisor-label">Supervisor</InputLabel>
              <Select
                labelId="supervisor-label"
                name="supervisorId"
                value={formData.supervisorId || ''}
                onChange={handleChange}
                label="Supervisor"
                disabled={loadingFaculty}
              >
                {facultyList.map((faculty) => (
                  <MenuItem key={faculty.id} value={faculty.id}>
                    {faculty.name} - {faculty.department} ({faculty.designation})
                  </MenuItem>
                ))}
              </Select>
              {formErrors.supervisorId && (
                <FormHelperText>{formErrors.supervisorId}</FormHelperText>
              )}
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle2" gutterBottom>
              Keywords
            </Typography>
            
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TextField
                size="small"
                label="Add keyword"
                value={keywordInput}
                onChange={handleKeywordInputChange}
                onKeyPress={handleKeyPress}
                sx={{ flexGrow: 1, mr: 1 }}
              />
              <Button 
                variant="outlined" 
                onClick={handleAddKeyword}
                disabled={!keywordInput.trim()}
                startIcon={<AddIcon />}
              >
                Add
              </Button>
            </Box>
            
            <Box sx={{ mt: 1 }}>
              {formData.keywords?.map((keyword, index) => (
                <Chip
                  key={index}
                  label={keyword}
                  onDelete={() => handleRemoveKeyword(index)}
                  sx={{ mr: 1, mb: 1 }}
                />
              ))}
              
              {!formData.keywords?.length && (
                <Typography variant="body2" color="text.secondary">
                  No keywords added yet. Keywords help others find your thesis.
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
        
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            type="button"
            onClick={() => navigate('/thesis')}
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            startIcon={createMutation.isPending ? <CircularProgress size={20} /> : <SaveIcon />}
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? 'Saving...' : 'Save Proposal'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};