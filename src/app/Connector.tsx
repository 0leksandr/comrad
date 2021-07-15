import React from "react";
import {Element, CartesianPosition} from "./General";
import {AbstractNode, OuterNode} from "./Tree";

export class Link {
    constructor(public readonly parent: AbstractNode, public readonly child: OuterNode) {}
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
        const from = this.link.parent.absolutePosition()
        const to = this.link.child.absolutePosition()
        const topLeft = new CartesianPosition(Math.min(from.x, to.x), Math.max(from.y, to.y))
        const lineFrom = from.sub(topLeft)
        const lineTo = to.sub(topLeft)
        return (
            <svg className="connector radial-connector"
                 key={`connector-${this.link.child.key()}`}
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
