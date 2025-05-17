import { Fee } from '../../types/api.types';

// Extended fee interface for our UI needs
export interface FeeStatusItem extends Omit<Fee, 'status'> {
  semester: string;
  status: 'approved' | 'pending' | 'due';
  approvedDate?: Date;
}

export interface FeeTypeData {
  tuitionFees: FeeStatusItem[];
  hostelFees: FeeStatusItem[];
}

class FeeService {
  private apiUrl = '/api/fees';

  async getAllFees(): Promise<FeeTypeData> {
    // Mock data for now - in a real application, this would fetch from the API
    const mockTuitionFees: FeeStatusItem[] = [
      {
        id: 1,
        student: { id: 1 } as any,
        amount: 75000,
        type: 'tuition',
        semester: 'Semester 6',
        dueDate: new Date('2025-06-01'),
        status: 'due',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        student: { id: 1 } as any,
        amount: 75000,
        type: 'tuition',
        semester: 'Semester 5',
        dueDate: new Date('2024-12-01'),
        status: 'approved',
        approvedDate: new Date('2024-12-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        student: { id: 1 } as any,
        amount: 75000,
        type: 'tuition',
        semester: 'Semester 4',
        dueDate: new Date('2024-06-01'),
        status: 'approved',
        approvedDate: new Date('2024-06-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        student: { id: 1 } as any,
        amount: 75000,
        type: 'tuition',
        semester: 'Semester 3',
        dueDate: new Date('2023-12-01'),
        status: 'approved',
        approvedDate: new Date('2023-12-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        student: { id: 1 } as any,
        amount: 75000,
        type: 'tuition',
        semester: 'Semester 2',
        dueDate: new Date('2023-06-01'),
        status: 'approved',
        approvedDate: new Date('2023-06-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        student: { id: 1 } as any,
        amount: 75000,
        type: 'tuition',
        semester: 'Semester 1',
        dueDate: new Date('2022-12-01'),
        status: 'approved',
        approvedDate: new Date('2022-12-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    const mockHostelFees: FeeStatusItem[] = [
      {
        id: 7,
        student: { id: 1 } as any,
        amount: 25000,
        type: 'hostel',
        semester: 'Semester 6',
        dueDate: new Date('2025-06-01'),
        status: 'due',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 8,
        student: { id: 1 } as any,
        amount: 25000,
        type: 'hostel',
        semester: 'Semester 5',
        dueDate: new Date('2024-12-01'),
        status: 'approved',
        approvedDate: new Date('2024-12-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 9,
        student: { id: 1 } as any,
        amount: 25000,
        type: 'hostel',
        semester: 'Semester 4',
        dueDate: new Date('2024-06-01'),
        status: 'approved',
        approvedDate: new Date('2024-06-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 10,
        student: { id: 1 } as any,
        amount: 25000,
        type: 'hostel',
        semester: 'Semester 3',
        dueDate: new Date('2023-12-01'),
        status: 'approved',
        approvedDate: new Date('2023-12-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 11,
        student: { id: 1 } as any,
        amount: 25000,
        type: 'hostel',
        semester: 'Semester 2',
        dueDate: new Date('2023-06-01'),
        status: 'approved',
        approvedDate: new Date('2023-06-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 12,
        student: { id: 1 } as any,
        amount: 25000,
        type: 'hostel',
        semester: 'Semester 1',
        dueDate: new Date('2022-12-01'),
        status: 'approved',
        approvedDate: new Date('2022-12-01'),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    return {
      tuitionFees: mockTuitionFees,
      hostelFees: mockHostelFees
    };
  }

  async getFeeDetails(id: number): Promise<FeeStatusItem> {
    // Mock implementation
    const allFees = await this.getAllFees();
    const fee = [...allFees.tuitionFees, ...allFees.hostelFees].find(f => f.id === id);
    
    if (!fee) {
      throw new Error('Fee not found');
    }
    
    return fee;
  }
}

export const feeService = new FeeService();