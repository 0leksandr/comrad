import {ReactElement} from "react";

export type Int = BigInt

export class Position {
    constructor(public x: number, public y: number) {}

    asStyle(): {left: number, top: number} {
        return {
            left: this.x,
            top: -this.y,
        }
    }

    addPosition(other: Position): Position {
        return new Position(this.x + other.x, this.y + other.y)
    }

    subPosition(other: Position): Position {
        return new Position(this.x - other.x, this.y - other.y)
    }

    moveDiagonal(nr: number): Position {
        return new Position(this.x + nr, this.y - nr)
    }
}

export abstract class Element {
    abstract render(): ReactElement;
}
