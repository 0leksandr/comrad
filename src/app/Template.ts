import {Comment} from "./Comment";
import {Node, NodePayload, Root, Tree} from "./Tree";

export class TemplateComment {
    constructor(public readonly comment: Comment, protected readonly children: TemplateComment[]) {}

    protected grow(node: Node, level: number): void {
        this.children.forEach((child, index) => {
            node.add(new NodePayload(child.comment, level + 1))
            child.grow(node.children[index], level + 1)
        })
    }

    protected walk(fn: (node: TemplateComment) => void): void {
        fn(this)
        this.children.forEach(child => { child.walk(fn) })
    }
}

export class TemplateRoot extends TemplateComment {
    asTree(): Tree {
        const root = new Root(new NodePayload(this.comment, 0), .5)
        this.grow(root, 0)
        return new Tree(root)
    }
}
