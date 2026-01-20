import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function AudioVisualizer({ analyser }: { analyser: AnalyserNode | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const lineRef = useRef<THREE.Line>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const barsRef = useRef<THREE.Mesh[]>([]);
  const barCount = 64;

  useEffect(() => {
    if (analyser && groupRef.current) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      
      barsRef.current = [];
      groupRef.current.clear();
      
      for (let i = 0; i < barCount; i++) {
        const geometry = new THREE.BoxGeometry(0.15, 1, 0.15);
        const material = new THREE.MeshStandardMaterial({ 
          color: new THREE.Color('#ffffff')
        });
        const mesh = new THREE.Mesh(geometry, material);
        
        const angle = (i / barCount) * Math.PI * 2;
        const radius = 3;
        mesh.position.x = Math.cos(angle) * radius;
        mesh.position.z = Math.sin(angle) * radius;
        
        groupRef.current.add(mesh);
        barsRef.current.push(mesh);
      }
    }
  }, [analyser]);

  useFrame(() => {
    if (!analyser || !dataArrayRef.current || !groupRef.current || !lineRef.current) return;

    analyser.getByteFrequencyData(dataArrayRef.current);
    
    const linePositions = lineRef.current.geometry.attributes.position;
    
    barsRef.current.forEach((bar, i) => {
      const index = Math.floor((i / barsRef.current.length) * dataArrayRef.current!.length);
      const value = dataArrayRef.current![index] / 255;
      const height = 0.1 + value * 5;
      
      bar.scale.y = height;
      bar.position.y = height / 2;
      
      // 多角形の頂点を更新
      const angle = (i / barCount) * Math.PI * 2;
      const radius = 3;
      linePositions.setXYZ(i, Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    });
    
    // 最後の点を最初の点と同じにして閉じる
    linePositions.setXYZ(barCount, linePositions.getX(0), linePositions.getY(0), linePositions.getZ(0));
    linePositions.needsUpdate = true;
    
    groupRef.current.rotation.y += 0.005;
  });

  const linePositions = new Float32Array((barCount + 1) * 3);
  for (let i = 0; i <= barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2;
    const radius = 3;
    linePositions[i * 3] = Math.cos(angle) * radius;
    linePositions[i * 3 + 1] = 0;
    linePositions[i * 3 + 2] = Math.sin(angle) * radius;
  }

  return (
    <group ref={groupRef}>
      <line ref={lineRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={barCount + 1}
            array={linePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" linewidth={2} />
      </line>
    </group>
  );
}

export default function SoundReactive() {
  const [fileName, setFileName] = useState("");
  const [volume, setVolume] = useState(0.5);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    analyserRef.current = analyser;

    const audio = new Audio();
    audio.src = URL.createObjectURL(file);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    const source = audioContext.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioContext.destination);

    audio.play();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  return (
    <div className="w-full h-screen">
      <Canvas camera={{ position: [0, 0, 8] }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <AudioVisualizer analyser={analyserRef.current} />
        <OrbitControls />
      </Canvas>
      
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        <label className="px-4 py-2 bg-blue-500 text-white rounded cursor-pointer">
          {fileName || "音声ファイルを選択"}
          <input type="file" accept="audio/*" onChange={handleFileUpload} className="hidden" />
        </label>
        
        {fileName && (
          <div className="flex items-center gap-2 bg-black/50 px-4 py-2 rounded">
            <span className="text-white text-sm">音量</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-32"
            />
            <span className="text-white text-sm">{Math.round(volume * 100)}%</span>
          </div>
        )}
      </div>
    </div>
  );
}
