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
        parentSector: Sector,
        childIndex: number,
        nrChildren: number,
    ): number {
        if (nrChildren === 1) {
            if (childIndex === 0) {
                return parentSector.angle
            } else {
                throw new Error("Logic error")
            }
        }
        return parentSector.angle
            - parentSector.sectorSize / 2
            + parentSector.sectorSize * childIndex / (nrChildren - 1)
    }

    protected childSector(
        parentSector: Sector,
        childIndex: number,
        nrChildren: number,
    ): Sector {
        let sectorSize = parentSector.sectorSize / nrChildren
        if (nrChildren === 2 && sectorSize > 1 / 2) sectorSize = 1 / 3
        return new Sector(this.childAngle(parentSector, childIndex, nrChildren), sectorSize)
    }

    protected addTrunk(node: Node): YoungLeave[] { // TODO: rename
        const bastards: YoungLeave[] = []
        this.children.forEach(child => {
            if (child.isTrunk()) {
                if (child.payload.isRoot()) {
                    node.add(child, new Sector(node.sector.angle, 0.5)) // TODO: test other values
                } else {
                    node.add(child, node.sector.narrow())
                }
            } else {
                bastards.push(child)
            }
        })
        return bastards
    }
}
export class YoungRoot extends YoungNode { // TODO: remove unnecessary exports
    harden(node: Node): void { // TODO: remove (inline)?
        if (this.payload.isRoot()) {
            const sectorSize = 1
            this.children.forEach((child, index) => {
                node.add(
                    child,
                    new Sector(
                        this.childAngle(node.sector, index, this.children.length + 1),
                        sectorSize / this.children.length,
                    ),
                )
            })
        } else {
            const bastards = this.addTrunk(node)
            bastards.forEach((bastard, index) => {
                node.add(
                    bastard,
                    this.childSector(node.sector, index, bastards.length).add(0.5),
                )
            })
        }
    }

    asTree(): Tree {
        const angle = 0.5
        const sectorSize = this.payload.isRoot() ? 1 : 0.4 // TODO: test other values
        const root = new Root(this.payload, new Sector(angle, sectorSize))
        this.harden(root)
        return new Tree(root)
    }
}
export class YoungLeave extends YoungNode {
    harden(node: Node): void {
        if (this.isTrunk() && !this.payload.isRoot()) {
            const bastards = this.addTrunk(node)
            const angle = 1 / 3 // TODO: test other values
            if (bastards.length === 2) {
                node.add(bastards[0], node.sector.narrow().add(-angle))
                node.add(bastards[1], node.sector.narrow().add(angle))
            } else {
                bastards.forEach(bastard => {
                    node.add(bastard, node.sector.narrow().add(angle))
                })
            }
        } else {
            this.children.forEach((child, index) => {
                node.add(
                    child,
                    this.childSector(node.sector, index, this.children.length),
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
        public readonly sector: Sector,
    ) {}

    abstract absolutePosition(): Position

    abstract relativePosition(): Position

    abstract neighbours(): Node[]

    abstract isRoot(): boolean

    isTrunk(): boolean {
        if (this.payload.isRoot()) return true
        return this.children.some(child => child.isTrunk())
    }

    add(leave: YoungLeave, sector: Sector): void {
        this.children.push(new Leave(this, leave.payload, sector))
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
        sector: Sector,
    ) {
        super(payload, sector)
        this.childIndex = parent.children.length
    }

    absolutePosition(): Position {
        return this.parent.absolutePosition().addPosition(this.relativePosition())
    }

    relativePosition(): Position {
        const length = 150
        const angle = this.sector.angle * 2 * Math.PI
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

    narrow(): Sector {
        return new Sector(this.angle, 0)
    }

    add(angle: number): Sector {
        return new Sector(this.angle + angle, this.sectorSize)
    }
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
