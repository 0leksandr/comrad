import {Position} from "./General";
import {Comment} from "./Comment";
import {Link} from "./Connector";

export class NodePayload { // TODO: rename
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

export abstract class Node {
    private readonly diameter = 100
    children: Leave[] = []

    protected constructor(public readonly payload: NodePayload) {}

    abstract sectorSize(): number

    abstract absolutePosition(): Position

    abstract relativePosition(): Position

    abstract angle(): number

    abstract neighbours(): Node[]

    abstract isRoot(): boolean

    isTrunk(): boolean {
        if (this.payload.isRoot()) return true
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
        super(payload)
    }
    
    sectorSize(): number {
        return this.payload.isRoot() ? 1 : 0.4 // TODO: test other values
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

    neighbours(): Node[] {
        return this.children
    }

    isRoot(): boolean {
        return true
    }
}

export class Leave extends Node { // TODO: cache
    private readonly childPosition: number

    constructor(private readonly parent: Node, payload: NodePayload) {
        super(payload)
        this.childPosition = parent.children.length
    }

    sectorSize(): number {
        if (this.payload.isRoot()) {
            return 0.5 // TODO: test other values
        } else if (this.isTrunk()) {
            return 0.1 // TODO: test
        } else {
            return this.parent.sectorSize() / (this.parent.children.length + 1) // TODO: remove +1 ?
        }
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
        if (this.isTrunk()) {
            return this.parent.angle()
        } else {
            return this.childOf().angle()
        }
    }

    neighbours(): Node[] {
        return [this.parent, ...this.children]
    }

    isRoot(): boolean {
        return false
    }

    protected childOf(): ChildOf {
        const p = this.parent;
        const getBastardPosition = (): number => {
            let bastardPosition = this.childPosition
            let trunkPosition = null
            for (const key in p.children) {
                if (p.children[key].isTrunk()) trunkPosition = parseInt(key)
            }
            if (trunkPosition === null) throw new Error("Logic error")
            if (trunkPosition < bastardPosition) --bastardPosition
            return bastardPosition
        }
        if (p.isRoot() && p.payload.isRoot()) {
            return new ChildOfCenter(this.childPosition, this.parent)
        } else if (p.isRoot()) {
            return new ChildOfRootNode(getBastardPosition(), this.parent)
        } else if (p.payload.isRoot()) {
            return new ChildOfRootArticle(this.childPosition, this.parent)
        } else if (p.isTrunk()) {
            const bastardPosition = getBastardPosition()
            return bastardPosition < (p.children.length - 1) / 2
                ? new LeftChildOfTrunk(bastardPosition, this.parent)
                : new RightChildOfTrunk(bastardPosition, this.parent)
        } else {
            return new NormalChild(this.childPosition, this.parent)
        }
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

// abstract class Role {
//     abstract group(): void
//
//     abstract childAngle(childIndex: number): number
// }
// class RoleCenter extends Role { // root and article
// }
// class RoleNodeRoot extends Role {
// }
// class RoleArticle extends Role {
// }
// class RoleTrunk extends Role {
// }
// class RoleNormal extends Role {
// }

abstract class ChildOf {
    constructor(protected readonly bastardPosition: number, protected readonly parent: Node) {}

    angle(): number {
        if (this.nrBastards() === 1) return this.parent.angle()
        const pSecSize = this.parent.sectorSize()
        return this.parent.angle() - pSecSize / 2 + pSecSize * this.bastardPosition / (this.nrBastards() - 1)
    }

    protected nrBastards(): number {
        return this.parent.children.length
    }
}
abstract class ChildOfTrunk extends ChildOf {
    protected nrBastards(): number {
        return super.nrBastards() - 1
    }
}
class ChildOfCenter extends ChildOf {
    protected nrBastards(): number {
        return super.nrBastards() + 1
    }
}
class ChildOfRootNode extends ChildOfTrunk {
    angle(): number {
        return super.angle() - 0.5
    }
}
class ChildOfRootArticle extends ChildOf {}
class LeftChildOfTrunk extends ChildOfTrunk {
    angle(): number {
        return super.angle() - 0.25
    }
}
class RightChildOfTrunk extends ChildOfTrunk {
    angle(): number {
        return super.angle() + 0.25
    }
}
class NormalChild extends ChildOf {}

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
