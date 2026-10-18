import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useDailyLogStore } from '@/store/dailyLogStore';
import { useUserStore } from '@/store/userStore';
import { useAdaptiveTdeeStore } from '@/store/adaptiveTdeeStore';
import { calculateAdaptiveTdee } from '@/utils/adaptiveTdee';

const MIN_DAYS_BETWEEN_CHECKS = 14;

function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24),
  );
}

export function useAdaptiveTdee(): void {
  const logs = useDailyLogStore((s) => s.logs);
  const profile = useUserStore((s) => s.profile);
  const { enabled, lastRecalculatedAt, setPendingResult, pendingResult } =
    useAdaptiveTdeeStore();

  useEffect(() => {
    const run = () => {
      if (!enabled || !profile || pendingResult) return;

      const today = new Date().toISOString().slice(0, 10);
      if (
        lastRecalculatedAt &&
        daysBetween(lastRecalculatedAt, today) < MIN_DAYS_BETWEEN_CHECKS
      ) {
        return;
      }

      const allLogs = Object.values(logs);
      const result = calculateAdaptiveTdee(
        allLogs,
        profile.dailyCalorieTarget,
        profile.goal,
      );

      if (result) setPendingResult(result);
    };

    run();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    return () => sub.remove();
  }, [enabled, logs, profile, lastRecalculatedAt, pendingResult, setPendingResult]);
}
