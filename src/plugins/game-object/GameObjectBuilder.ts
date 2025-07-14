import {
  AnimatedSprite,
  AnimatedSpriteOptions,
  assignWithIgnore,
  BitmapText,
  Container,
  ContainerOptions,
  Graphics,
  GraphicsOptions,
  ParticleContainer,
  ParticleContainerOptions,
  Sprite,
  SpriteOptions,
  Text,
  TextOptions,
  Texture,
  TilingSprite,
  TilingSpriteOptions,
} from 'pixi.js';

export class GameObjectBuilder {
  applyProperties<T extends Container = Container>(
    object: T,
    config: ContainerOptions,
    parent?: Container,
    ignore?: Record<string, boolean>,
  ): T {
    if (!ignore) {
      ignore = {};
    }
    if (ignore) {
      ignore.components = true;
    }
    assignWithIgnore(object, config as any, ignore);
    if (parent && !object.parent) {
      parent.addChild(object);
    }

    return object;
  }

  public container(config: ContainerOptions = {}, parent?: Container, ignore?: Record<string, boolean>): Container {
    return this.applyProperties(new Container(config), config, parent, ignore);
  }

  public graphics(config: GraphicsOptions = {}, parent?: Container, ignore?: Record<string, boolean>): Graphics {
    const graphics = new Graphics(config);

    this.applyProperties(graphics, config, parent, ignore);

    return graphics;
  }

  public particleContainer(
    config: ParticleContainerOptions = {},
    parent?: Container,
    ignore?: Record<string, boolean>,
  ): ParticleContainer {
    return this.applyProperties(new ParticleContainer(config), config, parent, ignore);
  }

  public animatedSprite(
    config: AnimatedSpriteOptions,
    parent?: Container,
    ignore?: Record<string, boolean>,
  ): AnimatedSprite {
    if (!Array.isArray(config.textures)) {
      config.textures = [Texture.EMPTY];
    }
    config.textures.map(t => (typeof t === 'string' ? Texture.from(t) : t));

    const sprite = new AnimatedSprite(config);
    return this.applyProperties(sprite, config, parent, ignore);
  }

  public sprite(
    config: Omit<SpriteOptions, 'texture'> & { texture: string | Texture },
    parent?: Container,
    ignore?: Record<string, boolean>,
  ): Sprite {
    const texture = config.texture;
    if (typeof config.texture === 'string') config.texture = Texture.from(config.texture);

    return this.applyProperties(
      new Sprite({
        ...config,
        texture: texture as Texture,
      }),
      config,
      parent,
      ignore,
    );
  }

  public tilingSprite(config: TilingSpriteOptions, parent?: Container, ignore?: Record<string, boolean>): TilingSprite {
    if (typeof config.texture === 'string') config.texture = Texture.from(config.texture);

    return this.applyProperties(new TilingSprite(config), config, parent, ignore);
  }

  public text(config: TextOptions, parent?: Container, ignore?: Record<string, boolean>): Text {
    return this.applyProperties(new Text(config), config, parent, ignore);
  }

  public bitmapText(config: TextOptions, parent?: Container, ignore?: Record<string, boolean>): BitmapText {
    return this.applyProperties(new BitmapText(config), config, parent, ignore);
  }

  public fromJSON(
    json: string | { [key: string]: ContainerOptions },
    parent?: Container,
    ignore?: Record<string, boolean>,
  ) {
    if (typeof json === 'string') {
      json = JSON.parse(json) as { [key: string]: ContainerOptions };
    }
    for (const key in json) {
      if (Object.prototype.hasOwnProperty.call(json, key)) {
        const gOpts: ContainerOptions = json[key];
        gOpts.label = gOpts.label || key;
        gOpts.type = gOpts.type || 'container';
        if (
          typeof gOpts.type === 'string' &&
          gOpts.type in this &&
          typeof this[gOpts.type as keyof GameObjectBuilder] === 'function'
        ) {
          let obj = null;
          if (typeof this[gOpts.type as keyof GameObjectBuilder] === 'function') {
            obj = (this[gOpts.type as keyof GameObjectBuilder] as Function).call(this, gOpts, parent, ignore);
          }

          if (typeof gOpts.children === 'object' && !Array.isArray(gOpts.children)) {
            this.fromJSON(gOpts.children, obj as Container);
          }
        }
      }
    }
  }
}
