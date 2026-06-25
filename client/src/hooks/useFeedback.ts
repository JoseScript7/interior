import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUserFeedback, createFeedback, fetchAllFeedback } from '../api/feedbackApi';

export function useUserFeedback() {
  return useQuery({
    queryKey: ['userFeedback'],
    queryFn: fetchUserFeedback,
    staleTime: 30_000,
  });
}

export function useAllFeedback() {
  return useQuery({
    queryKey: ['allFeedback'],
    queryFn: fetchAllFeedback,
    staleTime: 30_000,
  });
}

export function useCreateFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { title: string; message: string; category: string }) =>
      createFeedback(data.title, data.message, data.category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['userFeedback'] });
      queryClient.invalidateQueries({ queryKey: ['allFeedback'] });
    },
  });
}
