import { test, expect, type Locator, type Page } from '@playwright/test';
import {
  createCandidate,
  createEmployee,
  deleteCandidate,
  deleteEmployee,
  deleteRecruitmentPosition,
  ensureActiveRecruitmentPosition,
  findCandidateByName,
  findEmployeeByName,
  listCandidates,
  listEmployees,
  listHrStaff,
  loginToken,
} from './helpers/api';
import {
  clickFirstInteractiveRow,
  fillHrmDate,
  hrmFieldGroup,
  hrmFieldInput,
  hrmFieldNear,
  pickHrmSelect,
} from './helpers/ui';

function uniqueSuffix(): string {
  return `${Date.now().toString().slice(-7)}${Math.floor(Math.random() * 90 + 10)}`;
}

function fieldGroup(page: Page, label: string | RegExp): Locator {
  return hrmFieldGroup(page, label);
}

function textInput(page: Page, label: string | RegExp): Locator {
  return hrmFieldInput(page, label);
}

async function checkRadio(scope: Locator | Page, label: string): Promise<void> {
  await scope.getByRole('radio', { name: label, exact: true }).check();
}

test.describe('HRM flows', () => {
  test('employee create form renders required fields', async ({ page }) => {
    await page.goto('/members/new');
    await expect(page.getByText('Họ và tên', { exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'LƯU NHÂN VIÊN' })).toBeVisible();
  });

  test('employee detail from list row', async ({ page }) => {
    const token = await loginToken();
    const employees = await listEmployees(token);
    test.skip(employees.length === 0, 'No employees');

    const target = employees[0];
    await page.goto('/members/list');
    await page.getByPlaceholder('Tìm theo tên, mã NV, bộ phận...').fill(target.fullName);
    await clickFirstInteractiveRow(page);
    await expect(page).toHaveURL(new RegExp(`/members/${target.id}`));
    await expect(page.getByRole('heading', { level: 1, name: target.fullName })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thông tin HR (Mã NV, Tổ chức)' })).toBeVisible();
  });

  test('create employee via API then verify detail UI and cleanup', async ({ page }) => {
    const token = await loginToken();
    const suffix = uniqueSuffix();
    const fullName = `E2E Nhan Vien ${suffix}`;
    const empCode = `NV-${suffix.slice(0, 4)}`;
    let createdId: string | undefined;

    try {
      // BE PublicUpload = 10/hour (form upload burns 3 photos/create). Authenticated create
      // skips uploads so the suite stays runnable under rate limits.
      const created = await createEmployee(token, {
        code: empCode,
        fullName,
        gender: 'Nam',
        birthDate: '15/03/1995',
        joinDate: '01/07/2026',
        status: 'Đang làm',
        cccdNumber: `0790${suffix.slice(0, 8).padEnd(8, '0')}`,
        cccdIssueDate: '10/01/2020',
        cccdIssuePlace: 'Cong an TP HCM',
        personalEmail: `e2e.nv.${suffix}@namviet.vn`,
        personalPhone: `09${suffix.slice(0, 8).padEnd(8, '0')}`,
        permanentAddress: '123 Nguyen Trai, Quan 1, TP HCM',
        education: 'Đại học',
        school: 'Dai hoc Bach Khoa',
        major: 'Cong nghe thong tin',
        maritalStatus: 'Độc thân',
        bankAccountName: 'E2E NHAN VIEN',
        bankAccountNumber: `2026${suffix.slice(0, 8)}`,
        bankName: 'Vietcombank',
        bankBranch: 'CN Quan 1',
        hadSocialInsurance: 'Chưa từng tham gia',
      });
      createdId = created.id;

      await page.goto(`/members/${createdId}`);
      await expect(page.getByRole('heading', { level: 1, name: fullName })).toBeVisible();
      await expect(page.getByText(`Mã NV: ${empCode}`)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Thông tin HR (Mã NV, Tổ chức)' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Thông tin cơ bản' })).toBeVisible();
    } finally {
      if (!createdId) {
        createdId = (await findEmployeeByName(token, fullName))?.id;
      }
      if (createdId) {
        await deleteEmployee(token, createdId);
      }
    }
  });

  test('employee create form fills required fields without submit', async ({ page }) => {
    const suffix = uniqueSuffix();
    await page.goto('/members/new');
    await expect(page.getByRole('heading', { level: 1, name: 'Thêm nhân viên' })).toBeVisible();

    await textInput(page, 'Mã nhân viên').fill(`NV-${suffix.slice(0, 4)}`);
    await textInput(page, 'Họ và tên').fill(`E2E Form ${suffix}`);
    await checkRadio(fieldGroup(page, 'Giới tính'), 'Nam');
    await fillHrmDate(page, fieldGroup(page, 'Ngày sinh'), '15/03/1995');
    await fillHrmDate(page, fieldGroup(page, 'Ngày vào làm'), '01/07/2026');
    await textInput(page, 'Số CCCD').fill(`0790${suffix.slice(0, 8).padEnd(8, '0')}`);
    await fillHrmDate(page, hrmFieldNear(page, 'Số CCCD', /^Ngày cấp$/), '10/01/2020');
    await hrmFieldNear(page, 'Số CCCD', 'Nơi cấp')
      .locator('input.hrm-field-input')
      .first()
      .fill('Cong an TP HCM');
    await textInput(page, 'Email cá nhân').fill(`e2e.form.${suffix}@namviet.vn`);
    await textInput(page, 'Số điện thoại cá nhân').fill(`09${suffix.slice(0, 8).padEnd(8, '0')}`);
    await textInput(page, 'Địa chỉ thường trú').fill('123 Nguyen Trai, Quan 1, TP HCM');
    await pickHrmSelect(page, fieldGroup(page, 'Trình độ'), 'Đại học');
    await textInput(page, 'Trường đào tạo').fill('Dai hoc Bach Khoa');
    await textInput(page, 'Chuyên ngành').fill('Cong nghe thong tin');
    await pickHrmSelect(page, fieldGroup(page, 'Tình trạng hôn nhân'), 'Độc thân');
    await textInput(page, /Tên chủ tài khoản/).fill('E2E FORM FILL');
    await textInput(page, 'Số tài khoản').fill(`2026${suffix.slice(0, 8)}`);
    await textInput(page, 'Tên ngân hàng').fill('Vietcombank');
    await page
      .locator('label.hrm-field__label', { hasText: /^Chi nhánh$/ })
      .nth(1)
      .locator('xpath=ancestor::div[1]')
      .locator('input.hrm-field-input')
      .fill('CN Quan 1');
    await checkRadio(fieldGroup(page, 'Đã tham gia BHXH chưa'), 'Chưa từng tham gia');

    await expect(page.getByRole('button', { name: 'LƯU NHÂN VIÊN' })).toBeEnabled();
    await expect(page).toHaveURL(/\/members\/new/);
  });

  test('candidate detail from list row', async ({ page }) => {
    const token = await loginToken();
    const { items } = await listCandidates(token);
    test.skip(items.length === 0, 'No candidates');

    const target = items[0];
    await page.goto('/recruitment/candidates');
    await page.getByRole('searchbox', { name: 'Tìm kiếm ứng viên' }).fill(target.fullName);
    await clickFirstInteractiveRow(page);
    await expect(page).toHaveURL(new RegExp(`/recruitment/candidates/${target.id}`));
    await expect(page.getByRole('heading', { level: 1, name: target.fullName })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Thông tin ứng viên' })).toBeVisible();
  });

  test('create candidate via API then verify detail UI and cleanup', async ({ page }) => {
    const token = await loginToken();
    const hrStaff = await listHrStaff(token);
    test.skip(hrStaff.length === 0, 'No HR staff options');

    const positionGuard = await ensureActiveRecruitmentPosition(token, `E2E Vi tri ${uniqueSuffix()}`);
    const suffix = uniqueSuffix();
    const fullName = `E2E Ung Vien ${suffix}`;
    let createdId: string | undefined;

    try {
      // Avoid PublicUpload rate limit (10/hour) from CV binary uploads during full suite runs.
      const created = await createCandidate(token, {
        fullName,
        phone: `08${suffix.slice(0, 8).padEnd(8, '0')}`,
        email: `e2e.uv.${suffix}@namviet.vn`,
        gender: 'Nam',
        address: '456 Le Loi, Quan 3, TP HCM',
        birthDate: '20/05/1998',
        education: 'Đại học',
        school: 'Dai hoc Kinh Te',
        major: 'Quan tri nhan su',
        position: positionGuard.name,
        experience: '2 năm',
        source: '24h - ứng tuyển',
        hrResponsible: hrStaff[0].name,
        cvFileName: '',
        cvFileSize: '',
        appliedAt: new Date().toISOString(),
      });
      createdId = created.id;

      await page.goto(`/recruitment/candidates/${createdId}`);
      await expect(page.getByRole('heading', { level: 1, name: fullName })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Thông tin ứng viên' })).toBeVisible();
    } finally {
      if (!createdId) {
        createdId = (await findCandidateByName(token, fullName))?.id;
      }
      if (createdId) {
        await deleteCandidate(token, createdId);
      }
      if (positionGuard.created) {
        await deleteRecruitmentPosition(token, positionGuard.name);
      }
    }
  });

  test('candidate public apply form fills required fields without submit', async ({ page }) => {
    const token = await loginToken();
    const hrStaff = await listHrStaff(token);
    test.skip(hrStaff.length === 0, 'No HR staff options');
    const positionGuard = await ensureActiveRecruitmentPosition(token, `E2E Form VT ${uniqueSuffix()}`);

    try {
      const suffix = uniqueSuffix();
      await page.goto('/recruitment/apply');
      await expect(page.getByPlaceholder('Nhập họ tên')).toBeVisible();
      await page.getByPlaceholder('Nhập họ tên').fill(`E2E Form UV ${suffix}`);
      await fillHrmDate(page, page.locator('[data-form-field="birthDate"]'), '20/05/1998');
      await page.locator('[data-form-field="phone"] input').fill(`08${suffix.slice(0, 8).padEnd(8, '0')}`);
      await page.getByPlaceholder('Nhập email').fill(`e2e.form.uv.${suffix}@namviet.vn`);
      await checkRadio(page.locator('[data-form-field="gender"]'), 'Nam');
      await page.getByPlaceholder('Xã/Phường, Quận/Huyện, Tỉnh/Thành...').fill('456 Le Loi, Quan 3, TP HCM');
      await checkRadio(page.locator('[data-form-field="education"]'), 'Đại học');
      await pickHrmSelect(page, page.locator('[data-form-field="position"]'), positionGuard.name);
      await page.getByPlaceholder('Nhập tên trường').fill('Dai hoc Kinh Te');
      await page.getByPlaceholder('Nhập chuyên ngành').fill('Quan tri nhan su');
      await checkRadio(page.locator('[data-form-field="source"]'), '24h - ứng tuyển');
      await pickHrmSelect(page, page.locator('[data-form-field="hrResponsible"]'), hrStaff[0].name);
      await expect(page.getByRole('button', { name: 'GỬI HỒ SƠ ỨNG TUYỂN' })).toBeEnabled();
    } finally {
      if (positionGuard.created) {
        await deleteRecruitmentPosition(token, positionGuard.name);
      }
    }
  });
});
