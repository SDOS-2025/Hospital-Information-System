import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { studentService } from '../../../services/api/student.service';
import { Student } from '../../../types/api.types';
import { useState, useCallback, useMemo } from 'react';
import { StudentDialog } from './StudentDialog';
import { Notification } from '../../../components/common/Notification';
import { GridActions } from './GridActions';

type CreateStudentDto = Omit<Student, 'id' | 'createdAt' | 'updatedAt'>;
type UpdateStudentDto = Partial<CreateStudentDto>;

interface NotificationState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

export const StudentList = () => {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [paginationModel, setPaginationModel] = useState({
    pageSize: 10,
    page: 0
  });
  
  const queryClient = useQueryClient();
  
  const { data = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['students'] as const,
    queryFn: () => studentService.getAll(),
    retry: 1,
    staleTime: 30000,
    gcTime: 1000 * 60 * 5 // 5 minutes
  });

  const students = data as Student[];

  const createMutation = useMutation({
    mutationFn: (newStudent: CreateStudentDto) => studentService.create(newStudent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      handleCloseDialog();
      setNotification({
        open: true,
        message: 'Student created successfully',
        severity: 'success'
      });
    },
    onError: () => {
      setNotification({
        open: true,
        message: 'Failed to create student. Please try again.',
        severity: 'error'
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateStudentDto }) => 
      studentService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      handleCloseDialog();
      setNotification({
        open: true,
        message: 'Student updated successfully',
        severity: 'success'
      });
    },
    onError: () => {
      setNotification({
        open: true,
        message: 'Failed to update student. Please try again.',
        severity: 'error'
      });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => studentService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setNotification({
        open: true,
        message: 'Student deleted successfully',
        severity: 'success'
      });
    },
    onError: () => {
      setNotification({
        open: true,
        message: 'Failed to delete student. Please try again.',
        severity: 'error'
      });
    }
  });

  const handleOpenDialog = useCallback((student: Student | null = null) => {
    setSelectedStudent(student);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setSelectedStudent(null);
    setDialogOpen(false);
  }, []);

  const handleCloseNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, open: false }));
  }, []);

  const handleSave = useCallback((studentData: CreateStudentDto) => {
    if (selectedStudent) {
      updateMutation.mutate({ 
        id: selectedStudent.id, 
        data: studentData 
      });
    } else {
      createMutation.mutate(studentData);
    }
  }, [selectedStudent, updateMutation, createMutation]);

  const handleDelete = useCallback((id: number) => {
    deleteMutation.mutate(id);
  }, [deleteMutation]);

  const isLoading = isLoadingStudents || createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;
  const isMutating = createMutation.isPending || updateMutation.isPending;

  const columns = useMemo<GridColDef[]>(() => [
    { field: 'enrollmentNumber', headerName: 'Enrollment No.', width: 150 },
    { field: 'name', headerName: 'Name', width: 200 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'department', headerName: 'Department', width: 150 },
    { field: 'semester', headerName: 'Semester', width: 100 },
    { field: 'program', headerName: 'Program', width: 150 },
    {
      field: 'actions',
      type: 'actions',
      headerName: 'Actions',
      width: 100,
      getActions: (params) => (
        <GridActions
          student={params.row as Student}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          disabled={isLoading}
        />
      ),
    },
  ], [handleOpenDialog, handleDelete, isLoading]);

  return (
    <Box 
      sx={{ position: 'relative' }}
      role="region"
      aria-label="Students management"
    >
      <Box 
        sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}
        role="toolbar"
        aria-label="Student actions"
      >
        <Typography variant="h4" component="h1">Students</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
          disabled={isLoading}
          aria-label="Add new student"
        >
          Add Student
        </Button>
      </Box>
      
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
          aria-label="Loading students"
        >
          <CircularProgress aria-hidden="true" />
          <span className="sr-only">Loading students...</span>
        </Box>
      )}

      <DataGrid<Student>
        rows={students}
        columns={columns}
        loading={isLoadingStudents}
        autoHeight
        paginationModel={paginationModel}
        onPaginationModelChange={setPaginationModel}
        pageSizeOptions={[10, 25, 50]}
        checkboxSelection
        disableRowSelectionOnClick
        getRowId={(row) => row.id}
        keepNonExistentRowsSelected
        aria-label="Students table"
        slots={{
          baseButton: Button,
        }}
        slotProps={{
          baseButton: {
            'aria-label': 'Toggle selection'
          }
        }}
        localeText={{
          noRowsLabel: 'No students found',
        }}
      />
      
      <StudentDialog
        open={dialogOpen}
        onClose={handleCloseDialog}
        onSave={handleSave}
        student={selectedStudent}
        isLoading={isMutating}
      />

      <Notification
        open={notification.open}
        message={notification.message}
        severity={notification.severity}
        onClose={handleCloseNotification}
      />
    </Box>
  );
};