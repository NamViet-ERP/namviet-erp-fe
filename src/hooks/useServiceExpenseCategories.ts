import { useQuery } from '@tanstack/react-query';
import {
  serviceExpenseCategoriesService,
  type ServiceExpenseCategoryDto,
} from '../services/serviceExpenseCategoriesService';

export function useServiceExpenseCategories() {
  const query = useQuery<ServiceExpenseCategoryDto[]>({
    queryKey: ['serviceExpenseCategories'] as const,
    queryFn: () => serviceExpenseCategoriesService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  return {
    categories: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}
