import axiosInstance from '../http/axios-config';
import { BaseEntity } from '../../types/api.types';

export class BaseApiService<T extends BaseEntity> {
  constructor(protected readonly endpoint: string) {}

  async getAll(): Promise<T[]> {
    const { data } = await axiosInstance.get<T[]>(this.endpoint);
    return data;
  }

  async getById(id: number): Promise<T> {
    const { data } = await axiosInstance.get<T>(`${this.endpoint}/${id}`);
    return data;
  }

  async create(payload: Omit<T, keyof BaseEntity>): Promise<T> {
    const { data } = await axiosInstance.post<T>(this.endpoint, payload);
    return data;
  }

  async update(id: number, payload: Partial<Omit<T, keyof BaseEntity>>): Promise<T> {
    const { data } = await axiosInstance.patch<T>(`${this.endpoint}/${id}`, payload);
    return data;
  }

  async delete(id: number): Promise<void> {
    await axiosInstance.delete(`${this.endpoint}/${id}`);
  }
}