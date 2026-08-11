import { useQuery } from '@tanstack/react-query';
import {
  purchaseDocumentsService,
  type PurchaseDocumentListParams,
} from '../services/purchaseDocumentsService';

const LIST_KEY = ['purchasing', 'documents'] as const;

export function usePurchaseDocuments(params: PurchaseDocumentListParams = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => purchaseDocumentsService.list(params),
  });
}
