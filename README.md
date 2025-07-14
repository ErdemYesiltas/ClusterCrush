# ClusterCrush 🎮

Modern bir cluster crush oyunu - PixiJS, GSAP ve XState kullanılarak geliştirilmiş TypeScript tabanlı oyun.

## 🚀 Özellikler

- **PixiJS 8.11** ile geliştirilmiş moderne grafik motoru
- **Pixi Sound** ile ses efektleri ve müzik
- **XState 5.20** ile state machine tabanlı oyun mantığı
- **GSAP 3.12** ile gelişmiş animasyonlar
- **TypeScript** ile güvenli tip kontrolü
- **Vite** ile hızlı geliştirme ortamı

## 📦 Kurulum

### Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya yarn

### Projeyi Klonlayın

```bash
git clone https://github.com/ErdemYesiltas/ClusterCrush.git
cd ClusterCrush
```

### Bağımlılıkları Yükleyin

```bash
npm install
```

### Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

Oyun `http://localhost:8082` adresinde çalışacak.

## 🎯 Nasıl Oynanır

1. **Hedef**: Aynı renkteki gem'leri yan yana getirerek 3 veya daha fazla eşleştirme yapın
2. **Taşıma**: Alt kısımdan gem'leri sürükleyip board'a bırakın
3. **Skor**: Her eşleştirme için puan kazanın
4. **Hamle**: Toplam 25 hamle hakkınız var
5. **Kazanma**: 500 puan hedefine ulaşarak oyunu kazanın

## 🛠️ Customization

### Board Yapılandırması

Board'u `GameContainer.ts` dosyasında özelleştirebilirsiniz:

```typescript
const board = new Board(app, {
  x: 396, // Board'un x pozisyonu
  y: 40, // Board'un y pozisyonu
  scale: 0.65, // Board'un ölçeği
  rows: 5, // Satır sayısı
  columns: 5, // Sütun sayısı
  cellSize: 150, // Hücre boyutu
  cellTexture: 'cell', // Hücre texture'ı
  optionCount: 3, // Alt kısımda kaç gem olacak
  symbols: {
    // Gem yapılandırmaları
    b: {
      visualType: 'sprite',
      visualOptions: {
        texture: 'gem-blue',
        anchor: 0.5,
        x: 75,
        y: 75,
      },
      animations: commonAnims,
    },
    // Diğer gem'ler...
  },
  maskOpts: {
    x: 0,
    y: 0,
    width: 750,
    height: 750,
  },
});
```

### Gem Türleri Ekleme

Yeni gem türü eklemek için:

```typescript
const symbols = {
  // Mevcut gem'ler...
  r: {
    // Kırmızı gem
    visualType: 'sprite',
    visualOptions: {
      texture: 'gem-red',
      anchor: 0.5,
      scale: 0.8,
      x: 75,
      y: 75,
    },
    animations: commonAnims,
  },
  o: {
    // Turuncu gem
    visualType: 'sprite',
    visualOptions: {
      texture: 'gem-orange',
      anchor: 0.5,
      tint: 0xff8800,
      x: 75,
      y: 75,
    },
    animations: commonAnims,
  },
};
```

### Animasyonları Özelleştirme

Gem animasyonlarını değiştirebilirsiniz:

```typescript
const commonAnims = {
  idle: (visual: Sprite) => {
    return new Promise<void>(resolve => {
      // Fade in animasyonu
      gsap.fromTo(
        visual,
        { alpha: 0, scale: 0.5 },
        { alpha: 1, scale: 1, duration: 0.8, ease: 'back.out(1.7)', onComplete: resolve },
      );
    });
  },
  cascade: (visual: Sprite) => {
    return new Promise<void>(resolve => {
      // Patlamalı çıkış animasyonu
      gsap.to(visual, {
        alpha: 0,
        scale: 2,
        rotation: Math.PI,
        duration: 0.6,
        ease: 'power2.out',
        onStart: () => {
          try {
            if (sound.exists('remove-symbol-sound')) {
              sound.play('remove-symbol-sound');
            }
          } catch (error) {
            console.error('Ses efekti hatası:', error);
          }
        },
        onComplete: resolve,
      });
    });
  },
};
```

### State Machine Özelleştirme

Oyun mantığını `GameContainer.ts` dosyasında özelleştirebilirsiniz:

```typescript
const customGameLogic = crushGameLogic.provide({
  actions: {
    onStart: () => {
      // Oyun başlangıcında yapılacaklar
      console.log('Oyun başladı!');
      // Müzik çal
      try {
        if (sound.exists('main-music')) {
          sound.play('main-music', { loop: true, volume: 0.5 });
        }
      } catch (error) {
        console.error('Müzik çalarken hata:', error);
      }
    },
    onReset: () => {
      // Oyun resetlendiğinde
      console.log('Oyun resetlendi');
    },
    onEvaluation: () => {
      // Her hamleden sonra değerlendirme
      console.log('Hamle değerlendiriliyor');
    },
    onCascade: () => {
      // Cascade işlemi sırasında
      console.log('Cascade işlemi gerçekleşiyor');
    },
    onWin: () => {
      // Oyun kazanıldığında
      console.log('Oyun kazanıldı!');
      try {
        if (sound.exists('win-sound')) {
          sound.play('win-sound');
        }
      } catch (error) {
        console.error('Kazanma ses efekti hatası:', error);
      }
    },
    onLose: () => {
      // Oyun kaybedildiğinde
      console.log('Oyun kaybedildi!');
      try {
        if (sound.exists('lose-sound')) {
          sound.play('lose-sound');
        }
      } catch (error) {
        console.error('Kaybetme ses efekti hatası:', error);
      }
    },
  },
});
```

### Oyun Parametrelerini Değiştirme

Actor'u oluştururken oyun parametrelerini özelleştirebilirsiniz:

```typescript
this.actor = createActor(customGameLogic, {
  input: {
    board,
    hud,
    maxMoves: 30, // Maksimum hamle sayısı
    winCheckFn: (moves: number, score: number) => {
      // Kazanma koşulu: 20 hamle içinde 750 puan
      return moves <= 20 && score >= 750;
    },
    minWinCount: 4, // Minimum eşleştirme sayısı
    calcScoreFn: (moves: number) => {
      // Skor hesaplama formülü
      return Math.pow(moves, 3) * 15; // Daha yüksek puanlama
    },
  },
});
```

### Ses Efektleri Ekleme

`manifest.json` dosyasına yeni ses dosyaları ekleyebilirsiniz:

```json
{
  "bundles": [
    {
      "name": "default",
      "assets": [
        {
          "alias": "explosion-sound",
          "src": "sounds/explosion.mp3"
        },
        {
          "alias": "combo-sound",
          "src": "sounds/combo.mp3"
        }
      ]
    }
  ]
}
```

Ve bunları kodda kullanabilirsiniz:

```typescript
// Combo ses efekti
if (comboCount > 5) {
  sound.play('combo-sound');
}

// Patlama ses efekti
sound.play('explosion-sound', { volume: 0.8 });
```

## 🧪 Test Etme

### Build Testi

```bash
# Projeyi build et
npm run build

# Build edilen dosyaları test et
npm run preview
```

## 📁 Proje Yapısı

```
src/
├── core/                    # Oyun motor bileşenleri
│   ├── Board.ts            # Board mantığı
│   ├── CrushGameState.ts   # State machine
│   ├── HUD.ts              # UI bileşenleri
│   └── symbol/             # Gem bileşenleri
├── games/
│   └── game-one/           # Oyun implementasyonu
│       ├── GameContainer.ts # Ana oyun sınıfı
│       ├── manifest.json   # Asset manifest
│       └── options.ts      # Oyun seçenekleri
├── plugins/                # Özel plugin'ler
└── initApp.ts             # Uygulama başlatma
```

## 🎨 Asset Yönetimi

### Texture Ekleme

`public/assets/textures/` klasörüne texture dosyalarını ekleyin ve `manifest.json`'da tanımlayın:

```json
{
  "alias": "gem-purple",
  "src": ["textures/gem_purple.png"]
}
```

### Ses Dosyası Ekleme

`public/assets/sounds/` klasörüne ses dosyalarını ekleyin:

```json
{
  "alias": "power-up-sound",
  "src": "sounds/power-up.mp3"
}
```

## 📊 Performans Optimizasyonu

### Sprite Pool Kullanımı

```typescript
// Symbol pool'u özelleştirme
const symbolFactory = SymbolPool.createSymbolFactory(symbolConfig);
const pool = new SymbolPool(symbolFactory, symbolConfig);
```

---

Made with ❤️ by [ErdemYesiltas](https://github.com/ErdemYesiltas)
