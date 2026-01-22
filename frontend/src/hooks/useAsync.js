import { useCallback, useEffect, useMemo, useState } from "react";

export function useAsync(asyncFn, deps = []) {
  const [state, setState] = useState({
    status: "idle",
    data: null,
    error: null,
  });

  const run = useCallback(async () => {
    setState({ status: "loading", data: null, error: null });
    try {
      const data = await asyncFn();
      setState({ status: "success", data, error: null });
      return data;
    } catch (error) {
      setState({ status: "error", data: null, error });
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    run();
  }, [run]);

  return useMemo(() => ({ ...state, run }), [state, run]);
}

