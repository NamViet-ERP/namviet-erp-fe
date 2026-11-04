import { useState, type FormEvent } from 'react';
import { Award, CheckCircle, AlertTriangle, ShieldCheck, DollarSign, Truck, Wrench } from 'lucide-react';
import Modal from '../ui/Modal';
import { showToast } from '../ui/Toast';
import { getApiErrorMessage } from '../../lib/apiClient';
import { suppliersService, type SupplierApiDto, type SupplierTierEvaluationDto } from '../../services/suppliersService';

interface SupplierTierEvaluationModalProps {
  supplier: SupplierApiDto;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (evaluation: SupplierTierEvaluationDto) => void;
}

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
    >
      <div className="p-4 space-y-4">
        {/* Live Score Summary Banner */}
        <div
          className="p-4 rounded-xl border transition-all duration-300"
          style={{
            backgroundColor: isEligible ? 'rgba(34, 197, 94, 0.08)' : 'rgba(234, 179, 8, 0.08)',
            borderColor: isEligible ? 'rgba(34, 197, 94, 0.3)' : 'rgba(234, 179, 8, 0.3)',
          }}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {isEligible ? (
                <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <CheckCircle className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black" style={{ color: isEligible ? '#16a34a' : '#d97706' }}>
                    {totalScore}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider">/ 100 Điểm</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      isEligible
                        ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}
                  >
                    {isEligible ? 'ĐỦ ĐIỀU KIỆN THĂNG HẠNG' : 'CHƯA ĐỦ ĐIỀU KIỆN THĂNG HẠNG'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {isEligible
                    ? `Tổng điểm ≥ 80đ. Đủ điều kiện thăng hạng từ Hạng ${currentGrade} lên Hạng ${targetGrade}.`
                    : `Cần tối thiểu 80/100 điểm để thăng hạng (Còn thiếu ${80 - totalScore} điểm).`}
                </p>
              </div>
            </div>

            {/* Score Breakdown Pills */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700">
                Giá: <strong className="text-blue-600">{priceScore}/50</strong>
              </span>
              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700">
                Hồ sơ: <strong className="text-purple-600">{profileScore}/20</strong>
              </span>
              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700">
                Vận chuyển: <strong className="text-amber-600">{paymentScore}/20</strong>
              </span>
              <span className="px-2.5 py-1 bg-white dark:bg-slate-800 rounded-lg shadow-xs border border-slate-200 dark:border-slate-700">
                Dịch vụ: <strong className="text-emerald-600">{serviceScore}/10</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 4 Groups Criteria Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Group 1: Đơn Giá (Max 50) */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <DollarSign className="w-4 h-4 text-blue-600" />
                <span>1. Đơn giá & Báo giá cạnh tranh (Tối đa 50đ)</span>
              </div>
              <span className="text-[11px] font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50">
                Đã chọn: {priceScore}/50đ
              </span>
            </div>
            <div className="space-y-1.5">
              {PRICE_OPTIONS.map((opt) => (
                <label
                  key={opt.score}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    priceScore === opt.score
                      ? 'border-blue-500 bg-blue-50/60 dark:bg-blue-950/40 font-medium'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="priceScore"
                    value={opt.score}
                    checked={priceScore === opt.score}
                    onChange={() => setPriceScore(opt.score)}
                    className="mt-0.5 text-blue-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Group 2: Hồ sơ & CO/CQ (Max 20) */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>2. Hồ sơ năng lực & CO/CQ (Tối đa 20đ)</span>
              </div>
              <span className="text-[11px] font-bold text-purple-600 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/50">
                Đã chọn: {profileScore}/20đ
              </span>
            </div>
            <div className="space-y-1.5">
              {PROFILE_OPTIONS.map((opt) => (
                <label
                  key={opt.score}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    profileScore === opt.score
                      ? 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/40 font-medium'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="profileScore"
                    value={opt.score}
                    checked={profileScore === opt.score}
                    onChange={() => setProfileScore(opt.score)}
                    className="mt-0.5 text-purple-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Group 3: Vận chuyển & Công nợ (Max 20) */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Truck className="w-4 h-4 text-amber-600" />
                <span>3. Vận chuyển & Công nợ (Tối đa 20đ)</span>
              </div>
              <span className="text-[11px] font-bold text-amber-600 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/50">
                Đã chọn: {paymentScore}/20đ
              </span>
            </div>
            <div className="space-y-1.5">
              {PAYMENT_OPTIONS.map((opt) => (
                <label
                  key={opt.score}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    paymentScore === opt.score
                      ? 'border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 font-medium'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="paymentScore"
                    value={opt.score}
                    checked={paymentScore === opt.score}
                    onChange={() => setPaymentScore(opt.score)}
                    className="mt-0.5 text-amber-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Group 4: Bảo hành & Hỗ trợ (Max 10) */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                <Wrench className="w-4 h-4 text-emerald-600" />
                <span>4. Bảo hành & Hỗ trợ kỹ thuật (Tối đa 10đ)</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50">
                Đã chọn: {serviceScore}/10đ
              </span>
            </div>
            <div className="space-y-1.5">
              {SERVICE_OPTIONS.map((opt) => (
                <label
                  key={opt.score}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-xs cursor-pointer transition-colors ${
                    serviceScore === opt.score
                      ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/40 font-medium'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:bg-slate-100/60'
                  }`}
                >
                  <input
                    type="radio"
                    name="serviceScore"
                    value={opt.score}
                    checked={serviceScore === opt.score}
                    onChange={() => setServiceScore(opt.score)}
                    className="mt-0.5 text-emerald-600"
                  />
                  <span className="text-slate-700 dark:text-slate-300">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Promotion Target & Reason */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Hạng mục tiêu sau đánh giá:
              </label>
              <select
                value={targetGrade}
                onChange={(e) => setTargetGrade(e.target.value)}
                disabled={!isEligible}
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 disabled:opacity-50"
              >
                <option value="C">Hạng C — Nhà cung cấp Dự phòng (Đạt chuẩn)</option>
                <option value="B">Hạng B — Nhà cung cấp Thường xuyên</option>
                <option value="A">Hạng A — Đối tác Chiến lược</option>
              </select>
              {!isEligible && (
                <span className="text-[11px] text-amber-600 mt-1 block">
                  * Điểm dưới 80, hệ thống sẽ giữ nguyên Hạng {currentGrade}.
                </span>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Lý do chuyển hạng / Ghi chú thẩm định: <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="VD: Đã cung cấp đầy đủ hồ sơ CO/CQ, bảng giá chiết khấu 5% cho dự án..."
                rows={2}
                required
                className="w-full text-xs px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[var(--md-outline-variant)]">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 text-xs font-bold rounded-lg text-white shadow-sm flex items-center gap-2 ${
                isEligible
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-amber-600 hover:bg-amber-700'
              }`}
            >
              <Award className="w-4 h-4" />
              {submitting
                ? 'Đang lưu...'
                : isEligible
                ? `Xác Nhận Thăng Hạng Lên Hạng ${targetGrade}`
                : 'Lưu Kết Quả Đánh Giá (Không Thăng Hạng)'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
