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
  useTheme,
  Tooltip,
  Fade
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
  Dashboard,
  Notifications
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
    { 
      title: 'Fee Status', 
      icon: <AttachMoney />, 
      color: '#8BC34A', 
      hoverColor: '#7CB342',
      path: '/fees',
      description: 'View and pay fees'
    },
    { 
      title: 'Thesis Registration', 
      icon: <Book />, 
      color: '#8BC34A', 
      hoverColor: '#7CB342',
      path: '/thesis',
      description: 'Register thesis topics'
    },
    { 
      title: 'Exams & Grades', 
      icon: <School />, 
      color: '#D4AF37', 
      hoverColor: '#C8A732',
      path: '/exams',
      description: 'View exam schedule'
    },
    { 
      title: 'Leave Application', 
      icon: <Assignment />, 
      color: '#D08B93', 
      hoverColor: '#C47A82',
      path: '/leaves',
      description: 'Apply for leave'
    },
    { 
      title: 'Report Grievance', 
      icon: <Report />, 
      color: '#D08B93', 
      hoverColor: '#C47A82',
      path: '/grievances',
      description: 'Submit complaints'
    }
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
      bgcolor: '#f7f9fc' // Slightly softer background color
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        bgcolor: '#1A237E',
        color: 'white',
        p: { xs: 1.5, md: 2 },
        boxShadow: '0 3px 8px rgba(0,0,0,0.3)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          overflow: 'hidden'
        }}>
          <Box
            component="img"
            src="/logo.png"
            alt="Hindurao Hospital Logo"
            sx={{
              height: { xs: '36px', md: '48px' },
              width: 'auto',
              mr: 2,
              display: 'block',
              transition: 'transform 0.3s ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          />
          <Box sx={{ overflow: 'hidden' }}>
            <Typography 
              variant={isMobile ? "subtitle1" : "h6"} 
              sx={{ 
                fontWeight: 700,
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                letterSpacing: '0.5px'
              }}
            >
              HINDURAO HOSPITAL MEDICAL COLLEGE
            </Typography>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                display: { xs: 'none', sm: 'block' },
                whiteSpace: 'nowrap',
                opacity: 0.9,
                fontWeight: 400
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
          <Tooltip 
            title="Notifications" 
            arrow 
            enterDelay={700}
            sx={{ display: { xs: 'none', sm: 'inline-flex' }, mr: 2 }}
          >
            <IconButton color="inherit" size="small">
              <Notifications />
            </IconButton>
          </Tooltip>
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
              '&:hover': { 
                bgcolor: '#d32f2f',
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
              },
              transition: 'all 0.3s ease',
              minWidth: isMobile ? '40px' : 'auto',
              boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
            }}
          >
            {isMobile ? <ExitToApp /> : "Sign out"}
          </Button>
        </Box>
      </Box>

      {/* Dashboard Header */}
      <Box 
        sx={{ 
          bgcolor: '#e8eaf6', // Slightly better contrast with main content
          py: 2.5, 
          px: { xs: 2, md: 3 },
          borderBottom: '1px solid #c5cae9',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          position: 'relative',
          zIndex: 1
        }}
      >
        <Container maxWidth="xl">
          <Typography 
            variant={isMobile ? "h6" : "h5"} 
            sx={{ 
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              fontWeight: 600,
              color: '#1A237E'
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
              elevation={3} 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                }
              }}
            >
              <Box sx={{ 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                p: 3,
                background: 'linear-gradient(to bottom, #e8eaf6, #f5f5f5)',
                position: 'relative'
              }}>
                <Box 
                  component="img"
                  src="/logo.png"
                  alt="Hindurao Hospital Logo"
                  sx={{
                    position: 'absolute',
                    top: 10,
                    right: 10,
                    height: '30px',
                    width: 'auto',
                    opacity: 0.7
                  }}
                />
                <Avatar 
                  sx={{ 
                    width: { xs: 80, sm: 100, md: 120 }, 
                    height: { xs: 80, sm: 100, md: 120 }, 
                    mb: 2,
                    border: '4px solid white',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    bgcolor: '#1A237E'
                  }} 
                >
                  <Person sx={{ fontSize: { xs: 50, sm: 60, md: 80 } }} />
                </Avatar>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'bold', 
                    textAlign: 'center',
                    color: '#1A237E'
                  }}
                >
                  {studentData.name}
                </Typography>
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 1,
                    bgcolor: '#f5f5f5',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontFamily: 'monospace'
                  }}
                >
                  {studentData.id}
                </Typography>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    fontWeight: 'medium',
                    display: 'inline-block',
                    bgcolor: '#1A237E',
                    color: 'white',
                    px: 2,
                    py: 0.5,
                    borderRadius: 1
                  }}
                >
                  {studentData.course}
                </Typography>
              </Box>
              
              <Divider />
              
              <Box sx={{ p: 2.5, flexGrow: 1 }}>
                <TableContainer component={Box}>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            border: 'none', 
                            py: 1.2, 
                            pl: 0,
                            color: '#444',
                            fontWeight: 500
                          }}
                        >
                          Student ID:
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            border: 'none', 
                            py: 1.2, 
                            pr: 0,
                            fontWeight: 'bold',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem'
                          }}
                        >
                          {studentData.studentId}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            border: 'none', 
                            py: 1.2, 
                            pl: 0,
                            color: '#444',
                            fontWeight: 500
                          }}
                        >
                          CGPA:
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            border: 'none', 
                            py: 1.2, 
                            pr: 0,
                            fontWeight: 'bold',
                            color: '#1976d2'
                          }}
                        >
                          {studentData.cgpa}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            border: 'none', 
                            py: 1.2, 
                            pl: 0,
                            color: '#444',
                            fontWeight: 500
                          }}
                        >
                          Credits:
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            border: 'none', 
                            py: 1.2, 
                            pr: 0,
                            fontWeight: 'bold'
                          }}
                        >
                          {studentData.credits}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            border: 'none', 
                            py: 1.2, 
                            pl: 0,
                            color: '#444',
                            fontWeight: 500
                          }}
                        >
                          Fee status:
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            border: 'none', 
                            py: 1.2, 
                            pr: 0, 
                            color: studentData.feeStatus === 'VALID' ? '#2e7d32' : '#d32f2f',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            '&::before': {
                              content: '""',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              bgcolor: studentData.feeStatus === 'VALID' ? '#2e7d32' : '#d32f2f',
                              display: 'inline-block',
                              mr: 1
                            }
                          }}
                        >
                          {studentData.feeStatus}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell 
                          component="th" 
                          scope="row" 
                          sx={{ 
                            border: 'none', 
                            py: 1.2, 
                            pl: 0,
                            color: '#444',
                            fontWeight: 500
                          }}
                        >
                          Hostel status:
                        </TableCell>
                        <TableCell 
                          align="right" 
                          sx={{ 
                            border: 'none', 
                            py: 1.2, 
                            pr: 0, 
                            color: studentData.hostelStatus === 'VALID' ? '#2e7d32' : '#d32f2f',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            '&::before': {
                              content: '""',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              bgcolor: studentData.hostelStatus === 'VALID' ? '#2e7d32' : '#d32f2f',
                              display: 'inline-block',
                              mr: 1
                            }
                          }}
                        >
                          {studentData.hostelStatus}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Paper>
          </Grid>

          {/* Middle column - Dashboard menu and upcoming events */}
          <Grid item xs={12} md={6}>
            <Grid container spacing={2}>
              {/* Dashboard menu items */}
              {menuItems.map((item, index) => (
                <Grid item xs={6} sm={4} key={index}>
                  <Tooltip
                    title={item.description}
                    placement="top"
                    arrow
                    enterDelay={700}
                  >
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
                        position: 'relative',
                        overflow: 'hidden',
                        '&:hover': {
                          transform: 'translateY(-5px)',
                          boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                          background: `linear-gradient(45deg, ${item.hoverColor} 0%, ${item.color}99 100%)`
                        },
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: 'linear-gradient(rgba(255,255,255,0.1), rgba(255,255,255,0))',
                          opacity: 0,
                          transition: 'opacity 0.3s ease',
                        },
                        '&:hover::after': {
                          opacity: 1
                        }
                      }}
                    >
                      <Box 
                        sx={{ 
                          fontSize: { xs: '1.5rem', sm: '2rem' }, 
                          mb: 1,
                          transition: 'transform 0.3s ease',
                          '.MuiSvgIcon-root': {
                            filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.2))'
                          }
                        }}
                      >
                        {item.icon}
                      </Box>
                      <Typography 
                        variant="body1" 
                        align="center" 
                        sx={{ 
                          fontWeight: 'medium',
                          fontSize: { xs: '0.85rem', sm: '1rem' },
                          textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                        }}
                      >
                        {item.title}
                      </Typography>
                    </Paper>
                  </Tooltip>
                </Grid>
              ))}

              {/* Upcoming Events */}
              <Grid item xs={12}>
                <Paper 
                  elevation={3} 
                  sx={{ 
                    p: { xs: 2, sm: 3 }, 
                    mt: 1,
                    borderRadius: 2,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    },
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                >
                  <Box 
                    component="img"
                    src="/logo.png"
                    alt="Hindurao Hospital Logo"
                    sx={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      height: '25px',
                      width: 'auto',
                      opacity: 0.2
                    }}
                  />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      mb: 2, 
                      fontWeight: 'bold', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 1,
                      color: '#1A237E',
                      borderBottom: '2px solid #e8eaf6',
                      pb: 1
                    }}
                  >
                    <Event color="primary" /> Upcoming Events
                  </Typography>
                  <List sx={{ width: '100%', bgcolor: 'background.paper', p: 0 }}>
                    {upcomingEvents.map((event, index) => (
                      <React.Fragment key={event.id}>
                        <ListItem 
                          alignItems="flex-start"
                          secondaryAction={
                            <Tooltip title="View Details" arrow>
                              <IconButton 
                                edge="end" 
                                aria-label="view event" 
                                color="primary"
                                sx={{ 
                                  transition: 'all 0.2s ease',
                                  '&:hover': {
                                    transform: 'scale(1.1)',
                                    bgcolor: '#e3f2fd'
                                  }
                                }}
                              >
                                <Event />
                              </IconButton>
                            </Tooltip>
                          }
                          sx={{ 
                            px: 0,
                            transition: 'background-color 0.2s',
                            '&:hover': {
                              bgcolor: 'rgba(0, 0, 0, 0.02)'
                            },
                            borderRadius: 1
                          }}
                        >
                          <ListItemIcon sx={{ 
                            minWidth: '40px',
                            color: '#7986cb',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: '#e8eaf6',
                            borderRadius: '50%',
                            width: 36,
                            height: 36
                          }}>
                            <CalendarMonth fontSize="small" />
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography fontWeight="medium" sx={{ color: '#424242' }}>
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
                                  sx={{ 
                                    display: 'inline-block',
                                    bgcolor: '#e8eaf6',
                                    px: 1,
                                    py: 0.25,
                                    borderRadius: 1,
                                    fontSize: '0.75rem',
                                    mt: 0.5
                                  }}
                                >
                                  {event.date}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                  {event.description}
                                </Typography>
                              </React.Fragment>
                            }
                            sx={{ ml: 1 }}
                          />
                        </ListItem>
                        {index < upcomingEvents.length - 1 && <Divider component="li" sx={{ my: 0.5 }} />}
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
              elevation={3} 
              sx={{ 
                height: '100%',
                borderRadius: 2,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                },
                position: 'relative'
              }}
            >
              <Box 
                component="img"
                src="/logo.png"
                alt="Hindurao Hospital Logo"
                sx={{
                  position: 'absolute',
                  top: 10,
                  right: 10,
                  height: '25px',
                  width: 'auto',
                  opacity: 0.3,
                  zIndex: 1
                }}
              />
              <CardHeader
                avatar={<CalendarMonth color="primary" />}
                title={`${monthNames[currentMonthDisplay]} ${currentYearDisplay}`}
                titleTypographyProps={{ 
                  variant: 'h6',
                  fontWeight: 'bold',
                  color: '#1A237E'
                }}
                sx={{ 
                  bgcolor: '#e8eaf6',
                  py: 1.5,
                  borderBottom: '1px solid rgba(0,0,0,0.08)'
                }}
              />
              <CardContent sx={{ p: 2 }}>
                <Grid container spacing={0.5}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <Grid item xs={12/7} key={day}>
                      <Typography 
                        variant="caption" 
                        align="center" 
                        sx={{ 
                          fontWeight: 'bold', 
                          display: 'block',
                          color: day === 'Sun' ? '#d32f2f' : '#546e7a'
                        }}
                      >
                        {day}
                      </Typography>
                    </Grid>
                  ))}
                  
                  {calendarGrid.map((week, weekIndex) => (
                    <React.Fragment key={weekIndex}>
                      {week.map((day, dayIndex) => {
                        const isToday = day === currentDate.getDate() && 
                                       currentMonthDisplay === currentDate.getMonth() && 
                                       currentYearDisplay === currentDate.getFullYear();
                        const isWeekend = dayIndex === 0 || dayIndex === 6;
                        return (
                          <Grid item xs={12/7} key={`${weekIndex}-${dayIndex}`}>
                            <Box 
                              sx={{ 
                                height: { xs: '32px', sm: '36px' }, 
                                width: '100%',
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                border: isToday ? '2px solid #1A237E' : '1px solid #f0f0f0',
                                borderRadius: '4px',
                                m: '2px',
                                position: 'relative',
                                fontWeight: isToday ? 'bold' : 'normal',
                                bgcolor: isToday ? '#e3f2fd' : 'transparent',
                                color: isWeekend && day !== null ? '#d32f2f' : isToday ? '#1A237E' : 'inherit',
                                transition: 'all 0.2s ease',
                                cursor: day !== null ? 'pointer' : 'default',
                                '&:hover': day !== null ? {
                                  bgcolor: isToday ? '#bbdefb' : '#f5f5f5',
                                  transform: 'scale(1.05)',
                                  zIndex: 1
                                } : {},
                                overflow: 'hidden'
                              }}
                            >
                              {day !== null && (
                                <Typography variant="body2">
                                  {day}
                                </Typography>
                              )}
                              {isToday && (
                                <Box 
                                  sx={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    height: '3px',
                                    width: '60%',
                                    bgcolor: '#1A237E',
                                    borderRadius: '2px'
                                  }}
                                />
                              )}
                            </Box>
                          </Grid>
                        );
                      })}
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
