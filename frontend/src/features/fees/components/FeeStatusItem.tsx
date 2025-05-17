import { useState } from 'react';
import { 
  Box, 
  Typography, 
  IconButton, 
  Collapse, 
  Paper, 
  Grid, 
  Chip, 
  Button,
  Divider 
} from '@mui/material';
import { 
  CheckCircle, 
  Warning, 
  ExpandMore, 
  ExpandLess, 
  CalendarMonth, 
  Receipt 
} from '@mui/icons-material';
import { FeeStatusItem as FeeStatusItemType } from '../../../services/api/fee.service';
import { format } from 'date-fns';

interface FeeStatusItemProps {
  feeItem: FeeStatusItemType;
}

export const FeeStatusItem = ({ feeItem }: FeeStatusItemProps) => {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    setExpanded(!expanded);
  };

  const getStatusIcon = () => {
    switch (feeItem.status) {
      case 'approved':
        return <CheckCircle color="success" />;
      case 'due':
      case 'pending':
        return <Warning color="warning" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (feeItem.status) {
      case 'approved':
        return 'APPROVED';
      case 'due':
        return `Due: ${format(new Date(feeItem.dueDate), 'dd MMM yyyy')}`;
      case 'pending':
        return 'PENDING';
      default:
        return '';
    }
  };

  const getStatusColor = () => {
    switch (feeItem.status) {
      case 'approved':
        return 'success';
      case 'due':
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Paper 
      elevation={1} 
      sx={{ 
        mb: 2, 
        overflow: 'hidden',
        borderRadius: '8px'
      }}
    >
      <Box 
        sx={{ 
          p: 2, 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          borderLeft: 4, 
          borderColor: feeItem.status === 'approved' ? 'success.main' : 'warning.main',
          backgroundColor: feeItem.status === 'approved' ? 'rgba(46, 125, 50, 0.05)' : 'rgba(237, 108, 2, 0.05)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Box sx={{ 
            width: 40, 
            height: 40, 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: feeItem.status === 'approved' ? 'rgba(46, 125, 50, 0.1)' : 'rgba(237, 108, 2, 0.1)'
          }}>
            {getStatusIcon()}
          </Box>
          <Box sx={{ ml: 2 }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {feeItem.semester}
            </Typography>
            <Chip 
              label={getStatusText()} 
              size="small" 
              color={getStatusColor() as any}
              variant={feeItem.status === 'approved' ? 'filled' : 'outlined'} 
              sx={{ mt: 0.5 }} 
            />
          </Box>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            color="primary"
            variant="text"
            size="small"
            onClick={toggleExpand}
            endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
          >
            View Details
          </Button>
        </Box>
      </Box>
      
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <Box sx={{ p: 2, bgcolor: 'background.paper' }}>
          <Divider sx={{ mb: 2 }} />
          <Grid container spacing={3}>
            <Grid item xs={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Receipt sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Amount
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    ₹{feeItem.amount.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <CalendarMonth sx={{ mr: 1, color: 'text.secondary' }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Due Date
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {format(new Date(feeItem.dueDate), 'dd MMM yyyy')}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            {feeItem.status === 'approved' && feeItem.approvedDate && (
              <Grid item xs={6} md={3}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                  <CheckCircle sx={{ mr: 1, color: 'success.main' }} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Approved On
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {format(new Date(feeItem.approvedDate), 'dd MMM yyyy')}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
            )}
            
            <Grid item xs={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Box sx={{ mr: 1, width: 24 }} /> {/* Spacer for alignment */}
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Fee Type
                  </Typography>
                  <Typography variant="body1" fontWeight="medium" textTransform="capitalize">
                    {feeItem.type} Fee
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Collapse>
    </Paper>
  );
};