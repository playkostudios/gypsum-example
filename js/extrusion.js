import { CSGPool, makeCirclePolyline, makeRotationMinimizingFrames, ExtrusionMesh, fixTangentList, extendCurveFrames } from 'gypsum-mesh';
import nurbs from 'nurbs';

WL.registerComponent('extrusion', {
    insideMaterial: {type: WL.Type.Material},
    candyCaneMaterial: {type: WL.Type.Material},
}, {
    getSpiralFrames() {
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

        for (let i = 0; i < subDivs; i++) {
            const t = domainStart + domainRange * i / (subDivs - 1);
            positions.push(helixNurbs.evaluate([], t));
            tangents.push(derivativeEvaluator([], t));
        }

        fixTangentList(tangents);
        const curve = makeRotationMinimizingFrames(positions, tangents, [0, 1, 0], { endNormal: [0, 1, 0] });
        return [curve, positions];
    },
    getSpiralExtrusion(curve, positions, radius, extraOptions) {
        const polyline = makeCirclePolyline(radius, false, 10);

        return new ExtrusionMesh(polyline, positions, curve, {
            smoothNormals: true,
            ...(extraOptions ?? {}),
        });
    },
    async init() {
        // create a CSG pool with a single worker
        const pool = new CSGPool(1);

        // make a thick spiral
        const [extCurve, extPos] = this.getSpiralFrames();
        const extrusion = this.getSpiralExtrusion(extCurve, extPos, 0.4, {
            startMaterial: this.insideMaterial,
            segmentMaterial: this.candyCaneMaterial,
            endMaterial: this.insideMaterial,
            segmentsUVs: [0, 7.5, null],
        });

        // make the same spiral, but thinner
        const [iExtCurve, iExtPos] = extendCurveFrames(extCurve, extPos);
        const innerExtrusion = this.getSpiralExtrusion(iExtCurve, iExtPos, 0.3, {
            startMaterial: this.insideMaterial,
            segmentMaterial: this.insideMaterial,
            endMaterial: this.insideMaterial,
            segmentsUVs: [0, 7.5, null],
        });

        // subtract the thinner spiral from the thicker spiral
        const csgResult = await pool.dispatch({
            operation: 'subtract',
            left: extrusion.mark(),
            right: innerExtrusion.mark(),
        });

        // add each submesh to the scene
        for (const [mesh, material] of csgResult.getSubmeshes()) {
          this.object.addComponent('mesh', {
            mesh,
            material: material ?? this.fallbackMaterial
          });
        }
    },
});
