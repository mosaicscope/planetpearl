"""
Planet Pearl: photoreal chunky 3-ply yarn ball that unravels.
Run headless:
  blender -b -P yarn_film.py -- --frames 72 --start 0 --end 71 --out <dir> [--test]
Renders RGBA frames (transparent background) for the website hero.
"""
import bpy, sys, os, math, json
import numpy as np
from mathutils import Vector

argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
def arg(name, default):
    return argv[argv.index(name) + 1] if name in argv else default

FRAMES = int(arg('--frames', 72))
START = int(arg('--start', 0))
END = int(arg('--end', FRAMES - 1))
OUT = arg('--out', os.path.join(os.path.dirname(__file__), 'out'))
TEST = '--test' in argv
os.makedirs(OUT, exist_ok=True)

W, H = (int(arg('--w', 480 if TEST else 840)), int(arg('--h', 560 if TEST else 980)))
SAMPLES = int(arg('--samples', 24 if TEST else 48))
RT = arg('--rt', '1') == '1'

# ------------------------------------------------------------------ scene
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
engines = [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items]
scene.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in engines else 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x, scene.render.resolution_y = W, H
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
for k, v in (('taa_render_samples', SAMPLES), ('use_raytracing', RT), ('use_shadows', True),
             ('use_gtao', True), ('gtao_distance', 0.25), ('use_soft_shadows', True)):
    try: setattr(scene.eevee, k, v)
    except Exception: pass
scene.view_settings.view_transform = 'Standard'
try: scene.view_settings.look = 'None'
except Exception: pass

ims = scene.render.image_settings
ims.color_mode = 'RGBA'
EXT = 'webp'
try:
    ims.file_format = 'WEBP'; ims.quality = 88
except Exception:
    ims.file_format = 'PNG'; EXT = 'png'

# world: soft blush studio
world = bpy.data.worlds.new('w'); scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']
bg.inputs['Color'].default_value = (1.0, 0.90, 0.93, 1); bg.inputs['Strength'].default_value = 0.55

# camera (looking +Y, Z up), ball upper-middle of frame
cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 70; cam_d.sensor_width = 36
cam_d.sensor_fit = 'HORIZONTAL'
cam = bpy.data.objects.new('cam', cam_d); scene.collection.objects.link(cam)
cam.location = (0, -6.4, -0.82); cam.rotation_euler = (math.pi / 2, 0, 0)
scene.camera = cam
half_w = 6.4 * 18 / 70
half_h = half_w * H / W
FRAME_X = (-half_w, half_w)

def add_light(kind, loc, energy, size, color=(1, 0.95, 0.96), target=(0, 0, 0)):
    ld = bpy.data.lights.new(kind, kind); ld.energy = energy; ld.color = color
    if kind == 'AREA': ld.size = size
    if kind == 'SUN': ld.angle = size
    lo = bpy.data.objects.new(kind, ld); scene.collection.objects.link(lo); lo.location = loc
    d = Vector(target) - Vector(loc); lo.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    return lo
add_light('AREA', (-3.2, -4.5, 4.2), 900, 4.5)
add_light('AREA', (4.5, -3.0, 0.5), 260, 3.0, (1, 0.8, 0.86))
add_light('AREA', (0.0, 3.5, 2.5), 400, 3.0, (1, 0.85, 0.9))  # rim from behind

# ------------------------------------------------------------------ material
def yarn_material():
    m = bpy.data.materials.new('yarn'); m.use_nodes = True
    nt = m.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputMaterial')
    pb = nt.nodes.new('ShaderNodeBsdfPrincipled')
    geo = nt.nodes.new('ShaderNodeNewGeometry')
    sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.9; nz.inputs['Detail'].default_value = 2
    mix = nt.nodes.new('ShaderNodeMath'); mix.operation = 'MULTIPLY_ADD'
    ramp = nt.nodes.new('ShaderNodeValToRGB')
    pal = [(0.0, '#ffa6bd'), (0.3, '#ff86a6'), (0.55, '#f65a85'), (0.8, '#ff86a6'), (1.0, '#ffb3c6')]
    el = ramp.color_ramp.elements
    while len(el) < len(pal): el.new(0.5)
    def hexc(h):
        h = h.lstrip('#'); r, g, b = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
        f = lambda c: c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
        return (f(r), f(g), f(b), 1)
    for e, (p, h) in zip(el, pal): e.position = p; e.color = hexc(h)
    # variegation: hand-dyed ombre from position + noise
    nt.links.new(geo.outputs['Position'], sep.inputs['Vector'])
    nt.links.new(geo.outputs['Position'], nz.inputs['Vector'])
    add = nt.nodes.new('ShaderNodeMath'); add.operation = 'ADD'
    mix.inputs[1].default_value = 0.42; mix.inputs[2].default_value = 0.0
    nt.links.new(sep.outputs['Z'], mix.inputs[0])
    nt.links.new(mix.outputs[0], add.inputs[0]); nt.links.new(nz.outputs['Fac'], add.inputs[1])
    add2 = nt.nodes.new('ShaderNodeMath'); add2.operation = 'MULTIPLY'; add2.inputs[1].default_value = 1.0
    nt.links.new(add.outputs[0], add2.inputs[0]); nt.links.new(add2.outputs[0], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], pb.inputs['Base Color'])
    # fibre bump
    fib = nt.nodes.new('ShaderNodeTexNoise'); fib.inputs['Scale'].default_value = 260; fib.inputs['Detail'].default_value = 8
    fib.inputs['Roughness'].default_value = 0.75
    bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.55; bump.inputs['Distance'].default_value = 0.01
    nt.links.new(geo.outputs['Position'], fib.inputs['Vector'])
    nt.links.new(fib.outputs['Fac'], bump.inputs['Height'])
    nt.links.new(bump.outputs['Normal'], pb.inputs['Normal'])
    def setin(n, v):
        try: pb.inputs[n].default_value = v
        except Exception: pass
    setin('Roughness', 0.82); setin('Sheen Weight', 1.0); setin('Sheen Roughness', 0.32)
    setin('Sheen Tint', (1.0, 0.82, 0.88, 1)); setin('Specular IOR Level', 0.25)
    setin('Subsurface Weight', 0.18); setin('Subsurface Radius', (0.8, 0.25, 0.3))
    nt.links.new(pb.outputs['BSDF'], out.inputs['Surface'])
    return m
YARN = yarn_material()

def pearl_material():
    m = bpy.data.materials.new('pearl'); m.use_nodes = True
    pb = m.node_tree.nodes['Principled BSDF']
    pb.inputs['Base Color'].default_value = (1.0, 0.92, 0.95, 1)
    pb.inputs['Roughness'].default_value = 0.16
    for n, v in (('Coat Weight', 1.0), ('Coat Roughness', 0.05), ('Sheen Weight', 0.6), ('Specular IOR Level', 0.7)):
        try: pb.inputs[n].default_value = v
        except Exception: pass
    return m
bead = bpy.data.objects.new('bead', None)
bm = bpy.data.meshes.new('bead')
import bmesh
b = bmesh.new(); bmesh.ops.create_uvsphere(b, u_segments=32, v_segments=20, radius=0.075); b.to_mesh(bm); b.free()
bead = bpy.data.objects.new('bead', bm); scene.collection.objects.link(bead)
bead.data.materials.append(pearl_material())
for p in bead.data.polygons: p.use_smooth = True

# ------------------------------------------------------------------ geometry
PER_STEP = 0.026
LOOPS = 52
THETA = LOOPS * 2 * math.pi
th = np.arange(0, THETA, PER_STEP)
NB = len(th); t = th / th[-1]
r = 0.58 + 0.42 * t ** 0.7 + 0.012 * np.sin(1.7 * th)
def rot(v, axis, ang):  # rotate rows of v about unit axis by per-row angle
    axis = np.asarray(axis, float)
    c = np.cos(ang)[:, None]; s = np.sin(ang)[:, None]
    return v * c + np.cross(axis, v) * s + axis * (v @ axis)[:, None] * (1 - c)
v = np.stack([np.cos(th), np.zeros_like(th), np.sin(th)], 1)
v = rot(v, (1, 0, 0), 0.9 + 0.075 * th + 0.35 * np.sin(th * 0.19))
v = rot(v, (0, 1, 0), 0.029 * th + 0.4 * np.sin(th * 0.12 + 1))
v = rot(v, (0, 0, 1), 0.0176 * th + 0.3 * np.sin(th * 0.078))
BALL = v * r[:, None]          # (x, y_up?, z) generic; we use y as UP below
BALL_R = r

PLY_R = 0.0232
D_OFF = PLY_R * 2 / math.sqrt(3) * 1.0
PITCH = 0.30
DS = PITCH / 15

def catmull(pts, n=240):
    P = np.vstack([2 * pts[0] - pts[1], pts, 2 * pts[-1] - pts[-2]])
    out = []
    for i in range(1, len(P) - 2):
        for tt in np.linspace(0, 1, n // (len(pts) - 1), endpoint=False):
            p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * tt + (2 * p0 - 5 * p1 + 4 * p2 - p3) * tt ** 2 + (-p0 + 3 * p1 - 3 * p2 + p3) * tt ** 3))
    out.append(pts[-1])
    return np.array(out)

def resample(path, ds):
    seg = np.linalg.norm(np.diff(path, axis=0), axis=1)
    L = np.concatenate([[0], np.cumsum(seg)])
    s = np.arange(0, L[-1], ds)
    return np.stack([np.interp(s, L, path[:, k]) for k in range(3)], 1), s

def frames_pt(path):
    n = len(path)
    T = np.gradient(path, axis=0); T /= np.linalg.norm(T, axis=1)[:, None] + 1e-9
    N = np.zeros_like(path); B = np.zeros_like(path)
    n0 = np.array([1.0, 0, 0]) if abs(T[0, 0]) < 0.9 else np.array([0, 1.0, 0])
    n0 = n0 - T[0] * (n0 @ T[0]); n0 /= np.linalg.norm(n0)
    N[0] = n0
    for i in range(1, n):
        x = N[i - 1] - T[i] * (N[i - 1] @ T[i]); N[i] = x / (np.linalg.norm(x) + 1e-9)
    B = np.cross(T, N)
    return N, B

TAIL_X = 0.38
def build_curve(we, spin):
    # ball rotates as thread is pulled
    c = int(NB - (NB - NB * 0.2) * we) - 1
    P = BALL[:c + 1].copy()
    a = spin
    Rm = np.array([[math.cos(a), 0, math.sin(a)], [0, 1, 0], [-math.sin(a), 0, math.cos(a)]])
    P = P @ Rm.T
    tilt = 0.32
    Rt = np.array([[1, 0, 0], [0, math.cos(tilt), -math.sin(tilt)], [0, math.sin(tilt), math.cos(tilt)]])
    P = P @ Rt.T
    E = P[-1]
    # tail: from the loose end, down and out of the bottom of the frame
    sway = 0.18 * math.sin(we * 5.0)
    ctrl = np.array([E, [E[0] * 0.8 + 0.25, E[1] - 0.75, E[2] * 0.6 + 0.35],
                     [0.12 + sway, -1.9, 0.18], [TAIL_X + 0.2 * sway, -3.1, 0.05], [TAIL_X, -4.4, 0.0], [TAIL_X, -6.5, 0.0]])
    tail = catmull(ctrl, 300)
    seg = np.linalg.norm(np.diff(tail, axis=0), axis=1); cum = np.concatenate([[0], np.cumsum(seg)])
    Lmax = 0.45 + 5.4 * we ** 0.85 if we < 1 else 99
    keep = np.searchsorted(cum, Lmax); tail = tail[:max(keep, 4)]
    path = np.vstack([P, tail[1:]])
    path, s = resample(path, DS)
    return path, s, tail[-1]

curve_obj = None
def make_yarn(path, s):
    global curve_obj
    if curve_obj is not None:
        bpy.data.objects.remove(curve_obj, do_unlink=True)
        for c in list(bpy.data.curves):
            if c.users == 0: bpy.data.curves.remove(c)
    N, B = frames_pt(path)
    cu = bpy.data.curves.new('yarn', 'CURVE'); cu.dimensions = '3D'
    cu.bevel_depth = PLY_R; cu.bevel_resolution = 2; cu.use_fill_caps = True; cu.resolution_u = 1
    cu.materials.append(YARN)
    for j in range(3):
        ph = 2 * math.pi * j / 3
        ang = ph + 2 * math.pi * s / PITCH
        off = D_OFF * (np.cos(ang)[:, None] * N + np.sin(ang)[:, None] * B)
        pts = path + off
        sp = cu.splines.new('POLY'); sp.points.add(len(pts) - 1)
        co = np.hstack([pts, np.ones((len(pts), 1))]).astype(np.float32)
        # map (x, up, depth) -> blender (X, Y=depth, Z=up)
        co[:, [1, 2]] = co[:, [2, 1]]
        sp.points.foreach_set('co', co.ravel())
    curve_obj = bpy.data.objects.new('yarn', cu); scene.collection.objects.link(curve_obj)
    cu.use_map_taper = False

def render_frame(i):
    we = i / max(1, FRAMES - 1)
    we_e = we * we * (3 - 2 * we)
    path, s, tip = build_curve(we_e, spin=we_e * 3.0 + i * 0.01)
    make_yarn(path, s)
    tip_b = (tip[0], tip[2], tip[1])
    bead.location = tip_b
    bead.hide_render = bool(we_e >= 0.98 or tip[1] < -half_h - 0.9 + (-0.82))
    scene.render.filepath = os.path.join(OUT, 'f_%04d.%s' % (i, EXT))
    bpy.ops.render.render(write_still=True)
    print('rendered', i, 'pts', len(path))

for i in range(START, END + 1):
    render_frame(i)

meta = {'frames': FRAMES, 'width': W, 'height': H, 'ext': EXT,
        'tailXFrac': (TAIL_X - FRAME_X[0]) / (FRAME_X[1] - FRAME_X[0])}
with open(os.path.join(OUT, 'meta.json'), 'w') as f: json.dump(meta, f)
