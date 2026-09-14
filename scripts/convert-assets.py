"""Run with Python + bpy 4.2: python scripts/convert-assets.py <unitypackage>.
Selected sources are extracted to the OS temp directory, never shipped wholesale.
Atlas colors are baked per face to vertex colors; paint is a separate material.
"""
import sys, tarfile, tempfile, pathlib, json, collections, math, os
import bpy
from mathutils import Vector
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/models'
OUT.mkdir(parents=True, exist_ok=True)
SELECTION = {
    'pickup': 'SM_Veh_Pickup_01', 'convertible': 'SM_Veh_Convertable_01',
    'tree': 'SM_Env_Tree_01', 'bush': 'SM_Env_Bush_01',
    'lamp': 'SM_Prop_Streetlamp_01', 'house': 'SM_Bld_House_Preset_01',
}

def material(name, color=(1, 1, 1, 1), vertex=False):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = .85
    if vertex:
        node = mat.node_tree.nodes.new('ShaderNodeVertexColor')
        node.layer_name = 'Color'
        mat.node_tree.links.new(node.outputs['Color'], bsdf.inputs['Base Color'])
    return mat

with tempfile.TemporaryDirectory(prefix='charge-town-') as tmp:
    tmp = pathlib.Path(tmp)
    with tarfile.open(sys.argv[1]) as archive:
        paths = {m.name.rsplit('/', 1)[0]: archive.extractfile(m).read().decode('utf-8-sig').splitlines()[0]
                 for m in archive.getmembers() if m.name.endswith('/pathname')}
        for key, path in paths.items():
            name = pathlib.PurePosixPath(path).name
            if name in [s + '.fbx' for s in SELECTION.values()] or name == 'PolygonTown_Texture_01_A.png':
                (tmp / name).write_bytes(archive.extractfile(key + '/asset').read())
    atlas = Image.open(tmp / 'PolygonTown_Texture_01_A.png').convert('RGB')
    def sample(uv):
        if not all(math.isfinite(v) for v in uv): return (100,100,100)
        x = min(atlas.width-1, max(0, int(uv.x * atlas.width)))
        y = min(atlas.height-1, max(0, int((1-uv.y) * atlas.height)))
        return atlas.getpixel((x, y))
    report = {}
    for name, source in SELECTION.items():
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=str(tmp / (source + '.fbx')))
        meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
        vehicle = name in ('pickup', 'convertible')
        # Evaluate original world-space bounds before parenting / centering.
        corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
        lo = Vector(tuple(min(c[i] for c in corners) for i in range(3)))
        hi = Vector(tuple(max(c[i] for c in corners) for i in range(3)))
        center = Vector(((lo.x+hi.x)/2, (lo.y+hi.y)/2, lo.z))
        scale = 4.6 / (hi.y-lo.y) if vehicle else 1
        root = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(root)
        root.scale = (scale,)*3
        base = material('AtlasColors', vertex=True)
        paint = material('CarPaint', (.0, .246, .63, 1))
        glass = material('Glass', (.025, .045, .07, 1))
        histogram = collections.Counter()
        paint_faces = 0
        for obj in meshes:
            world = obj.matrix_world.copy()
            obj.parent = root
            obj.matrix_basis = world
            obj.location -= center
            mesh = obj.data
            uv = [d.uv.copy() for d in mesh.uv_layers.active.data] if mesh.uv_layers.active else None
            colors = mesh.color_attributes.new(name='Color', type='BYTE_COLOR', domain='CORNER')
            mesh.materials.clear()
            for mat in (base, paint, glass): mesh.materials.append(mat)
            for face in mesh.polygons:
                face.use_smooth = False
                rgb = sample(sum((uv[i] for i in face.loop_indices), Vector((0,0))) / len(face.loop_indices)) if uv else (150,150,150)
                histogram[rgb] += 1
                # Town's blue paint swatches; exclude wheels, interior and lamps.
                is_paint = vehicle and obj.name == source and rgb[2] > rgb[0]*1.4 and rgb[2] > rgb[1]*1.3 and rgb[2] > 100
                face.material_index = 2 if 'Glass' in obj.name else 1 if is_paint else 0
                paint_faces += int(is_paint)
                if name == 'house':
                    world_center = world @ face.center
                    normal = (world.to_3x3() @ face.normal).normalized()
                    if (world_center.z > 3.6 and abs(normal.z) > .15) or (abs(rgb[0]-42)<3 and max(rgb)-min(rgb)<3):
                        rgb = (181, 86, 54) if normal.x > 0 else (204, 109, 68)
                    elif min(rgb) > 95:
                        rgb = (237, 218, 178)
                    elif max(rgb) < 100:
                        rgb = (61, 89, 84)
                elif name in ('tree','bush') and rgb[1] > rgb[0]:
                    rgb = (112, 148, 84) if face.normal.z > 0 else (92, 125, 72)
                for i in face.loop_indices:
                    colors.data[i].color_srgb = (*[v/255 for v in rgb], 1)
            # UVs no longer needed after baking the shared palette.
            for layer in list(mesh.uv_layers): mesh.uv_layers.remove(layer)
        bpy.ops.export_scene.gltf(filepath=str(OUT / (name + '.glb')), export_format='GLB',
                                  export_yup=True, export_animations=False, export_cameras=False,
                                  export_lights=False, export_materials='EXPORT')
        report[name] = {'source': source, 'originalBounds': [list(lo), list(hi)],
                        'scale': scale, 'paintFaces': paint_faces,
                        'topColors': histogram.most_common(12), 'bytes': (OUT/(name+'.glb')).stat().st_size}
        print(name, report[name], flush=True)
    (OUT / 'manifest.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
# bpy's Windows wheel can fail during interpreter teardown after a successful export.
sys.stdout.flush()
os._exit(0)
