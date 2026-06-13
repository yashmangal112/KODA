// contexts/MeetingInvalidationContext.tsx

import React, { createContext, useCallback, useContext, useRef } from 'react';

type InvalidationContext = {
  markDirty: (meetingId?: string) => void;   // undefined = invalidate list
  consumeDirty: (meetingId?: string) => boolean;
};

const Ctx = createContext<InvalidationContext>({
  markDirty: () => {},
  consumeDirty: () => false,
});

export function MeetingInvalidationProvider({ children }: { children: React.ReactNode }) {
  // Set of dirty keys: 'list' | meetingId
  const dirtyKeys = useRef<Set<string>>(new Set());

  const markDirty = useCallback((meetingId?: string) => {
    dirtyKeys.current.add(meetingId ?? 'list');
    dirtyKeys.current.add('list'); // always also invalidate list
  }, []);

  const consumeDirty = useCallback((meetingId?: string) => {
    const key = meetingId ?? 'list';
    if (dirtyKeys.current.has(key)) {
      dirtyKeys.current.delete(key);
      return true;
    }
    return false;
  }, []);

  return <Ctx.Provider value={{ markDirty, consumeDirty }}>{children}</Ctx.Provider>;
}

export const useMeetingInvalidation = () => useContext(Ctx);