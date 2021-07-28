import {CartesianPosition} from "./General";
import {Comment} from "./Comment";
import {Link} from "./Connector";
import {ReactElement} from "react";
import {Config} from "./Config";

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
        return new Sector(
            this.childAngle(parentSector, childIndex, nrChildren),
            parentSector.sectorSize / nrChildren,
        )
    }

    protected addTrunk(node: InnerNode): SproutLeave[] { // TODO: rename
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
    constructor(payload: NodePayload, private readonly angle: number) { // TODO: separate type for angle
        super(payload)
    }

    asTree(): Tree {
        const sector = this.payload.isRoot() // TODO: separate type for Center?
            ? new Sector(0.5, 1)
            : new Sector(this.angle, 0.4) // TODO: test other values
        const root = new Root(this.payload, sector)
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
    harden(node: InnerNode): void { // TODO: rename. draw?
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
            let sector = node.sector
            if (this.children.length === 2 && sector.sectorSize > 1 / 3) {
                sector = new Sector(sector.angle, 1 / 3)
            }
            this.children.forEach((child, index) => {
                node.add(
                    child,
                    this.childSector(sector, index, this.children.length),
                )
            })
        }
    }
}

export interface NodeInterface {
    commentLevel(): number

    outerNodes(): OuterNode[]

    absolutePosition(): CartesianPosition

    // TODO: maybe refactor
    links(): Link[]
    is(payload: NodePayload): boolean
    soften(source: Sprout): void // TODO: grow?
    group(): void


    style(): {}

    key(): string

    renderContent(): ReactElement

    isRoot(): boolean
}
export interface OuterNode extends NodeInterface {
    asTree(): Tree
}

export abstract class AbstractNode implements NodeInterface {
    private readonly diameter = 50

    protected constructor(public readonly sector: Sector) {}

    abstract absolutePosition(): CartesianPosition

    abstract soften(source: Sprout): void

    abstract is(payload: NodePayload): boolean

    abstract outerNodes(): OuterNode[]

    abstract commentLevel(): number

    abstract links(): Link[]

    abstract group(): void

    abstract key(): string

    abstract renderContent(): ReactElement

    abstract isRoot(): boolean

    style(): {} {
        return {
            width: this.diameter,
            height: this.diameter,
            borderRadius: this.radius(),
            left: -this.radius(),
            top: -this.radius(),
        }
    }

    private radius(): number {
        return this.diameter / 2
    }
}

abstract class InnerNode extends AbstractNode {
    children: OuterNode[] = []

    constructor(public readonly payload: NodePayload, sector: Sector) {
        super(sector)
    }

    protected abstract neighbours(): NodeInterface[]

    soften(source: Sprout): void {
        const added = source.add(this.payload)
        this.neighbours().forEach(neighbour => {
            if (!neighbour.is(source.payload)) neighbour.soften(added)
        })
    }

    is(payload: NodePayload): boolean {
        return this.payload === payload
    }

    outerNodes(): OuterNode[] {
        let outerNodes: OuterNode[] = this.children
        this.children.forEach(child => {
            outerNodes = outerNodes.concat(child.outerNodes())
        })
        return outerNodes
    }

    commentLevel(): number {
        return this.payload.commentLevel
    }

    renderContent(): ReactElement {
        return this.payload.comment.render()
    }

    links(): Link[] {
        let links: Link[] = []
        this.children.forEach(child => {
            links.push(new Link(this, child))
            links = links.concat(child.links())
        })
        return links
    }

    key(): string {
        return `node-${this.payload.comment.id}`
    }

    isRoot(): boolean {
        return this.payload.isRoot()
    }

    add(leave: SproutLeave, sector: Sector): void {
        const node = new Node(this, leave.payload, sector);
        this.children.push(node)
        leave.harden(node)
    }
}

class Root extends InnerNode {
    absolutePosition(): CartesianPosition {
        return new CartesianPosition(0, 0)
    }

    group(): void {
        this.children.forEach(child => { // TODO: group root itself
            child.group()
        })
    }

    protected neighbours(): NodeInterface[] {
        return this.children
    }
}

class Node extends InnerNode implements OuterNode { // TODO: cache
    constructor(
        private readonly parent: AbstractNode,
        payload: NodePayload,
        sector: Sector,
    ) {
        super(payload, sector)
    }

    absolutePosition(): CartesianPosition {
        return this.parent.absolutePosition().add(this.sector.relativePosition())
    }

    group(): void {
        const minAngle = 1 / 4 // TODO
        if ((this.children.length > 1) &&
            (this.parent.sector.sectorSize / (this.children.length - 1) <= minAngle)
        ) {
            this.children = [new NodeGroup(this)] // TODO
        } else {
            this.children.forEach(child => {
                child.group()
            })
        }
    }

    asTree(): Tree {
        const angle = Config.get().direction() === Config.DIRECTION_INHERIT
            ? this.sector.angle - 0.5
            : 0
        const root = new SproutRoot(this.payload, angle)
        this.neighbours().forEach(neighbour => {
            neighbour.soften(root)
        })
        return root.asTree()
    }

    protected neighbours(): NodeInterface[] {
        return [this.parent, ...this.children]
    }
}

class NodeGroup extends AbstractNode implements OuterNode {
    private readonly nodes: OuterNode[] // TODO: maybe refactor and return Node[] ?

    constructor(private readonly parent: Node) {
        super(parent.sector.narrow())
        if (parent.children.length < 2) throw new Error("NodeGroup should contain >1 nodes")
        this.nodes = parent.children
        parent.children = [this]
    }

    absolutePosition(): CartesianPosition {
        return this.parent.absolutePosition().add(this.sector.relativePosition())
    }

    is(payload: NodePayload): boolean {
        return false // TODO: maybe refactor
    }

    commentLevel(): number {
        return this.parent.commentLevel() + 1
    }

    outerNodes(): OuterNode[] {
        // throw new Error("Fix me") // TODO: fix
console.log("fix me?")
        return []
    }

    key(): string {
        return `node-group-${this.nodes[0].key()}`
    }

    renderContent(): ReactElement { // TODO: move somewhere, and return extension .ts to the file
        return (
            <div className="node-group">
                {this.nodes.length}
            </div>
        )
    }

    links(): Link[] {
        return [] // TODO: maybe refactor
    }

    soften(source: Sprout): void {
        this.nodes.forEach(node => {
            node.soften(source) // TODO: check
        })
    }

    group(): void {
console.log("should not happen?")
    }

    isRoot(): boolean {
        return false
    }

    asTree(): Tree {
        this.ungroup()
        return this.parent.asTree()
    }

    private ungroup(): void {
        this.parent.children = this.nodes
    }
}

class Sector {
    constructor(
        public readonly angle: number, // TODO: direction?
        public readonly sectorSize: number, // TODO: width?
    ) {}

    narrow(): Sector {
        return new Sector(this.angle, 0)
    }

    add(angle: number): Sector {
        return new Sector(this.angle + angle, this.sectorSize)
    }

    relativePosition(): CartesianPosition {
        const length = 150
        const angle = this.angle * 2 * Math.PI
        const x = length * Math.sin(angle)
        const y = length * Math.cos(angle)
        return new CartesianPosition(x, y)
    }
}

export class Tree {
    public readonly nodes: OuterNode[] = []
    public readonly links: Link[]

    constructor(public readonly root: Root) {
        root.group()
        this.links = root.links()
        this.nodes = root.outerNodes()
    }
}
