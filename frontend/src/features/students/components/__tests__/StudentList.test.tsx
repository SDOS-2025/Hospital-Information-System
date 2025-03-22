import { render, screen, waitFor } from '@testing-library/react';
import { StudentList } from '../StudentList';
import { studentService } from '../../../../services/api/student.service';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import userEvent from '@testing-library/user-event';

// Mock the student service
jest.mock('../../../../services/api/student.service');

const mockDate = new Date('2025-01-01');

const mockStudents = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    enrollmentNumber: 'EN001',
    department: 'Computer Science',
    semester: 3,
    program: 'B.Tech',
    createdAt: mockDate,
    updatedAt: mockDate
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    enrollmentNumber: 'EN002',
    department: 'Electronics',
    semester: 4,
    program: 'B.Tech',
    createdAt: mockDate,
    updatedAt: mockDate
  }
];

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('StudentList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient.clear();
  });

  it('renders students table with data', async () => {
    (studentService.getAll as jest.Mock).mockResolvedValueOnce(mockStudents);

    renderWithQueryClient(<StudentList />);

    // Check loading state
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    // Check if students are displayed
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('shows error notification when loading fails', async () => {
    (studentService.getAll as jest.Mock).mockRejectedValueOnce(new Error('Failed to load'));

    renderWithQueryClient(<StudentList />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load students. Please try again.')).toBeInTheDocument();
    });
  });

  it('opens create dialog when Add Student button is clicked', async () => {
    (studentService.getAll as jest.Mock).mockResolvedValueOnce(mockStudents);

    renderWithQueryClient(<StudentList />);

    const addButton = screen.getByRole('button', { name: /add new student/i });
    await userEvent.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Add Student')).toBeInTheDocument();
  });

  it('creates a new student successfully', async () => {
    const newStudent = {
      name: 'New Student',
      email: 'new@example.com',
      enrollmentNumber: 'EN003',
      department: 'Physics',
      semester: 1,
      program: 'B.Sc'
    };

    (studentService.getAll as jest.Mock).mockResolvedValueOnce(mockStudents);
    (studentService.create as jest.Mock).mockResolvedValueOnce({ id: 3, ...newStudent });

    renderWithQueryClient(<StudentList />);

    // Open create dialog
    const addButton = screen.getByRole('button', { name: /add new student/i });
    await userEvent.click(addButton);

    // Fill form
    await userEvent.type(screen.getByLabelText(/student name/i), newStudent.name);
    await userEvent.type(screen.getByLabelText(/student email/i), newStudent.email);
    await userEvent.type(screen.getByLabelText(/enrollment number/i), newStudent.enrollmentNumber);
    await userEvent.type(screen.getByLabelText(/department/i), newStudent.department);
    await userEvent.type(screen.getByLabelText(/semester/i), newStudent.semester.toString());
    await userEvent.type(screen.getByLabelText(/program/i), newStudent.program);

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save student information/i });
    await userEvent.click(saveButton);

    // Check if success notification is shown
    await waitFor(() => {
      expect(screen.getByText('Student created successfully')).toBeInTheDocument();
    });

    // Check if service was called with correct data
    expect(studentService.create).toHaveBeenCalledWith(newStudent);
  });

  it('deletes a student after confirmation', async () => {
    (studentService.getAll as jest.Mock).mockResolvedValueOnce(mockStudents);
    (studentService.delete as jest.Mock).mockResolvedValueOnce(undefined);

    // Mock window.confirm
    const confirmSpy = jest.spyOn(window, 'confirm');
    confirmSpy.mockImplementation(() => true);

    renderWithQueryClient(<StudentList />);

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Click delete button for first student
    const deleteButton = screen.getByLabelText('Delete John Doe');
    await userEvent.click(deleteButton);

    // Check if confirmation was shown
    expect(confirmSpy).toHaveBeenCalled();

    // Check if delete service was called
    expect(studentService.delete).toHaveBeenCalledWith(1);

    // Check if success notification is shown
    await waitFor(() => {
      expect(screen.getByText('Student deleted successfully')).toBeInTheDocument();
    });

    confirmSpy.mockRestore();
  });

  it('maintains keyboard navigation', async () => {
    (studentService.getAll as jest.Mock).mockResolvedValueOnce(mockStudents);

    renderWithQueryClient(<StudentList />);

    // Wait for table to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    // Test keyboard navigation
    const addButton = screen.getByRole('button', { name: /add new student/i });
    addButton.focus();
    expect(document.activeElement).toBe(addButton);

    // Tab to first action button
    await userEvent.tab();
    const firstActionButton = screen.getByLabelText('Edit John Doe');
    expect(document.activeElement).toBe(firstActionButton);
  });
});