import { Student } from '../../types/api.types';
import { BaseApiService } from './base.service';
import axiosInstance from '../http/axios-config';

class StudentService extends BaseApiService<Student> {
  constructor() {
    super('/students');
  }

  // Add student-specific methods here
  async getByEnrollmentNumber(enrollmentNumber: string): Promise<Student> {
    const { data } = await axiosInstance.get(`${this.endpoint}/enrollment/${enrollmentNumber}`);
    return data;
  }
}

export const studentService = new StudentService();