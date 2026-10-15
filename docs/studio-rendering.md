# Satin metal panels

The excessive first studio-lighting pass has been removed. The adapter now adds
only a restrained satin finish to opaque painted panels: metallic 0.10, specular
0.08, roughness 0.28 and clear coat 0. The smoother finish keeps a small visible
highlight instead of the previous broad matte reflection that appeared hazy.
Source colors, RGB control graphs and
vertex-color shading remain intact. The key light is reduced by 5%. Panels use
30% of the original HDR environment contribution to prevent the white clipped
patches shown on the green top panels. New panels and color-change clones receive
the same absolute intensity, without repeated multiplication. Chrome and glass
retain their original reflection intensity. Global exposure is unchanged.

Only the same-origin source scene JSON response is adapted, in memory. The
captured scene file retains its original bytes. Failed adaptation falls back to
the original response. `?render-quality=original` disables the adapter.

Drawing resolution remains bounded at a mobile DPR cap of 1.5, desktop cap of 2
and 4 million pixels. `panel-reflections-4` versions the rendering script URL.

Automated checks cover the scene boundary, original geometry/color controls,
untouched non-panel materials and responsive resolution lifecycle. Actual visual
appearance has not been verified because the browser connection is unavailable.
