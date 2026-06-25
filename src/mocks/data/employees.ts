import type { Employee } from '../types/hr';

export const mockEmployees: Employee[] = [
  {
    id: 'emp_1',
    code: 'NV-0001',
    fullName: 'Phan Văn Vỹ',
    gender: 'Nam',
    birthDate: '1990-03-12',
    joinDate: '2022-03-12',
    officialDate: '2022-09-12',
    status: 'Đang làm',
    segment: 'Sản xuất',
    branch: 'Cần Thơ',
    department: 'Kho bãi',
    position: 'Thủ kho',
    personalEmail: 'vy.phan@gmail.com',
    personalPhone: '0901234567',
  },
  {
    id: 'emp_2',
    fullName: 'Nguyễn Thị Mai',
    gender: 'Nữ',
    birthDate: '1995-08-20',
    joinDate: '2024-01-15',
    status: 'Đang làm',
    segment: 'Hành chính',
    branch: 'TP. HCM',
    department: 'Nhân sự',
    position: 'Chuyên viên HCNS',
    personalEmail: 'mai.nguyen@gmail.com',
    personalPhone: '0988776655',
  },
];
