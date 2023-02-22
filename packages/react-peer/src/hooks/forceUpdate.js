//
// Copyright 2023 Vulcanize, Inc.
//

import { useCallback, useState } from 'react';

export function useForceUpdate(){
    const [, setValue] = useState(0); // integer state
    const forceUpdate = useCallback(() => setValue(value => value + 1), [setValue]); // update state to force render

    return forceUpdate;
}
