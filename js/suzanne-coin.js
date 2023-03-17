import { Component, Type } from '@wonderlandengine/api';
import { CylinderMesh, MeshGroup } from 'gypsum-mesh';
import { getSharedCSGPool } from './csg-shared-pool';

// an example on how to do CSG on existing meshes; makes a coin out of the
// suzanne model by squishing it, adding it to a short cylinder and trimming the
// ears

export class SuzanneCoin extends Component {
    static TypeName = 'suzanne-coin';
    static Properties = {
        material: {type: Type.Material},
        suzanne: {type: Type.Mesh},
    };

    async start() {
        // make meshgroup out of suzanne mesh
        const suzanne = MeshGroup.fromWLEMesh(this.suzanne);

        // add squished suzanne to rotated short cylinder to make coin. trim the
        // ears out of the coin by doing an intersection with a similar cylinder
        const csgPool = getSharedCSGPool();
        const csgResult = await csgPool.dispatch(WL, {
            operation: 'rotate',
            degrees: [0, -135, 0],
            manifold: {
                operation: 'intersect',
                left: {
                    operation: 'add',
                    left: {
                        operation: 'translate',
                        offset: [0, 0, -0.2],
                        manifold: {
                            operation: 'rotate',
                            degrees: [90, 0, 0],
                            manifold: new CylinderMesh(WL, { radius: 1.1, height: 0.2 }).mark(),
                        },
                    },
                    right: {
                        operation: 'scale',
                        factor: [1, 1, 0.2],
                        manifold: suzanne.mark(),
                    },
                },
                right: {
                    operation: 'translate',
                    offset: [0, 0, -0.2],
                    manifold: {
                        operation: 'rotate',
                        degrees: [90, 0, 0],
                        manifold: new CylinderMesh(WL, { radius: 1.1, height: 0.5 }).mark(),
                    },
                }
            },
        });

        // add each submesh to the scene
        for (const [mesh, _material] of csgResult.getSubmeshes()) {
            this.object.addComponent('mesh', { mesh, material: this.material });
        }
    }
}

WL.registerComponent(SuzanneCoin);