import { ManifoldPool, makeCirclePolyline, makeStarPolyline, makeRotationMinimizingFrames, ExtrusionMesh, ManifoldWLMesh, LinearExtrusionMesh, CubeMesh } from 'manifold-wle';
import nurbs from 'nurbs';
import { vec3 } from 'gl-matrix';

WL.registerComponent('manifold-wle', {
    fallbackMaterial: {type: WL.Type.Material},
    baseMaterial: {type: WL.Type.Material},
    subMaterial: {type: WL.Type.Material},
    endsMaterial: {type: WL.Type.Material},
    candyCaneMaterial: {type: WL.Type.Material},
    base: {type: WL.Type.Mesh},
    sub: {type: WL.Type.Mesh},
    cube: {type: WL.Type.Mesh},
    degenerateCase: {type: WL.Type.Mesh},
}, {
    getStraightExtrusion() {
        return new LinearExtrusionMesh(
            makeStarPolyline(0.4, 0.25, 5),
            4,
            { smoothNormals: false }
        );
    },
    getSpiralExtrusion(radius, extraOptions) {
        const helixHeight = 8;
        const helixSpacing = 1;
        const helixPoints = [];

        for (let i = 0; i < helixHeight; i++) {
            helixPoints.push([-1, i * helixSpacing, -1], [1, (i + 0.25) * helixSpacing, -1], [1, (i + 0.5) * helixSpacing, 1], [-1, (i + 0.75) * helixSpacing, 1]);
        }

        const helixNurbs = nurbs({points: helixPoints});
        const positions = [], tangents = [];
        const subDivs = 128;
        const domainStart = helixNurbs.domain[0][0];
        const domainRange = helixNurbs.domain[0][1] - domainStart;
        const derivativeEvaluator = helixNurbs.evaluator(1);
        let lastGoodTangent = derivativeEvaluator([], domainStart);

        for (let i = 0; i < subDivs; i++) {
            const t = domainStart + domainRange * i / (subDivs - 1);
            positions.push(helixNurbs.evaluate([], t));
            let tangent = i === 0 ? lastGoodTangent : derivativeEvaluator([], t);

            if (vec3.squaredLength(tangent) === 0) {
                tangent = lastGoodTangent;
            } else {
                vec3.normalize(tangent, tangent);
                lastGoodTangent = tangent;
            }

            tangents.push(tangent);
        }

        const polyline = makeCirclePolyline(radius, false, 10);
        // const polyline = makeStarPolyline(radius, radius * 0.625, 5);
        const curve = makeRotationMinimizingFrames(positions, tangents, [0, 1, 0], { endNormal: [0, 1, 0] });

        return new ExtrusionMesh(polyline, positions, curve, {
            smoothNormals: true,
            ...(extraOptions ?? {}),
        });
    },
    async init() {
        // const segmentUs = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];
        const extrusion = this.getSpiralExtrusion(0.4, {
            startMaterial: this.endsMaterial,
            segmentMaterial: this.candyCaneMaterial,
            endMaterial: this.endsMaterial,
            segmentsUVs: [0, 20, null],
        });

        // const innerExtrusion = this.getSpiralExtrusion(0.3, {
        //     startMaterial: this.endsMaterial,
        //     segmentMaterial: this.endsMaterial,
        //     endMaterial: this.endsMaterial
        // });
        // const extrusion = this.getStraightExtrusion();

        // const cube = new CubeMesh(1, { frontMaterial: this.candyCaneMaterial, frontUVs: 2 });

        const pool = new ManifoldPool(1);
        let results;

        // results = await pool.dispatch({
        //     operation: 'subtract',
        //     left: this.base,
        //     right: {
        //         operation: 'scale',
        //         factor: 1.3,
        //         manifold: this.sub,
        //     },
        // }, new Map([
        //     [this.base, this.baseMaterial],
        //     [this.sub, this.subMaterial]
        // ]));

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

        // results = await pool.dispatch({
        //     operation: 'union',
        //     left: {
        //         operation: 'translate',
        //         offset: [1, 0, 1],
        //         manifold: this.cube
        //     },
        //     right: this.cube,
        // });

        results = await pool.dispatch({
            operation: 'translate',
            offset: [0, 0, 0],
            manifold: extrusion
        });

        // const extrusionMesh = ManifoldWLMesh.manifoldToWLE(extrusion.premadeManifoldMesh);
        // results = [[extrusionMesh, null]];

        // extrusion.premadeManifoldMesh = undefined;
        // const extrusionMesh = ManifoldWLMesh.manifoldToWLE(extrusion.manifoldMesh);
        // results = [[extrusionMesh, null]];

        // results = extrusion.getSubmeshes();

        // results = await pool.dispatch({
        //     operation: 'subtract',
        //     left: extrusion,
        //     right: innerExtrusion,
        // });

        // results = cube.getSubmeshes();

        // results = await pool.dispatch({
        //     operation: 'translate',
        //     offset: [0, 0, 0],
        //     manifold: cube
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
