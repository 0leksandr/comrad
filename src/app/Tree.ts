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

// abstract class YoungNode { // TODO: rename
//     children: Leave[] = []
//
//     protected constructor(public readonly payload: NodePayload) {}
//
//     add(payload: NodePayload): Leave {
//         this.children.push(new Leave(this, payload))
//         return this.children[this.children.length - 1]
//     }
//
//     walk(fn: (node: YoungNode) => void): void {
//         fn(this)
//         this.children.forEach(child => child.walk(fn))
//     }
// }

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

    abstract childAngle(childIndex: number): number

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
        const angle = this.payload.isRoot() ? this.angle() : (this.angle() - .5);
        const root = new Root(this.payload, angle)
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

    protected subAngle(childIndex: number, nrChildren: number): number {
        if (nrChildren === 1) {
            if (childIndex === 0) {
                return this.angle()
            } else {
                throw new Error("Logic error")
            }
        }
        const sectorSize = this.sectorSize()
        return this.angle() - sectorSize / 2 + sectorSize * childIndex / (nrChildren - 1)
    }

    protected getBastardIndex(childIndex: number): number { // TODO: rename
        let trunkIndex = null
        this.children.forEach((child, index) => {
            if (child.isTrunk()) trunkIndex = index
        })
        if (trunkIndex === null) {
            return childIndex
        } else if (childIndex > trunkIndex) {
            return childIndex - 1
        } else if (childIndex === trunkIndex) {
            throw new Error("Cannot get bastard index for a trunk")
        } else {
            return childIndex
        }
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

    childAngle(childIndex: number): number {
        if (this.payload.isRoot()) {
            return this.subAngle(childIndex, this.children.length + 1)
        } else {
            return this.subAngle(this.getBastardIndex(childIndex), this.children.length - 1) - 0.5
        }
    }
}

export class Leave extends Node { // TODO: cache
    private readonly childIndex: number

    constructor(private readonly parent: Node, payload: NodePayload) {
        super(payload)
        this.childIndex = parent.children.length
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
            return this.parent.childAngle(this.childIndex)
        }
    }

    neighbours(): Node[] {
        return [this.parent, ...this.children]
    }

    isRoot(): boolean {
        return false
    }

    childAngle(childIndex: number): number {
        if (this.isTrunk() && !this.payload.isRoot()) {
            const nrBastards = this.children.length - 1
            const corrective = 1 / 3
            const angle = this.angle()
            switch (nrBastards) {
                case 0: throw new Error("Logic error")
                case 1: return angle + corrective
                case 2: return this.getBastardIndex(childIndex) === 0 ? (angle + corrective) : (angle - corrective)
                default: return (angle + corrective) // TODO: check
            }
        } else {
            return this.subAngle(childIndex, this.children.length)
        }
    }

    // protected childOf(): ChildOf {
    //     const p = this.parent;
    //     const getBastardIndex = (): number => {
    //         let bastardIndex = this.childIndex
    //         let trunkIndex = null
    //         for (const key in p.children) {
    //             if (p.children[key].isTrunk()) trunkIndex = parseInt(key)
    //         }
    //         if (trunkIndex === null) throw new Error("Logic error")
    //         if (trunkIndex < bastardIndex) --bastardIndex
    //         return bastardIndex
    //     }
    //     if (p.isRoot() && p.payload.isRoot()) {
    //         return new ChildOfCenter(this.childIndex, this.parent)
    //     } else if (p.isRoot()) {
    //         return new ChildOfRootNode(getBastardIndex(), this.parent)
    //     } else if (p.payload.isRoot()) {
    //         return new ChildOfRootArticle(this.childIndex, this.parent)
    //     } else if (p.isTrunk()) {
    //         const bastardIndex = getBastardIndex()
    //         return bastardIndex < (p.children.length - 1) / 2
    //             ? new LeftChildOfTrunk(bastardIndex, this.parent)
    //             : new RightChildOfTrunk(bastardIndex, this.parent)
    //     } else {
    //         return new NormalChild(this.childIndex, this.parent)
    //     }
    // }
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

// abstract class ChildOf {
//     constructor(protected readonly bastardIndex: number, protected readonly parent: Node) {}
//
//     angle(): number {
//         if (this.nrBastards() === 1) return this.parent.angle()
//         const pSecSize = this.parent.sectorSize()
//         return this.parent.angle() - pSecSize / 2 + pSecSize * this.bastardIndex / (this.nrBastards() - 1)
//     }
//
//     protected nrBastards(): number {
//         return this.parent.children.length
//     }
// }
// abstract class ChildOfTrunk extends ChildOf {
//     protected nrBastards(): number {
//         return super.nrBastards() - 1
//     }
// }
// class ChildOfCenter extends ChildOf {
//     protected nrBastards(): number {
//         return super.nrBastards() + 1
//     }
// }
// class ChildOfRootNode extends ChildOfTrunk {
//     angle(): number {
//         return super.angle() - 0.5
//     }
// }
// class ChildOfRootArticle extends ChildOf {}
// class LeftChildOfTrunk extends ChildOfTrunk {
//     angle(): number {
//         return super.angle() - 0.25
//     }
// }
// class RightChildOfTrunk extends ChildOfTrunk {
//     angle(): number {
//         return super.angle() + 0.25
//     }
// }
// class NormalChild extends ChildOf {}

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
