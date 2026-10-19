import { keepPreviousData, useQuery } from '@tanstack/vue-query'
import { toValue, type MaybeRefOrGetter } from 'vue'
import { attendanceApi } from './api'

export function useAttendance(params: MaybeRefOrGetter<{ patient_id?: number; days?: number | null }>) {
  return useQuery({
    queryKey: () => ['attendance', toValue(params)] as const,
    queryFn: () => attendanceApi.get(toValue(params)),
    placeholderData: keepPreviousData,
  })
}
