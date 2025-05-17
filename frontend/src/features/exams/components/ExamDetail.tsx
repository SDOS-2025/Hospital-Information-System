import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Chip, 
  Button, 
  Divider, 
  CircularProgress,
  Alert,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Link
} from '@mui/material';
import { 
  ArrowBack as BackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CloudUpload as UploadIcon,
  Event as EventIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  NoteAdd as NoteAddIcon,
  AttachFile as AttachFileIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { examService, ExamDetails, ExamStatus, ExamUpdateDto } from '../../../services/api/exam.service';
import { useNavigate, useParams } from 'react-router-dom';
import { format, formatDuration, intervalToDuration } from 'date-fns';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

// Status badge component
const ExamStatusBadge = ({ status }: { status: ExamStatus }) => {
  const getColorByStatus = () => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'ongoing':
        return 'primary';
      case 'scheduled':
        return 'info';
      case 'postponed':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Chip 
      label={status.toUpperCase()} 
      color={getColorByStatus() as any}
      sx={{ 
        fontWeight: 'bold', 
        fontSize: '0.9rem', 
        height: 32,
        '& .MuiChip-label': { px: 2 }
      }}
    />
  );
};

// Type badge component
const ExamTypeBadge = ({ type }: { type: string }) => {
  const getColorByType = () => {
    switch (type) {
      case 'internal':
        return 'default';
      case 'midterm':
        return 'primary';
      case 'fat':
        return 'secondary';
      case 'practical':
        return 'info';
      case 'viva':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getTypeLabel = () => {
    if (type === 'fat') return 'FINAL ASSESSMENT';
    return type.toUpperCase();
  };

  return (
    <Chip 
      label={getTypeLabel()} 
      color={getColorByType() as any}
      variant="outlined"
      sx={{ fontWeight: 500 }}
    />
  );
};

// Materials upload dialog component
const MaterialsUploadDialog = ({ 
  open, 
  onClose, 
  onUpload,
  isUploading
}: { 
  open: boolean; 
  onClose: () => void; 
  onUpload: (files: File[]) => void;
  isUploading: boolean;
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const fileList = Array.from(event.target.files);
      
      // Validate file size (max 10MB each)
      const invalidFiles = fileList.filter(file => file.size > 10 * 1024 * 1024);
      
      if (invalidFiles.length > 0) {
        setError('Some files exceed the maximum size of 10MB.');
        return;
      }
      
      setFiles(fileList);
      setError('');
    }
  };
  
  const handleUpload = () => {
    if (files.length > 0) {
      onUpload(files);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Exam Materials</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" paragraph>
            Upload question papers, answer keys, or other exam materials.
            Maximum file size is 10MB per file.
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadIcon />}
            fullWidth
            sx={{ py: 2, px: 3 }}
          >
            Select Files
            <input
              type="file"
              hidden
              multiple
              onChange={handleFileChange}
            />
          </Button>
          
          {files.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Selected files:
              </Typography>
              {files.map((file, index) => (
                <Typography key={index} variant="body2" sx={{ pl: 2 }}>
                  - {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
                </Typography>
              ))}
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isUploading}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpload} 
          variant="contained" 
          disabled={files.length === 0 || isUploading}
          startIcon={isUploading ? <CircularProgress size={20} /> : null}
        >
          {isUploading ? 'Uploading...' : 'Upload Files'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Status update dialog component
const StatusUpdateDialog = ({ 
  open, 
  onClose, 
  onUpdate,
  isUpdating,
  currentStatus,
  currentRemarks
}: { 
  open: boolean; 
  onClose: () => void; 
  onUpdate: (status: ExamStatus, remarks: string) => void;
  isUpdating: boolean;
  currentStatus: ExamStatus;
  currentRemarks?: string;
}) => {
  const [status, setStatus] = useState<ExamStatus>(currentStatus);
  const [remarks, setRemarks] = useState(currentRemarks || '');
  
  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setStatus(currentStatus);
      setRemarks(currentRemarks || '');
    }
  }, [open, currentStatus, currentRemarks]);
  
  const handleStatusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatus(event.target.value as ExamStatus);
  };
  
  const handleRemarksChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRemarks(event.target.value);
  };
  
  const handleUpdate = () => {
    onUpdate(status, remarks);
  };
  
  // Get available status options based on current status
  const getAvailableStatuses = () => {
    switch (currentStatus) {
      case 'scheduled':
        return ['scheduled', 'ongoing', 'postponed', 'cancelled'];
      case 'postponed':
        return ['postponed', 'scheduled', 'cancelled'];
      case 'ongoing':
        return ['ongoing', 'completed', 'postponed', 'cancelled'];
      case 'completed':
        return ['completed']; // Completed is final
      case 'cancelled':
        return ['cancelled', 'scheduled']; // Can reschedule a cancelled exam
      default:
        return [];
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Exam Status</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel id="status-update-label">Status</InputLabel>
            <Select
              labelId="status-update-label"
              value={status}
              onChange={handleStatusChange as any}
              label="Status"
            >
              {getAvailableStatuses().map((s) => (
                <MenuItem key={s} value={s}>{s.toUpperCase()}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="normal"
            fullWidth
            label="Remarks"
            multiline
            rows={4}
            value={remarks}
            onChange={handleRemarksChange}
            placeholder="Add any notes or remarks about this status update"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isUpdating}>
          Cancel
        </Button>
        <Button 
          onClick={handleUpdate} 
          variant="contained" 
          disabled={isUpdating}
          startIcon={isUpdating ? <CircularProgress size={20} /> : null}
        >
          {isUpdating ? 'Updating...' : 'Update Status'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Edit exam dialog component
const EditExamDialog = ({ 
  open, 
  onClose, 
  onSave,
  isProcessing,
  exam
}: { 
  open: boolean; 
  onClose: () => void; 
  onSave: (data: ExamUpdateDto) => void;
  isProcessing: boolean;
  exam?: ExamDetails;
}) => {
  const [formData, setFormData] = useState<ExamUpdateDto>({
    title: '',
    startTime: new Date(),
    endTime: new Date(),
    venue: '',
    maxMarks: undefined,
    passingMarks: undefined,
    instructions: '',
  });
  
  // Reset form when exam changes
  React.useEffect(() => {
    if (exam) {
      setFormData({
        title: exam.title,
        startTime: new Date(exam.startTime),
        endTime: new Date(exam.endTime),
        venue: exam.venue,
        maxMarks: exam.maxMarks,
        passingMarks: exam.passingMarks,
        instructions: exam.instructions || ''
      });
    }
  }, [exam]);
  
  const handleTextFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleNumberFieldChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const numberValue = value === '' ? undefined : Number(value);
    setFormData(prev => ({
      ...prev,
      [name]: numberValue
    }));
  };
  
  const handleDateChange = (name: string) => (date: Date | null) => {
    if (date) {
      setFormData(prev => ({
        ...prev,
        [name]: date
      }));
    }
  };
  
  const handleSave = () => {
    onSave(formData);
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Exam Details</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>
          <TextField
            autoFocus
            margin="normal"
            name="title"
            label="Exam Title"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={handleTextFieldChange}
            required
          />
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Start Time"
                  value={formData.startTime}
                  onChange={handleDateChange('startTime')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="End Time"
                  value={formData.endTime}
                  onChange={handleDateChange('endTime')}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
          
          <TextField
            margin="normal"
            name="venue"
            label="Venue"
            fullWidth
            variant="outlined"
            value={formData.venue}
            onChange={handleTextFieldChange}
            required
          />
          
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                name="maxMarks"
                label="Maximum Marks"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.maxMarks === undefined ? '' : formData.maxMarks}
                onChange={handleNumberFieldChange}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="passingMarks"
                label="Passing Marks"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.passingMarks === undefined ? '' : formData.passingMarks}
                onChange={handleNumberFieldChange}
              />
            </Grid>
          </Grid>
          
          <TextField
            margin="normal"
            name="instructions"
            label="Instructions"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={formData.instructions}
            onChange={handleTextFieldChange}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!formData.title || !formData.venue || isProcessing}
          startIcon={isProcessing ? <CircularProgress size={20} /> : null}
        >
          {isProcessing ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main ExamDetail component
export const ExamDetail = () => {
  const { id } = useParams<{ id: string }>();
  const examId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Query to fetch exam details
  const { 
    data: exam, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['exam', examId],
    queryFn: () => examService.getExamById(examId),
    enabled: !!examId,
    staleTime: 60000, // 1 minute
  });
  
  // Mutation for uploading materials
  const uploadMutation = useMutation({
    mutationFn: ({ id, files }: { id: number, files: File[] }) => 
      examService.uploadMaterials(id, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      setUploadDialogOpen(false);
    }
  });
  
  // Mutation for updating status
  const statusMutation = useMutation({
    mutationFn: ({ id, status, remarks }: { id: number, status: ExamStatus, remarks: string }) => 
      examService.updateExam(id, { status, remarks }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      setStatusDialogOpen(false);
    }
  });
  
  // Mutation for updating exam details
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ExamUpdateDto }) => 
      examService.updateExam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam', examId] });
      setEditDialogOpen(false);
    }
  });
  
  // Mutation for deleting exam
  const deleteMutation = useMutation({
    mutationFn: (id: number) => examService.deleteExam(id),
    onSuccess: () => {
      navigate('/exams');
    }
  });
  
  // Handle materials upload
  const handleMaterialsUpload = (files: File[]) => {
    if (exam) {
      uploadMutation.mutate({ id: exam.id, files });
    }
  };
  
  // Handle status update
  const handleStatusUpdate = (status: ExamStatus, remarks: string) => {
    if (exam) {
      statusMutation.mutate({ id: exam.id, status, remarks });
    }
  };
  
  // Handle exam details update
  const handleExamUpdate = (data: ExamUpdateDto) => {
    if (exam) {
      updateMutation.mutate({ id: exam.id, data });
    }
  };
  
  // Handle exam delete
  const handleDelete = () => {
    if (exam && window.confirm('Are you sure you want to delete this exam? This action cannot be undone.')) {
      deleteMutation.mutate(exam.id);
    }
  };
  
  // Check if user can edit exam
  const canEdit = exam && ['scheduled', 'postponed'].includes(exam.status);
  
  // Check if user can update status
  const canUpdateStatus = exam && exam.status !== 'completed';
  
  // Format exam duration
  const formatExamDuration = (startTime: Date, endTime: Date) => {
    const duration = intervalToDuration({
      start: new Date(startTime),
      end: new Date(endTime)
    });
    
    return formatDuration(duration, {
      format: ['hours', 'minutes'],
      delimiter: ' and '
    });
  };
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !exam) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert severity="error">
          {error ? 'Error loading exam details.' : 'Exam not found.'}
        </Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/exams')}
          sx={{ mt: 2 }}
        >
          Back to Exam List
        </Button>
      </Box>
    );
  }
  
  return (
    <Box>
      {/* Header with back button and actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/exams')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Action buttons based on exam status */}
        {canEdit && (
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={() => setEditDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Edit
          </Button>
        )}
        
        {canEdit && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={handleDelete}
            sx={{ mr: 1 }}
          >
            Delete
          </Button>
        )}
        
        {canUpdateStatus && (
          <Button
            variant="outlined"
            color="primary"
            onClick={() => setStatusDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Update Status
          </Button>
        )}
        
        <Button
          variant="contained"
          startIcon={<UploadIcon />}
          onClick={() => setUploadDialogOpen(true)}
        >
          Upload Materials
        </Button>
      </Box>
      
      {/* Main content */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
              <ExamTypeBadge type={exam.type} />
              <Typography variant="body1" component="span">
                {exam.courseCode} • Semester {exam.semester}
              </Typography>
            </Box>
            <Typography variant="h4" component="h1">
              {exam.title}
            </Typography>
          </Box>
          <ExamStatusBadge status={exam.status} />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%' }}>
              <CardHeader title="Exam Details" />
              <CardContent>
                <TableContainer>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold', width: '40%' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <EventIcon fontSize="small" sx={{ mr: 1 }} />
                            Date
                          </Box>
                        </TableCell>
                        <TableCell>
                          {format(new Date(exam.startTime), 'EEEE, MMMM d, yyyy')}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <TimeIcon fontSize="small" sx={{ mr: 1 }} />
                            Time
                          </Box>
                        </TableCell>
                        <TableCell>
                          {format(new Date(exam.startTime), 'h:mm a')} - {format(new Date(exam.endTime), 'h:mm a')}
                          <Typography variant="caption" display="block" color="text.secondary">
                            Duration: {formatExamDuration(exam.startTime, exam.endTime)}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <LocationIcon fontSize="small" sx={{ mr: 1 }} />
                            Venue
                          </Box>
                        </TableCell>
                        <TableCell>{exam.venue}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                          Faculty in Charge
                        </TableCell>
                        <TableCell>
                          {exam.facultyInCharge.name}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {exam.facultyInCharge.department} • {exam.facultyInCharge.email}
                          </Typography>
                        </TableCell>
                      </TableRow>
                      {exam.maxMarks && (
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                            Marks
                          </TableCell>
                          <TableCell>
                            Maximum: {exam.maxMarks}
                            {exam.passingMarks && (
                              <Typography variant="body2" component="span" sx={{ ml: 2 }}>
                                Passing: {exam.passingMarks}
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      )}
                      {exam.proctors && exam.proctors.length > 0 && (
                        <TableRow>
                          <TableCell component="th" sx={{ fontWeight: 'bold' }}>
                            Proctors
                          </TableCell>
                          <TableCell>
                            {exam.proctors.map((proctor, index) => (
                              <Typography key={index} variant="body2">
                                • {proctor}
                              </Typography>
                            ))}
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardHeader title="Instructions" />
              <CardContent sx={{ flexGrow: 1 }}>
                {exam.instructions ? (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {exam.instructions}
                  </Typography>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No instructions provided.
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12}>
            <Card variant="outlined">
              <CardHeader title="Exam Materials" />
              <CardContent>
                {exam.attachments && exam.attachments.length > 0 ? (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>File Name</TableCell>
                          <TableCell align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {exam.attachments.map((attachment, index) => {
                          const fileName = attachment.split('/').pop() || `File ${index + 1}`;
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                  <AttachFileIcon fontSize="small" sx={{ mr: 1 }} />
                                  {fileName}
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Button
                                  size="small"
                                  variant="outlined"
                                  href={attachment}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Download
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : (
                  <Typography variant="body1" color="text.secondary">
                    No materials uploaded yet.
                  </Typography>
                )}
                
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<UploadIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    Upload Materials
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Remarks section */}
        {exam.remarks && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Remarks
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                {exam.remarks}
              </Typography>
            </Paper>
          </Box>
        )}
      </Paper>
      
      {/* Dialogs */}
      <MaterialsUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleMaterialsUpload}
        isUploading={uploadMutation.isPending}
      />
      
      <StatusUpdateDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onUpdate={handleStatusUpdate}
        isUpdating={statusMutation.isPending}
        currentStatus={exam.status}
        currentRemarks={exam.remarks}
      />
      
      <EditExamDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleExamUpdate}
        isProcessing={updateMutation.isPending}
        exam={exam}
      />
    </Box>
  );
};