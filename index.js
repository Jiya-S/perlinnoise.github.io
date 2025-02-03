const grammar = {
    _expand: function(rule) {
        if (Array.isArray(rule)) {
            return rule[Math.floor(Math.random() * rule.length)];
        }
        return rule;
    },
    generate: function() {
        const prefix = this._expand(this.prefix);
        const suffix = this._expand(this.suffix);
        const adjective = this._expand(this.adjective);
        const place = this._expand(this.place);
        const name = this._expand(this.name);

        const formats = [
            `${prefix}${suffix}`,
            `${prefix} ${name}`,
            `${adjective} ${place}`,
            `${name}${suffix}`
        ];

        return this._expand(formats);
    },
    prefix: [
        "Santa", "White", "Pier", "Iris", "Lake", "Castle", "Garden", "County",
        "Forest", "Woody", "Valley", "Barb", "Maze", "St.", "Mountain", "Farm",
        "Gold", "Sunny", "Rainy", "University", "Breaking", "Avenue",
        "Dome", "Den"
    ],
    suffix: [
        "dale", "tale", "burrow", "alley", "camp", "ville", "day", "ton",
        "land", "dooms", "sand", "glass"
    ],
    adjective: [
        "Brave", "Moral", "River", "Shiny", "Viente", "Freezing",
        "Warm", "Droopy", "Musty", "Clear", "Grumpy", "Smiley", "Valorant", "Academic",
        "Smart", "Fit", "Hilly", "Cheesy", "Radiant", "Crusty",
        "Loopy", "Hard", "Dirty", "Twisted", "Wicked", "Evil", "Lovely",
        "Sweet", "Sour", "Drainy"
    ],
    place: ["Castle", "Hill", "Rock", "Town", "Road"],
    name: [
        "River", "Townsend", "York", "Finger", "Bridger", "Pendle", "Feathering", "Vegas"
    ]
};

class myScene extends Phaser.Scene {
    constructor() {
        super("myScene");
    }

    preload() {
        this.load.image('tileset', '/assets/Spritesheet/mapPack_spritesheet.png');
    }

    init(data) {
        this.seed = data.seed;
        this.noiseScale = data.noiseScale;
        this.tilesetData = {
            name: "terrain",
            key: "tileset"
        };
    }

    create() {
        if (!this.seed) this.seed = Math.random();
        if (!this.noiseScale) this.noiseScale = 10;

        const mapWidth = 20;
        const mapHeight = 15;
        const tileSize = 64;


        const layers = {
            base: [],
            terrain: [],
            hills: [],
            peaks: [],
        };

        // Initialize arrays
        for (const layer in layers) {
            for (let y = 0; y < mapHeight; y++) {
                layers[layer][y] = new Array(mapWidth).fill(0);
            }
        }


        noise.seed(this.seed);
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                const baseNoise = noise.perlin2(x / this.noiseScale, y / this.noiseScale);
                const detailNoise = noise.perlin2((x + 100) / (this.noiseScale * 0.5), (y + 100) / (this.noiseScale * 0.5));

                //Water and Grass layer
                if (baseNoise < -0.2) {
                    layers.base[y][x] = 70; // Water
                } else {
                    layers.base[y][x] = 40; // Grass
                }

                // Rocks
                if (baseNoise > 0.1) {
                    layers.terrain[y][x] = 165;
                }

                // Hills
                if (baseNoise > 0.3 && detailNoise > 0) {
                    layers.hills[y][x] = 50;
                }

                // Snow
                if (baseNoise > 0.5 && detailNoise > 0.2) {
                    layers.peaks[y][x] = 51;
                }
            }
        }

        //tilemaps
        const map = this.make.tilemap({
            tileWidth: tileSize,
            tileHeight: tileSize,
            width: mapWidth,
            height: mapHeight
        });

        const tileset = map.addTilesetImage(this.tilesetData.name, this.tilesetData.key);

        // LAYERS
        const baseLayer = map.createBlankLayer('base', tileset);
        const terrainLayer = map.createBlankLayer('terrain', tileset);
        const hillsLayer = map.createBlankLayer('hills', tileset);
        const peaksLayer = map.createBlankLayer('peaks', tileset);


        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                if (layers.base[y][x]) baseLayer.putTileAt(layers.base[y][x], x, y);
                if (layers.terrain[y][x]) terrainLayer.putTileAt(layers.terrain[y][x], x, y);
                if (layers.hills[y][x]) hillsLayer.putTileAt(layers.hills[y][x], x, y);
                if (layers.peaks[y][x]) peaksLayer.putTileAt(layers.peaks[y][x], x, y);
            }
        }



        // Add town names
        this.addTownNames(mapWidth, mapHeight, tileSize, baseLayer);

        // Input handlers
        this.input.keyboard.on('keydown-COMMA', () => {
            this.noiseScale = Math.max(1, this.noiseScale - 1);
            this.scene.restart({ seed: this.seed, noiseScale: this.noiseScale });
        });

        this.input.keyboard.on('keydown-PERIOD', () => {
            this.noiseScale++;
            this.scene.restart({ seed: this.seed, noiseScale: this.noiseScale });
        });

        this.input.keyboard.on('keydown-R', () => {
            this.seed = Math.random();
            this.scene.restart({ seed: this.seed, noiseScale: this.noiseScale });
        });
    }

    addTownNames(mapWidth, mapHeight, tileSize, baseLayer) {
        for (let y = 0; y < mapHeight; y++) {
            for (let x = 0; x < mapWidth; x++) {
                // Add names every 5 tiles to space them out
                if (y % 5 === 0 && x % 5 === 0) {
                    // Check if it's a grass tile
                    const tile = baseLayer.getTileAt(x, y);
                    if (tile && tile.index === 40) { // 40 is grass tile index
                        // Generate a town name
                        const townName = grammar.generate();

                        // Add text to the game
                        this.add.text(x * tileSize + tileSize/2, y * tileSize + tileSize/2, townName, {
                            fontSize: '11px',
                            fill: '#000000',
                            align: 'center',
                            stroke: '#ffffff',
                            strokeThickness: 5
                        }).setOrigin(0.5, 0.5)
                            .setDepth(100);
                    }
                }
            }
        }
    }

}

const config = {
    type: Phaser.CANVAS,
    width: 1280,
    height: 960,
    backgroundColor: '#87CEEB',
    scene: [myScene],
    pixelArt: true
};

const game = new Phaser.Game(config);
