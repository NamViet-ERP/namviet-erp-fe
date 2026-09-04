import { useQuery } from '@tanstack/react-query';
import {
  purchaseDocumentsService,
  type PurchaseDocumentListParams,
} from '../services/purchaseDocumentsService';
import { queryKeys } from '../services/queryKeys';

const LIST_KEY = queryKeys.purchaseDocuments.all;

export function usePurchaseDocuments(params: PurchaseDocumentListParams = {}) {
  return useQuery({
    queryKey: [...LIST_KEY, params],
    queryFn: () => purchaseDocumentsService.list(params),
  });
}
