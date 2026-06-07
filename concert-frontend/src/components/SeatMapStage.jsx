import React, { Suspense, useEffect, useMemo, useRef, useState, memo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Billboard, OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { AlertCircle, Crown, MapPin, Sparkles, Ticket } from 'lucide-react';
import { formatDate } from '../utils/helpers';

const STAGE_COLORS = ['#22d3ee', '#a855f7', '#fb7185', '#34d399', '#fbbf24', '#60a5fa', '#f59e0b'];
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 8;
const IMAGE_WIDTH = 1000;
const IMAGE_HEIGHT = 700;

const FILTER_OPTIONS = [
  { id: 'recommended', label: '推荐区' },
  { id: 'value', label: '性价比' },
  { id: 'view', label: '最佳视野' },
  { id: 'all', label: '全部分区' },
];

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseCoords = (coordsStr) => {
  if (!coordsStr) return [];
  return coordsStr
    .split(',')
    .map((n) => Number.parseFloat(n.trim()))
    .filter((n) => Number.isFinite(n));
};

const projectX = (x) => (clamp(x / IMAGE_WIDTH, 0, 1) - 0.5) * BOARD_WIDTH;
const projectZ = (y) => (clamp(y / IMAGE_HEIGHT, 0, 1) - 0.5) * BOARD_HEIGHT;

const extractPriceValue = (priceRange) => {
  if (!priceRange) return 0;
  const matches = String(priceRange).match(/\d+(?:\.\d+)?/g);
  if (!matches?.length) return 0;
  return Math.max(...matches.map(Number));
};

const polygonArea = (points) => {
  let area = 0;
  for (let i = 0; i < points.length; i += 1) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return area / 2;
};

const ensureCounterClockwise = (points) => {
  if (points.length < 3) return points;
  return polygonArea(points) >= 0 ? points : [...points].reverse();
};

const buildPolyPoints = (coords) => {
  const points = [];
  for (let i = 0; i < coords.length - 1; i += 2) {
    points.push({ x: coords[i], y: coords[i + 1] });
  }
  return ensureCounterClockwise(points);
};

const buildRectPoints = (coords) => {
  if (coords.length < 4) return [];
  const [x1, y1, x2, y2] = coords;
  return ensureCounterClockwise([
    { x: x1, y: y1 }, { x: x2, y: y1 }, { x: x2, y: y2 }, { x: x1, y: y2 },
  ]);
};

const buildCirclePoints = (coords, segments = 28) => {
  if (coords.length < 3) return [];
  const [cx, cy, r] = coords;
  return Array.from({ length: segments }, (_, index) => {
    const theta = (index / segments) * Math.PI * 2;
    return { x: cx + Math.cos(theta) * r, y: cy + Math.sin(theta) * r };
  });
};

const createPointsFromArea = (area) => {
  const coords = parseCoords(area.coords);
  if (!coords.length) return [];
  if (area.shape === 'circle') return buildCirclePoints(coords);
  if (area.shape === 'rect') return buildRectPoints(coords);
  return buildPolyPoints(coords);
};

const createShapeData = (points) => {
  if (points.length < 3) return null;
  const projected = points.map((p) => ({ x: projectX(p.x), z: projectZ(p.y) }));
  const centerX = projected.reduce((s, p) => s + p.x, 0) / projected.length;
  const centerZ = projected.reduce((s, p) => s + p.z, 0) / projected.length;
  const localPoints = projected.map((p) => new THREE.Vector2(p.x - centerX, p.z - centerZ));
  const shape = new THREE.Shape(localPoints);
  const xs = projected.map((p) => p.x);
  const zs = projected.map((p) => p.z);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanZ = Math.max(...zs) - Math.min(...zs);
  const footprint = Math.max(spanX, spanZ);
  const planeArea = Math.abs(polygonArea(projected.map((p) => ({ x: p.x, y: p.z }))));
  return { centerX, centerZ, shape, spanX, spanZ, footprint, planeArea };
};

const getAreaCategory = (area) => {
  const name = `${area.id || ''} ${area.name || ''}`.toLowerCase();
  if (/vip|cat1|a1/.test(name)) return 'premium';
  if (/内场|floor|cat2|cat3|a2|a3|a4|a区|b1|b2/.test(name)) return 'floor';
  if (/看台|stand|cat5|c1|c2|b区/.test(name)) return 'stand';
  if (/山顶|高层|upper|cheap|d区/.test(name)) return 'upper';
  return 'standard';
};

const getAreaSummary = (area) => {
  switch (getAreaCategory(area)) {
    case 'premium': return '核心推荐区，距离舞台最近，沉浸感和互动感最强。';
    case 'floor':   return '内场区域，平衡距离与体验，适合优先考虑现场氛围。';
    case 'stand':   return '看台区域，视野更完整，适合看整体舞美和灯光。';
    case 'upper':   return '高层区域，预算友好，适合更在意氛围和性价比。';
    default:        return '综合体验区，可结合预算与视角偏好选择。';
  }
};

const getAreaBadge = (area) => {
  switch (getAreaCategory(area)) {
    case 'premium': return '核心推荐';
    case 'floor':   return '沉浸内场';
    case 'stand':   return '全景看台';
    case 'upper':   return '高性价比';
    default:        return '综合选择';
  }
};

const rankArea = (area, shapeData) => {
  const price = extractPriceValue(area.priceRange);
  const proximity = 1 - clamp((shapeData.centerZ + BOARD_HEIGHT / 2) / BOARD_HEIGHT, 0, 1);
  const centrality = 1 - clamp(Math.abs(shapeData.centerX) / (BOARD_WIDTH / 2), 0, 1);
  const areaScale = clamp(shapeData.planeArea / 8, 0, 1);
  return price * 0.45 + proximity * 1000 + centrality * 450 + areaScale * 220;
};

// Pre-build shape objects once, stable across renders
const shapeCache = new Map();

const normalizeArea = (area, index) => {
  const points = createPointsFromArea(area);
  const shapeData = createShapeData(points);
  if (!shapeData) return null;

  // Reuse cached THREE.Shape for this area id to avoid rebuilding geometry
  const cacheKey = `${area.id}-${area.coords}`;
  let shape = shapeCache.get(cacheKey);
  if (!shape) {
    const localPoints = points.map((p) => new THREE.Vector2(
      projectX(p.x) - shapeData.centerX,
      projectZ(p.y) - shapeData.centerZ,
    ));
    shape = new THREE.Shape(localPoints);
    shapeCache.set(cacheKey, shape);
  }

  const tier = clamp((shapeData.centerZ + BOARD_HEIGHT / 2) / BOARD_HEIGHT, 0, 1);
  const priceValue = extractPriceValue(area.priceRange);
  const score = rankArea(area, shapeData);
  const category = getAreaCategory(area);
  const thickness = 0.16 + (1 - tier) * 0.22 + clamp(priceValue / 2000, 0, 0.08);
  const valueScore = score - priceValue * 0.22 + shapeData.planeArea * 120;
  const viewScore = (1 - tier) * 900 + (1 - clamp(Math.abs(shapeData.centerX) / (BOARD_WIDTH / 2), 0, 1)) * 700;

  return {
    ...area,
    color: STAGE_COLORS[index % STAGE_COLORS.length],
    centerX: shapeData.centerX,
    centerZ: shapeData.centerZ,
    spanX: shapeData.spanX,
    spanZ: shapeData.spanZ,
    footprint: shapeData.footprint,
    planeArea: shapeData.planeArea,
    shape,
    y: 0.08 + (1 - tier) * 0.16 + index * 0.012,
    thickness,
    intensity: 0.25 + (1 - tier) * 0.55 + clamp(priceValue / 2200, 0, 0.18),
    ringScale: Math.max(shapeData.footprint * 0.55, 0.9),
    labelOffset: 0.28 + thickness,
    tier,
    priceValue,
    score,
    valueScore,
    viewScore,
    category,
    badge: getAreaBadge(area),
    summary: getAreaSummary(area),
  };
};

const sortAreasForStage = (areas) => {
  const categoryWeight = { upper: 1, stand: 2, standard: 3, floor: 4, premium: 5 };
  return [...areas].sort((a, b) => {
    const tierDiff = b.tier - a.tier;
    if (Math.abs(tierDiff) > 0.06) return tierDiff;
    const categoryDiff = (categoryWeight[a.category] || 0) - (categoryWeight[b.category] || 0);
    if (categoryDiff !== 0) return categoryDiff;
    return a.score - b.score;
  });
};

const buildStageAreas = (areas = []) => sortAreasForStage(areas.map(normalizeArea).filter(Boolean));

const getTopAreaByMetric = (areas, metric) => {
  if (!areas.length) return null;
  return [...areas].sort((a, b) => (b[metric] || 0) - (a[metric] || 0))[0] || null;
};

const getAreasForFilter = (areas, filterMode, recommendedArea, bestValueArea, bestViewArea) => {
  if (!areas.length) return [];
  if (filterMode === 'all') return areas;
  const target =
    filterMode === 'value' ? bestValueArea
    : filterMode === 'view' ? bestViewArea
    : recommendedArea;
  if (!target) return areas;
  return areas
    .filter((area) => area.category === target.category || area.id === target.id)
    .sort((a, b) => (b.score || 0) - (a.score || 0));
};

// ── 3D Scene Components ──────────────────────────────────────────

const GroundBoard = () => (
  <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.07, 0]} receiveShadow>
    <planeGeometry args={[BOARD_WIDTH, BOARD_HEIGHT]} />
    <meshStandardMaterial color="#080f1e" roughness={0.96} metalness={0.04} />
  </mesh>
);

const AudienceBowl = () => (
  <>
    <mesh position={[0, -0.32, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <circleGeometry args={[7.6, 96]} />
      <meshStandardMaterial color="#050814" roughness={1} />
    </mesh>
    <mesh position={[0, -0.24, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[6.1, 7.1, 96]} />
      <meshBasicMaterial color="#1e293b" transparent opacity={0.32} side={THREE.DoubleSide} />
    </mesh>
    <mesh position={[0, -0.22, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[4.9, 5.8, 96]} />
      <meshBasicMaterial color="#0f172a" transparent opacity={0.28} side={THREE.DoubleSide} />
    </mesh>
  </>
);

const StageDeck = () => (
  <group position={[0, 0.02, -3.3]}>
    <mesh castShadow>
      <boxGeometry args={[3.2, 0.22, 0.72]} />
      <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={1.35} metalness={0.42} roughness={0.22} />
    </mesh>
    <mesh position={[0, 0.08, -0.5]}>
      <boxGeometry args={[1.2, 0.1, 1.2]} />
      <meshStandardMaterial color="#a855f7" emissive="#7c3aed" emissiveIntensity={0.85} metalness={0.35} roughness={0.3} />
    </mesh>
    <mesh position={[0, -0.08, 0.8]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.1, 1.8]} />
      <meshBasicMaterial color="#22d3ee" transparent opacity={0.22} side={THREE.DoubleSide} />
    </mesh>
  </group>
);

const FocusController = ({ targetArea }) => {
  const { camera } = useThree();
  const controlsRef = useRef(null);

  useFrame(() => {
    if (!targetArea) return;
    const target = new THREE.Vector3(targetArea.centerX * 0.5, 0.35, targetArea.centerZ * 0.72);
    const offsetZ = THREE.MathUtils.lerp(4.4, 6.2, targetArea.tier);
    const desired = new THREE.Vector3(
      targetArea.centerX * 0.22,
      5.2 + targetArea.tier * 0.7,
      targetArea.centerZ + offsetZ,
    );
    camera.position.lerp(desired, 0.06);
    camera.lookAt(target);
    if (controlsRef.current) {
      controlsRef.current.target.lerp(target, 0.08);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={6.8}
      maxDistance={12}
      minPolarAngle={0.75}
      maxPolarAngle={1.18}
      autoRotate={!targetArea}
      autoRotateSpeed={0.42}
    />
  );
};

// Stable area component — memo prevents re-render when other areas change
const StageArea = memo(({ area, active, dimmed, hovered, onHover, onSelect }) => {
  const emissive = useMemo(() => new THREE.Color(area.color), [area.color]);

  return (
    <group
      position={[area.centerX, area.y, area.centerZ]}
      onClick={() => onSelect(area)}
      onPointerOver={(event) => { event.stopPropagation(); onHover(area); }}
      onPointerOut={(event) => { event.stopPropagation(); onHover(null); }}
    >
      <mesh castShadow receiveShadow scale={active ? 1.06 : hovered ? 1.03 : 1}>
        <extrudeGeometry
          args={[
            area.shape,
            {
              depth: area.thickness,
              bevelEnabled: true,
              bevelSize: 0.04,
              bevelThickness: 0.03,
              bevelSegments: 3,
              curveSegments: 32,
            },
          ]}
        />
        <meshStandardMaterial
          color={active || hovered ? '#f8fafc' : area.color}
          metalness={0.38}
          roughness={0.28}
          transparent
          opacity={dimmed && !active && !hovered ? 0.3 : 1}
          emissive={emissive}
          emissiveIntensity={active || hovered ? 1.05 : dimmed ? area.intensity * 0.45 : area.intensity}
        />
      </mesh>

      <mesh position={[0, -0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[area.ringScale * 0.7, area.ringScale, 64]} />
        <meshBasicMaterial color={area.color} transparent opacity={active || hovered ? 0.52 : dimmed ? 0.08 : 0.18} side={THREE.DoubleSide} />
      </mesh>

      <Billboard position={[0, area.labelOffset, 0]}>
        <Text
          fontSize={Math.max(0.18, Math.min(0.34, area.footprint * 0.14))}
          color={active || hovered ? '#ffffff' : dimmed ? '#cbd5e1' : '#f8fafc'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.02}
          outlineColor="#020617"
          maxWidth={Math.max(1.4, area.spanX + 0.5)}
        >
          {area.name}
        </Text>
      </Billboard>
    </group>
  );
});

const StageScene = memo(({ areas, selectedArea, hoveredArea, setHoveredArea, setSelectedArea, visibleAreaIds }) => (
  <>
    <color attach="background" args={['#050816']} />
    <fog attach="fog" args={['#050816', 8, 18]} />
    <ambientLight intensity={0.92} />
    <directionalLight position={[5, 8, 6]} intensity={1.18} color="#cffafe" castShadow />
    <spotLight position={[-6, 8, 2]} intensity={28} angle={0.28} penumbra={0.65} color="#c084fc" castShadow />
    <spotLight position={[6, 7, -2]} intensity={22} angle={0.22} penumbra={0.7} color="#38bdf8" />

    <group rotation={[-0.52, 0, 0]} position={[0, -0.16, 0]}>
      <GroundBoard />
      <AudienceBowl />
      <StageDeck />
      {areas.map((area) => (
        <StageArea
          key={area.id || area.name}
          area={area}
          active={selectedArea?.id === area.id}
          hovered={hoveredArea?.id === area.id}
          dimmed={!visibleAreaIds.has(area.id)}
          onHover={setHoveredArea}
          onSelect={setSelectedArea}
        />
      ))}
    </group>
    <FocusController targetArea={hoveredArea || selectedArea} />
  </>
));

// ── Main Component ───────────────────────────────────────────────

const SeatMapStage = ({ config, onAskAI, concert }) => {
  const [selectedArea, setSelectedArea] = useState(null);
  const [hoveredArea, setHoveredArea] = useState(null);
  const [filterMode, setFilterMode] = useState('recommended');

  const stageAreas = useMemo(() => buildStageAreas(config?.areas || []), [config?.areas]);
  const recommendedArea = useMemo(() => getTopAreaByMetric(stageAreas, 'score'), [stageAreas]);
  const bestValueArea = useMemo(() => getTopAreaByMetric(stageAreas, 'valueScore'), [stageAreas]);
  const bestViewArea = useMemo(() => getTopAreaByMetric(stageAreas, 'viewScore'), [stageAreas]);

  const filteredAreas = useMemo(
    () => getAreasForFilter(stageAreas, filterMode, recommendedArea, bestValueArea, bestViewArea),
    [stageAreas, filterMode, recommendedArea, bestValueArea, bestViewArea],
  );

  const visibleAreaIds = useMemo(() => new Set(filteredAreas.map((a) => a.id)), [filteredAreas]);

  // Don't auto-reselect on every config change — only when areas actually change
  useEffect(() => {
    if (!stageAreas.length) { setSelectedArea(null); return; }
    if (selectedArea && visibleAreaIds.has(selectedArea.id)) return; // keep current selection

    const fallback =
      filterMode === 'value' ? bestValueArea
      : filterMode === 'view' ? bestViewArea
      : recommendedArea || stageAreas[0];
    setSelectedArea(fallback || stageAreas[0]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stageAreas.length]); // only re-run when total area count changes

  const focusArea = hoveredArea || selectedArea;

  const handleAskAI = () => {
    if (focusArea) {
      const info = concert
        ? `${concert.singer} ${concert.showTime ? formatDate(concert.showTime, 'yyyy年MM月dd日 HH:mm') : ''} 在 ${concert.city} ${concert.venue}`
        : '';
      onAskAI?.(`${info ? info + '，' : ''}${focusArea.name}视野怎么样？价格是多少？适合什么人买？`);
    }
  };

  if (!config?.hasSeatMap) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-white/70">
        <div className="flex items-center gap-3 text-white">
          <AlertCircle className="h-5 w-5 text-cyan-300" />
          <span className="text-base font-semibold">座位图暂未上线</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/55">当前场次还没有座位配置，后续补充后这里会展示 2.5D 舞台视图。</p>
      </div>
    );
  }

  if (!stageAreas.length) {
    return (
      <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-white/70">
        <div className="flex items-center gap-3 text-white">
          <AlertCircle className="h-5 w-5 text-cyan-300" />
          <span className="text-base font-semibold">座位图配置异常</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-white/55">座位分区数据为空，请检查后台配置。</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.65fr)_320px]">
      {/* 3D Canvas */}
      <div className="relative overflow-hidden rounded-[28px] border border-cyan-400/20 bg-[#07111f] shadow-[0_0_60px_rgba(34,211,238,0.12)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-[#020617] via-[#020617]/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-28 bg-gradient-to-t from-[#020617] via-[#020617]/85 to-transparent" />
        <div className="absolute left-5 top-5 z-20 rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-xs tracking-[0.24em] text-cyan-200">
          STAGE VIEW
        </div>
        <div className="absolute left-5 top-16 z-20 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setFilterMode(option.id)}
              className={`rounded-full border px-3 py-1 text-xs transition ${
                filterMode === option.id
                  ? 'border-cyan-300/40 bg-cyan-300/15 text-cyan-100'
                  : 'border-white/10 bg-black/25 text-white/60 hover:bg-white/10'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="h-[420px] w-full">
          <Canvas camera={{ position: [0, 6.1, 7.2], fov: 44 }} shadows dpr={[1, 1.8]}>
            <StageScene
              areas={stageAreas}
              selectedArea={selectedArea}
              hoveredArea={hoveredArea}
              setHoveredArea={setHoveredArea}
              setSelectedArea={setSelectedArea}
              visibleAreaIds={visibleAreaIds}
            />
          </Canvas>
        </div>

        <div className="absolute bottom-5 left-5 right-5 z-20 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 backdrop-blur-md">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-white/45">Interactive focus</p>
            <p className="mt-1 text-sm text-white/80">悬停高亮并聚焦镜头，点击锁定分区；上方可切换推荐区、性价比和最佳视野模式。</p>
          </div>
        </div>
      </div>

      {/* Side panel */}
      <div className="rounded-[28px] border border-white/10 bg-[linear-gradient(180deg,rgba(10,14,32,0.96),rgba(5,8,22,0.94))] p-5 shadow-[0_20px_80px_rgba(3,7,18,0.35)]">
        <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/70">Selected zone</p>
        <h3 className="mt-3 flex items-center gap-2 text-2xl font-semibold text-white">
          <MapPin className="h-5 w-5 text-cyan-300" />
          {focusArea?.name || '选择分区'}
        </h3>

        <div className="mt-4 flex flex-wrap gap-2">
          {focusArea?.badge && (
            <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-xs text-amber-100">
              {focusArea.badge}
            </span>
          )}
          {recommendedArea?.id === focusArea?.id && (
            <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-100">
              <Crown className="h-3.5 w-3.5" />
              当前推荐
            </span>
          )}
        </div>

        <div className="mt-5 space-y-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">票价区间</p>
            <p className="mt-2 flex items-center gap-2 text-lg font-medium text-emerald-300">
              <Ticket className="h-4 w-4" />
              {focusArea?.priceRange || '待公布'}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-white/40">视野描述</p>
            <p className="mt-2 text-sm leading-6 text-white/70">
              {focusArea?.description || '点击舞台中的发光分区，查看详细的视野与位置说明。'}
            </p>
          </div>

          <div className="rounded-2xl border border-cyan-300/15 bg-cyan-300/5 p-4 text-sm leading-6 text-cyan-50/80">
            {focusArea?.summary
              || '系统综合预算、距离舞台和整体视角，为每个场次自动优化推荐顺序。'}
          </div>
        </div>

        <button
          type="button"
          onClick={handleAskAI}
          disabled={!focusArea}
          className="mt-6 inline-flex w-full items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#22d3ee,#8b5cf6)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          问 AI 推荐座位
        </button>
      </div>
    </div>
  );
};

export default SeatMapStage;
