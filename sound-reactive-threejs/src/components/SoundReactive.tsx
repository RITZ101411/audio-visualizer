import { useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";

function AudioVisualizer({ analyser }: { analyser: AnalyserNode | null }) {
  const groupRef = useRef<THREE.Group>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const barsRef = useRef<THREE.Mesh[]>([]);

  useEffect(() => {
    if (analyser && groupRef.current) {
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      const barCount = 64;
      
      barsRef.current = [];
      groupRef.current.clear();
      
      for (let i = 0; i < barCount; i++) {
        const geometry = new THREE.BoxGeometry(0.1, 1, 0.1);
        const material = new THREE.MeshStandardMaterial({ 
          color: new THREE.Color(`hsl(${(i / barCount) * 360}, 100%, 50%)`)
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
    if (!analyser || !dataArrayRef.current || !groupRef.current) return;

    analyser.getByteFrequencyData(dataArrayRef.current);
    
    barsRef.current.forEach((bar, i) => {
      const index = Math.floor((i / barsRef.current.length) * dataArrayRef.current!.length);
      const value = dataArrayRef.current![index] / 255;
      bar.scale.y = 0.1 + value * 5;
      bar.position.y = bar.scale.y / 2;
    });
    
    groupRef.current.rotation.y += 0.005;
  });

  return <group ref={groupRef} />;
}

export default function SoundReactive() {
  const [fileName, setFileName] = useState("");
  const [volume, setVolume] = useState(0.5);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);

    // 初回のみAudioContextを作成
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 512;
    }

    // 既存の音声を停止して新しいファイルに切り替え
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = URL.createObjectURL(file);
      audioRef.current.load();
    } else {
      // 初回のみaudio要素とsourceを作成
      const audio = new Audio();
      audio.src = URL.createObjectURL(file);
      audio.loop = true;
      audio.volume = volume;
      audioRef.current = audio;

      sourceRef.current = audioContextRef.current.createMediaElementAudioSource(audio);
      sourceRef.current.connect(analyserRef.current!);
      analyserRef.current!.connect(audioContextRef.current.destination);
    }

    audioRef.current.volume = volume;
    audioRef.current.loop = true;
    audioRef.current.play();
    setIsPlaying(true);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioContextRef.current?.close();
    };
  }, []);

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
        
        {isPlaying && (
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
