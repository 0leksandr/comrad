import React from "react";
import {Element, Position} from "./General";
import {AbstractGroupNode, OuterGroupNode} from "./Tree";

export class Link {
    constructor(
        public readonly parent: AbstractGroupNode, // TODO: GroupNodeDecorator?
        public readonly child: OuterGroupNode,
    ) {}
}

abstract class Connector extends Element {
    protected constructor(protected readonly link: Link, private readonly colors: string[]) {
        super()
    }

    protected color(): string {
        const level = Math.min(this.link.parent.commentLevel(), this.link.child.commentLevel())
        return this.colors[level % this.colors.length]
    }
}

export class LineConnector extends Connector {
    private readonly thickness = 2

    constructor(link: Link) {
        super(link, ["rgb(255,0,0)", "rgb(0,255,0)", "rgb(255, 255, 0)"])
    }

    render(): React.ReactElement {
        const from = this.link.parent.absolutePosition().moveDiagonal(this.link.parent.radius())
        const to = this.link.child.absolutePosition().moveDiagonal(this.link.child.radius())
        const topLeft = new Position(Math.min(from.x, to.x), Math.max(from.y, to.y))
        const lineFrom = from.subPosition(topLeft)
        const lineTo = to.subPosition(topLeft)
        return (
            <svg className="connector radial-connector"
                 key={`connector-${this.link.child.id()}`}
                 width={Math.abs(from.x - to.x) + this.thickness}
                 height={Math.abs(from.y - to.y) + this.thickness}
                 style={topLeft.asStyle()}
            >
                <line x1={lineFrom.x} y1={-lineFrom.y}
                      x2={lineTo.x} y2={-lineTo.y}
                      style={{
                          stroke: this.color(),
                          strokeWidth: this.thickness,
                      }}
                />
            </svg>
        )
    }
}
