import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

export function useNavigation() {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  const navigate = useCallback(
    (path: string) => {
      setIsNavigating(true);
      router.push(path);
    },
    [router]
  );

  const goBack = useCallback(() => {
    router.back();
  }, [router]);

  return {
    navigate,
    goBack,
    isNavigating,
    setIsNavigating,
  };
}

