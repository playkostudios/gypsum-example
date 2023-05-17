import { Component, Property } from '@wonderlandengine/api';
import { CubeMesh } from 'gypsum-mesh';
import { getSharedCSGPool } from './csg-shared-pool';

// a simple example on how to do CSG: subtracts 2 cubes

export class SimpleCubeCSGComponent extends Component {
    static TypeName = 'simple-cube-csg';
    static Properties = {
        baseMaterial: Property.material(),
        subMaterial: Property.material(),
        fallbackMaterial: Property.material(),
    };

    async start() {
        // subtract the base cube from the offset subtraction cube
        const csgPool = getSharedCSGPool();
        const csgResult = await csgPool.dispatch(this.engine, {
            operation: 'subtract',
            left: new CubeMesh(this.engine, 2, { material: this.baseMaterial }).mark(),
            right: {
                operation: 'translate',
                offset: [1, 1, 1],
                manifold: new CubeMesh(this.engine, 2, { material: this.subMaterial }).mark(),
            }
        });

        // add each submesh to the scene
        for (const [mesh, material] of csgResult.getSubmeshes()) {
            this.object.addComponent('mesh', {
                mesh,
                material: material ?? this.fallbackMaterial
            });
        }
    }
}
