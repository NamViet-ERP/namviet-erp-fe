import { useCallback, useState } from 'react';
import { showToast } from '../../components/ui/Toast';
import {
  initialExpectedData,
  targetProjects,
  type ExpectedItem,
  type ScanResult,
  type TargetProject,
} from '../../mocks/pages/expectedImports';

export type { ExpectedItem, ScanResult, TargetProject };

function runScan(
  selectedTargetProject: string,
  expectedData: ExpectedItem[],
): ScanResult[] {
  const target = targetProjects.find((p) => p.id === selectedTargetProject);
  if (!target) return [];

  const matches: ScanResult[] = [];

  target.requirements.forEach((req) => {
    const suppliers = expectedData.filter((item) => item.sku === req.sku && item.surplus > 0);
    const totalSurplus = suppliers.reduce((sum, item) => sum + item.surplus, 0);

    if (totalSurplus > 0) {
      const qtyToAllocate = Math.min(req.needed, totalSurplus);
      matches.push({
        sku: req.sku,
        name: req.name,
        needed: req.needed,
        availableSurplus: totalSurplus,
        allocated: qtyToAllocate,
        sources: suppliers.map((s) => ({
          project: s.project,
          surplusAvailable: s.surplus,
          id: s.id,
        })),
      });
    }
  });

  return matches;
}

function applyCoordination(
  expectedData: ExpectedItem[],
  scanResults: ScanResult[],
): ExpectedItem[] {
  return expectedData.map((item) => {
    let matchedAlloc = 0;
    scanResults.forEach((res) => {
      const sourceMatch = res.sources.find((src) => src.id === item.id);
      if (sourceMatch) {
        matchedAlloc = res.allocated;
      }
    });
    return {
      ...item,
      surplus: Math.max(0, item.surplus - matchedAlloc),
    };
  });
}

export function useExpectedImportsCoordination() {
  const [expectedData, setExpectedData] = useState<ExpectedItem[]>(initialExpectedData);
  const [selectedTargetProject, setSelectedTargetProject] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<ScanResult[] | null>(null);
  const [coordinationSuccess, setCoordinationSuccess] = useState(false);

  const selectedProjObj = targetProjects.find((p) => p.id === selectedTargetProject);

  const handleStartScan = useCallback(() => {
    if (!selectedTargetProject) {
      showToast('error', 'Vui lòng chọn Dự án thụ hưởng để kiểm tra', 'Thiếu thông tin');
      return;
    }
    setIsScanning(true);
    setScanResults(null);
    setCoordinationSuccess(false);

    setTimeout(() => {
      const matches = runScan(selectedTargetProject, expectedData);
      setScanResults(matches);
      setIsScanning(false);
      showToast('success', `Đã quét và tìm thấy ${matches.length} loại vật tư có thể điều phối!`, 'Quét hoàn tất');
    }, 1500);
  }, [expectedData, selectedTargetProject]);

  const handleCreateCoordination = useCallback(() => {
    if (!scanResults || scanResults.length === 0) return;

    setExpectedData((prev) => applyCoordination(prev, scanResults));
    setCoordinationSuccess(true);
    setScanResults(null);
    showToast('success', 'Đã tự động tạo Phiếu chuyển kho liên dự án thành công!', 'Điều phối hoàn tất');
  }, [scanResults]);

  const handleSelectTargetProject = useCallback((projectId: string) => {
    setSelectedTargetProject(projectId);
    setScanResults(null);
    setCoordinationSuccess(false);
  }, []);

  return {
    expectedData,
    targetProjects,
    selectedTargetProject,
    selectedProjObj,
    isScanning,
    scanResults,
    coordinationSuccess,
    handleStartScan,
    handleCreateCoordination,
    handleSelectTargetProject,
  };
}
