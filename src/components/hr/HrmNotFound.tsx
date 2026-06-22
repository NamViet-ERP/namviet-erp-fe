import { UI_LOADING } from '../../lib/uiMessages';

interface HrmNotFoundProps {
  message: string;
  backLabel?: string;
  onBack: () => void;
}

export default function HrmNotFound({ message, backLabel = 'Quay lại', onBack }: HrmNotFoundProps) {
  return (
    <div className="hrm-empty">
      <p className="mb-4">{message}</p>
      <button type="button" className="btn btn-outline" onClick={onBack}>
        {backLabel}
      </button>
    </div>
  );
}

export function HrmLoadingState({ message = UI_LOADING.default }: { message?: string }) {
  return <div className="hrm-empty">{message}</div>;
}
