import { CSGPool } from 'gypsum-mesh';

// XXX ideally you would just export a shared instance like this:
// export const csgSharedPool = new CSGPool();
// ... but this will result in an error in the current Wonderland Engine version
// due to the build system

let pool = null;

/** @returns { CSGPool } */
export function getSharedCSGPool() {
    if (pool === null) {
        pool = new CSGPool();
    }

    return pool;
}