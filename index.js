import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Package } from 'lucide-react';

const AuraGame = () => {
  const [inventory, setInventory] = useState([]);
  const [currentAura, setCurrentAura] = useState(null);
  const [isRolling, setIsRolling] = useState(false);
  const [showInventory, setShowInventory] = useState(false);
  const [isExploding, setIsExploding] = useState(false);

  // Generate unique pattern for an aura
  const generatePattern = (config) => {
    return Array.from({ length: config.particleCount }).map(() => ({
      angle: Math.random() * Math.PI * 2,
      radius: Math.random() * 0.5 + 0.5, // 0.5 to 1
      speed: (Math.random() * 0.5 + 0.75) * config.speed, // 75% to 125% of base speed
      phase: Math.random() * Math.PI * 2, // For orbital variation
      radiusVariation: Math.random() * 0.2, // For radius wobble
    }));
  };

  const rarityConfigs = {
    common: {
      color: '#ffffff',
      particleCount: 20,
      speed: 1,
      size: 2,
      chance: 0.70,
      glow: '0px 0px 5px',
      radius: 80
    },
    rare: {
      color: '#4287f5',
      particleCount: 30,
      speed: 1.5,
      size: 3,
      chance: 0.20,
      glow: '0px 0px 8px',
      radius: 80
    },
    epic: {
      color: '#9b42f5',
      particleCount: 40,
      speed: 2,
      size: 4,
      chance: 0.06,
      glow: '0px 0px 12px',
      radius: 80
    },
    legendary: {
      color: '#f5a742',
      particleCount: 50,
      speed: 2.5,
      size: 5,
      chance: 0.025,
      glow: '0px 0px 15px',
      radius: 80
    },
    chroma: {
      color: 'rainbow',
      particleCount: 60,
      speed: 3,
      size: 6,
      chance: 0.01,
      glow: '0px 0px 20px',
      radius: 80
    },
    starlight: {
      color: '#ffffff',
      particleCount: 70,
      speed: 3.5,
      size: 4,
      chance: 0.005,
      glow: '0px 0px 25px',
      radius: 80,
      isStarlight: true
    }
  };

  useEffect(() => {
    const savedInventory = localStorage.getItem('auraInventory');
    if (savedInventory) {
      setInventory(JSON.parse(savedInventory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('auraInventory', JSON.stringify(inventory));
  }, [inventory]);

  const Particle = ({ config, pattern, isExploding, index }) => {
    const [position, setPosition] = useState({ x: config.radius, y: config.radius });
    const [hue, setHue] = useState(Math.random() * 360);
    const [scale, setScale] = useState(isExploding ? 0 : 1);

    useEffect(() => {
      if (isExploding) {
        const timeout = setTimeout(() => setScale(1), index * 20);
        return () => clearTimeout(timeout);
      }
    }, [isExploding, index]);

    useEffect(() => {
      const interval = setInterval(() => {
        if (isExploding && scale < 1) return;

        const time = Date.now() / 1000;
        const particlePattern = pattern[index];
        
        // Calculate position based on unique pattern
        const wobbleRadius = config.radius * particlePattern.radius + 
                           Math.sin(time + particlePattern.phase) * particlePattern.radiusVariation * config.radius;
        
        const angle = particlePattern.angle + time * particlePattern.speed;
        
        setPosition({
          x: Math.cos(angle) * wobbleRadius + config.radius,
          y: Math.sin(angle) * wobbleRadius + config.radius
        });

        if (config.color === 'rainbow') {
          setHue(h => (h + 1) % 360);
        }
      }, 50);

      return () => clearInterval(interval);
    }, [config, pattern, index, isExploding, scale]);

    const getParticleColor = () => {
      if (config.color === 'rainbow') {
        return `hsl(${hue}, 100%, 50%)`;
      }
      if (config.isStarlight) {
        return `rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5})`;
      }
      return config.color;
    };

    const transition = isExploding ? 'all 0.5s ease-out' : 'all 0.05s ease-out';

    return (
      <div
        className="absolute rounded-full"
        style={{
          left: isExploding && scale < 1 ? config.radius : position.x,
          top: isExploding && scale < 1 ? config.radius : position.y,
          width: config.size,
          height: config.size,
          backgroundColor: getParticleColor(),
          boxShadow: `${getParticleColor()} ${config.glow}`,
          transform: `scale(${scale})`,
          transition,
          opacity: scale
        }}
      />
    );
  };

  const AuraDisplay = ({ config, rarity, pattern, size = "large", isExploding = false }) => {
    const containerSize = size === "large" ? "w-52 h-52" : "w-32 h-32";
    const fontSize = size === "large" ? "text-lg" : "text-sm";
    
    return (
      <div className={`relative ${containerSize} rounded-full bg-gray-900 flex items-center justify-center overflow-hidden`}>
        <div className="absolute inset-0 flex items-center justify-center">
          {Array.from({ length: config.particleCount }).map((_, i) => (
            <Particle 
              key={i} 
              config={config} 
              pattern={pattern}
              isExploding={isExploding}
              index={i}
            />
          ))}
        </div>
        <span className={`text-white z-10 font-bold ${fontSize} transition-opacity duration-500 ${isExploding ? 'opacity-0' : 'opacity-100'}`}>
          {rarity.toUpperCase()}
        </span>
      </div>
    );
  };

  const rollAura = async () => {
    setIsRolling(true);
    setIsExploding(true);
    
    // Determine rarity
    const rand = Math.random();
    let rarity;
    let cumulative = 0;
    
    for (const [r, config] of Object.entries(rarityConfigs)) {
      cumulative += config.chance;
      if (rand < cumulative) {
        rarity = r;
        break;
      }
    }

    const config = rarityConfigs[rarity];
    const pattern = generatePattern(config);

    const newAura = {
      id: Date.now(),
      rarity,
      config,
      pattern
    };

    setCurrentAura(newAura);
    
    // Reset explosion state after animation
    setTimeout(() => {
      setIsExploding(false);
      setIsRolling(false);
    }, 1000);
  };

  const keepAura = () => {
    if (currentAura) {
      setInventory(prev => [...prev, currentAura]);
      setCurrentAura(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4">
      <Card className="w-full max-w-4xl mx-auto bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Sparkles className="h-6 w-6" />
            Aura Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6">
            <div className="flex gap-4">
              <Button 
                onClick={rollAura} 
                disabled={isRolling}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {isRolling ? "Rolling..." : "Roll New Aura"}
              </Button>
              <Button 
                onClick={keepAura}
                disabled={!currentAura || isRolling}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-900"
              >
                Keep Aura
              </Button>
              <Button
                onClick={() => setShowInventory(!showInventory)}
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-900"
              >
                <Package className="mr-2 h-4 w-4" />
                Inventory
              </Button>
            </div>

            {currentAura && (
              <div className="text-center">
                <AuraDisplay 
                  config={currentAura.config} 
                  rarity={currentAura.rarity}
                  pattern={currentAura.pattern}
                  isExploding={isExploding}
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showInventory && (
        <Card className="w-full max-w-4xl mx-auto mt-4 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">
              Inventory ({inventory.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {inventory.map(aura => (
                <div key={aura.id} className="flex flex-col items-center">
                  <AuraDisplay 
                    config={aura.config} 
                    rarity={aura.rarity}
                    pattern={aura.pattern}
                    size="small"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuraGame;
