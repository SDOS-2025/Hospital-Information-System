import { memo } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { Student } from '../../../types/api.types';

interface GridActionsProps {
  student: Student;
  onEdit: (student: Student) => void;
  onDelete: (id: number) => void;
  disabled: boolean;
}

export const GridActions = memo(function GridActions({ 
  student, 
  onEdit, 
  onDelete, 
  disabled 
}: GridActionsProps) {
  return [
    <GridActionsCellItem
      icon={<EditIcon />}
      label="Edit"
      onClick={() => onEdit(student)}
      disabled={disabled}
      showInMenu={false}
      aria-label={`Edit ${student.name}`}
      sx={{
        '&:focus-visible': {
          outline: '2px solid #1976d2',
          outlineOffset: '2px',
        }
      }}
    />,
    <GridActionsCellItem
      icon={<DeleteIcon />}
      label="Delete"
      onClick={() => {
        if (window.confirm(`Are you sure you want to delete ${student.name}?`)) {
          onDelete(student.id);
        }
      }}
      disabled={disabled}
      showInMenu={false}
      aria-label={`Delete ${student.name}`}
      sx={{
        '&:focus-visible': {
          outline: '2px solid #1976d2',
          outlineOffset: '2px',
        }
      }}
    />,
  ];
});