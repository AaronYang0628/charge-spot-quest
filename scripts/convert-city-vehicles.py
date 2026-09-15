"""Convert eight selected City Pack FBX files to GLB (Python + bpy 4.2 + Pillow).

python scripts/convert-city-vehicles.py "D:/Downloads/POLYGON - City Pack 1.1.unitypackage"
npm run assets:optimize -- ambulance police taxi sedan compact citycar muscle van

City prefab material 62e25ef75a2216f418d06453c9ad15cb references
PolygonCity_Texture_01_A.png. Keep UV textures for service liveries / markings.
Original package contents are extracted only into a temporary directory.
"""
import collections
import json
import math
import os
from pathlib import Path, PurePosixPath
import sys
import tarfile
import tempfile

import bpy
from mathutils import Vector
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/models'
SELECTION = {
    'ambulance': ('SM_Veh_Car_Ambo_01', 4.7),
    'police': ('SM_Veh_Car_Police_01', 4.4),
    'taxi': ('SM_Veh_Car_Taxi_01', 4.4),
    'sedan': ('SM_Veh_Car_Sedan_01', 4.4),
    'compact': ('SM_Veh_Car_Small_01', 3.6),
    'citycar': ('SM_Veh_Car_Medium_01', 4.1),
    'muscle': ('SM_Veh_Car_Muscle_01', 4.5),
    'van': ('SM_Veh_Car_Van_01', 4.65),
}
ATLAS = 'PolygonCity_Texture_01_A.png'

def mat(name, color):
    material = bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = .8
    return material

with tempfile.TemporaryDirectory(prefix='charge-city-') as tmp:
    tmp = Path(tmp)
    with tarfile.open(sys.argv[1]) as archive:
        paths = {m.name.rsplit('/', 1)[0]: archive.extractfile(m).read().decode('utf-8-sig').splitlines()[0]
                 for m in archive.getmembers() if m.name.endswith('/pathname')}
        selected_files = {v[0] + '.fbx' for v in SELECTION.values()} | {ATLAS}
        for key, path in paths.items():
            filename = PurePosixPath(path).name
            if filename in selected_files:
                (tmp / filename).write_bytes(archive.extractfile(key + '/asset').read())
    atlas = Image.open(tmp / ATLAS).convert('RGB')
    atlas.resize((1024, 1024), Image.Resampling.LANCZOS).save(tmp / 'city-atlas.png')

    def sample(uv):
        if not all(math.isfinite(v) for v in uv): return (128, 128, 128)
        x = min(atlas.width - 1, max(0, int(uv.x * atlas.width)))
        y = min(atlas.height - 1, max(0, int((1 - uv.y) * atlas.height)))
        return atlas.getpixel((x, y))

    manifest_path = OUT / 'manifest.json'
    report = json.loads(manifest_path.read_text(encoding='utf-8'))
    for name, (source, length) in SELECTION.items():
        bpy.ops.wm.read_factory_settings(use_empty=True)
        bpy.ops.import_scene.fbx(filepath=str(tmp / (source + '.fbx')))
        meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
        corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
        lo = Vector(tuple(min(c[i] for c in corners) for i in range(3)))
        hi = Vector(tuple(max(c[i] for c in corners) for i in range(3)))
        center = Vector(((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, lo.z))
        scale = min(length / (hi.y - lo.y), 2.3 / (hi.x - lo.x))
        front = [o.matrix_world.translation.y for o in meshes if o.name.endswith(('Wheel_fl', 'Wheel_fr'))]
        rear = [o.matrix_world.translation.y for o in meshes if o.name.endswith(('Wheel_rl', 'Wheel_rr'))]
        flip = bool(front and rear and sum(front) / len(front) > sum(rear) / len(rear))
        root = bpy.data.objects.new(name, None)
        bpy.context.collection.objects.link(root)
        root.scale = (scale,) * 3
        root.rotation_euler.z = math.pi if flip else 0
        root['vehicleType'] = name
        root['length'] = length
        root['sourcePack'] = 'POLYGON City Pack 1.1'
        base = mat('CityLivery', (1, 1, 1, 1))
        tex = base.node_tree.nodes.new('ShaderNodeTexImage')
        tex.image = bpy.data.images.load(str(tmp / 'city-atlas.png'))
        base.node_tree.links.new(tex.outputs['Color'], base.node_tree.nodes.get('Principled BSDF').inputs['Base Color'])
        paint = mat('CarPaint', (0, .246, .63, 1))
        glass = mat('Glass', (.025, .055, .075, 1))
        paintable = name not in ('ambulance', 'police', 'taxi')
        swatches = collections.Counter()
        body_colors = {}
        # Detect the broad paint swatch by area, not by tiny triangles in trim.
        for obj in meshes:
            if obj.name != source and '_Door_' not in obj.name: continue
            if 'Glass' in obj.name or not obj.data.uv_layers.active: continue
            uv = [d.uv.copy() for d in obj.data.uv_layers.active.data]
            for face in obj.data.polygons:
                rgb = sample(sum((uv[i] for i in face.loop_indices), Vector((0, 0))) / len(face.loop_indices))
                body_colors[(obj.name, face.index)] = rgb
                if max(rgb) > 75 and max(rgb) - min(rgb) > 45:
                    swatches[rgb] += face.area
        paint_rgb = swatches.most_common(1)[0][0] if swatches else None
        paint_faces = 0
        for obj in meshes:
            world = obj.matrix_world.copy()
            obj.parent = root
            obj.matrix_basis = world
            obj.location -= center
            mesh = obj.data
            mesh.materials.clear()
            for material in (base, paint, glass): mesh.materials.append(material)
            for face in mesh.polygons:
                face.use_smooth = False
                rgb = body_colors.get((obj.name, face.index))
                is_paint = bool(paintable and paint_rgb and rgb and sum((a-b)**2 for a,b in zip(rgb,paint_rgb)) < 30**2)
                face.material_index = 2 if 'Glass' in obj.name else 1 if is_paint else 0
                paint_faces += int(is_paint)
        bpy.ops.export_scene.gltf(filepath=str(OUT / (name + '.glb')), export_format='GLB',
            export_yup=True, export_animations=False, export_cameras=False,
            export_lights=False, export_extras=True)
        report[name] = {'source': source, 'sourcePack': 'POLYGON City Pack 1.1', 'atlas': ATLAS,
            'originalBounds': [list(lo), list(hi)], 'scale': scale, 'flippedToPositiveZ': flip,
            'paintSwatch': paint_rgb, 'paintFaces': paint_faces, 'livery': not paintable,
            'bytes': (OUT / (name + '.glb')).stat().st_size}
        print(name, report[name], flush=True)
    manifest_path.write_text(json.dumps(report, indent=2), encoding='utf-8')
sys.stdout.flush()
os._exit(0)
