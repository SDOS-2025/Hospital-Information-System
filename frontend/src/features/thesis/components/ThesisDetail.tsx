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
  TextField,
  Alert,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { 
  CloudUpload as UploadIcon, 
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  ArrowBack as BackIcon,
  History as HistoryIcon,
  Comment as CommentIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { thesisService, ThesisDetails, ThesisStatus, ThesisUpdateDto } from '../../../services/api/thesis.service';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';

// Status display component
const ThesisStatusDisplay = ({ status }: { status: ThesisStatus }) => {
  const getColorByStatus = () => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'submitted':
      case 'under_review':
        return 'info';
      case 'revision_needed':
        return 'warning';
      case 'rejected':
        return 'error';
      case 'published':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getLabel = () => {
    switch (status) {
      case 'draft':
        return 'Draft';
      case 'submitted':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'revision_needed':
        return 'Needs Revision';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'published':
        return 'Published';
      default:
        return status;
    }
  };
  
  return (
    <Chip 
      label={getLabel()} 
      color={getColorByStatus() as any}
      sx={{ 
        fontWeight: 'bold', 
        fontSize: '1rem', 
        height: 32,
        '& .MuiChip-label': { px: 2 }
      }}
    />
  );
};

// Status timeline component
const StatusTimeline = ({ thesis }: { thesis: ThesisDetails }) => {
  // Define the possible steps in thesis lifecycle
  const steps = [
    { label: 'Draft', completed: true },
    { label: 'Submitted', completed: ['submitted', 'under_review', 'revision_needed', 'approved', 'published'].includes(thesis.status) },
    { label: 'Under Review', completed: ['under_review', 'revision_needed', 'approved', 'published'].includes(thesis.status) },
    { label: thesis.status === 'revision_needed' ? 'Needs Revision' : 'Approved', completed: ['revision_needed', 'approved', 'published'].includes(thesis.status) },
    { label: 'Published', completed: ['published'].includes(thesis.status) }
  ];
  
  // Find the active step (the last completed one)
  const activeStep = steps.findIndex(step => !step.completed);
  
  return (
    <Stepper activeStep={activeStep === -1 ? steps.length : activeStep}>
      {steps.map((step, index) => (
        <Step key={index} completed={step.completed}>
          <StepLabel>{step.label}</StepLabel>
        </Step>
      ))}
    </Stepper>
  );
};

// Document upload dialog component
const DocumentUploadDialog = ({ 
  open, 
  onClose, 
  onUpload,
  isUploading
}: { 
  open: boolean; 
  onClose: () => void; 
  onUpload: (file: File) => void;
  isUploading: boolean;
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const selectedFile = event.target.files[0];
      
      // Validate file type (PDF only)
      if (!selectedFile.type.includes('pdf')) {
        setError('Only PDF files are allowed.');
        setFile(null);
        return;
      }
      
      // Validate file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('File size should not exceed 10MB.');
        setFile(null);
        return;
      }
      
      setFile(selectedFile);
      setError('');
    }
  };
  
  const handleUpload = () => {
    if (file) {
      onUpload(file);
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Upload Thesis Document</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 2 }}>
          <Typography variant="body1" paragraph>
            Upload your thesis document in PDF format. Maximum file size is 10MB.
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
            Select File
            <input
              type="file"
              accept=".pdf"
              hidden
              onChange={handleFileChange}
            />
          </Button>
          
          {file && (
            <Typography variant="body2" sx={{ mt: 2 }}>
              Selected file: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
            </Typography>
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
          disabled={!file || isUploading}
          startIcon={isUploading ? <CircularProgress size={20} /> : null}
        >
          {isUploading ? 'Uploading...' : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Status update dialog component for faculty/admin
const StatusUpdateDialog = ({ 
  open, 
  onClose, 
  onUpdate,
  isUpdating,
  currentStatus
}: { 
  open: boolean; 
  onClose: () => void; 
  onUpdate: (status: ThesisStatus, comments: string) => void;
  isUpdating: boolean;
  currentStatus: ThesisStatus;
}) => {
  const [status, setStatus] = useState<ThesisStatus>(currentStatus);
  const [comments, setComments] = useState('');
  
  // Reset state when dialog opens
  React.useEffect(() => {
    if (open) {
      setStatus(currentStatus);
      setComments('');
    }
  }, [open, currentStatus]);
  
  const handleStatusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setStatus(event.target.value as ThesisStatus);
  };
  
  const handleCommentsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setComments(event.target.value);
  };
  
  const handleUpdate = () => {
    onUpdate(status, comments);
  };
  
  const getAvailableStatuses = () => {
    // Based on current status, determine which statuses are valid next steps
    switch (currentStatus) {
      case 'draft':
        return ['draft', 'submitted'];
      case 'submitted':
        return ['submitted', 'under_review'];
      case 'under_review':
        return ['under_review', 'revision_needed', 'approved', 'rejected'];
      case 'revision_needed':
        return ['revision_needed', 'submitted'];
      case 'approved':
        return ['approved', 'published'];
      case 'rejected':
        return ['rejected'];
      case 'published':
        return ['published'];
      default:
        return [];
    }
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Update Thesis Status</DialogTitle>
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
                <MenuItem key={s} value={s}>{s.replace('_', ' ').toUpperCase()}</MenuItem>
              ))}
            </Select>
          </FormControl>
          
          <TextField
            margin="normal"
            fullWidth
            label="Comments/Feedback"
            multiline
            rows={4}
            value={comments}
            onChange={handleCommentsChange}
            placeholder="Provide feedback or comments about this status update"
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

// Edit thesis dialog component
const EditThesisDialog = ({ 
  open, 
  onClose, 
  onSave,
  isProcessing,
  thesis
}: { 
  open: boolean; 
  onClose: () => void; 
  onSave: (data: ThesisUpdateDto) => void;
  isProcessing: boolean;
  thesis?: ThesisDetails;
}) => {
  const [formData, setFormData] = useState<ThesisUpdateDto>({
    title: thesis?.title || '',
    abstract: thesis?.abstract || '',
    keywords: thesis?.keywords || []
  });
  const [keywordInput, setKeywordInput] = useState('');
  
  // Reset form when thesis changes
  React.useEffect(() => {
    if (thesis) {
      setFormData({
        title: thesis.title,
        abstract: thesis.abstract || '',
        keywords: thesis.keywords || []
      });
    }
  }, [thesis]);
  
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleKeywordInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeywordInput(event.target.value);
  };
  
  const handleAddKeyword = () => {
    if (keywordInput.trim()) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), keywordInput.trim()]
      }));
      setKeywordInput('');
    }
  };
  
  const handleRemoveKeyword = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter((_, i) => i !== index)
    }));
  };
  
  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleAddKeyword();
    }
  };
  
  const handleSave = () => {
    onSave(formData);
  };
  
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Thesis</DialogTitle>
      <DialogContent>
        <Box sx={{ py: 1 }}>
          <TextField
            autoFocus
            margin="normal"
            name="title"
            label="Thesis Title"
            fullWidth
            variant="outlined"
            value={formData.title}
            onChange={handleChange}
            required
          />
          
          <TextField
            margin="normal"
            name="abstract"
            label="Abstract"
            multiline
            rows={4}
            fullWidth
            variant="outlined"
            value={formData.abstract}
            onChange={handleChange}
            placeholder="Brief summary of your thesis"
          />
          
          <Box sx={{ mt: 2 }}>
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
              
              {formData.keywords?.length === 0 && (
                <Typography variant="body2" color="text.secondary">
                  No keywords added yet
                </Typography>
              )}
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isProcessing}>
          Cancel
        </Button>
        <Button 
          onClick={handleSave} 
          variant="contained" 
          disabled={!formData.title || isProcessing}
          startIcon={isProcessing ? <CircularProgress size={20} /> : null}
        >
          {isProcessing ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main ThesisDetail component
export const ThesisDetail = () => {
  const { id } = useParams<{ id: string }>();
  const thesisId = parseInt(id || '0', 10);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Query to fetch thesis details
  const { 
    data: thesis, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['thesis', thesisId],
    queryFn: () => thesisService.getThesisById(thesisId),
    enabled: !!thesisId,
    staleTime: 60000, // 1 minute
  });
  
  // Mutation for uploading document
  const uploadMutation = useMutation({
    mutationFn: ({ id, file }: { id: number, file: File }) => 
      thesisService.uploadDocument(id, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thesis', thesisId] });
      setUploadDialogOpen(false);
    }
  });
  
  // Mutation for updating status
  const statusMutation = useMutation({
    mutationFn: ({ id, status, comments }: { id: number, status: ThesisStatus, comments: string }) => 
      thesisService.updateStatus(id, status, comments),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thesis', thesisId] });
      setStatusDialogOpen(false);
    }
  });
  
  // Mutation for updating thesis
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: ThesisUpdateDto }) => 
      thesisService.updateThesis(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['thesis', thesisId] });
      setEditDialogOpen(false);
    }
  });
  
  // Mutation for deleting thesis
  const deleteMutation = useMutation({
    mutationFn: (id: number) => thesisService.deleteThesis(id),
    onSuccess: () => {
      navigate('/thesis');
    }
  });
  
  // Handle document upload
  const handleUploadDocument = (file: File) => {
    if (thesis) {
      uploadMutation.mutate({ id: thesis.id, file });
    }
  };
  
  // Handle status update
  const handleStatusUpdate = (status: ThesisStatus, comments: string) => {
    if (thesis) {
      statusMutation.mutate({ id: thesis.id, status, comments });
    }
  };
  
  // Handle thesis update
  const handleThesisUpdate = (data: ThesisUpdateDto) => {
    if (thesis) {
      updateMutation.mutate({ id: thesis.id, data });
    }
  };
  
  // Handle thesis delete
  const handleDelete = () => {
    if (thesis && window.confirm('Are you sure you want to delete this thesis? This action cannot be undone.')) {
      deleteMutation.mutate(thesis.id);
    }
  };
  
  // Check if user has edit permissions (in a real app, this would check against user role/permissions)
  const canEdit = thesis?.status === 'draft' || thesis?.status === 'revision_needed';
  
  // Check if user can update status (faculty/admin role)
  const canUpdateStatus = true; // In a real app, check user role
  
  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error || !thesis) {
    return (
      <Box sx={{ my: 4 }}>
        <Alert severity="error">
          {error ? 'Error loading thesis details.' : 'Thesis not found.'}
        </Alert>
        <Button 
          startIcon={<BackIcon />} 
          onClick={() => navigate('/thesis')}
          sx={{ mt: 2 }}
        >
          Back to Thesis List
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
          onClick={() => navigate('/thesis')}
          sx={{ mr: 2 }}
        >
          Back
        </Button>
        
        <Box sx={{ flexGrow: 1 }} />
        
        {/* Action buttons based on thesis status */}
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
            startIcon={<HistoryIcon />}
            onClick={() => setStatusDialogOpen(true)}
            sx={{ mr: 1 }}
          >
            Update Status
          </Button>
        )}
        
        {(thesis.status === 'draft' || thesis.status === 'revision_needed') && (
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
          >
            Upload Document
          </Button>
        )}
      </Box>
      
      {/* Main content */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h4" component="h1">
            {thesis.title}
          </Typography>
          <ThesisStatusDisplay status={thesis.status} />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <StatusTimeline thesis={thesis} />
        
        <Grid container spacing={3} sx={{ mt: 1 }}>
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Student</Typography>
            <Typography variant="body1">{thesis.student.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {thesis.student.department} &middot; {thesis.student.program}
            </Typography>
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Supervisor</Typography>
            <Typography variant="body1">{thesis.supervisor.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {thesis.supervisor.department} &middot; {thesis.supervisor.designation}
            </Typography>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Abstract</Typography>
            <Typography variant="body1">
              {thesis.abstract || 'No abstract provided.'}
            </Typography>
          </Grid>
          
          {thesis.keywords && thesis.keywords.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Keywords</Typography>
              <Box>
                {thesis.keywords.map((keyword, index) => (
                  <Chip 
                    key={index} 
                    label={keyword} 
                    sx={{ mr: 1, mb: 1 }} 
                  />
                ))}
              </Box>
            </Grid>
          )}
          
          <Grid item xs={12} md={6}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Date Information</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Typography variant="body2">
                <strong>Created:</strong> {format(new Date(thesis.createdAt), 'MMM dd, yyyy')}
              </Typography>
              
              {thesis.submissionDate && (
                <Typography variant="body2">
                  <strong>Submitted:</strong> {format(new Date(thesis.submissionDate), 'MMM dd, yyyy')}
                </Typography>
              )}
              
              {thesis.approvalDate && (
                <Typography variant="body2">
                  <strong>Approved:</strong> {format(new Date(thesis.approvalDate), 'MMM dd, yyyy')}
                </Typography>
              )}
              
              <Typography variant="body2">
                <strong>Last Updated:</strong> {format(new Date(thesis.updatedAt), 'MMM dd, yyyy')}
              </Typography>
            </Box>
          </Grid>
          
          {thesis.documentUrl && (
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>Document</Typography>
              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                href={thesis.documentUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Thesis Document
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>
      
      {/* Review feedback section */}
      {thesis.reviewFeedback && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CommentIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Review Feedback</Typography>
            </Box>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
              {thesis.reviewFeedback}
            </Typography>
          </CardContent>
        </Card>
      )}
      
      {/* Dialogs */}
      <DocumentUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onUpload={handleUploadDocument}
        isUploading={uploadMutation.isPending}
      />
      
      <StatusUpdateDialog
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        onUpdate={handleStatusUpdate}
        isUpdating={statusMutation.isPending}
        currentStatus={thesis.status}
      />
      
      <EditThesisDialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        onSave={handleThesisUpdate}
        isProcessing={updateMutation.isPending}
        thesis={thesis}
      />
    </Box>
  );
};