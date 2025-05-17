import { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Box, 
  Button, 
  Typography, 
  CircularProgress, 
  Paper, 
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Chip
} from '@mui/material';
import { 
  Add as AddIcon,
  FilterList as FilterListIcon,
  Clear as ClearIcon
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridValueFormatterParams } from '@mui/x-data-grid';
import { format } from 'date-fns';
import { examService, ExamDetails, ExamType, ExamStatus, ExamFilterOptions } from '../../../services/api/exam.service';
import { ExamDialog } from './ExamDialog';
import { Notification } from '../../../components/common/Notification';
import { GridActions } from './GridActions';
import { useNavigate } from 'react-router-dom';

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export const ExamList = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // State for DataGrid
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 10,
  });
  
  // State for filtering exams
  const [filters, setFilters] = useState<ExamFilterOptions>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // State for exam dialog
  const [selectedExam, setSelectedExam] = useState<ExamDetails | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // State for notifications
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });

  // Query for fetching exams
  const { data: exams = [], isLoading: isLoadingExams } = useQuery({
    queryKey: ['exams', filters],
    queryFn: () => examService.getAllExams(filters)
  });

  // Mutation for creating a new exam
  const createMutation = useMutation({
    mutationFn: examService.createExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setDialogOpen(false);
      setNotification({
        open: true,
        message: 'Exam created successfully',
        severity: 'success'
      });
    },
    onError: (error: Error) => {
      setNotification({
        open: true,
        message: `Failed to create exam: ${error.message}`,
        severity: 'error'
      });
    }
  });

  // Mutation for updating an exam
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number, data: any }) => 
      examService.updateExam(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
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

  // Mutation for deleting an exam
  const deleteMutation = useMutation({
    mutationFn: examService.deleteExam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
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

  // Handler for opening the dialog to create/edit exam
  const handleOpenDialog = useCallback((exam: ExamDetails | null = null) => {
    setSelectedExam(exam);
    setDialogOpen(true);
  }, []);

  // Handler for closing dialog
  const handleCloseDialog = useCallback(() => {
    setSelectedExam(null);
    setDialogOpen(false);
  }, []);

  // Handler for closing notification
  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  // Handler for saving exam data
  const handleSave = useCallback((examData: any) => {
    if (selectedExam) {
      updateMutation.mutate({ 
        id: selectedExam.id, 
        data: examData 
      });
    } else {
      createMutation.mutate(examData);
    }
  }, [selectedExam, updateMutation, createMutation]);

  // Handler for deleting an exam
  const handleDelete = useCallback((id: number) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  // Handler for viewing exam details
  const handleViewDetails = useCallback((id: number) => {
    navigate(`/exams/${id}`);
  }, [navigate]);

  // Handler for toggling filters visibility
  const handleToggleFilters = useCallback(() => {
    setShowFilters(prev => !prev);
  }, []);

  // Handler for clearing all filters
  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // Handler for applying a filter
  const handleFilterChange = useCallback((name: keyof ExamFilterOptions, value: any) => {
    setFilters(prev => {
      // If value is empty, remove the filter
      if (value === '' || value === undefined || value === null) {
        const { [name]: _, ...rest } = prev;
        return rest;
      }
      // Otherwise, update the filter
      return { ...prev, [name]: value };
    });
  }, []);

  // Loading state
  const isLoading = isLoadingExams || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const isMutating = createMutation.isPending || updateMutation.isPending;

  // DataGrid columns definition
  const columns = useMemo<GridColDef[]>(() => [
    { field: 'title', headerName: 'Title', width: 200 },
    { field: 'courseCode', headerName: 'Course Code', width: 120 },
    { 
      field: 'type', 
      headerName: 'Type', 
      width: 100,
      renderCell: (params) => {
        const examType = params.value as ExamType;
        let color: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default' = 'default';
        
        switch (examType) {
          case 'internal': 
            color = 'info'; 
            break;
          case 'midterm': 
            color = 'primary'; 
            break;
          case 'fat': 
            color = 'error'; 
            break;
          case 'practical': 
            color = 'success'; 
            break;
          case 'viva': 
            color = 'warning'; 
            break;
        }
        
        return (
          <Chip 
            label={examType.charAt(0).toUpperCase() + examType.slice(1)} 
            size="small" 
            color={color}
          />
        );
      }
    },
    { 
      field: 'status', 
      headerName: 'Status', 
      width: 120,
      renderCell: (params) => {
        const examStatus = params.value as ExamStatus;
        let color: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default' = 'default';
        
        switch (examStatus) {
          case 'scheduled': 
            color = 'info'; 
            break;
          case 'ongoing': 
            color = 'warning'; 
            break;
          case 'completed': 
            color = 'success'; 
            break;
          case 'cancelled': 
            color = 'error'; 
            break;
          case 'postponed': 
            color = 'secondary'; 
            break;
        }
        
        return (
          <Chip 
            label={examStatus.charAt(0).toUpperCase() + examStatus.slice(1)} 
            size="small" 
            color={color}
          />
        );
      }
    },
    { field: 'semester', headerName: 'Semester', width: 100 },
    { 
      field: 'startTime', 
      headerName: 'Date', 
      width: 110,
      valueFormatter: (params) => {
        return format(new Date(params.value as Date), 'dd/MM/yyyy');
      }
    },
    { 
      field: 'startTime', 
      headerName: 'Time', 
      width: 130,
      valueFormatter: (params: GridValueFormatterParams<Date>) => {
        const row = params.api.getRow(params.id) as ExamDetails;
        return `${format(new Date(params.value), 'HH:mm')} - ${format(new Date(row.endTime), 'HH:mm')}`;
      }
    },
    { field: 'venue', headerName: 'Venue', width: 150 },
    { 
      field: 'facultyInCharge', 
      headerName: 'Faculty', 
      width: 180,
      valueGetter: (params) => params.row.facultyInCharge?.name,
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 150,
      getActions: (params) => {
        const exam = params.row as ExamDetails;
        const canDelete = ['scheduled', 'cancelled'].includes(exam.status);
        
        return (
          <GridActions
            item={exam}
            onView={() => handleViewDetails(exam.id)}
            onEdit={handleOpenDialog}
            onDelete={canDelete ? handleDelete : undefined}
            disabled={isLoading}
          />
        );
      },
    },
  ], [handleOpenDialog, handleDelete, isLoading, handleViewDetails]);

  return (
    <Paper sx={{ p: 3, position: 'relative' }} role="region" aria-label="Exams management">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }} role="toolbar" aria-label="Exam actions">
        <Typography variant="h4" component="h1">Exams</Typography>
        <Box>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={handleToggleFilters}
            sx={{ mr: 1 }}
          >
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
            disabled={isLoading}
            aria-label="Add new exam"
          >
            Add Exam
          </Button>
        </Box>
      </Box>
      
      {/* Filters section */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2 }} elevation={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">Filters</Typography>
            <Button 
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              disabled={Object.keys(filters).length === 0}
              size="small"
            >
              Clear All
            </Button>
          </Box>
          
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-type-label">Type</InputLabel>
                <Select
                  labelId="filter-type-label"
                  id="filter-type"
                  value={filters.type || ''}
                  label="Type"
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                >
                  <MenuItem value=""><em>Any</em></MenuItem>
                  <MenuItem value="internal">Internal</MenuItem>
                  <MenuItem value="midterm">Midterm</MenuItem>
                  <MenuItem value="fat">Final Assessment</MenuItem>
                  <MenuItem value="practical">Practical</MenuItem>
                  <MenuItem value="viva">Viva</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-status-label">Status</InputLabel>
                <Select
                  labelId="filter-status-label"
                  id="filter-status"
                  value={filters.status || ''}
                  label="Status"
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <MenuItem value=""><em>Any</em></MenuItem>
                  <MenuItem value="scheduled">Scheduled</MenuItem>
                  <MenuItem value="ongoing">Ongoing</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="cancelled">Cancelled</MenuItem>
                  <MenuItem value="postponed">Postponed</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel id="filter-semester-label">Semester</InputLabel>
                <Select
                  labelId="filter-semester-label"
                  id="filter-semester"
                  value={filters.semester || ''}
                  label="Semester"
                  onChange={(e) => handleFilterChange('semester', e.target.value ? Number(e.target.value) : '')}
                >
                  <MenuItem value=""><em>Any</em></MenuItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <MenuItem key={sem} value={sem}>{sem}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                size="small"
                label="Course Code"
                value={filters.courseCode || ''}
                onChange={(e) => handleFilterChange('courseCode', e.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={6}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="From Date"
                  type="date"
                  value={filters.startDate ? format(new Date(filters.startDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleFilterChange('startDate', e.target.value ? new Date(e.target.value) : '')}
                  InputLabelProps={{ shrink: true }}
                  sx={{ mr: 2, width: '100%' }}
                />
                <TextField
                  size="small"
                  label="To Date"
                  type="date"
                  value={filters.endDate ? format(new Date(filters.endDate), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleFilterChange('endDate', e.target.value ? new Date(e.target.value) : '')}
                  InputLabelProps={{ shrink: true }}
                  sx={{ width: '100%' }}
                />
              </Box>
            </Grid>
          </Grid>
          
          {/* Active filters display */}
          {Object.keys(filters).length > 0 && (
            <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {Object.entries(filters).map(([key, value]) => {
                if (!value) return null;
                
                let label = '';
                
                switch (key) {
                  case 'type':
                    label = `Type: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
                    break;
                  case 'status':
                    label = `Status: ${value.charAt(0).toUpperCase() + value.slice(1)}`;
                    break;
                  case 'semester':
                    label = `Semester: ${value}`;
                    break;
                  case 'courseCode':
                    label = `Course: ${value}`;
                    break;
                  case 'startDate':
                    label = `From: ${format(new Date(value), 'dd/MM/yyyy')}`;
                    break;
                  case 'endDate':
                    label = `To: ${format(new Date(value), 'dd/MM/yyyy')}`;
                    break;
                  default:
                    label = `${key}: ${value}`;
                }
                
                return (
                  <Chip
                    key={key}
                    label={label}
                    onDelete={() => handleFilterChange(key as keyof ExamFilterOptions, '')}
                    size="small"
                  />
                );
              })}
            </Box>
          )}
        </Paper>
      )}
      
      {/* Loading overlay */}
      {isLoading && (
        <Box 
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 1
          }}
          role="status"
          aria-label="Loading exams"
        >
          <CircularProgress aria-hidden="true" />
          <span className="sr-only">Loading exams...</span>
        </Box>
      )}

      {/* DataGrid for exams */}
      <DataGrid<ExamDetails>
        rows={exams}
        columns={columns}
        loading={isLoadingExams}
        autoHeight
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        aria-label="Exams table"
        slots={{
          baseButton: Button,
        }}
        slotProps={{
          baseButton: {
            'aria-label': 'Toggle selection'
          }
        }}
        localeText={{
          noRowsLabel: 'No exams found',
        }}
        sx={{ 
          '& .MuiDataGrid-row:hover': {
            cursor: 'pointer',
          }
        }}
        onRowClick={(params) => {
          handleViewDetails(params.row.id);
        }}
      />
      
      {/* Dialog for creating/editing exams */}
      <ExamDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        exam={selectedExam}
        isLoading={isMutating}
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