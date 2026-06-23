import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fromApi, toApi, resolveMediaUrl } from './employeeApiMapper';
import type { EmployeeApiDto } from './employeeApiMapper';
import type { Employee } from '../../types/hr';

describe('employeeApiMapper', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.namviet.com');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('resolveMediaUrl', () => {
    it('should return undefined if url is missing', () => {
      expect(resolveMediaUrl(undefined)).toBeUndefined();
      expect(resolveMediaUrl('')).toBeUndefined();
    });

    it('should return the same url if it is absolute or data/blob', () => {
      expect(resolveMediaUrl('http://example.com/img.png')).toBe('http://example.com/img.png');
      expect(resolveMediaUrl('https://example.com/img.png')).toBe('https://example.com/img.png');
      expect(resolveMediaUrl('blob:uuid-string')).toBe('blob:uuid-string');
      expect(resolveMediaUrl('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
    });

    it('should resolve relative urls with VITE_API_BASE_URL', () => {
      expect(resolveMediaUrl('/uploads/avatar.jpg')).toBe('https://api.namviet.com/uploads/avatar.jpg');
      expect(resolveMediaUrl('uploads/avatar.jpg')).toBe('https://api.namviet.com/uploads/avatar.jpg');
    });
  });

  describe('fromApi', () => {
    it('should map a full DTO to Employee correctly', () => {
      const dto: EmployeeApiDto = {
        id: 'emp-123',
        code: ' NV001 ',
        fullName: 'Nguyen Van A',
        gender: 'Nam',
        birthDate: '1995-10-15',
        joinDate: '15/05/2020',
        officialDate: '2020-08-15T00:00:00Z',
        status: 'Đang làm',
        photoUrl: '/uploads/avatar.jpg',
        cccdNumber: '012345678912',
        taxCode: 'MST-11111',
      };

      const employee = fromApi(dto);

      expect(employee.id).toBe('emp-123');
      expect(employee.code).toBe('NV001'); // trimmed
      expect(employee.fullName).toBe('Nguyen Van A');
      expect(employee.gender).toBe('Nam');
      expect(employee.birthDate).toBe('1995-10-15'); // YYYY-MM-DD remains same
      expect(employee.joinDate).toBe('2020-05-15'); // DD/MM/YYYY converted to YYYY-MM-DD
      expect(employee.officialDate).toBe('2020-08-15'); // ISO datetime converted to YYYY-MM-DD
      expect(employee.status).toBe('Đang làm');
      expect(employee.profilePhoto).toEqual({
        fileName: 'avatar.jpg',
        fileSize: '',
        previewUrl: 'https://api.namviet.com/uploads/avatar.jpg',
      });
      expect(employee.cccdNumber).toBe('012345678912');
      expect(employee.taxCode).toBe('MST-11111');
    });

    it('should handle missing dates and optional values', () => {
      const dto: EmployeeApiDto = {
        id: 'emp-124',
        fullName: 'Tran Thi B',
        gender: 'Nữ',
        birthDate: '',
        joinDate: 'invalid-date',
        status: 'Nghỉ việc',
      };

      const employee = fromApi(dto);

      expect(employee.birthDate).toBe('');
      expect(employee.joinDate).toBe('invalid-date'); // falls back to the original string if invalid
      expect(employee.officialDate).toBeUndefined();
      expect(employee.taxCode).toBeUndefined();
    });
  });

  describe('toApi', () => {
    it('should convert Employee model back to DTO', () => {
      const employee: Employee = {
        id: 'emp-123',
        fullName: 'Nguyen Van A',
        gender: 'Nam',
        birthDate: '1995-10-15',
        joinDate: '2020-05-15',
        officialDate: '2020-08-15',
        status: 'Đang làm',
        profilePhoto: {
          fileName: 'avatar.jpg',
          fileSize: '',
          previewUrl: 'https://api.namviet.com/uploads/avatar.jpg',
        },
        taxCode: 'MST-22222',
      };

      const dto = toApi(employee, 'emp-123');

      expect(dto.id).toBe('emp-123');
      expect(dto.fullName).toBe('Nguyen Van A');
      expect(dto.birthDate).toBe('15/10/1995'); // YYYY-MM-DD -> DD/MM/YYYY
      expect(dto.joinDate).toBe('15/05/2020'); // YYYY-MM-DD -> DD/MM/YYYY
      expect(dto.officialDate).toBe('15/08/2020'); // YYYY-MM-DD -> DD/MM/YYYY
      expect(dto.photoUrl).toBe('/uploads/avatar.jpg'); // strips base URL
      expect(dto.taxCode).toBe('MST-22222');
    });

    it('should send null photoUrl when profile photo was removed', () => {
      const dto = toApi({
        fullName: 'Test Onboard',
        birthDate: '2026-06-16',
        joinDate: '2026-06-16',
        gender: 'Nam',
        status: 'Đang làm',
      });

      expect(dto.photoUrl).toBeNull();
    });

    it('should keep DD/MM/YYYY dates unchanged if already in that format', () => {
      const employee = {
        fullName: 'Test A',
        birthDate: '15/10/1995',
        joinDate: '',
      };

      const dto = toApi(employee);

      expect(dto.birthDate).toBe('15/10/1995');
      expect(dto.joinDate).toBe('');
    });
  });

  describe('round-trip mapping', () => {
    it('should preserve taxCode through fromApi -> toApi round-trip', () => {
      const dto: EmployeeApiDto = {
        id: 'emp-999',
        fullName: 'Le Van C',
        gender: 'Nam',
        birthDate: '1990-01-01',
        joinDate: '01/01/2020',
        status: 'Đang làm',
        taxCode: 'MST-33333',
      };

      const employee = fromApi(dto);
      expect(employee.taxCode).toBe('MST-33333');

      const resultDto = toApi(employee, 'emp-999');
      expect(resultDto.taxCode).toBe('MST-33333');
    });

    it('should handle null taxCode in fromApi and pass it to toApi', () => {
      const dto = {
        id: 'emp-null-tax',
        fullName: 'Null Tax',
        gender: 'Nữ',
        birthDate: '1990-01-01',
        joinDate: '01/01/2020',
        status: 'Đang làm',
        taxCode: null,
      } as EmployeeApiDto;

      const employee = fromApi(dto);
      expect(employee.taxCode).toBeNull(); // It is preserved as null at runtime

      const resultDto = toApi(employee, 'emp-null-tax');
      expect(resultDto.taxCode).toBeNull();
    });

    it('should handle undefined taxCode in fromApi and pass it to toApi', () => {
      const dto: EmployeeApiDto = {
        id: 'emp-undef-tax',
        fullName: 'Undef Tax',
        gender: 'Nữ',
        birthDate: '1990-01-01',
        joinDate: '01/01/2020',
        status: 'Đang làm',
        taxCode: undefined,
      };

      const employee = fromApi(dto);
      expect(employee.taxCode).toBeUndefined();

      const resultDto = toApi(employee, 'emp-undef-tax');
      expect(resultDto.taxCode).toBeUndefined();
    });

    it('should handle empty/whitespace taxCode in fromApi and pass it to toApi without trim (potential limitation)', () => {
      const dto: EmployeeApiDto = {
        id: 'emp-space-tax',
        fullName: 'Space Tax',
        gender: 'Nữ',
        birthDate: '1990-01-01',
        joinDate: '01/01/2020',
        status: 'Đang làm',
        taxCode: '   ',
      };

      const employee = fromApi(dto);
      expect(employee.taxCode).toBe('   '); // Does not trim (unlike employee code)

      const resultDto = toApi(employee, 'emp-space-tax');
      expect(resultDto.taxCode).toBe('   ');
    });

    it('should handle null, undefined, empty, and space-padded taxCode', () => {
      const dtoNull: EmployeeApiDto = {
        id: 'emp-999',
        fullName: 'Le Van C',
        gender: 'Nam',
        birthDate: '1990-01-01',
        joinDate: '01/01/2020',
        status: 'Đang làm',
        taxCode: null,
      } as EmployeeApiDto;

      const empNull = fromApi(dtoNull);
      expect(empNull.taxCode).toBeNull();
      const resNull = toApi(empNull, 'emp-999');
      expect(resNull.taxCode).toBeNull();

      const dtoUndefined: EmployeeApiDto = {
        id: 'emp-999',
        fullName: 'Le Van C',
        gender: 'Nam',
        birthDate: '1990-01-01',
        joinDate: '01/01/2020',
        status: 'Đang làm',
        taxCode: undefined,
      };

      const empUndef = fromApi(dtoUndefined);
      expect(empUndef.taxCode).toBeUndefined();
      const resUndef = toApi(empUndef, 'emp-999');
      expect(resUndef.taxCode).toBeUndefined();

      const dtoEmpty: EmployeeApiDto = {
        id: 'emp-999',
        fullName: 'Le Van C',
        gender: 'Nam',
        birthDate: '1990-01-01',
        joinDate: '01/01/2020',
        status: 'Đang làm',
        taxCode: '',
      };

      const empEmpty = fromApi(dtoEmpty);
      expect(empEmpty.taxCode).toBe('');
      const resEmpty = toApi(empEmpty, 'emp-999');
      expect(resEmpty.taxCode).toBe('');

      const dtoSpaces: EmployeeApiDto = {
        id: 'emp-999',
        fullName: 'Le Van C',
        gender: 'Nam',
        birthDate: '1990-01-01',
        joinDate: '01/01/2020',
        status: 'Đang làm',
        taxCode: ' 123456789 ',
      };

      const empSpaces = fromApi(dtoSpaces);
      expect(empSpaces.taxCode).toBe(' 123456789 '); // verify it is not trimmed
      const resSpaces = toApi(empSpaces, 'emp-999');
      expect(resSpaces.taxCode).toBe(' 123456789 ');
    });

    it('should round-trip a number taxCode directly without converting to string (potential type unsafety)', () => {
      const dtoNumber: EmployeeApiDto = {
        id: 'emp-999',
        fullName: 'Le Van C',
        gender: 'Nam',
        birthDate: '1990-01-01',
        joinDate: '01/01/2020',
        status: 'Đang làm',
        taxCode: 123456789,
      } as EmployeeApiDto;

      const employee = fromApi(dtoNumber);
      expect(employee.taxCode).toBe(123456789); // remains a number!
      const resDto = toApi(employee, 'emp-999');
      expect(resDto.taxCode).toBe(123456789);
    });
  });
});
