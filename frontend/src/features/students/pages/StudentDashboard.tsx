import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Grid, 
  Avatar, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Container,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { 
  CalendarMonth, 
  Event,
  AttachMoney,
  Assignment,
  Book,
  School,
  Report,
  ExitToApp,
  Person,
  Dashboard
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

// Mock data for the student profile
const studentData = {
  name: 'SARTHAK GUPTA',
  id: 'XXXXXXXXXXX',
  course: 'MBBS - 3rd Year',
  studentId: 'xx/xx/xx',
  cgpa: 'xx.xx',
  credits: 'xxx',
  feeStatus: 'VALID',
  hostelStatus: 'INVALID'
};

// Mock data for upcoming events
const upcomingEvents = [
  { id: 1, title: 'XXXXXXX XXX XXXXX', date: 'xx/xx/xx', description: 'lorem ipsum lalalalalala' },
  { id: 2, title: 'XXXXXXX XXX XXXXX', date: 'xx/xx/xx', description: 'lorem ipsum lalalalalala' },
  { id: 3, title: 'XXXXXXX XXX XXXXX', date: 'xx/xx/xx', description: 'lorem ipsum lalalalalala' },
  { id: 4, title: 'XXXXXXX XXX XXXXX', date: 'xx/xx/xx', description: 'lorem ipsum lalalalalala' }
];

// Calendar data
const currentDate = new Date();
const currentMonth = currentDate.getMonth();
const currentYear = currentDate.getFullYear();

const getDaysInMonth = (month: number, year: number) => {
  return new Date(year, month + 1, 0).getDate();
};

const getFirstDayOfMonth = (month: number, year: number) => {
  return new Date(year, month, 1).getDay();
};

const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('md', 'lg'));
  
  const [currentMonthDisplay] = useState(currentMonth);
  const [currentYearDisplay] = useState(currentYear);

  const daysInMonth = getDaysInMonth(currentMonthDisplay, currentYearDisplay);
  const firstDayOfMonth = getFirstDayOfMonth(currentMonthDisplay, currentYearDisplay);
  
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Generate calendar days
  const calendarDays = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  // Create calendar grid with 7 columns (Sun-Sat)
  const calendarGrid = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    calendarGrid.push(calendarDays.slice(i, i + 7));
  }

  // Dashboard menu items
  const menuItems = [
    { title: 'Fee Status', icon: <AttachMoney />, color: '#8BC34A', path: '/fees' },
    { title: 'Thesis Registration', icon: <Book />, color: '#8BC34A', path: '/thesis' },
    { title: 'Exams & Grades', icon: <School />, color: '#D4AF37', path: '/exams' },
    { title: 'Leave Application', icon: <Assignment />, color: '#D08B93', path: '/leaves' },
    { title: 'Report Grievance', icon: <Report />, color: '#D08B93', path: '/grievances' }
  ];

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  const handleSignOut = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <Box sx={{ 
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      bgcolor: '#f5f5f5'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: '#1A237E',
        color: 'white',
        p: { xs: 1, md: 1.5 },
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          overflow: 'hidden'
        }}>
          <img 
            src="/logo.png" 
            alt="Hindurao Hospital Logo" 
            style={{ 
              height: '40px', 
              marginRight: '16px', 
              display: isMobile ? 'none' : 'block' 
            }} 
          />
          <Box sx={{ overflow: 'hidden' }}>
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              sx={{ 
                fontWeight: 'bold',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden'
              }}
            >
              HINDURAO HOSPITAL MEDICAL COLLEGE
            </Typography>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                whiteSpace: 'nowrap'
              }}
            >
              Enterprise Resource Planning System
            </Typography>
          </Box>
        </Box>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          minWidth: isMobile ? 'auto' : '300px',
          justifyContent: 'flex-end'
        }}>
          <Typography 
            variant="body2" 
            sx={{ 
              mr: 2, 
              textAlign: 'right',
              display: { xs: 'none', sm: 'block' }
            }}
          >
            Logged in as: <strong>STUDENT - SARTHAK S</strong><br />
            <span style={{ fontSize: '0.8rem' }}>last login: 23/03/2025 18:57:47</span>
          </Typography>
          <Button 
            variant="contained" 
            color="error" 
            size="small"
            startIcon={!isMobile && <ExitToApp />}
            onClick={handleSignOut}
            sx={{ 
              bgcolor: '#f44336', 
              '&:hover': { bgcolor: '#d32f2f' },
              minWidth: isMobile ? '40px' : 'auto'
            }}
          >
            {isMobile ? <ExitToApp /> : "Sign out"}
          </Button>
        </Box>
      </Box>

      {/* Dashboard Header */}
      <Box 
        sx={{ 
          bgcolor: '#f0f4f8', 
          py: 2, 
          px: { xs: 2, md: 3 },
          borderBottom: '1px solid #e0e0e0'
        }}
      >
        <Container maxWidth="xl">
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Dashboard fontSize="inherit" /> Student Dashboard
          </Typography>
        </Container>
      </Box>

      {/* Main Content */}
      <Container maxWidth="xl" sx={{ flexGrow: 1, py: 3 }}>
        <Grid container spacing={3}>
          {/* Left column - Student profile */}
          <Grid item xs={12} md={3}>
            <Paper 
              elevation={2} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: 3
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                p: 3,
                bgcolor: '#f9f9f9'
              }}>
                <Avatar 
                  sx={{ 
                    width: { xs: 80, sm: 100, md: 120 }, 
                    height: { xs: 80, sm: 100, md: 120 }, 
                    mb: 2,
                    border: '4px solid white',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
                  }} 
                >
                  <Person sx={{ fontSize: { xs: 50, sm: 60, md: 80 } }} />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold', textAlign: 'center' }}>
                  {studentData.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  {studentData.id}
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                  {studentData.course}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box sx={{ p: 2, flexGrow: 1 }}>
                <TableContainer component={Box}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ border: 'none', py: 1, pl: 0 }}>
                          Student ID:
                        </TableCell>
                        <TableCell align="right" sx={{ border: 'none', py: 1, pr: 0 }}>
                          {studentData.studentId}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ border: 'none', py: 1, pl: 0 }}>
                          CGPA:
                        </TableCell>
                        <TableCell align="right" sx={{ border: 'none', py: 1, pr: 0 }}>
                          {studentData.cgpa}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ border: 'none', py: 1, pl: 0 }}>
                          Credits:
                        </TableCell>
                        <TableCell align="right" sx={{ border: 'none', py: 1, pr: 0 }}>
                          {studentData.credits}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ border: 'none', py: 1, pl: 0 }}>
                          Fee status:
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            border: 'none', 
                            py: 1, 
                            pr: 0, 
                            color: studentData.feeStatus === 'VALID' ? 'green' : 'red',
                            fontWeight: 'bold'
                          }}
                        >
                          {studentData.feeStatus}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell component="th" scope="row" sx={{ border: 'none', py: 1, pl: 0 }}>
                          Hostel status:
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            border: 'none', 
                            py: 1, 
                            pr: 0, 
                            color: studentData.hostelStatus === 'VALID' ? 'green' : 'red',
                            fontWeight: 'bold'
                          }}
                        >
                          {studentData.hostelStatus}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>

              <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center', p: 2 }}>
                <img 
                  src="/logo.png" 
                  alt="College Emblem" 
                  style={{ width: '60px', opacity: 0.7 }} 
                />
              </Box>
            </Paper>
          </Grid>

          {/* Middle column - Dashboard menu and upcoming events */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              {/* Dashboard menu items */}
              {menuItems.map((item, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Paper 
                    elevation={3}
                    onClick={() => handleMenuClick(item.path)}
                    sx={{ 
                      p: 2, 
                      height: { xs: '100px', sm: '120px' }, 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(45deg, ${item.color} 0%, ${item.color}99 100%)`,
                      color: 'white',
                      cursor: 'pointer',
                      borderRadius: 2,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.2)'
                      }
                    }}
                  >
                    <Box sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, mb: 1 }}>
                      {item.icon}
                    </Box>
                    <Typography 
                      variant="body1" 
                      align="center" 
                      sx={{ 
                        fontWeight: 'medium',
                        fontSize: { xs: '0.85rem', sm: '1rem' }
                      }}
                    >
                      {item.title}
                    </Typography>
                  </Paper>
                </Grid>
              ))}

              {/* Upcoming Events */}
              <Grid item xs={12}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    mt: 1,
                    borderRadius: 2,
                    transition: 'box-shadow 0.3s ease-in-out',
                    '&:hover': {
                      boxShadow: 3
                    }
                  }}
                >
                  <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Event color="primary" /> Upcoming Events
                  </Typography>
                  <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                    {upcomingEvents.map((event, index) => (
                      <React.Fragment key={event.id}>
                        <ListItem 
                          alignItems="flex-start"
                          secondaryAction={
                            <IconButton edge="end" aria-label="view event" color="primary">
                              <Event />
                            </IconButton>
                          }
                          sx={{ px: 0 }}
                        >
                          <ListItemIcon sx={{ minWidth: '40px' }}>
                            <CalendarMonth color="secondary" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography fontWeight="medium">
                                {event.title}
                              </Typography>
                            }
                            secondary={
                              <React.Fragment>
                                <Typography
                                  component="span"
                                  variant="body2"
                                  color="primary"
                                  fontWeight="bold"
                                >
                                  Date: {event.date}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {event.description}
                                </Typography>
                              </React.Fragment>
                            }
                          />
                        </ListItem>
                        {index < upcomingEvents.length - 1 && <Divider component="li" />}
                      </React.Fragment>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Grid>

          {/* Right column - Calendar */}
          <Grid item xs={12} md={3}>
            <Card 
              elevation={2} 
              sx={{ 
                height: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'box-shadow 0.3s ease-in-out',
                '&:hover': {
                  boxShadow: 3
                }
              }}
            >
              <CardHeader
                title={`${monthNames[currentMonthDisplay]} ${currentYearDisplay}`}
                titleTypographyProps={{ 
                  align: 'center', 
                  variant: 'h6',
                  fontWeight: 'bold'
                }}
                sx={{ 
                  bgcolor: '#1A237E',
                  color: 'white',
                  py: 1.5 
                }}
              />
              <CardContent>
                <Grid container spacing={0}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Grid item xs={12/7} key={day}>
                      <Typography 
                        variant="subtitle2" 
                        align="center" 
                        sx={{ fontWeight: 'bold', mb: 1 }}
                      >
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                  
                  {calendarGrid.map((week, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                      {week.map((day, dayIndex) => (
                        <Grid item xs={12/7} key={`${weekIndex}-${dayIndex}`}>
                          <Box 
                            sx={{ 
                              height: '36px', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              border: '1px solid #f0f0f0',
                              borderRadius: '4px',
                              m: 0.2,
                              bgcolor: day === currentDate.getDate() ? '#e3f2fd' : 'transparent',
                              fontWeight: day === currentDate.getDate() ? 'bold' : 'normal',
                              color: day === currentDate.getDate() ? '#1A237E' : 'inherit',
                              '&:hover': {
                                bgcolor: '#f5f5f5'
                              }
                            }}
                          >
                            {day !== null ? day : ''}
                          </Box>
                        </Grid>
                      ))}
                    </React.Fragment>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default StudentDashboard;
