import { render, screen } from '@testing-library/react';
import { GridActions } from '../GridActions';
import userEvent from '@testing-library/user-event';
import { Student } from '../../../../types/api.types';

const mockStudent: Student = {
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

const mockOnEdit = jest.fn();
const mockOnDelete = jest.fn();

describe('GridActions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock window.confirm
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders edit and delete buttons', () => {
    render(
      <div>
        {GridActions({
          student: mockStudent,
          onEdit: mockOnEdit,
          onDelete: mockOnDelete,
          disabled: false
        })}
      </div>
    );

    expect(screen.getByLabelText(`Edit ${mockStudent.name}`)).toBeInTheDocument();
    expect(screen.getByLabelText(`Delete ${mockStudent.name}`)).toBeInTheDocument();
  });

  it('disables buttons when disabled prop is true', () => {
    render(
      <div>
        {GridActions({
          student: mockStudent,
          onEdit: mockOnEdit,
          onDelete: mockOnDelete,
          disabled: true
        })}
      </div>
    );

    expect(screen.getByLabelText(`Edit ${mockStudent.name}`)).toBeDisabled();
    expect(screen.getByLabelText(`Delete ${mockStudent.name}`)).toBeDisabled();
  });

  it('calls onEdit when edit button is clicked', async () => {
    render(
      <div>
        {GridActions({
          student: mockStudent,
          onEdit: mockOnEdit,
          onDelete: mockOnDelete,
          disabled: false
        })}
      </div>
    );

    const editButton = screen.getByLabelText(`Edit ${mockStudent.name}`);
    await userEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockStudent);
  });

  it('shows confirmation dialog and calls onDelete when delete button is clicked', async () => {
    render(
      <div>
        {GridActions({
          student: mockStudent,
          onEdit: mockOnEdit,
          onDelete: mockOnDelete,
          disabled: false
        })}
      </div>
    );

    const deleteButton = screen.getByLabelText(`Delete ${mockStudent.name}`);
    await userEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith(`Are you sure you want to delete ${mockStudent.name}?`);
    expect(mockOnDelete).toHaveBeenCalledWith(mockStudent.id);
  });

  it('does not call onDelete when confirmation is cancelled', async () => {
    jest.spyOn(window, 'confirm').mockImplementation(() => false);

    render(
      <div>
        {GridActions({
          student: mockStudent,
          onEdit: mockOnEdit,
          onDelete: mockOnDelete,
          disabled: false
        })}
      </div>
    );

    const deleteButton = screen.getByLabelText(`Delete ${mockStudent.name}`);
    await userEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalled();
    expect(mockOnDelete).not.toHaveBeenCalled();
  });

  it('supports keyboard navigation and focus management', async () => {
    render(
      <div>
        {GridActions({
          student: mockStudent,
          onEdit: mockOnEdit,
          onDelete: mockOnDelete,
          disabled: false
        })}
      </div>
    );

    const editButton = screen.getByLabelText(`Edit ${mockStudent.name}`);
    const deleteButton = screen.getByLabelText(`Delete ${mockStudent.name}`);

    // Check initial focus
    editButton.focus();
    expect(document.activeElement).toBe(editButton);

    // Tab to delete button
    await userEvent.tab();
    expect(document.activeElement).toBe(deleteButton);

    // Test focus indication styles are applied
    expect(deleteButton).toHaveStyle({
      '&:focus-visible': {
        outline: '2px solid #1976d2',
        outlineOffset: '2px',
      }
    });
  });
});