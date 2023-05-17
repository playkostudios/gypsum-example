import { Component, MeshAttribute, Property } from '@wonderlandengine/api';
import { makeCirclePolyline, makeRotationMinimizingFrames, ExtrusionMesh, fixTangentList, extendCurveFrames } from 'gypsum-mesh';
import nurbs from 'nurbs';
import { getSharedCSGPool } from './csg-shared-pool';

// a more complicated example. shows how to procedurally generate extrusion
// meshes, how to use mesh hinting and how to apply multiple materials to
// procedural meshes

export class ExtrusionComponent extends Component {
    static TypeName = 'extrusion';
    static Properties = {
        insideMaterial: Property.material(),
        candyCaneMaterial: Property.material(),
        fallbackMaterial: Property.material(),
    };

    getSpiralFrames(helixHeight = 8, helixSpacing = 1, subDivs = 128) {
        const helixPoints = [];

        for (let i = 0; i < helixHeight; i++) {
            helixPoints.push([-1, i * helixSpacing, -1], [1, (i + 0.25) * helixSpacing, -1], [1, (i + 0.5) * helixSpacing, 1], [-1, (i + 0.75) * helixSpacing, 1]);
        }

        const helixNurbs = nurbs({points: helixPoints});
        const positions = [], tangents = [];
        const domainStart = helixNurbs.domain[0][0];
        const domainRange = helixNurbs.domain[0][1] - domainStart;
        const derivativeEvaluator = helixNurbs.evaluator(1);

        for (let i = 0; i < subDivs; i++) {
            const t = domainStart + domainRange * i / (subDivs - 1);
            positions.push(helixNurbs.evaluate([], t));
            tangents.push(derivativeEvaluator([], t));
        }

        fixTangentList(tangents);
        const curve = makeRotationMinimizingFrames(positions, tangents, [0, 1, 0], { endNormal: [0, 1, 0] });
        return [curve, positions];
    }

    getSpiralExtrusion(curve, positions, radius, extraOptions) {
        const polyline = makeCirclePolyline(radius, false, 10);

        return new ExtrusionMesh(this.engine, polyline, positions, curve, {
            smoothNormals: true,
            ...(extraOptions ?? {}),
        });
    }

    async start() {
        // make a thick spiral
        const [extCurve, extPos] = this.getSpiralFrames();
        const extrusion = this.getSpiralExtrusion(extCurve, extPos, 0.4, {
            startMaterial: this.insideMaterial,
            segmentMaterial: this.candyCaneMaterial,
            endMaterial: this.insideMaterial,
            segmentsUVs: [0, 7.5, null],
            hints: new Map([
                [null, new Set([ MeshAttribute.Normal ])],
                [this.candyCaneMaterial, new Set([ MeshAttribute.Normal, MeshAttribute.TextureCoordinate ])],
            ]),
        });

        // make the same spiral, but thinner
        const [iExtCurve, iExtPos] = extendCurveFrames(extCurve, extPos);
        const innerExtrusion = this.getSpiralExtrusion(iExtCurve, iExtPos, 0.3, {
            startMaterial: this.insideMaterial,
            segmentMaterial: this.insideMaterial,
            endMaterial: this.insideMaterial,
            segmentsUVs: [0, 7.5, null],
            hints: new Map([
                [null, new Set([ MeshAttribute.Normal ])],
            ]),
        });

        // subtract the thinner spiral from the thicker spiral
        const csgPool = getSharedCSGPool();
        const csgResult = await csgPool.dispatch(this.engine, {
            operation: 'rotate',
            degrees: [45, 45, 45],
            manifold: {
                operation: 'subtract',
                left: extrusion.mark(),
                right: innerExtrusion.mark(),
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