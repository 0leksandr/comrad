import {ReactElement} from "react";

export type Int = BigInt

interface Position { // TODO: Coordinate?
    asStyle(): {}
}
export class CartesianPosition implements Position {
    constructor(
        public readonly x: number,
        public readonly y: number,
    ) {}

    asStyle(): {left: number, top: number} {
        return {
            left: this.x,
            top: -this.y,
        }
    }

    add(other: CartesianPosition): CartesianPosition {
        return new CartesianPosition(this.x + other.x, this.y + other.y)
    }

    sub(other: CartesianPosition): CartesianPosition {
        return new CartesianPosition(this.x - other.x, this.y - other.y)
    }
}
class PolarPosition implements Position {
    constructor(
        public readonly angle: number,
        public readonly distance: number,
    ) {}

    asStyle(): {top: number, height: number, transform: string} {
        return {
            top: -this.distance,
            height: this.distance * 2,
            transform: `rotate(${this.angle}turn)`,
        }
    }
}

export abstract class Element {
    abstract render(): ReactElement;
}
