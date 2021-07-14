import {Position} from "./General";
import {Comment} from "./Comment";
import {Link} from "./Connector";
import {ReactElement} from "react";

// TODO: remove unnecessary exports

export class NodePayload { // TODO: rename. Leaf?
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

export abstract class Sprout { // TODO: remove (move logic to Template)?
    public readonly children: SproutLeave[] = []

    constructor(public readonly payload: NodePayload) {}

    isTrunk(): boolean { // TODO: remove?
        if (this.payload.isRoot()) return true
        return this.children.some(child => child.isTrunk())
    }

    add(payload: NodePayload): SproutLeave {
        this.children.push(new SproutLeave(payload))
        return this.children[this.children.length - 1]
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

    protected addTrunk(node: AbstractParentNode): SproutLeave[] { // TODO: rename
        const bastards: SproutLeave[] = []
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
export class SproutRoot extends Sprout { // TODO: Sapling?
    asTree(): Tree {
        const angle = 0.5
        const sectorSize = this.payload.isRoot() ? 1 : 0.4 // TODO: test other values
        const root = new Root(this.payload, new Sector(angle, sectorSize))
        if (this.payload.isRoot()) {
            const sectorSize = 1
            this.children.forEach((child, index) => {
                root.add(
                    child,
                    new Sector(
                        this.childAngle(root.sector, index, this.children.length + 1),
                        sectorSize / this.children.length,
                    ),
                )
            })
        } else {
            const bastards = this.addTrunk(root)
            bastards.forEach((bastard, index) => {
                root.add(
                    bastard,
                    this.childSector(root.sector, index, bastards.length).add(0.5),
                )
            })
        }
        return new Tree(root)
    }
}
class SproutLeave extends Sprout {
    harden(node: AbstractParentNode): void {
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

interface NodeInterface {
    absolutePosition(): Position

    style(): {}

    radius(): number

    commentLevel(): number

    render(): ReactElement
}
export interface InnerNode extends NodeInterface {
    group(): void
}
export interface OuterNode extends NodeInterface {
    asTree(): Tree

    id(): string

    getParent(): InnerNode
}

export abstract class AbstractNode implements NodeInterface {
    private readonly diameter = 100

    protected constructor(public readonly sector: Sector) {}

    abstract absolutePosition(): Position

    abstract outerNodes(): OuterNode[]

    abstract links(): Link[]

    abstract render(): ReactElement

    abstract commentLevel(): number

    radius(): number {
        return this.diameter / 2
    }

    style(): {} {
        return {
            width: this.diameter,
            height: this.diameter,
            borderRadius: this.radius(),
        }
    }
}

export abstract class AbstractParentNode extends AbstractNode implements InnerNode {
    children: Node[] = []

    constructor(
        public readonly payload: NodePayload,
        sector: Sector,
    ) {
        super(sector)
    }

    abstract group(): void

    protected abstract neighbours(): AbstractParentNode[]

    add(leave: SproutLeave, sector: Sector): void {
        this.children.push(new Node(this, leave.payload, sector))
        leave.harden(this.children[this.children.length - 1])
    }

    outerNodes(): OuterNode[] {
        let nodes: OuterNode[] = []
        this.children.forEach(child => {
            nodes = nodes.concat(child.outerNodes())
        })
        return nodes
    }

    soften(source: Sprout): void {
        const added = source.add(this.payload)
        this.neighbours().forEach(neighbour => {
            if (!neighbour.payload.is(source.payload)) neighbour.soften(added)
        })
    }

    links(): Link[] {
        let links: Link[] = []
        this.children.forEach(child => {
            links.push(new Link(this, child))
            links = links.concat(child.links())
        })
        return links
    }

    render(): ReactElement { // TODO: remove?
        return this.payload.comment.render()
    }

    commentLevel(): number { // TODO: remove?
        return this.payload.commentLevel
    }
}

class Root extends AbstractParentNode implements InnerNode {
    absolutePosition(): Position {
        return new Position(0, 0)
    }

    group(): void { // TODO: group root itself
        this.children.forEach(child => {
            child.group()
        })
    }

    protected neighbours(): AbstractParentNode[] {
        return this.children
    }
}

class Node extends AbstractParentNode implements InnerNode, OuterNode { // TODO: cache
    constructor(
        private readonly parent: AbstractParentNode,
        payload: NodePayload,
        sector: Sector,
    ) {
        super(payload, sector)
    }

    absolutePosition(): Position {
        return this.parent.absolutePosition().addPosition(this.sector.relativePosition())
    }

    outerNodes(): OuterNode[] {
        return [this, ...super.outerNodes()]
    }

    asTree(): Tree {
        const root = new SproutRoot(this.payload)
        this.neighbours().forEach(neighbour => {
            neighbour.soften(root)
        })
        return root.asTree()
    }

    id(): string {
        return `node-${this.payload.comment.id}`
    }

    getParent(): InnerNode {
        return this.parent
    }

    group(): void {
        const minAngle = 0.5 // TODO
        if (this.children.length > 1 && this.children[0].sector.sectorSize < minAngle) {
            // this.children = [new NodeGroup(this)] // TODO
        } else {
            this.children.forEach(chile => {
                chile.group()
            })
        }
    }

    protected neighbours(): AbstractParentNode[] {
        return [this.parent, ...this.children]
    }
}

class NodeGroup extends AbstractNode implements OuterNode {
    private readonly nodes: Node[]

    constructor(private readonly parent: Node) {
        super(parent.sector.narrow())
        if (parent.children.length < 2) throw new Error("") // TODO: make it logically impossible?
        this.nodes = parent.children
    }

    asTree(): Tree {
        this.ungroup()
        return this.parent.asTree()
    }

    id(): string {
        return `group-${this.parent.id()}`
    }

    getParent(): InnerNode {
        return this.parent
    }

    absolutePosition(): Position {
        return this.parent.absolutePosition().addPosition(this.sector.relativePosition())
    }

    commentLevel(): number {
        return this.parent.commentLevel() + 1
    }

    links(): Link[] { // TODO: remove?
        return []
    }

    outerNodes(): OuterNode[] {
        return this.parent.children // TODO: think about
    }

    render(): ReactElement { // TODO: move, and remove extension .tsx from the file
        return (
            <div className="comment-group">
                {this.parent.children.length}
            </div>
        )
    }

    private ungroup(): void {
        this.parent.children = this.nodes
    }
}
// class RootGroup extends AbstractNode implements OuterNode {
// }

class Sector {
    constructor(
        public readonly angle: number, // TODO: direction, vector
        public readonly sectorSize: number, // TODO: width?
    ) {}

    narrow(): Sector {
        return new Sector(this.angle, 0)
    }

    add(angle: number): Sector {
        return new Sector(this.angle + angle, this.sectorSize)
    }

    relativePosition(): Position {
        const length = 150
        const angle = this.angle * 2 * Math.PI
        const x = length * Math.sin(angle)
        const y = length * Math.cos(angle)
        return new Position(x, y)
    }
}

export class Tree { // TODO: remove?
    public readonly nodes: OuterNode[]
    public readonly links: Link[]

    constructor(public readonly root: Root) {
        this.nodes = this.root.outerNodes()
        this.links = this.root.links()
    }
}