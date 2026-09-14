import { RoundedBox } from '@react-three/drei'
import { Prop } from './SceneModels'

function Block({ p, s, c, rotation = 0 }: {p:[number,number,number];s:[number,number,number];c:string;rotation?:number}) {
  return <mesh position={p} rotation-y={rotation} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.95}/></mesh>
}
function Planter({x,z,length=2.2}: {x:number;z:number;length?:number}) {
  return <group position={[x,0,z]}>
    <RoundedBox args={[.85,.35,length]} radius={.09} smoothness={2} position={[0,.15,0]} castShadow receiveShadow><meshStandardMaterial color="#e6d5b5"/></RoundedBox>
    <Block p={[0,.34,0]} s={[.66,.03,length-.18]} c="#7d7653"/>
    {Array.from({length:5},(_,i)=><group key={i} position={[Math.sin(i*12)*.2,.39,(i-2)*(length/6)]}>
      <mesh position={[0,.1,0]}><coneGeometry args={[.18,.35,5]}/><meshStandardMaterial color="#7e9f68"/></mesh>
      <mesh position={[.03,.3,.02]} castShadow><icosahedronGeometry args={[.13,0]}/><meshStandardMaterial color={i%2?'#ecc66c':'#d68e81'}/></mesh>
    </group>)}
  </group>
}
function Bench({x,z}: {x:number;z:number}) {
  return <group position={[x,0,z]}>
    {[-.65,.65].map(v=><Block key={v} p={[v,.28,0]} s={[.1,.55,.5]} c="#405f59"/>)}
    {[0,1,2].map(i=><Block key={i} p={[0,.55,i*.15-.15]} s={[1.7,.07,.12]} c="#c59361"/>)}
    {[0,1].map(i=><Block key={i} p={[0,.83+i*.18,-.25]} s={[1.7,.12,.065]} c="#c59361"/>)}
  </group>
}
export default function TownBackdrop() {
  return <group>
    <mesh rotation={[-Math.PI/2,0,0]} position={[0,-.75,0]} receiveShadow><planeGeometry args={[200,200]}/><meshStandardMaterial color="#ece6d6"/></mesh>
    <RoundedBox args={[14.6,.55,18.5]} radius={.2} smoothness={2} position={[0,-.42,-2.5]} receiveShadow castShadow><meshStandardMaterial color="#d0bb98"/></RoundedBox>
    <RoundedBox args={[14.6,.13,18.5]} radius={.04} smoothness={2} position={[0,-.12,-2.5]} receiveShadow><meshStandardMaterial color="#eee1c6"/></RoundedBox>
    {/* A connected street behind the charging courtyard. */}
    <Block p={[0,-.005,-6.2]} s={[14.5,.025,2.3]} c="#91a09c"/>
    {[-6,-3,0,3,6].map(x=><Block key={x} p={[x,.016,-6.2]} s={[1.1,.012,.06]} c="#e6e1c8"/>)}
    {[-7.15,7.15].map(x=><group key={x}>
      {[0,1,2,3].map(i=><Block key={i} p={[x,.018,-6.95+i*.5]} s={[.2,.015,.28]} c="#f7efd8"/>)}
    </group>)}
    <Block p={[0,.07,-4.95]} s={[14.5,.2,.25]} c="#fff0d1"/>
    <Block p={[0,.07,-7.45]} s={[14.5,.2,.25]} c="#fff0d1"/>
    <Prop name="house" position={[-3.35,0,-9.45]} scale={.48} />
    <Prop name="house" position={[2.25,0,-9.6]} scale={.4} />
    {/* Cafe awning, warm wood and a compact outdoor terrace. */}
    <Block p={[-3.35,1.28,-7.9]} s={[1.9,.12,.85]} c="#648875"/>
    {[-.7,-.25,.2,.65].map(x=><Block key={x} p={[-3.35+x,1.35,-7.9]} s={[.18,.015,.85]} c="#f9e9c6"/>)}
    <Block p={[-3.35,1.04,-7.46]} s={[1.9,.35,.06]} c="#648875"/>
    <Prop name="tree" position={[-6.05,0,-4.1]} scale={.87}/>
    <Prop name="tree" position={[6.05,0,-3.5]} scale={.9}/>
    <Prop name="tree" position={[5.6,0,-9.7]} scale={.8}/>
    <Prop name="bush" position={[-6.2,0,-9.2]} scale={.8}/>
    <Prop name="bush" position={[.05,0,-8.7]} scale={.65}/>
    <Prop name="lamp" position={[-4.6,0,-4.4]} scale={.85}/>
    <Prop name="lamp" position={[4.85,0,-7.5]} scale={.8} rotation={Math.PI}/>
    <Bench x={-.5} z={-4.25}/>
    <Planter x={-6.25} z={.7} length={3.7}/>
    <Planter x={6.25} z={1.6} length={4.1}/>
    <Planter x={5.9} z={-8.1} length={1.2}/>
    <Block p={[-6.2,.09,-3.4]} s={[1.35,.2,1.9]} c="#9ba875"/>
    <Block p={[6.1,.09,-3.4]} s={[1.35,.2,1.9]} c="#9ba875"/>
    {/* Short white fence and planting make a readable foreground edge. */}
    {[-6.6,-5.9,-5.2,5.2,5.9,6.6].map(x=><Block key={x} p={[x,.4,5.8]} s={[.09,.8,.1]} c="#fff0d7"/>)}
    {[-5.9,5.9].map(x=><group key={x}><Block p={[x,.37,5.8]} s={[1.7,.08,.07]} c="#fff0d7"/><Block p={[x,.65,5.8]} s={[1.7,.08,.07]} c="#fff0d7"/></group>)}
    <Prop name="bush" position={[-6.1,0,4.5]} scale={.65}/>
    <Prop name="bush" position={[6.1,0,4.8]} scale={.6}/>
  </group>
}
