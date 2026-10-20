import { useFocusEffect } from 'expo-router';
import { useSQLiteContext, type SQLiteDatabase } from 'expo-sqlite';
import { useCallback, useState } from 'react';

/**
 * Runs `query` against the local database whenever the screen gains focus or
 * `key` changes, so data logged on another screen shows up on return. Pass
 * every input the query depends on (e.g. the selected day) in `key`.
 */
export function useFocusedQuery<T>(query: (db: SQLiteDatabase) => Promise<T>, key = '') {
  const db = useSQLiteContext();
  const [data, setData] = useState<T | undefined>(undefined);
  const [version, setVersion] = useState(0);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      query(db).then((result) => {
        if (!cancelled) setData(result);
      });
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [db, version, key]),
  );

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return { data, reload, db };
}
