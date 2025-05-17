import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper, 
  Link, 
  CircularProgress, 
  Alert, 
  Divider 
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { ErrorOutline } from '@mui/icons-material';
import { feeService } from '../../../services/api/fee.service';
import { FeeStatusItem } from '../components/FeeStatusItem';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`fee-tabpanel-${index}`}
      aria-labelledby={`fee-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `fee-tab-${index}`,
    'aria-controls': `fee-tabpanel-${index}`,
  };
};

export const FeeStatus = () => {
  const [tabValue, setTabValue] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ['fees'],
    queryFn: () => feeService.getAllFees(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" component="h1">Fee Status</Typography>
        <Link href="#" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
          <ErrorOutline sx={{ mr: 0.5 }} fontSize="small" />
          Report an issue
        </Link>
      </Box>
      
      <Paper sx={{ width: '100%', mt: 2, borderRadius: 1 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
              }
            }}
          >
            <Tab label="Tuition Fee" {...a11yProps(0)} />
            <Tab label="Hostel Fee" {...a11yProps(1)} />
          </Tabs>
        </Box>

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ p: 2 }}>
            <Alert severity="error">
              Failed to load fee data. Please try again later.
            </Alert>
          </Box>
        )}

        {data && (
          <>
            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ ml: 1 }}>
                  HINDURAO HOSPITAL MEDICAL COLLEGE
                </Typography>
                <Divider sx={{ mb: 3 }} />
                {data.tuitionFees.map((feeItem) => (
                  <FeeStatusItem key={feeItem.id} feeItem={feeItem} />
                ))}
              </Box>
            </TabPanel>
            <TabPanel value={tabValue} index={1}>
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ ml: 1 }}>
                  HINDURAO HOSPITAL MEDICAL COLLEGE
                </Typography>
                <Divider sx={{ mb: 3 }} />
                {data.hostelFees.map((feeItem) => (
                  <FeeStatusItem key={feeItem.id} feeItem={feeItem} />
                ))}
              </Box>
            </TabPanel>
          </>
        )}
      </Paper>
    </Box>
  );
};