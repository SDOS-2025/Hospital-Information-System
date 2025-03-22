import { render, screen } from '@testing-library/react';
import { StudentDialog } from '../StudentDialog';
import userEvent from '@testing-library/user-event';

const mockStudent = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  enrollmentNumber: 'EN001',
  department: 'Computer Science',
  semester: 3,
  program: 'B.Tech',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01')
};

const mockOnSave = jest.fn();
const mockOnClose = jest.fn();

describe('StudentDialog', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders create form when no student is provided', () => {
    render(
      <StudentDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        student={null}
      />
    );

    expect(screen.getByText('Add Student')).toBeInTheDocument();
    expect(screen.getByLabelText('Student name')).toHaveValue('');
    expect(screen.getByLabelText('Student email')).toHaveValue('');
  });

  it('renders edit form with student data', () => {
    render(
      <StudentDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        student={mockStudent}
      />
    );

    expect(screen.getByText('Edit Student')).toBeInTheDocument();
    expect(screen.getByLabelText('Student name')).toHaveValue(mockStudent.name);
    expect(screen.getByLabelText('Student email')).toHaveValue(mockStudent.email);
  });

  it('validates required fields', async () => {
    render(
      <StudentDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        student={null}
      />
    );

    const saveButton = screen.getByRole('button', { name: /save student information/i });
    await userEvent.click(saveButton);

    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(await screen.findByText('Email is required')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    render(
      <StudentDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        student={null}
      />
    );

    const emailInput = screen.getByLabelText('Student email');
    await userEvent.type(emailInput, 'invalid-email');

    const saveButton = screen.getByRole('button', { name: /save student information/i });
    await userEvent.click(saveButton);

    expect(await screen.findByText('Invalid email address')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('validates semester range', async () => {
    render(
      <StudentDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        student={null}
      />
    );

    const semesterInput = screen.getByLabelText('Student semester');
    await userEvent.clear(semesterInput);
    await userEvent.type(semesterInput, '9');

    const saveButton = screen.getByRole('button', { name: /save student information/i });
    await userEvent.click(saveButton);

    expect(await screen.findByText('Semester must be between 1 and 8')).toBeInTheDocument();
    expect(mockOnSave).not.toHaveBeenCalled();
  });

  it('submits form with valid data', async () => {
    render(
      <StudentDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        student={null}
      />
    );

    await userEvent.type(screen.getByLabelText('Student name'), 'New Student');
    await userEvent.type(screen.getByLabelText('Student email'), 'new@example.com');
    await userEvent.type(screen.getByLabelText('Student enrollment number'), 'EN003');
    await userEvent.type(screen.getByLabelText('Student department'), 'Physics');
    await userEvent.type(screen.getByLabelText('Student semester'), '1');
    await userEvent.type(screen.getByLabelText('Student program'), 'B.Sc');

    const saveButton = screen.getByRole('button', { name: /save student information/i });
    await userEvent.click(saveButton);

    expect(mockOnSave).toHaveBeenCalledWith({
      name: 'New Student',
      email: 'new@example.com',
      enrollmentNumber: 'EN003',
      department: 'Physics',
      semester: 1,
      program: 'B.Sc'
    });
  });

  it('closes dialog when cancel is clicked', async () => {
    render(
      <StudentDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        student={null}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await userEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('shows loading state and disables inputs', () => {
    render(
      <StudentDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        student={null}
        isLoading={true}
      />
    );

    expect(screen.getByLabelText('Student name')).toBeDisabled();
    expect(screen.getByLabelText('Student email')).toBeDisabled();
    expect(screen.getByRole('button', { name: /saving student information/i })).toBeDisabled();
  });

  it('maintains focus management for keyboard navigation', async () => {
    render(
      <StudentDialog
        open={true}
        onClose={mockOnClose}
        onSave={mockOnSave}
        student={null}
      />
    );

    const nameInput = screen.getByLabelText('Student name');
    nameInput.focus();
    expect(document.activeElement).toBe(nameInput);

    // Tab through form fields
    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByLabelText('Student email'));

    await userEvent.tab();
    expect(document.activeElement).toBe(screen.getByLabelText('Student enrollment number'));
  });
});