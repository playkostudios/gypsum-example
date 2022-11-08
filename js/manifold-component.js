import { ManifoldPool } from 'manifold-wle';

WL.registerComponent('manifold-wle', {
    fallbackMaterial: {type: WL.Type.Material},
    baseMaterial: {type: WL.Type.Material},
    subMaterial: {type: WL.Type.Material},
    base: {type: WL.Type.Mesh},
    sub: {type: WL.Type.Mesh},
}, {
    async init() {
        const pool = new ManifoldPool(1);
        let results;

        results = await pool.dispatch({
            operation: 'subtract',
            left: this.base,
            right: {
                operation: 'scale',
                factor: 1.3,
                manifold: this.sub,
            },
        }, new Map([
            [this.base, this.baseMaterial],
            [this.sub, this.subMaterial]
        ]));

        // results = await pool.dispatch({
        //     operation: 'union',
        //     left: {
        //         operation: 'rotate',
        //         degrees: [0, 22.5, 0],
        //         manifold: {
        //             primitive: 'cube',
        //             size: 1,
        //             center: false,
        //         }
        //     },
        //     right: {
        //         operation: 'rotate',
        //         degrees: [0, 22.5, 0],
        //         manifold: {
        //             operation: 'translate',
        //             offset: [0.9999999, 0, 0],
        //             manifold: {
        //                 primitive: 'cube',
        //                 size: 1,
        //                 center: false,
        //             }
        //         }
        //     },
        // });

        for (const result of results) {
            const [mesh, material] = result;
            this.object.addComponent('mesh', {
                mesh,
                material: material ?? this.fallbackMaterial
            });
        }
    },
});
