import { useState, type FormEvent } from 'react';
import { Award, CheckCircle, AlertTriangle, ShieldCheck, DollarSign, Truck, Wrench } from 'lucide-react';
import Button from '../ui/Button';
import FormField from '../ui/FormField';
import Modal from '../ui/Modal';
import SelectField from '../ui/SelectField';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { suppliersService, type SupplierApiDto, type SupplierTierEvaluationDto } from '../../services/suppliersService';

interface SupplierTierEvaluationModalProps {
  supplier: SupplierApiDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (evaluation: SupplierTierEvaluationDto) => void;
}

const FORM_ID = 'supplier-tier-evaluation-form';

const PRICE_OPTIONS = [
  { score: 50, label: '50 điểm - Rẻ nhất thị trường, cam kết giữ giá ổn định theo hợp đồng EPC' },
  { score: 40, label: '40 điểm - Rất cạnh tranh (thấp hơn 3-5% so với báo giá các đơn vị khác)' },
  { score: 30, label: '30 điểm - Mức giá hợp lý, bám sát mặt bằng thị trường' },
  { score: 10, label: '10 điểm - Giá cao hơn thị trường, ít chiết khấu hoặc đòi ứng nhiều' },
];

const PROFILE_OPTIONS = [
  { score: 20, label: '20 điểm - Đầy đủ CO/CQ gốc/hợp lệ, chứng chỉ ISO/test xuất xưởng đạt chuẩn 100%' },
  { score: 10, label: '10 điểm - Có CO/CQ scan/photo, hồ sơ năng lực cơ bản' },
  { score: 0, label: '0 điểm - Thiếu CO/CQ hoặc chứng chỉ xuất xưởng không rõ ràng' },
];

const PAYMENT_OPTIONS = [
  { score: 20, label: '20 điểm - Giao tận chân công trình đúng tiến độ, cho phép công nợ 30-60 ngày' },
  { score: 10, label: '10 điểm - Giao qua chành xe/kho trung chuyển, điều khoản thanh toán 50/50' },
  { score: 0, label: '0 điểm - Bắt thanh toán trước 100%, không hỗ trợ vận chuyển' },
];

const SERVICE_OPTIONS = [
  { score: 10, label: '10 điểm - Cam kết 1 đổi 1 trong 24h, cử kỹ thuật hỗ trợ trực tiếp tại công trường' },
  { score: 5, label: '5 điểm - Bảo hành tiêu chuẩn nhà máy, hỗ trợ kỹ thuật từ xa' },
];

const TARGET_GRADE_OPTIONS = [
  { value: 'C', label: 'Hạng C — Nhà cung cấp Dự phòng (Đạt chuẩn)' },
  { value: 'B', label: 'Hạng B — Nhà cung cấp Thường xuyên' },
  { value: 'A', label: 'Hạng A — Đối tác Chiến lược' },
];

export default function SupplierTierEvaluationModal({
  supplier,
  isOpen,
  onClose,
  onSuccess,
}: SupplierTierEvaluationModalProps) {
  const currentGrade = supplier.rating || 'D';
  const defaultTarget = currentGrade === 'D' ? 'C' : currentGrade === 'C' ? 'B' : 'A';

  const [priceScore, setPriceScore] = useState<number>(40);
  const [profileScore, setProfileScore] = useState<number>(20);
  const [paymentScore, setPaymentScore] = useState<number>(10);
  const [serviceScore, setServiceScore] = useState<number>(10);
  const [targetGrade, setTargetGrade] = useState<string>(defaultTarget);
  const [reason, setReason] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const totalScore = priceScore + profileScore + paymentScore + serviceScore;
  const isEligible = totalScore >= 80;

  const criterionGroups = [
    {
      name: 'priceScore',
      title: '1. Đơn giá & Báo giá cạnh tranh (Tối đa 50đ)',
      icon: DollarSign,
      iconTone: 'text-[var(--md-info)]',
      badgeTone: 'bg-[var(--md-info-container)] text-[var(--md-on-info-container)]',
      maxScore: 50,
      value: priceScore,
      onChange: setPriceScore,
      options: PRICE_OPTIONS,
    },
    {
      name: 'profileScore',
      title: '2. Hồ sơ năng lực & CO/CQ (Tối đa 20đ)',
      icon: ShieldCheck,
      iconTone: 'text-[var(--md-primary)]',
      badgeTone: 'bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)]',
      maxScore: 20,
      value: profileScore,
      onChange: setProfileScore,
      options: PROFILE_OPTIONS,
    },
    {
      name: 'paymentScore',
      title: '3. Vận chuyển & Công nợ (Tối đa 20đ)',
      icon: Truck,
      iconTone: 'text-[var(--md-warning)]',
      badgeTone: 'bg-[var(--md-warning-container)] text-[var(--md-on-warning-container)]',
      maxScore: 20,
      value: paymentScore,
      onChange: setPaymentScore,
      options: PAYMENT_OPTIONS,
    },
    {
      name: 'serviceScore',
      title: '4. Bảo hành & Hỗ trợ kỹ thuật (Tối đa 10đ)',
      icon: Wrench,
      iconTone: 'text-[var(--md-success)]',
      badgeTone: 'bg-[var(--md-success-container)] text-[var(--md-on-success-container)]',
      maxScore: 10,
      value: serviceScore,
      onChange: setServiceScore,
      options: SERVICE_OPTIONS,
    },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showToast('warning', 'Vui lòng nhập lý do đánh giá/chuyển hạng.');
      return;
    }

    setSubmitting(true);
    try {
      const detailsJson = JSON.stringify({
        priceScore,
        profileScore,
        paymentScore,
        serviceScore,
        evaluatedAt: new Date().toISOString(),
      });

      const res = await suppliersService.submitTierEvaluation(supplier.id, {
        priceScore,
        profileScore,
        paymentScore,
        serviceScore,
        targetGrade: isEligible ? targetGrade : undefined,
        reason: reason.trim(),
        detailsJson,
      });

      showToast(
        'success',
        isEligible
          ? `Đã thăng hạng thành công NCC ${supplier.supplierName} lên Hạng ${res.newGrade}!`
          : `Đã lưu kết quả đánh giá (${res.totalScore}/100 điểm) cho NCC ${supplier.supplierName}.`
      );
      onSuccess(res);
      onClose();
    } catch (err) {
      showToast('error', getApiErrorMessage(err, 'Lỗi khi lưu đánh giá thăng hạng.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      title="Đánh Giá & Thăng Hạng NCC (50-20-20-10)"
      subtitle={`${supplier.supplierCode} — ${supplier.supplierName} (Hiện tại: Hạng ${currentGrade})`}
      footer={(
        <>
          <Button type="button" variant="outlined" size="sm" onClick={onClose} disabled={submitting}>
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            form={FORM_ID}
            variant="filled"
            size="sm"
            leftIcon={Award}
            disabled={submitting}
            loading={submitting}
          >
            {submitting
              ? 'Đang lưu...'
              : isEligible
              ? `Xác Nhận Thăng Hạng Lên Hạng ${targetGrade}`
              : 'Lưu Kết Quả Đánh Giá (Không Thăng Hạng)'}
          </Button>
        </>
      )}
    >
      <div className="space-y-4">
        {/* Live Score Summary Banner */}
        <div
          className={`p-4 rounded-xl border transition-all duration-300 ${
            isEligible
              ? 'bg-[var(--md-success-container)] border-[var(--tint-success-border)]'
              : 'bg-[var(--md-warning-container)] border-[var(--tint-warning-border)]'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg shadow-sm shrink-0 ${
                  isEligible
                    ? 'bg-[var(--md-success)] text-[var(--md-on-primary)]'
                    : 'bg-[var(--md-warning)] text-[var(--md-on-primary)]'
                }`}
              >
                {isEligible ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-2xl font-black tabular-nums ${
                      isEligible ? 'text-[var(--md-on-success-container)]' : 'text-[var(--md-on-warning-container)]'
                    }`}
                  >
                    {totalScore}
                  </span>
                  <span className="text-[length:var(--fs-xs)] text-[var(--md-on-surface-variant)] font-semibold uppercase tracking-wider">
                    / 100 Điểm
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[length:var(--fs-xs)] font-bold border ${
                      isEligible
                        ? 'bg-[var(--md-surface)] text-[var(--md-on-success-container)] border-[var(--tint-success-border)]'
                        : 'bg-[var(--md-surface)] text-[var(--md-on-warning-container)] border-[var(--tint-warning-border)]'
                    }`}
                  >
                    {isEligible ? 'ĐỦ ĐIỀU KIỆN THĂNG HẠNG' : 'CHƯA ĐỦ ĐIỀU KIỆN THĂNG HẠNG'}
                  </span>
                </div>
                <p
                  className={`text-[length:var(--fs-xs)] mt-0.5 ${
                    isEligible ? 'text-[var(--md-on-success-container)]' : 'text-[var(--md-on-warning-container)]'
                  }`}
                >
                  {isEligible
                    ? `Tổng điểm ≥ 80đ. Đủ điều kiện thăng hạng từ Hạng ${currentGrade} lên Hạng ${targetGrade}.`
                    : `Cần tối thiểu 80/100 điểm để thăng hạng (Còn thiếu ${80 - totalScore} điểm).`}
                </p>
              </div>
            </div>

            {/* Score Breakdown Pills */}
            <div className="flex flex-wrap items-center gap-2 text-[length:var(--fs-xs)]">
              <span className="px-2.5 py-1 bg-[var(--md-surface)] text-[var(--md-on-surface)] rounded-lg border border-[var(--md-outline-variant)]">
                Giá: <strong className="text-[var(--md-info)]">{priceScore}/50</strong>
              </span>
              <span className="px-2.5 py-1 bg-[var(--md-surface)] text-[var(--md-on-surface)] rounded-lg border border-[var(--md-outline-variant)]">
                Hồ sơ: <strong className="text-[var(--md-primary)]">{profileScore}/20</strong>
              </span>
              <span className="px-2.5 py-1 bg-[var(--md-surface)] text-[var(--md-on-surface)] rounded-lg border border-[var(--md-outline-variant)]">
                Vận chuyển: <strong className="text-[var(--md-warning)]">{paymentScore}/20</strong>
              </span>
              <span className="px-2.5 py-1 bg-[var(--md-surface)] text-[var(--md-on-surface)] rounded-lg border border-[var(--md-outline-variant)]">
                Dịch vụ: <strong className="text-[var(--md-success)]">{serviceScore}/10</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Groups Criteria Form */}
        <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
          {criterionGroups.map(group => {
            const GroupIcon = group.icon;
            return (
              <div
                key={group.name}
                className="p-3.5 rounded-xl border border-[var(--md-outline-variant)] bg-[var(--md-surface-container-low)]"
              >
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2 text-[length:var(--fs-xs)] font-bold text-[var(--md-on-surface)]">
                    <GroupIcon className={`w-4 h-4 ${group.iconTone}`} aria-hidden />
                    <span>{group.title}</span>
                  </div>
                  <span className={`text-[length:var(--fs-xs)] font-bold px-2 py-0.5 rounded ${group.badgeTone}`}>
                    Đã chọn: {group.value}/{group.maxScore}đ
                  </span>
                </div>
                <div className="space-y-1.5">
                  {group.options.map(opt => {
                    const selected = group.value === opt.score;
                    return (
                      <label
                        key={opt.score}
                        className={`flex items-start gap-2.5 p-2 rounded-lg border text-[length:var(--fs-xs)] cursor-pointer transition-colors ${
                          selected
                            ? 'border-[var(--md-primary)] bg-[var(--md-primary-container)] text-[var(--md-on-primary-container)] font-medium'
                            : 'border-[var(--md-outline-variant)] bg-[var(--md-surface)] text-[var(--md-on-surface)] hover:bg-[var(--md-surface-variant05)]'
                        }`}
                      >
                        <input
                          type="radio"
                          name={group.name}
                          value={opt.score}
                          checked={selected}
                          onChange={() => group.onChange(opt.score)}
                          className="mt-0.5 form-checkbox-accent"
                        />
                        <span>{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Promotion Target & Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <SelectField
                label="Hạng mục tiêu sau đánh giá:"
                value={targetGrade}
                onChange={setTargetGrade}
                disabled={!isEligible}
                options={TARGET_GRADE_OPTIONS}
              />
              {!isEligible ? (
                <span className="text-[length:var(--fs-xs)] text-[var(--md-warning)] mt-1 block">
                  * Điểm dưới 80, hệ thống sẽ giữ nguyên Hạng {currentGrade}.
                </span>
              ) : null}
            </div>

            <FormField label="Lý do chuyển hạng / Ghi chú thẩm định:" required>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="VD: Đã cung cấp đầy đủ hồ sơ CO/CQ, bảng giá chiết khấu 5% cho dự án..."
                rows={2}
                required
                className="form-input w-full"
              />
            </FormField>
          </div>
        </form>
      </div>
    </Modal>
  );
}
