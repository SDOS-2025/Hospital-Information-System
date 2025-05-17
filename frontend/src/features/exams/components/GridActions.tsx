import { memo } from 'react';
import { GridActionsCellItem } from '@mui/x-data-grid';
import { Edit as EditIcon, Delete as DeleteIcon, Visibility as ViewIcon } from '@mui/icons-material';
import { ExamDetails } from '../../../services/api/exam.service';

interface GridActionsProps {
  item: ExamDetails;
  onEdit: (item: ExamDetails) => void;
  onDelete?: (id: number) => void;
  onView: (id: number) => void;
  disabled?: boolean;
}

export const GridActions = memo(function GridActions({ 
  item, 
  onEdit, 
  onDelete, 
  onView,
  disabled 
}: GridActionsProps) {
  const actions = [
    <GridActionsCellItem
      icon={<ViewIcon />}
      label="View"
      onClick={(e) => {
        e.stopPropagation();
        onView(item.id);
      }}
      disabled={disabled}
      showInMenu={false}
      aria-label={`View ${item.title}`}
      sx={{
        '&:focus-visible': {
          outline: '2px solid #1976d2',
          outlineOffset: '2px',
        }
      }}
    />,
    <GridActionsCellItem
      icon={<EditIcon />}
      label="Edit"
      onClick={(e) => {
        e.stopPropagation();
        onEdit(item);
      }}
      disabled={disabled}
      showInMenu={false}
      aria-label={`Edit ${item.title}`}
      sx={{
        '&:focus-visible': {
          outline: '2px solid #1976d2',
          outlineOffset: '2px',
        }
      }}
    />
  ];

  if (onDelete) {
    actions.push(
      <GridActionsCellItem
        icon={<DeleteIcon />}
        label="Delete"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`Are you sure you want to delete ${item.title}?`)) {
            onDelete(item.id);
          }
        }}
        disabled={disabled}
        showInMenu={false}
        aria-label={`Delete ${item.title}`}
        sx={{
          '&:focus-visible': {
            outline: '2px solid #1976d2',
            outlineOffset: '2px',
          }
        }}
      />
    );
  }

  return actions;
});