import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent,
  CardActions,
  Button,
  Chip,
  Grid,
  IconButton,
  TextField,
  InputAdornment,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon, 
  Add as AddIcon,
  FilterList as FilterIcon,
  InsertDriveFile as FileIcon,
  Person as PersonIcon,
  SupervisorAccount as SupervisorIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { thesisService, ThesisDetails, ThesisStatus } from '../../../services/api/thesis.service';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Status badge component to show the status of a thesis
const StatusBadge = ({ status }: { status: ThesisStatus }) => {
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
      size="small" 
      sx={{ textTransform: 'capitalize' }}
    />
  );
};

// Thesis card component to display each thesis
const ThesisCard = ({ thesis }: { thesis: ThesisDetails }) => {
  const navigate = useNavigate();

  return (
    <Card 
      sx={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        boxShadow: 3,
        '&:hover': {
          boxShadow: 6,
          transform: 'translateY(-2px)',
          transition: 'transform 0.3s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
            {thesis.title}
          </Typography>
          <StatusBadge status={thesis.status} />
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, height: '60px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {thesis.abstract || 'No abstract provided.'}
        </Typography>
        
        <Grid container spacing={2}>
          <Grid item xs={12} display="flex" alignItems="center">
            <PersonIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2">
              {thesis.student.name}
            </Typography>
          </Grid>
          
          <Grid item xs={12} display="flex" alignItems="center">
            <SupervisorIcon fontSize="small" color="action" sx={{ mr: 1 }} />
            <Typography variant="body2">
              {thesis.supervisor.name}
            </Typography>
          </Grid>
          
          {thesis.submissionDate && (
            <Grid item xs={12}>
              <Typography variant="caption" display="block" color="text.secondary">
                Submitted: {format(new Date(thesis.submissionDate), 'MMM dd, yyyy')}
              </Typography>
            </Grid>
          )}
          
          {thesis.keywords && thesis.keywords.length > 0 && (
            <Grid item xs={12} sx={{ mt: 1 }}>
              {thesis.keywords.map((keyword, index) => (
                <Chip 
                  key={index} 
                  label={keyword} 
                  size="small" 
                  variant="outlined" 
                  sx={{ mr: 0.5, mb: 0.5 }} 
                />
              ))}
            </Grid>
          )}
        </Grid>
      </CardContent>
      <CardActions>
        <Button 
          size="small" 
          variant="outlined"
          onClick={() => navigate(`/thesis/${thesis.id}`)}
        >
          View Details
        </Button>
        
        {thesis.documentUrl && (
          <Button
            size="small"
            startIcon={<FileIcon />}
            href={thesis.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            View Document
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

// Filter component for thesis filtering
const ThesisFilters = ({ 
  onFilterChange 
}: { 
  onFilterChange: (filters: {
    search: string,
    status: ThesisStatus | '',
  }) => void 
}) => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ThesisStatus | ''>('');
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newSearch = event.target.value;
    setSearch(newSearch);
    onFilterChange({ search: newSearch, status });
  };
  
  const handleStatusChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newStatus = event.target.value as ThesisStatus | '';
    setStatus(newStatus);
    onFilterChange({ search, status: newStatus });
  };
  
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            placeholder="Search by title, abstract, or keywords"
            value={search}
            onChange={handleSearchChange}
            variant="outlined"
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth size="small" variant="outlined">
            <InputLabel id="status-filter-label">Filter by Status</InputLabel>
            <Select
              labelId="status-filter-label"
              value={status}
              onChange={handleStatusChange as any}
              label="Filter by Status"
            >
              <MenuItem value="">All Statuses</MenuItem>
              <MenuItem value="draft">Draft</MenuItem>
              <MenuItem value="submitted">Submitted</MenuItem>
              <MenuItem value="under_review">Under Review</MenuItem>
              <MenuItem value="revision_needed">Needs Revision</MenuItem>
              <MenuItem value="approved">Approved</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="published">Published</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>
    </Paper>
  );
};

// Main ThesisList component
export const ThesisList = () => {
  const [filters, setFilters] = useState({
    search: '',
    status: '' as ThesisStatus | '',
  });
  
  const navigate = useNavigate();
  
  const { data: theses = [], isLoading, error } = useQuery({
    queryKey: ['theses', filters],
    queryFn: () => thesisService.getAllTheses({
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? { keyword: filters.search } : {}),
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const handleFilterChange = (newFilters: {
    search: string,
    status: ThesisStatus | '',
  }) => {
    setFilters(newFilters);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">Thesis Management</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/thesis/new')}
        >
          New Thesis
        </Button>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <ThesisFilters onFilterChange={handleFilterChange} />
      
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
          <CircularProgress />
        </Box>
      )}
      
      {error && (
        <Box sx={{ my: 2 }}>
          <Typography color="error">
            Error loading theses. Please try again later.
          </Typography>
        </Box>
      )}
      
      {!isLoading && theses.length === 0 && (
        <Box sx={{ textAlign: 'center', my: 4, p: 3, bgcolor: 'background.paper', borderRadius: 1 }}>
          <Typography variant="h6">No theses found</Typography>
          <Typography color="textSecondary">
            {filters.search || filters.status 
              ? 'Try changing your search criteria'
              : 'Create a new thesis to get started'}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            sx={{ mt: 2 }}
            onClick={() => navigate('/thesis/new')}
          >
            Create New Thesis
          </Button>
        </Box>
      )}
      
      <Grid container spacing={3}>
        {theses.map((thesis) => (
          <Grid item key={thesis.id} xs={12} sm={6} md={4}>
            <ThesisCard thesis={thesis} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};