export class Config {
    static readonly DIRECTION_DOWN = 'direction_down'
    static readonly DIRECTION_INHERIT = 'direction_inherit'

    static get(): Config {
        return new Config()
    }

    direction(): string {
        return Config.DIRECTION_INHERIT
        // return Config.DIRECTION_DOWN
    }

    moveRoot(): boolean {
        return true
    }
}
