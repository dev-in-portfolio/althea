"use client";

import { useEffect, useState } from "react";

export default function useUserKey() {
  const [userKey, setUserKey] = useState<string>("");

  useEffect(() => {
    const stored = window.localStorage.getItem("contradict_user_key");
    if (stored) {
      setUserKey(stored);
      return;
    }
    const generated = crypto.randomUUID();
    window.localStorage.setItem("contradict_user_key", generated);
    setUserKey(generated);
  }, []);

  return userKey;
}
