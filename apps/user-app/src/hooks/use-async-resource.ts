import { useCallback, useEffect, useRef, useState } from 'react';

export function useAsyncResource<T>(loader: () => Promise<T>, dependencyKey = '') {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  const reload = useCallback(async () => {
    void dependencyKey;
    setLoading(true);
    setError(null);
    try {
      setData(await loaderRef.current());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [dependencyKey]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { data, error, loading, reload };
}
