import {Position} from "./General";
import {Comment} from "./Comment";
import {Link} from "./Connector";

export class NodePayload { // TODO: rename. Leave?
    constructor(
        public readonly comment: Comment,
        public readonly commentLevel: number
    ) {}

    is(other: NodePayload): boolean {
        return this.comment.id === other.comment.id
    }

    isRoot(): boolean {
        return this.commentLevel === 0
    }
}

export abstract class YoungNode { // TODO: rename. Or remove (move logic to Template)
    public readonly children: YoungLeave[] = []

    constructor(public readonly payload: NodePayload) {}

    abstract harden(node: Node): void // TODO: rename. draw?

    isTrunk(): boolean { // TODO: remove?
        if (this.payload.isRoot()) return true
        return this.children.some(child => child.isTrunk())
    }

    add(payload: NodePayload): YoungLeave {
        this.children.push(new YoungLeave(payload))
        return this.children[this.children.length - 1]
    }

    walk(fn: (node: YoungNode) => void): void {
        fn(this)
        this.children.forEach(child => child.walk(fn))
    }

    protected childAngle(
        node: Node,
        thisSectorSize: number, // TODO
        childIndex: number,
        nrChildren: number,
    ): number {
        if (nrChildren === 1) {
            if (childIndex === 0) {
                return node.angle
            } else {
                throw new Error("Logic error")
            }
        }
        return node.angle - thisSectorSize / 2 + thisSectorSize * childIndex / (nrChildren - 1)
    }
}
export class YoungRoot extends YoungNode {
    harden(node: Node): void { // TODO: remove (inline)?
        if (this.payload.isRoot()) {
            const sectorSize = 1
            this.children.forEach((child, index) => {
                node.add(
                    child,
                    this.childAngle(node, sectorSize, index, this.children.length + 1),
                    sectorSize / this.children.length,
                )
            })
        } else {
            const bastards: YoungLeave[] = []
            this.children.forEach(child => {
                if (child.isTrunk()) {
                    node.add(child, node.angle, 0)
                } else {
                    bastards.push(child)
                }
            })
            const sectorSize = 0.4 // TODO: test other values
            bastards.forEach((bastard, index) => {
                node.add(
                    bastard,
                    this.childAngle(node, sectorSize, index, bastards.length) - 0.5,
                    sectorSize / bastards.length,
                )
            })
        }
    }

    asTree(): Tree {
        const angle = 0.5
        const root = new Root(this.payload, angle, this.sectorSize())
        this.harden(root)
        return new Tree(root)
    }

    private sectorSize(): number { // TODO: remove?
        return this.payload.isRoot() ? 1 : 0.4 // TODO: test other values
    }
}
export class YoungLeave extends YoungNode {
    harden(node: Node): void {
        if (this.payload.isRoot()) {
            const sectorSize = 0.5 // TODO: test other values
            this.children.forEach((child, index) => {
                node.add(
                    child,
                    this.childAngle(node, sectorSize, index, this.children.length),
                    sectorSize / this.children.length,
                )
            })
        } else if (this.isTrunk()) {
            const bastards: YoungLeave[] = []
            this.children.forEach(child => {
                if (child.isTrunk()) {
                    node.add(child, node.angle, 0)
                } else {
                    bastards.push(child)
                }
            })
            const angle = 1 / 3 // TODO: test other values
            if (bastards.length === 2) {
                node.add(bastards[0], node.angle - angle, 0)
                node.add(bastards[1], node.angle + angle, 0)
            } else {
                bastards.forEach(bastard => {
                    node.add(bastard, node.angle + angle, 0)
                })
            }
        } else {
            this.children.forEach((child, index) => {
                node.add(
                    child,
                    this.childAngle(node, node.sectorSize, index, this.children.length),
                    node.sectorSize / this.children.length,
                )
            })
        }
    }
}

export abstract class Node {
    private readonly diameter = 100
    children: Leave[] = []

    constructor(
        public readonly payload: NodePayload,
        public readonly angle: number,
        public readonly sectorSize: number,
    ) {}

    abstract absolutePosition(): Position

    abstract relativePosition(): Position

    abstract neighbours(): Node[]

    abstract isRoot(): boolean

    isTrunk(): boolean {
        if (this.payload.isRoot()) return true
        return this.children.some(child => child.isTrunk())
    }

    add(leave: YoungLeave, angle: number, sectorSize: number): void {
        this.children.push(new Leave(this, leave.payload, angle, sectorSize))
        leave.harden(this.children[this.children.length - 1])
    }

    radius(): number {
        return this.diameter / 2
    }

    walk(fn: (node: Node) => void): void {
        fn(this)
        this.children.forEach(child => child.walk(fn))
    }

    links(): Link[] {
        let links: Link[] = []
        this.children.forEach(child => {
            links.push(new Link(this, child))
            links = links.concat(child.links())
        })
        return links
    }

    asTree(): Tree {
        // const angle = this.payload.isRoot() ? this.angle : (this.angle - .5);
        const root = new YoungRoot(this.payload)
        this.neighbours().forEach(child => {
            child.joinTo(root)
        })
        return root.asTree()
    }

    style(): {} {
        return {
            width: this.diameter,
            height: this.diameter,
            borderRadius: this.radius(),
        }
    }

    protected joinTo(source: YoungNode): void {
        const added = source.add(this.payload)
        this.neighbours().forEach(neighbour => {
            if (!neighbour.payload.is(source.payload)) neighbour.joinTo(added)
        })
    }
}

export class Root extends Node {
    absolutePosition(): Position {
        return new Position(0, 0)
    }

    relativePosition(): Position {
        return new Position(0, 0)
    }

    neighbours(): Node[] {
        return this.children
    }

    isRoot(): boolean {
        return true
    }
}

export class Leave extends Node { // TODO: cache
    private readonly childIndex: number // TODO: remove

    constructor(
        private readonly parent: Node,
        payload: NodePayload,
        angle: number,
        sectorSize: number,
    ) {
        super(payload, angle, sectorSize)
        this.childIndex = parent.children.length
    }

    absolutePosition(): Position {
        return this.parent.absolutePosition().addPosition(this.relativePosition())
    }

    relativePosition(): Position {
        const length = 150
        const angle = this.angle * 2 * Math.PI
        const x = length * Math.sin(angle)
        const y = length * Math.cos(angle)
        return new Position(x, y)
    }

    neighbours(): Node[] {
        return [this.parent, ...this.children]
    }

    isRoot(): boolean {
        return false
    }
}

// class Group extends Leave {
//     constructor(private readonly leaves: Leave[]) {
//         if (leaves.length < 2) throw new Error("")
//         super()
//     }
//
//     isTrunk(): boolean {
//         return false
//     }
//
//     isRoot(): boolean {
//         return false
//     }
// }

class Sector {
    constructor(public readonly angle: number, public readonly sectorSize: number) {}
}

export class Tree {
    public readonly nodes: Node[] = []
    public readonly links: Link[]

    constructor(root: Root) {
        this.links = root.links()
        root.walk((node: Node): void => {
            this.nodes.push(node)
        })
    }
}
