import { Component, Property } from '@wonderlandengine/api';

export class AutoRotateComponent extends Component {
    static TypeName = 'auto-rotate';
    static Properties = {
        rotationTime: Property.float(1.0),
        heightVariance: Property.float(1.0),
        heightVarianceTime: Property.float(1.0),
    };

    init() {
        const startPos = this.object.getPositionWorld([0, 0, 0]);
        this.radius = Math.sqrt(startPos[0] * startPos[0] + startPos[2] * startPos[2]);
        this.height = startPos[1];
        this.startTime = Date.now();
        this.rotTimeMS = this.rotationTime * 1000;
        this.heightRotTimeMS = this.heightVarianceTime * 1000;
        const TAU = Math.PI * 2;
        this.mul = TAU / this.rotTimeMS;
        this.heightMul = TAU / this.heightRotTimeMS;
        this.paused = false;

        window.addEventListener('keydown', (e) => {
            if (e.key === ' ') {
                this.paused = !this.paused;
            }
        });
    }

    update(_dt) {
        if (!this.paused) {
            const now = Date.now();
            const i = this.mul * ((now - this.startTime) % this.rotTimeMS);
            const j = this.heightMul * ((now - this.startTime) % this.heightRotTimeMS);
            this.object.setPositionWorld([
                this.radius * Math.sin(i),
                this.height + Math.sin(j),
                this.radius * Math.cos(i),
            ]);
        }
    }
}
