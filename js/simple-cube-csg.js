import { Component, Type } from '@wonderlandengine/api';
import { CubeMesh } from 'gypsum-mesh';
import { getSharedCSGPool } from './csg-shared-pool';

// a simple example on how to do CSG: subtracts 2 cubes

export class SimpleCubeCSG extends Component {
    static TypeName = 'simple-cube-csg';
    static Properties = {
        baseMaterial: {type: Type.Material},
        subMaterial: {type: Type.Material},
        fallbackMaterial: {type: Type.Material},
    };

    async start() {
        // subtract the base cube from the offset subtraction cube
        const csgPool = getSharedCSGPool();
        const csgResult = await csgPool.dispatch(WL, {
            operation: 'subtract',
            left: new CubeMesh(WL, 2, { material: this.baseMaterial }).mark(),
            right: {
                operation: 'translate',
                offset: [1, 1, 1],
                manifold: new CubeMesh(WL, 2, { material: this.subMaterial }).mark(),
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

WL.registerComponent(SimpleCubeCSG);