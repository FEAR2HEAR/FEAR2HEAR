import { useGLTF } from "@react-three/drei";

function AIAvatar() {
  const { scene } = useGLTF("/dom.glb");

  return <primitive object={scene} scale={1.0} />;
}

export default AIAvatar;