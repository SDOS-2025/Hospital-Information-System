import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Divider,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Tooltip,
  Card,
  CardContent
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  EventAvailable as EventIcon,
  School as SchoolIcon,
  LocationOn as LocationIcon,
  AccessTime as TimeIcon,
  Person as PersonIcon,
  AttachFile as AttachFileIcon,
  Upload as UploadIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { examService, ExamStatus } from '../../../services/api/exam.service';
import { ExamDialog } from './ExamDialog';
import { Notification } from '../../../components/common/Notification';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export const ExamDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const examId = Number(id);
  
  // State for exam dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // State for notifications
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Query for fetching exam details
  const { data: exam, isLoading } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examService.getExamById(examId),
    enabled: !!examId && !isNaN(examId)
  });
  
  // Mutation for updating exam
  const updateMutation = useMutation({
    mutationFn: (data: any) => examService.updateExam(examId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      setDialogOpen(false);
      setNotification({
        open: true,
        message: 'Exam updated successfully',
        severity: 'success'
      });
    },
    onError: (error: Error) => {
      setNotification({
        open: true,
        message: `Failed to update exam: ${error.message}`,
        severity: 'error'
      });
    }
  });
  
  // Mutation for deleting exam
  const deleteMutation = useMutation({
    mutationFn: () => examService.deleteExam(examId),
    onSuccess: () => {
      navigate('/exams');
      setNotification({
        open: true,
        message: 'Exam deleted successfully',
        severity: 'success'
      });
    },
    onError: (error: Error) => {
      setNotification({
        open: true,
        message: `Failed to delete exam: ${error.message}`,
        severity: 'error'
      });
    }
  });
  
  // Mutation for uploading materials
  const uploadMutation = useMutation({
    mutationFn: (files: File[]) => examService.uploadMaterials(examId, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      setNotification({
        open: true,
        message: 'Materials uploaded successfully',
        severity: 'success'
      });
    },
    onError: (error: Error) => {
      setNotification({
        open: true,
        message: `Failed to upload materials: ${error.message}`,
        severity: 'error'
      });
    }
  });
  
  // Handler for navigating back
  const handleBack = useCallback(() => {
    navigate('/exams');
  }, [navigate]);
  
  // Handler for opening dialog
  const handleOpenDialog = useCallback(() => {
    setDialogOpen(true);
  }, []);
  
  // Handler for closing dialog
  const handleCloseDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);
  
  // Handler for saving exam details
  const handleSave = useCallback((data: any) => {
    updateMutation.mutate(data);
  }, [updateMutation]);
  
  // Handler for deleting exam
  const handleDelete = useCallback(() => {
    if (window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      deleteMutation.mutate();
    }
  }, [deleteMutation]);
  
  // Handler for closing notification
  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);
  
  // Handler for file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      uploadMutation.mutate(files);
    }
  }, [uploadMutation]);
  
  // Helper function to get status color
  const getStatusColor = (status: ExamStatus) => {
    switch (status) {
      case 'scheduled': return 'info';
      case 'ongoing': return 'warning';
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'postponed': return 'secondary';
      default: return 'default';
    }
  };
  
  // Helper function to get exam type label
  const getExamTypeLabel = (type: string) => {
    switch (type) {
      case 'internal': return 'Internal Assessment';
      case 'midterm': return 'Midterm Examination';
      case 'fat': return 'Final Assessment Test (FAT)';
      case 'practical': return 'Practical Examination';
      case 'viva': return 'Viva Voce';
      default: return type;
    }
  };
  
  if (isLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }
  
  if (!exam) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" color="error">
          Exam not found
        </Typography>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={handleBack}
          sx={{ mt: 2 }}
        >
          Back to Exams
        </Button>
      </Paper>
    );
  }
  
  const canDelete = ['scheduled', 'cancelled'].includes(exam.status);
  const isMutating = updateMutation.isPending || deleteMutation.isPending || uploadMutation.isPending;
  
  return (
    <Paper sx={{ p: 3, position: 'relative' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={handleBack}
            sx={{ mb: 1 }}
          >
            Back to Exams
          </Button>
          <Typography variant="h4" component="h1">{exam.title}</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
            <Chip 
              label={exam.courseCode} 
              color="primary" 
              size="small" 
              sx={{ mr: 1 }}
            />
            <Chip 
              label={exam.type.charAt(0).toUpperCase() + exam.type.slice(1)} 
              size="small" 
              sx={{ mr: 1 }}
            />
            <Chip 
              label={exam.status.charAt(0).toUpperCase() + exam.status.slice(1)} 
              color={getStatusColor(exam.status)} 
              size="small" 
            />
          </Box>
        </Box>
        
        <Box>
          <Button
            startIcon={<EditIcon />}
            variant="outlined"
            onClick={handleOpenDialog}
            disabled={isMutating}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
          {canDelete && (
            <Button
              startIcon={<DeleteIcon />}
              variant="outlined"
              color="error"
              onClick={handleDelete}
              disabled={isMutating}
            >
              Delete
            </Button>
          )}
        </Box>
      </Box>
      
      <Divider sx={{ my: 2 }} />
      
      {/* Exam details */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Exam Details
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <EventIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="body1" fontWeight="medium">Date:</Typography>
                  </Box>
                  <Typography variant="body2">
                    {format(new Date(exam.startTime), 'EEEE, MMMM d, yyyy')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <TimeIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="body1" fontWeight="medium">Time:</Typography>
                  </Box>
                  <Typography variant="body2">
                    {format(new Date(exam.startTime), 'h:mm a')} - {format(new Date(exam.endTime), 'h:mm a')}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <LocationIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="body1" fontWeight="medium">Venue:</Typography>
                  </Box>
                  <Typography variant="body2">{exam.venue}</Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <SchoolIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="body1" fontWeight="medium">Semester:</Typography>
                  </Box>
                  <Typography variant="body2">{exam.semester}</Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <PersonIcon color="action" sx={{ mr: 1 }} />
                    <Typography variant="body1" fontWeight="medium">Faculty In Charge:</Typography>
                  </Box>
                  <Typography variant="body2">
                    {exam.facultyInCharge.name} ({exam.facultyInCharge.department})
                    <br />
                    <Typography variant="caption" color="textSecondary">
                      {exam.facultyInCharge.email}
                    </Typography>
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6">Additional Information</Typography>
              
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" fontWeight="medium">Exam Type:</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {getExamTypeLabel(exam.type)}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" fontWeight="medium">Status:</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    <Chip 
                      label={exam.status.charAt(0).toUpperCase() + exam.status.slice(1)} 
                      color={getStatusColor(exam.status)} 
                      size="small" 
                    />
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" fontWeight="medium">Maximum Marks:</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {exam.maxMarks || 'Not specified'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="body1" fontWeight="medium">Passing Marks:</Typography>
                  <Typography variant="body2" sx={{ mt: 0.5 }}>
                    {exam.passingMarks || 'Not specified'}
                  </Typography>
                </Grid>
                
                {exam.remarks && (
                  <Grid item xs={12}>
                    <Typography variant="body1" fontWeight="medium">Remarks:</Typography>
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {exam.remarks}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
          
          {exam.instructions && (
            <Card variant="outlined" sx={{ mt: 3 }}>
              <CardContent>
                <Typography variant="h6">Instructions</Typography>
                <Typography variant="body2" component="pre" sx={{ 
                  mt: 1,
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'inherit',
                  p: 2,
                  bgcolor: 'background.default',
                  borderRadius: 1
                }}>
                  {exam.instructions}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Materials</Typography>
                <Tooltip title="Upload Materials">
                  <span>
                    <IconButton 
                      color="primary" 
                      component="label"
                      disabled={isMutating}
                    >
                      <UploadIcon />
                      <input
                        type="file"
                        hidden
                        multiple
                        onChange={handleFileUpload}
                      />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                {!exam.attachments || exam.attachments.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No materials uploaded yet
                  </Typography>
                ) : (
                  <Box component="ul" sx={{ listStyleType: 'none', pl: 0, m: 0 }}>
                    {exam.attachments.map((attachment, index) => (
                      <Box 
                        key={index}
                        component="li" 
                        sx={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          py: 0.5,
                          borderBottom: index < exam.attachments!.length - 1 ? '1px solid #eee' : 'none'
                        }}
                      >
                        <AttachFileIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                        <Typography 
                          variant="body2"
                          component="a"
                          href={attachment}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                        >
                          {attachment.split('/').pop() || `Attachment ${index + 1}`}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6">Proctors</Typography>
              <Box sx={{ mt: 2 }}>
                {!exam.proctors || exam.proctors.length === 0 ? (
                  <Typography variant="body2" color="textSecondary">
                    No proctors assigned
                  </Typography>
                ) : (
                  <Box component="ul" sx={{ pl: 2, m: 0 }}>
                    {exam.proctors.map((proctor, index) => (
                      <Box 
                        key={index}
                        component="li" 
                        sx={{ py: 0.5 }}
                      >
                        <Typography variant="body2">{proctor}</Typography>
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </CardContent>
          </Card>
          
          <Card variant="outlined" sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6">Meta Information</Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" color="textSecondary">
                  Created: {format(new Date(exam.createdAt), 'MMM d, yyyy')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Last updated: {format(new Date(exam.updatedAt), 'MMM d, yyyy')}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Duration: {Math.round((new Date(exam.endTime).getTime() - new Date(exam.startTime).getTime()) / (1000 * 60))} minutes
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      {/* Dialog for editing exam */}
      <ExamDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        exam={exam}
        isLoading={updateMutation.isPending}
      />
      
      {/* Notification component */}
      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
      />
    </Paper>
  );
};