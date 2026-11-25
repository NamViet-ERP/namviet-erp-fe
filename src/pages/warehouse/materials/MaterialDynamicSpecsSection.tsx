import { useState } from 'react';
import FormField from '../../../components/ui/FormField';

export interface MaterialDynamicSpecsSectionProps {
  mode: 'steel' | 'equipment' | null;
  technicalSpecPreview: string;
  generalSpecPreview: string;
  onSteelChange: (patch: { technicalSpec: string; qualityStandard?: string }) => void;
  onEquipmentChange: (generalTechnicalSpec: string) => void;
  className?: string;
}

export default function MaterialDynamicSpecsSection({
  mode,
  technicalSpecPreview,
  generalSpecPreview,
  onSteelChange,
  onEquipmentChange,
  className = '',
}: MaterialDynamicSpecsSectionProps) {
  const [steelDimension, setSteelDimension] = useState('');
  const [steelThickness, setSteelThickness] = useState('');
  const [steelLength, setSteelLength] = useState('');
  const [steelGrade, setSteelGrade] = useState('');

  const [pumpPower, setPumpPower] = useState('');
  const [pumpFlow, setPumpFlow] = useState('');
  const [pumpPressure, setPumpPressure] = useState('');
  const [pumpVoltage, setPumpVoltage] = useState('');
  const [pumpDrive, setPumpDrive] = useState('');

  if (!mode) return null;

  const updateSteel = (dim: string, thick: string, len: string, grade: string) => {
    setSteelDimension(dim);
    setSteelThickness(thick);
    setSteelLength(len);
    setSteelGrade(grade);
    const dims = [dim.trim(), thick.trim(), len.trim()].filter(Boolean);
    const technicalSpec = dims.length > 0
      ? dims.join('x') + (dims.some(d => d.endsWith('mm')) ? '' : 'mm')
      : '';
    onSteelChange({
      technicalSpec,
      qualityStandard: grade.trim() || undefined,
    });
  };

  const updatePump = (power: string, flow: string, pressure: string, voltage: string, drive: string) => {
    setPumpPower(power);
    setPumpFlow(flow);
    setPumpPressure(pressure);
    setPumpVoltage(voltage);
    setPumpDrive(drive);
    const parts = [
      power.trim() && (power.toLowerCase().endsWith('kw') ? power.trim() : `${power.trim()}kW`),
      flow.trim() && (flow.toLowerCase().includes('m3') ? flow.trim() : `${flow.trim()} m³/h`),
      pressure.trim() && (
        pressure.toLowerCase().includes('pa') || pressure.toLowerCase().includes('h2o')
          ? pressure.trim()
          : `${pressure.trim()} Pa`
      ),
      voltage.trim() && `Điện áp ${voltage.trim()}`,
      drive.trim(),
    ].filter(Boolean);
    onEquipmentChange(parts.join(' | '));
  };

  if (mode === 'steel') {
    return (
      <div className={['mat-form-card mat-form-card--steel', className].filter(Boolean).join(' ')}>
        <div className="mat-form-card__header">
          <span className="mat-form-card__title mat-form-card__title--steel">
            <span className="mat-form-card__dot mat-form-card__dot--steel" aria-hidden />
            Thông số hình học (Thép & Nguyên vật liệu)
          </span>
          {technicalSpecPreview ? (
            <span className="mat-form-card__preview mat-form-card__preview--surface">
              Quy cách: {technicalSpecPreview}
            </span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <FormField label="Phi / Rộng (mm)">
            <input
              className="form-input w-full"
              value={steelDimension}
              onChange={e => updateSteel(e.target.value, steelThickness, steelLength, steelGrade)}
              placeholder="VD: Ø355 hoặc 1500"
            />
          </FormField>
          <FormField label="Độ dày (mm)">
            <input
              className="form-input w-full"
              value={steelThickness}
              onChange={e => updateSteel(steelDimension, e.target.value, steelLength, steelGrade)}
              placeholder="VD: 9 hoặc 4"
            />
          </FormField>
          <FormField label="Chiều dài (mm)">
            <input
              className="form-input w-full"
              value={steelLength}
              onChange={e => updateSteel(steelDimension, steelThickness, e.target.value, steelGrade)}
              placeholder="VD: 6000"
            />
          </FormField>
          <FormField label="Mác thép / Tiêu chuẩn">
            <input
              className="form-input w-full"
              value={steelGrade}
              onChange={e => updateSteel(steelDimension, steelThickness, steelLength, e.target.value)}
              placeholder="VD: SS400, SA516"
            />
          </FormField>
        </div>
      </div>
    );
  }

  return (
    <div className={['mat-form-card mat-form-card--equipment', className].filter(Boolean).join(' ')}>
      <div className="mat-form-card__header">
        <span className="mat-form-card__title mat-form-card__title--equipment">
          <span className="mat-form-card__dot mat-form-card__dot--equipment" aria-hidden />
          Thông số cơ điện (Động cơ / Bơm / Quạt)
        </span>
        {generalSpecPreview ? (
          <span className="mat-form-card__preview mat-form-card__preview--surface" title={generalSpecPreview}>
            {generalSpecPreview}
          </span>
        ) : null}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        <FormField label="Công suất (kW)">
          <input
            className="form-input w-full"
            value={pumpPower}
            onChange={e => updatePump(e.target.value, pumpFlow, pumpPressure, pumpVoltage, pumpDrive)}
            placeholder="VD: 160kW hoặc 5.5kW"
          />
        </FormField>
        <FormField label="Lưu lượng (m³/h)">
          <input
            className="form-input w-full"
            value={pumpFlow}
            onChange={e => updatePump(pumpPower, e.target.value, pumpPressure, pumpVoltage, pumpDrive)}
            placeholder="VD: 71500 m³/h"
          />
        </FormField>
        <FormField label="Cột áp (Pa / mH2O)">
          <input
            className="form-input w-full"
            value={pumpPressure}
            onChange={e => updatePump(pumpPower, pumpFlow, e.target.value, pumpVoltage, pumpDrive)}
            placeholder="VD: 5600Pa hoặc 24-42 mH2O"
          />
        </FormField>
        <FormField label="Điện áp">
          <input
            className="form-input w-full"
            value={pumpVoltage}
            onChange={e => updatePump(pumpPower, pumpFlow, pumpPressure, e.target.value, pumpDrive)}
            placeholder="VD: 3phase/380V/50Hz"
          />
        </FormField>
        <FormField label="Kiểu truyền động" className="sm:col-span-2">
          <input
            className="form-input w-full"
            value={pumpDrive}
            onChange={e => updatePump(pumpPower, pumpFlow, pumpPressure, pumpVoltage, e.target.value)}
            placeholder="VD: Truyền động trực tiếp / Gián tiếp qua dây đai"
          />
        </FormField>
      </div>
    </div>
  );
}
