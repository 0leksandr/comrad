import {Position} from "./General";
import {Comment} from "./Comment/Comment";
import {Link} from "./Connector";

export class NodePayload { // TODO: rename
    constructor(
        public readonly comment: Comment,
        public readonly commentLevel: number
    ) {}

    is(other: NodePayload): boolean {
        return this.comment.id === other.comment.id
    }
}

export abstract class Node {
    private readonly diameter = 100
    children: Leave[] = []

    protected constructor(public readonly payload: NodePayload, public readonly level: number) {}

    abstract sectorSize(): number

    abstract absolutePosition(): Position

    abstract relativePosition(): Position

    abstract angle(): number

    abstract nrSubSectors(): number

    abstract neighbours(): Node[]

    protected isTrunk(): boolean {
        if (this.payload.commentLevel === 0) return true
        return this.children.some(child => child.isTrunk())
    }

    add(payload: NodePayload): Leave {
        this.children.push(new Leave(this, payload))
        return this.children[this.children.length - 1]
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
        const root = new Root(this.payload, this.angle() - .5)
        this.neighbours().forEach(neighbour => {
            neighbour.joinTo(root)
        })
        return new Tree(root)
    }

    style(): {} {
        return {
            width: this.diameter,
            height: this.diameter,
            borderRadius: this.radius(),
        }
    }

    protected joinTo(source: Node): void {
        const added = source.add(this.payload)
        this.neighbours().forEach(neighbour => {
            if (!neighbour.payload.is(source.payload)) neighbour.joinTo(added)
        })
    }
}

export class Root extends Node {
    constructor(payload: NodePayload, private readonly _angle: number) {
        super(payload, 0);
    }
    
    sectorSize(): number {
        return 1
    }

    absolutePosition(): Position {
        return new Position(0, 0)
    }

    relativePosition(): Position {
        return new Position(0, 0)
    }

    angle(): number {
        return this._angle
    }

    nrSubSectors(): number {
        return this.children.length
    }

    neighbours(): Node[] {
        return this.children
    }
}

export class Leave extends Node { // TODO: cache
    private readonly childPosition: number

    constructor(private readonly parent: Node, payload: NodePayload) {
        super(payload, parent.level + 1)
        this.childPosition = parent.children.length
    }

    sectorSize(): number {
        return this.parent.sectorSize() / (this.parent.children.length + 1)
    }

    absolutePosition(): Position {
        return this.parent.absolutePosition().addPosition(this.relativePosition())
    }

    relativePosition(): Position {
        const length = 150
        const angle = this.angle() * 2 * Math.PI
        const x = length * Math.sin(angle)
        const y = length * Math.cos(angle)
        return new Position(x, y)
    }

    angle(): number {
        let trunkPosition = -1
        this.parent.children.forEach((child, childPosition) => {
            if (child.isTrunk()) trunkPosition = childPosition
        })

        if (trunkPosition === this.childPosition) {
            return this.parent.angle()
        } else if (trunkPosition !== -1) {
            let childPosition = this.childPosition
            if (childPosition > trunkPosition) --childPosition

            const p = this.parent
            const pSecSize = p.sectorSize() / 2
            const nrFreeChildren = p.children.length - 1
            const nrLeft = nrFreeChildren / 2
            const nrRight = nrFreeChildren - nrLeft
console.log(this.childPosition, trunkPosition, childPosition, p.children.length, nrLeft, nrRight)
            if (childPosition < nrLeft) {
                return p.angle() - pSecSize + pSecSize * childPosition / nrLeft
            } else {
                return p.angle() + pSecSize * childPosition / nrRight
            }
        } else {
            const p = this.parent
            if (p.children.length === 1) return p.angle()
            const pSecSize = p.sectorSize()
            return p.angle() - pSecSize / 2 + pSecSize * this.childPosition / p.nrSubSectors()
        }
    }

    nrSubSectors(): number {
        return this.children.length - 1
    }

    neighbours(): Node[] {
        return [this.parent, ...this.children]
    }
}

export class Tree {
    public readonly nodes: { [key: number]: Node } = {}
    public readonly links: Link[]

    constructor(root: Root) {
        this.links = root.links()
        root.walk((node: Node): void => {
            this.nodes[node.payload.comment.id] = node
        })
    }
}
