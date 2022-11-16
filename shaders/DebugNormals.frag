#include "lib/Compatibility.frag"
#define USE_NORMAL
#include "lib/Inputs.frag"

void main() {
    outColor = vec4(abs(fragNormal), 1.0);
}
