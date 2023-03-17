import { Component, Type } from '@wonderlandengine/api';
import { CubeMesh } from 'gypsum-mesh';
import { getSharedCSGPool } from './csg-shared-pool';

// similar to the simple cube CSG example, except the cube meshes are reused to
// show how manual memory management (.dispose() instead of .mark()) works in
// gypsum

export class ManualMemoryManagement extends Component {
    static TypeName = 'manual-memory-management';
    static Properties = {
        material: {type: Type.Material},
    };

    async start() {
        // make cube meshgroup
        const cube = new CubeMesh(WL, 2);

        // subtract the base cube from the offset subtraction cube
        const csgPool = getSharedCSGPool();
        const csgResult = await csgPool.dispatch(WL, {
            operation: 'subtract',
            left: cube,
            right: {
                operation: 'translate',
                offset: [1, 1, 1],
                manifold: cube,
            }
        });

        // destroy cube meshgroup
        cube.dispose();

        // add each submesh to the scene
        for (const [mesh, _material] of csgResult.getSubmeshes()) {
            this.object.addComponent('mesh', { mesh, material: this.material });
        }
    }
}

WL.registerComponent(ManualMemoryManagement);