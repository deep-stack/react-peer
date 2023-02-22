//
// Copyright 2023 Vulcanize, Inc.
//

import { useCallback } from 'react';
import throttle from 'lodash/throttle'

export function useThrottledCallback(callback, waitTime, options){
  const throttledCallback = useCallback(throttle(callback, waitTime, options), [callback]);
  return throttledCallback;
}
