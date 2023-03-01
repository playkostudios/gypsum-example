import { WasdControlsComponent, MouseLookComponent } from '@wonderlandengine/components';

WL.registerComponent(WasdControlsComponent);
WL.registerComponent(MouseLookComponent);

/* wle:auto-imports:start */
import { AutoRotate } from './auto-rotate.js';
WL.registerComponent(AutoRotate);
import { Extrusion } from './extrusion.js';
WL.registerComponent(Extrusion);
/* wle:auto-imports:end */