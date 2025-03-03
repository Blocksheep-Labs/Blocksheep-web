import React, { useRef, useEffect, useState, useCallback } from "react";
import BasketCarrotImage from "../../../assets/images/carrot-basket.png";
import * as THREE from "three";

interface CarrotThrowerProps {
  MAX_CARROTS: number;
  setDisplayNumber: (num: number) => void;
  displayNumber: number;
  disabled: boolean;
}

export function CarrotBasket({fuelLeft}: {fuelLeft: number}) {
  return (
      <div className="relative">
          <img src={BasketCarrotImage} alt="basket" className="w-28"/>
          <span className="text-white absolute left-[57px] -bottom-[2px] text-3xl" style={{ transform: 'translate(-50%,-50%)' }}>{fuelLeft}</span>
      </div>
  );
}

export const CarrotBasketIncrement: React.FC<CarrotThrowerProps> = ({
  MAX_CARROTS,
  setDisplayNumber,
  displayNumber,
  disabled
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isPressed, setIsPressed] = useState(false);
  const [counterKey, setCounterKey] = useState(0);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carrotGroupRef = useRef<THREE.Group | null>(null);
  const carrotsRef = useRef<{ mesh: THREE.Group; velocity: THREE.Vector3; rotation: THREE.Vector3 }[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // Create Three.js scene
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ alpha: true });

    renderer.setSize(175, 300);

    mountRef.current.appendChild(renderer.domElement);

    sceneRef.current = scene;
    cameraRef.current = camera;
    rendererRef.current = renderer;

    camera.position.set(0.55, 1, 5);

    createCarrotMesh();

    animate();

    return () => {
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  const createCarrotMesh = () => {
    const carrotGroup = new THREE.Group();

    // Carrot body
    const bodyGeometry = new THREE.ConeGeometry(0.2, 1, 8);
    const bodyMaterial = new THREE.MeshBasicMaterial({ color: 0xff6b02 });
    const carrotBody = new THREE.Mesh(bodyGeometry, bodyMaterial);

    // Carrot top
    const topGeometry = new THREE.ConeGeometry(0.15, 0.45, 8);
    const topMaterial = new THREE.MeshBasicMaterial({ color: 0x228B22 });
    const carrotTop = new THREE.Mesh(topGeometry, topMaterial);
    
    carrotTop.position.y = -0.5 - (topGeometry.parameters.height / 2);
    carrotTop.rotation.x = Math.PI;

    carrotGroup.add(carrotBody);
    carrotGroup.add(carrotTop);
    carrotGroup.rotateX(Math.PI / 2);

    carrotGroupRef.current = carrotGroup;
  };

  const throwCarrot = useCallback(() => {
    if ((displayNumber >= MAX_CARROTS) || disabled) return;

    setDisplayNumber(displayNumber + 1);

    setIsPressed(true);
    setCounterKey(prev => prev + 1);
    setTimeout(() => setIsPressed(false), 150);

    if (!sceneRef.current || !carrotGroupRef.current) return;

    // Clone carrot and set position
    const carrot = carrotGroupRef.current.clone();
    carrot.position.set((Math.random() - 0.5) * 0.5, -2, 0);

    const velocity = new THREE.Vector3((Math.random() - 0.5) * 0.2, 0.3, -0.2);
    const rotation = new THREE.Vector3(Math.random() * 0.1, Math.random() * 0.1, Math.random() * 0.1);

    carrotsRef.current.push({ mesh: carrot, velocity, rotation });
    sceneRef.current.add(carrot);

    setTimeout(() => {
      sceneRef.current?.remove(carrot);
      carrotsRef.current = carrotsRef.current.filter(c => c.mesh !== carrot);
    }, 1000);
  }, [MAX_CARROTS, displayNumber, disabled]);

  const animate = () => {
    requestAnimationFrame(animate);

    carrotsRef.current.forEach(carrot => {
      carrot.mesh.position.add(carrot.velocity);
      carrot.velocity.y -= 0.015;
      carrot.mesh.rotation.x += carrot.rotation.x;
      carrot.mesh.rotation.y += carrot.rotation.y;
      carrot.mesh.rotation.z += carrot.rotation.z;
    });

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  };

  return (
    <>
      <div ref={mountRef} className="z-50"/>
      <div style={{ position: "relative", zIndex: 99999, paddingRight: '40px' }}>
        {/* Counter UI */}
        <div
          id="counter"
          style={{
            position: "absolute",
            bottom: "85px",
            left: "38%",
            transform: "translateX(-50%)",
            width: "50px",
            height: "50px",
            borderRadius: "50%",
            background: `url('https://i.ibb.co/fzK9KrmQ/counter.png') no-repeat center/contain`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#000",
            fontSize: "20px",
            textShadow: "1px 1px 2px rgba(0, 0, 0, 0.7)",
            fontWeight: "bold",
            opacity: displayNumber >= MAX_CARROTS || disabled ? 0.6 : 1,
            zIndex: 9,
          }}
        >
          <span key={counterKey}>{displayNumber}</span>
        </div>

        {/* Drop Button */}
        <button
          onClick={throwCarrot}
          style={{
            position: "absolute",
            bottom: "-10px",
            left: "38%",
            transform: `translate(-50%, 0) ${isPressed ? "scale(0.95)" : "scale(1)"}`,
            width: "130px",
            height: "130px",
            color: "#000",
            justifyContent: "center",
            paddingLeft: "20px",
            borderRadius: "50%",
            background: `url('https://i.ibb.co/RG10K8Cy/image1-removebg-preview.png') no-repeat center/cover`,
            border: "none",
            outline: "none",
            WebkitTapHighlightColor: "transparent",
            userSelect: "none",
            fontWeight: "bold",
            opacity: displayNumber >= MAX_CARROTS || disabled ? 0.6 : 1,
            zIndex: 10,
            transition: "all 0.15s ease-out",
            textAlign: "center",
            lineHeight: "100px",
          }}
        >
          DROP
        </button>
      </div>
    </>
  );
};
